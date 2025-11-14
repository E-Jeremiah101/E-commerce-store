import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import axios from "axios";
import mongoose from "mongoose";
import { acquireWebhookLock, releaseWebhookLock } from "../lib/redis.js";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import { sendEmail } from "../lib/mailer.js";
import { flw } from "../lib/flutterwave.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });


// ==================== INVENTORY RESERVATION SYSTEM ====================
const inventoryReservations = new Map();

// Clean up expired reservations every minute
setInterval(() => {
  const now = new Date();
  for (const [reservationId, reservation] of inventoryReservations.entries()) {
    if (reservation.expiresAt < now) {
      console.log(`Releasing expired reservation: ${reservationId}`);
      releaseInventory(reservationId).catch(console.error);
    }
  }
}, 60000);

// Reserve inventory atomically
// Reserve inventory atomically
async function reserveInventory(products, reservationId, timeoutMinutes = 4) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      for (const item of products) {
        if (!item._id) continue;

        console.log(`🔄 Reserving ${item.quantity} of ${item.name}`);

        const product = await Product.findById(item._id).session(session);
        if (!product) throw new Error(`Product ${item.name} not found`);

        // Handle variants (like Almond Suit with size/color)
        if (item.size && item.color) {
          const variantIndex = product.variants.findIndex(
            (v) => v.size === item.size && v.color === item.color
          );

          if (variantIndex === -1) {
            throw new Error(
              `Variant ${item.size}/${item.color} not found for ${item.name}`
            );
          }

          const variant = product.variants[variantIndex];
          console.log(
            `📦 BEFORE - ${item.name} ${item.size}/${item.color}: Stock=${
              variant.countInStock
            }, Reserved=${variant.reserved || 0}`
          );

          // Check stock
          if (variant.countInStock < item.quantity) {
            throw new Error(
              `Only ${variant.countInStock} available, but ${item.quantity} requested`
            );
          }

          // ACTUALLY DEDUCT INVENTORY HERE
          variant.countInStock -= item.quantity;
          variant.reserved = (variant.reserved || 0) + item.quantity;

          console.log(
            `📦 AFTER - ${item.name} ${item.size}/${item.color}: Stock=${variant.countInStock}, Reserved=${variant.reserved}`
          );

          // Update total product stock
          product.countInStock = product.variants.reduce(
            (total, v) => total + v.countInStock,
            0
          );
        }
        // Handle simple products (no variants)
        else {
          console.log(
            `📦 BEFORE - ${item.name}: Stock=${
              product.countInStock
            }, Reserved=${product.reserved || 0}`
          );

          if (product.countInStock < item.quantity) {
            throw new Error(
              `Only ${product.countInStock} available, but ${item.quantity} requested`
            );
          }

          // ACTUALLY DEDUCT INVENTORY HERE
          product.countInStock -= item.quantity;
          product.reserved = (product.reserved || 0) + item.quantity;

          console.log(
            `📦 AFTER - ${item.name}: Stock=${product.countInStock}, Reserved=${product.reserved}`
          );
        }

        await product.save({ session });
        console.log(
          `✅ Successfully reserved ${item.quantity} of ${item.name}`
        );
      }
    });

    // Store reservation
    inventoryReservations.set(reservationId, {
      products,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000),
    });

    console.log(`🎉 ALL inventory reserved successfully: ${reservationId}`);
    return true;
  } catch (error) {
    console.error("❌ Reservation failed:", error);

    // Release any partial reservations
    try {
      await releaseInventory(reservationId);
    } catch (releaseError) {
      console.error("Failed to release inventory after failure:", releaseError);
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

// Release reserved inventory
async function releaseInventory(reservationId) {
  const reservation = inventoryReservations.get(reservationId);
  if (!reservation) {
    console.log(`No reservation found: ${reservationId}`);
    return;
  }

  console.log(`🔄 Releasing reservation: ${reservationId}`);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of reservation.products) {
        if (!item._id) continue;

        const product = await Product.findById(item._id).session(session);
        if (!product) {
          console.log(`Product not found for ID: ${item._id}`);
          continue;
        }

        if (item.size && item.color) {
          const variantIndex = product.variants.findIndex(
            (v) => v.size === item.size && v.color === item.color
          );

          if (variantIndex !== -1) {
            // RESTORE the inventory we deducted
            product.variants[variantIndex].countInStock += item.quantity;
            product.variants[variantIndex].reserved = Math.max(
              0,
              (product.variants[variantIndex].reserved || 0) - item.quantity
            );

            // Update total
            product.countInStock = product.variants.reduce(
              (total, v) => total + v.countInStock,
              0
            );

            console.log(
              `✅ Released ${item.quantity} of ${item.name} variant - Stock now: ${product.variants[variantIndex].countInStock}`
            );
          }
        } else {
          // Simple product - restore inventory
          product.countInStock += item.quantity;
          product.reserved = Math.max(
            0,
            (product.reserved || 0) - item.quantity
          );
          console.log(
            `✅ Released ${item.quantity} of ${item.name} - Stock now: ${product.countInStock}`
          );
        }

        await product.save({ session });
      }
    });

    inventoryReservations.delete(reservationId);
    console.log(`🎉 Successfully released reservation: ${reservationId}`);
  } catch (error) {
    console.error("❌ Release failed:", error);
  } finally {
    await session.endSession();
  }
}

// Confirm inventory (convert reservation to permanent deduction)
async function confirmInventory(reservationId) {
  const reservation = inventoryReservations.get(reservationId);
  if (!reservation) {
    console.log(`No reservation found to confirm: ${reservationId}`);
    return;
  }

  console.log(`🔄 Confirming reservation: ${reservationId}`);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of reservation.products) {
        if (!item._id) continue;

        const product = await Product.findById(item._id).session(session);
        if (!product) continue;

        if (item.size && item.color) {
          const variantIndex = product.variants.findIndex(
            (v) => v.size === item.size && v.color === item.color
          );

          if (variantIndex !== -1) {
            // Just remove the reservation flag - inventory already deducted
            product.variants[variantIndex].reserved = Math.max(
              0,
              (product.variants[variantIndex].reserved || 0) - item.quantity
            );
            console.log(
              `✅ Confirmed ${item.name} variant - Final: Stock=${product.variants[variantIndex].countInStock}, Reserved=${product.variants[variantIndex].reserved}`
            );
          }
        } else {
          // Simple product - remove reservation flag
          product.reserved = Math.max(
            0,
            (product.reserved || 0) - item.quantity
          );
          console.log(
            `✅ Confirmed ${item.name} - Final: Stock=${product.countInStock}, Reserved=${product.reserved}`
          );
        }

        await product.save({ session });
      }
    });

    inventoryReservations.delete(reservationId);
    console.log(`🎉 Successfully confirmed reservation: ${reservationId}`);
  } catch (error) {
    console.error("❌ Confirmation failed:", error);
    throw error;
  } finally {
    await session.endSession();
  }
}

// ==================== EXISTING FUNCTIONS (UPDATED) ====================

async function checkCouponEligibility(userId, orderAmount) {
  try {
    const orderCount = await Order.countDocuments({
      user: userId,
      paymentStatus: "paid",
    });

    console.log(
      `Checking coupon eligibility for user ${userId}: ${orderCount} orders, ₦${orderAmount}`
    );

    const activeCoupon = await Coupon.findOne({
      userId: userId,
      isActive: true,
      expirationDate: { $gt: new Date() },
    });

    if (activeCoupon) {
      console.log(
        `User ${userId} already has active coupon: ${activeCoupon.code}`
      );
      return null;
    }

    if (orderCount === 1) {
      console.log(`User ${userId} eligible for FIRST ORDER coupon`);
      return {
        discountPercentage: 10,
        codePrefix: "WELCOME",
        reason: "first_order",
        emailType: "welcome_coupon",
      };
    } else if (orderCount === 3) {
      console.log(`User ${userId} eligible for THIRD ORDER coupon`);
      return {
        discountPercentage: 15,
        codePrefix: "LOYAL",
        reason: "third_order_milestone",
        emailType: "loyalty_coupon",
      };
    } else if (orderCount >= 5 && orderCount % 5 === 0) {
      console.log(
        `User ${userId} eligible for VIP coupon (${orderCount} orders)`
      );
      return {
        discountPercentage: 20,
        codePrefix: "VIP",
        reason: "every_five_orders",
        emailType: "vip_coupon",
      };
    } else if (orderAmount > 175000) {
      console.log(
        `User ${userId} eligible for BIG SPENDER coupon (₦${orderAmount})`
      );
      return {
        discountPercentage: 15,
        codePrefix: "BIGSPEND",
        reason: "high_value_order",
        emailType: "bigspender_coupon",
      };
    }

    console.log(
      `User ${userId} not eligible for coupon (${orderCount} orders, ₦${orderAmount})`
    );
    return null;
  } catch (error) {
    console.error("Error checking coupon eligibility:", error);
    return null;
  }
}

async function createNewCoupon(userId, options = {}) {
  const {
    discountPercentage = 10,
    daysValid = 30,
    couponType = "GIFT",
    reason = "general",
  } = options;

  try {
    console.log(`Starting coupon creation for user ${userId}...`);

    const newCode =
      couponType + Math.random().toString(36).substring(2, 8).toUpperCase();

    console.log(`Generated coupon code: ${newCode}`);

    const coupon = await Coupon.findOneAndUpdate(
      { userId: userId },
      {
        code: newCode,
        discountPercentage,
        expirationDate: new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000),
        isActive: true,
        couponReason: reason,
        deactivatedAt: null,
        deactivationReason: null,
        usedAt: null,
        usedInOrder: null,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      `Successfully ${coupon.$isNew ? "CREATED" : "UPDATED"} coupon: ${
        coupon.code
      } for user ${userId}`
    );
    return coupon;
  } catch (error) {
    console.error("Failed to create/update coupon:", error);
    return null;
  }
}

function generateOrderNumber() {
  return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function createPaymentMethodData(flutterwaveData) {
  const paymentType = flutterwaveData.payment_type || "card";

  return {
    method: paymentType,
    status: "PAID",
    card: {
      brand: flutterwaveData.card?.brand || "Unknown",
      last4: flutterwaveData.card?.last_4digits || null,
      exp_month: flutterwaveData.card?.exp_month || null,
      exp_year: flutterwaveData.card?.exp_year || null,
      type: flutterwaveData.card?.type || null,
      issuer: flutterwaveData.card?.issuer || null,
    },
  };
}

// UPDATED: Remove inventory checks - inventory already reserved
async function processOrderCreation(transactionData) {
  const {
    transaction_id,
    tx_ref,
    data,
    meta,
    userId,
    parsedProducts,
    couponCode,
    reservationId,
  } = transactionData;

  console.log(` STARTING order processing for: ${tx_ref}`);

  // 1. IMMEDIATE DUPLICATE CHECK
  const existingOrder = await Order.findOne({
    $or: [
      { flutterwaveTransactionId: transaction_id },
      { flutterwaveRef: tx_ref },
    ],
  });

  if (existingOrder) {
    console.log(` ORDER ALREADY EXISTS: ${existingOrder.orderNumber}`);
    return { order: existingOrder, isNew: false };
  }

  // 2. CREATE ORDER (inventory already reserved)
  try {
    console.log(` CREATING NEW ORDER for user: ${userId}`);

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const products = parsedProducts.map((p) => ({
      product: p._id,
      name: p.name || "Unknown Product",
      image: (p.images && p.images[0]) || "/placeholder.png",
      quantity: p.quantity || 1,
      price: p.price || 0,
      selectedSize: p.size || "",
      selectedColor: p.color || "",
      selectedCategory: p.category || "",
    }));

    const order = new Order({
      user: user._id,
      products,
      subtotal: Number(meta.originalTotal) || Number(data.amount) || 0,
      discount: Number(meta.discountAmount) || 0,
      totalAmount: Number(meta.finalTotal) || Number(data.amount) || 0,
      orderNumber: generateOrderNumber(),
      couponCode: couponCode || null,
      deliveryAddress: meta.deliveryAddress || "No address provided",
      phone: meta.phoneNumber || "No phone provided",
      flutterwaveRef: tx_ref,
      flutterwaveTransactionId: transaction_id,
      paymentStatus: "paid",
      status: "Pending",
      paymentMethod: createPaymentMethodData(data),
      isProcessed: true,
    });

    await order.save();
    console.log(` SUCCESS: Created order ${order.orderNumber}`);

    // 3. CONFIRM INVENTORY (convert reservation to permanent)
    if (reservationId) {
      await confirmInventory(reservationId);
    }

    // 4. CLEAR CART
    await User.findByIdAndUpdate(userId, { cartItems: [] });

    // 5. HANDLE COUPON APPLICATION (if coupon was used in this order)
    if (couponCode?.trim()) {
      await Coupon.findOneAndUpdate(
        { code: couponCode.trim().toUpperCase(), userId, isActive: true },
        { isActive: false, usedAt: new Date(), usedInOrder: tx_ref }
      );
      console.log(` Coupon applied: ${couponCode}`);
    }

    // NOTE: Coupon eligibility check for NEW coupons is handled in the webhook handler
    // This function only handles applying existing coupons used in the purchase

    return { order, isNew: true };
  } catch (error) {
    // Handle duplicate order error
    if (error.code === 11000) {
      console.log(`🔄 Duplicate key error - finding existing order...`);
      const existingOrder = await Order.findOne({
        $or: [
          { flutterwaveTransactionId: transaction_id },
          { flutterwaveRef: tx_ref },
        ],
      });

      if (existingOrder) {
        console.log(` Found existing order: ${existingOrder.orderNumber}`);
        return { order: existingOrder, isNew: false };
      }
    }

    console.error(`❌ ORDER CREATION FAILED:`, error);
    throw error;
  }
}

// REMOVED: checkInventoryAvailability and reduceInventory functions
// Inventory is now managed through reservation system

// ==================== UPDATED CHECKOUT SESSION ====================

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const defaultPhone =
      user.phones?.find((p) => p.isDefault) || user.phones?.[0];
    const defaultAddress =
      user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

    const addressString = defaultAddress
      ? (defaultAddress.address && defaultAddress.address.trim()) ||
        `${defaultAddress.landmark ? defaultAddress.landmark + ", " : ""}${
          defaultAddress.lga ? defaultAddress.lga + ", " : ""
        }${defaultAddress.city ? defaultAddress.city + ", " : ""}${
          defaultAddress.state || ""
        }`.trim()
      : "";

    if (!defaultPhone?.number?.trim() || !addressString) {
      return res.status(400).json({
        error: "You must add a phone number and address before checkout.",
      });
    }

// === CHECK AVAILABILITY BEFORE RESERVATION ===
    console.log('🔍 Checking availability before reservation...');
    try {
      for (const item of products) {
        if (!item._id) continue;

        const product = await Product.findById(item._id);
        if (!product) {
          throw new Error(`Product ${item.name} not found`);
        }

        // Handle variants
        if (item.size && item.color) {
          const variantIndex = product.variants.findIndex(
            (v) => v.size === item.size && v.color === item.color
          );

          if (variantIndex === -1) {
            throw new Error(
              `Variant ${item.size}/${item.color} not found for ${item.name}`
            );
          }

          const variant = product.variants[variantIndex];
          console.log(
            `📊 Availability check - ${item.name} ${item.size}/${item.color}: Stock=${variant.countInStock}, Requested=${item.quantity}`
          );

          if (variant.countInStock < item.quantity) {
            throw new Error(
              ` ${item.name} ${item.size}/${item.color}, is out of stock, please update you cart`
            );
          }
        }
        // Handle simple products
        else {
          console.log(
            `📊 Availability check - ${item.name}: Stock=${product.countInStock}, Requested=${item.quantity}`
          );

          if (product.countInStock < item.quantity) {
            throw new Error(
              `Only ${product.countInStock} available for ${item.name}, but ${item.quantity} requested`
            );
          }
        }
      }
      console.log('✅ All items available for reservation');
    } catch (availabilityError) {
      console.error('❌ Availability check failed:', availabilityError.message);
      return res.status(400).json({
        error: availabilityError.message,
      });
    }
    // Calculate totals
    const originalTotal = products.reduce((acc, p) => {
      const qty = p.quantity || 1;
      const price = Number(p.price) || 0;
      return acc + price * qty;
    }, 0);

    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode && couponCode.trim() !== "") {
      try {
        validCoupon = await Coupon.findOne({
          code: couponCode.trim().toUpperCase(),
          userId,
          isActive: true,
          expirationDate: { $gt: new Date() },
        });

        if (validCoupon) {
          discountAmount = Math.round(
            (originalTotal * validCoupon.discountPercentage) / 100
          );
          console.log(
            `Coupon applied: ${couponCode} - Discount: ₦${discountAmount}`
          );
        } else {
          console.log(`Invalid or expired coupon: ${couponCode}`);
        }
      } catch (error) {
        console.error("Error validating coupon:", error);
      }
    }

    const finalTotal = Math.max(0, originalTotal - discountAmount);
    const tx_ref = `ECOSTORE-${Date.now()}`;

    // === CRITICAL: RESERVE INVENTORY BEFORE PAYMENT ===
    const reservationId = `res_${tx_ref}`;
    try {
      await reserveInventory(products, reservationId, 4); // Reserve for 10 minutes
      console.log(`✅ Inventory reserved: ${reservationId}`);
    } catch (reservationError) {
      console.error("❌ Inventory reservation failed:", reservationError);
      return res.status(400).json({
        error:
          "Some items in your cart are no longer available. Please refresh your cart and try again.",
      });
    }

    const payload = {
      tx_ref,
      amount: finalTotal,
      currency: "NGN",
      redirect_url: `${process.env.CLIENT_URL}/purchase-success`,
      customer: {
        email: user.email,
        phonenumber: defaultPhone.number,
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        name:
          (user.firstname || "") + (user.lastname ? ` ${user.lastname}` : ""),
      },
      payment_options: "card",
      meta: {
        userId: userId.toString(),
        products: JSON.stringify(
          products.map((p) => ({
            _id: p._id || p.id || null,
            name: p.name,
            images: p.images || [],
            quantity: p.quantity || 1,
            price: p.price,
            size: p.size || null,
            color: p.color || null,
            category: p.category || null,
          }))
        ),
        couponCode: couponCode || "",
        originalTotal,
        discountAmount,
        finalTotal,
        deliveryAddress: addressString || "",
        phoneNumber: defaultPhone.number || "",
        reservationId: reservationId, // Include reservation ID
      },
      customizations: {
        title: "EcoStore Purchase",
        description: "Payment for items in your cart",
        logo: process.env.STORE_LOGO || "https://yourstore.com/logo.png",
      },
    };

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    const link =
      response?.data?.data?.link || response?.data?.data?.authorization_url;

    if (!link) {
      // Release inventory if payment initialization fails
      await releaseInventory(reservationId);
      console.error("No payment link returned by Flutterwave:", response.data);
      return res.status(500).json({ message: "Failed to initialize payment" });
    }

    console.log("Flutterwave payment initialized:", tx_ref, "link:", link);
    return res.status(200).json({ link, tx_ref });
  } catch (err) {
    console.error("Error initializing Flutterwave payment:", err);
    return res.status(500).json({
      message: "Payment initialization failed",
      error: err?.message || String(err),
    });
  }
};


// ==================== UPDATED WEBHOOK HANDLER ====================

export const handleFlutterwaveWebhook = async (req, res) => {
  console.log("WEBHOOK CALLED - STARTING PROCESS");

  try {
    const signature = req.headers["verif-hash"];
    console.log("Signature received:", signature);

    if (!signature) {
      console.warn("Missing verif-hash header");
      return res.status(401).send("Missing signature");
    }

    if (signature !== process.env.FLW_WEBHOOK_HASH) {
      console.warn("Invalid webhook signature - possible forgery attempt");
      return res.status(401).send("Invalid signature");
    }

    console.log("Webhook signature validated successfully");

    const event = req.body;
    if (!event) {
      console.warn("Empty webhook event body");
      return res.status(400).send("No event body");
    }

    console.log(`Webhook received: ${event.event} for ${event.data?.tx_ref}`);

    if (event.event !== "charge.completed") {
      console.log(`Ignoring webhook event: ${event.event}`);
      return res.status(200).send("Ignored event type");
    }

    const { id: transaction_id, tx_ref, status } = event.data;

    // === REDIS-BASED DISTRIBUTED LOCKING ===
    console.log(`🔒 Attempting to acquire Redis lock for: ${transaction_id}`);
    const lockAcquired = await acquireWebhookLock(transaction_id, 45000); // 45 second lock

    if (!lockAcquired) {
      console.log(
        `⏳ Webhook already being processed (Redis lock): ${transaction_id}`
      );
      return res.status(200).send("Webhook already being processed");
    }
    console.log(`✅ Acquired Redis lock for: ${transaction_id}`);

    let processingCompleted = false;

    try {
      // === ENHANCED DUPLICATE PROTECTION ===
      // 1. Check for existing order FIRST (before any processing)
      const existingOrder = await Order.findOne({
        $or: [
          { flutterwaveTransactionId: transaction_id },
          { flutterwaveRef: tx_ref },
        ],
      });

      if (existingOrder) {
        console.log(
          `🔄 DUPLICATE: Order ${existingOrder.orderNumber} already exists with status: ${existingOrder.paymentStatus}`
        );

        // If order exists but payment status needs updating
        if (existingOrder.paymentStatus !== "paid" && status === "successful") {
          existingOrder.paymentStatus = "paid";
          await existingOrder.save();
          console.log(
            `✅ Updated order status to paid: ${existingOrder.orderNumber}`
          );
        }

        // Release any reserved inventory
        const reservationId = event.data.meta?.reservationId;
        if (reservationId) {
          await releaseInventory(reservationId);
        }

        processingCompleted = true;
        return res.status(200).send("Order already processed");
      }

      if (status !== "successful") {
        console.log(`Payment not successful: ${status} for ${tx_ref}`);

        // Release inventory if payment failed
        const reservationId = event.data.meta?.reservationId;
        if (reservationId) {
          await releaseInventory(reservationId);
        }

        processingCompleted = true;
        return res.status(200).send("Payment not successful");
      }

      console.log(`Processing webhook for successful payment: ${tx_ref}`);

      let data;

      const isTestTransaction =
        transaction_id === 285959875 ||
        tx_ref.includes("TEST") ||
        tx_ref.includes("ECOSTORE-");

      if (isTestTransaction) {
        console.log(
          "Test transaction detected - bypassing Flutterwave verification"
        );
        data = event.data;
        data.payment_type = data.payment_type || "card";
        data.amount = data.amount || 100;
        data.currency = data.currency || "NGN";
        console.log("Using webhook data directly for test transaction");
      } else {
        console.log(
          `Verifying real transaction with Flutterwave: ${transaction_id}`
        );
        const verifyResp = await flw.Transaction.verify({ id: transaction_id });

        if (!verifyResp?.data || verifyResp.data.status !== "successful") {
          console.error(`Webhook verification failed for: ${transaction_id}`);

          // Release inventory if verification fails
          const reservationId = event.data.meta?.reservationId;
          if (reservationId) {
            await releaseInventory(reservationId);
          }

          processingCompleted = true;
          return res.status(400).send("Payment verification failed");
        }

        data = verifyResp.data;
        console.log("Real transaction verified successfully");
      }

      const meta_data = data.meta || event.meta_data || {};

      let parsedProducts = [];
      if (meta_data.products) {
        try {
          if (typeof meta_data.products === "string") {
            parsedProducts = JSON.parse(meta_data.products);
          } else {
            parsedProducts = meta_data.products;
          }
          parsedProducts = parsedProducts.map((p) => ({
            _id: p._id || p.id || null,
            name: p.name,
            images: p.images || [],
            quantity: p.quantity || 1,
            price: p.price,
            size: p.size || null,
            color: p.color || null,
            category: p.category || null,
          }));
        } catch (error) {
          console.error("Error parsing products:", error);
          parsedProducts = [];
        }
      }

      let userId = meta_data.userId;
      const couponCode = meta_data.couponCode || "";
      const reservationId = meta_data.reservationId;
      const originalTotal =
        Number(meta_data.originalTotal) || Number(data.amount) || 0;
      const discountAmount = Number(meta_data.discountAmount) || 0;
      const finalTotal =
        Number(meta_data.finalTotal) || Number(data.amount) || 0;
      const deliveryAddress = meta_data.deliveryAddress || "";
      const phoneNumber = data.customer?.phone_number || "";

      console.log("UserId from meta_data:", userId);
      console.log("Reservation ID:", reservationId);
      console.log("Parsed products count:", parsedProducts.length);

      if (!userId) {
        console.error("Missing userId in webhook data");

        // Release inventory if no user ID
        if (reservationId) {
          await releaseInventory(reservationId);
        }

        processingCompleted = true;
        return res.status(400).send("Missing userId");
      }

      // 2. FINAL DUPLICATE CHECK (in case order was created between first check and now)
      const finalDuplicateCheck = await Order.findOne({
        $or: [
          { flutterwaveTransactionId: transaction_id },
          { flutterwaveRef: tx_ref },
        ],
      });

      if (finalDuplicateCheck) {
        console.log(
          `🔄 LATE DUPLICATE: Order ${finalDuplicateCheck.orderNumber} created during processing`
        );

        // Release inventory
        if (reservationId) {
          await releaseInventory(reservationId);
        }

        processingCompleted = true;
        return res.status(200).send("Order already processed");
      }

      console.log("Starting database transaction...");
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const transactionData = {
            transaction_id,
            tx_ref,
            data,
            meta: {
              userId: userId,
              products: meta_data.products,
              couponCode: couponCode,
              originalTotal: originalTotal,
              discountAmount: discountAmount,
              finalTotal: finalTotal,
              deliveryAddress: deliveryAddress || "No address provided",
              phoneNumber:
                data.customer?.phone_number || phoneNumber || "No phone number",
            },
            userId,
            parsedProducts,
            couponCode,
            reservationId,
          };

          console.log("Processing order creation...");
          const { order, isNew } = await processOrderCreation(transactionData);

          console.log(
            `${isNew ? "Created new" : "Updated existing"} order: ${
              order.orderNumber
            } for user: ${userId}`
          );

          // ONLY send email and check coupons for NEW orders
          if (isNew) {
            try {
              console.log(`STARTING COUPON PROCESS FOR USER: ${userId}`);
              const couponEligibility = await checkCouponEligibility(
                userId,
                order.totalAmount
              );

              if (couponEligibility) {
                console.log(
                  `User eligible for ${couponEligibility.reason} coupon`
                );
                const newCoupon = await createNewCoupon(userId, {
                  discountPercentage: couponEligibility.discountPercentage,
                  couponType: couponEligibility.codePrefix,
                  reason: couponEligibility.reason,
                  daysValid: 30,
                });

                if (newCoupon && newCoupon.isActive) {
                  console.log(
                    `Successfully created ACTIVE coupon: ${newCoupon.code}`
                  );
                  try {
                    const user = await User.findById(userId);
                    if (user && user.email) {
                      await sendCouponEmail({
                        to: user.email,
                        coupon: newCoupon,
                        couponType: couponEligibility.emailType,
                        orderCount: await Order.countDocuments({
                          user: userId,
                          paymentStatus: "paid",
                        }),
                      });
                      console.log(`Coupon email sent for: ${newCoupon.code}`);
                    }
                  } catch (emailErr) {
                    console.error("Coupon email send failed:", emailErr);
                  }
                }
              }
            } catch (error) {
              console.error("Coupon creation failed:", error);
            }

            // SEND ORDER CONFIRMATION EMAIL ONLY FOR NEW ORDERS
            try {
              const user = await User.findById(userId);
              if (user && user.email) {
                await sendDetailedOrderEmail({
                  to: user.email,
                  order,
                  flutterwaveData: data,
                });
                console.log(
                  `✅ Confirmation email sent for NEW order: ${order.orderNumber}`
                );
              }
            } catch (emailErr) {
              console.error("Email send failed (webhook):", emailErr);
            }
          } else {
            console.log(
              `📧 Skipping email and coupons for existing order: ${order.orderNumber}`
            );
          }
        });

        console.log("Database transaction committed successfully");
        processingCompleted = true;
      } catch (transactionError) {
        console.error("Transaction failed:", transactionError);

        // Release inventory if transaction fails
        if (reservationId) {
          await releaseInventory(reservationId);
        }

        throw transactionError;
      } finally {
        await session.endSession();
      }

      console.log(`Webhook processing completed successfully`);
      return res.status(200).send("Order processed successfully");
    } finally {
      // Release Redis lock immediately if processing completed
      // Otherwise, let it expire automatically after 45 seconds
      if (processingCompleted) {
        await releaseWebhookLock(transaction_id);
      } else {
        console.log(
          `⏳ Letting Redis lock expire naturally for: ${transaction_id}`
        );
      }
    }
  } catch (err) {
    console.error(`Webhook processing error:`, err);

    // Always try to release the lock on error
    try {
      await releaseWebhookLock(transaction_id);
    } catch (lockError) {
      console.error("Failed to release lock on error:", lockError);
    }

    return res.status(500).send("Webhook processing failed");
  }
};

async function withRetry(fn, retries = 3, delay = 200) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const transient =
        err?.codeName === "WriteConflict" ||
        (err?.errorLabels &&
          err.errorLabels.includes("TransientTransactionError"));

      if (transient && attempt < retries) {
        console.warn(`Transient error, retrying ${attempt}/${retries}...`);
        await new Promise((r) => setTimeout(r, delay * attempt));
        continue;
      }
      throw err;
    }
  }
}

export const checkoutSuccess = async (req, res) => {
  try {
    const { tx_ref, transaction_id } = req.body;

    if (!transaction_id) {
      return res.status(400).json({ error: "transaction_id is required" });
    }

    // Duplicate protection
    const existingPaidOrder = await Order.findOne({
      $or: [
        { flutterwaveTransactionId: transaction_id },
        { flutterwaveRef: tx_ref },
      ],
      paymentStatus: "paid",
    });

    if (existingPaidOrder) {
      console.log(
        `🔄 CheckoutSuccess: Order already processed: ${existingPaidOrder.orderNumber}`
      );
      return res.status(200).json({
        success: true,
        message: "Order already processed",
        orderId: existingPaidOrder._id,
        orderNumber: existingPaidOrder.orderNumber,
      });
    }

    const verifyResp = await flw.Transaction.verify({ id: transaction_id });
    const data = verifyResp?.data;

    if (!data || data.status !== "successful") {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const meta = data.meta || {};
    const userId = meta.userId;
    const parsedProducts = meta.products ? JSON.parse(meta.products) : [];
    const couponCode = meta.couponCode || "";
    const reservationId = meta.reservationId;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "Missing userId in payment metadata" });
    }

    let finalOrder;

    await withRetry(async () => {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const transactionData = {
            transaction_id,
            tx_ref,
            data,
            meta,
            userId,
            parsedProducts,
            couponCode,
            reservationId,
          };

          const { order } = await processOrderCreation(transactionData);
          finalOrder = order;

          // Handle coupon eligibility
          const couponEligibility = await checkCouponEligibility(
            userId,
            finalOrder.totalAmount
          );
          if (couponEligibility) {
            const newCoupon = await createNewCoupon(userId, {
              discountPercentage: couponEligibility.discountPercentage,
              couponType: couponEligibility.codePrefix,
              reason: couponEligibility.reason,
              daysValid: 30,
            });

            if (newCoupon) {
              console.log(
                `Created ${couponEligibility.reason} coupon: ${newCoupon.code}`
              );
              try {
                const user = await User.findById(userId);
                if (user && user.email) {
                  await sendCouponEmail({
                    to: user.email,
                    coupon: newCoupon,
                    couponType: couponEligibility.emailType,
                    orderCount: await Order.countDocuments({
                      user: userId,
                      paymentStatus: "paid",
                    }),
                  });
                }
              } catch (emailErr) {
                console.error("Coupon email send failed:", emailErr);
              }
            }
          }

          // Send confirmation email
          try {
            const user = await User.findById(userId);
            await sendDetailedOrderEmail({
              to: user.email,
              order,
              flutterwaveData: data,
            });
          } catch (emailErr) {
            console.error("Email send failed (checkoutSuccess):", emailErr);
          }
        });
      } finally {
        await session.endSession();
      }
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified and order finalized",
      orderId: finalOrder._id,
      orderNumber: finalOrder.orderNumber,
    });
  } catch (error) {
    console.error("checkoutSuccess failed:", error);

    // Release inventory on failure
    const reservationId = req.body.meta?.reservationId;
    if (reservationId) {
      await releaseInventory(reservationId);
    }

    return res.status(500).json({
      error: error.message || "Checkout failed",
    });
  }
};

// Update your email function to use paymentMethod instead of paymentData
export const sendDetailedOrderEmail = async ({
  to,
  order,
  flutterwaveData,
}) => {
  if (!to || !order) return;

  let customerName = "";
  try {
    const userDoc = await User.findById(order.user).select(
      "firstname lastname"
    );
    if (userDoc) {
      customerName =
        userDoc.firstname || userDoc.lastname || order.user?.name || "Customer";
    }
  } catch (err) {
    console.error("Error fetching user name for email:", err);
  }

  // Use paymentMethod from order instead of paymentData
  const paymentMethod = order.paymentMethod || {};
  const tx_ref = order.flutterwaveRef || "N/A";
  const transaction_id = order.flutterwaveTransactionId || "N/A";
  const payment_type = paymentMethod.method || "N/A";
  const card = paymentMethod.card || {};

  // Prepare items array
  const items = order.products || order.items || [];

  const productRows = items
    .map((item) => {
      let details = "";
      if (item.selectedSize) details += `Size: ${item.selectedSize} `;
      if (item.selectedColor) details += `| Color: ${item.selectedColor}`;

      return `
        <tr>
          <td style="padding: 8px 12px; border:1px solid #eee;">
          <p display:block; margin-top: 1; margin-bottom:1>${
            item.name || item.productName || "Item"
          }</p>
            <img src="${item.image}" alt="${
        item.name
      }" width="60" height="60" style="border-radius: 6px; object-fit: cover;" />
           
            ${
              details
                ? `<br/><small style="color:#666;">${details || ""}</small>`
                : ""
            }
          </td>
          <td style="padding: 8px 12px; text-align:center; border:1px solid #eee;">${
            item.quantity || 1
          }</td>
          <td style="padding: 8px 12px; text-align:right; border:1px solid #eee;">₦${Number(
            item.price || item.unitPrice || 0
          ).toLocaleString()}</td>
        </tr>`;
    })
    .join("");

  const totalAmount = order.totalAmount || order.totalPrice || order.total || 0;
  const subtotal = order.subtotal || order.subTotal || 0;
  const discount = order.discount || 0;

  // Card info block (masked)
  const maskedLast4 = card.last4 || card.last_4digits || "****";
  const cardBrand = card.type || "Card";

  const cardInfo = card.last4
    ? `
    <div style="margin-top:10px;font-size:14px;color:#333;">
      <strong>Payment Method:</strong> ${cardBrand} **** ${maskedLast4}<br/>
    </div>`
    : "";

  // HTML email (your existing email template with paymentMethod adjustments)
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f6f8fa; padding: 20px;">
      <div style="max-width: 700px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.06);">
        <div style="background: #10b981; padding: 22px; text-align: center; color: #fff;">
          <img src="${
            process.env.STORE_LOGO || ""
          }" alt="Store Logo" style="max-height:50px; display:block; margin: 0 auto 8px;" />
          <h1 style="margin:0; font-size:20px;">Order Confirmation</h1>
          <div style="margin-top:6px; font-size:15px;">${
            order.orderNumber || "N/A"
          }</div>
        </div>

        <div style="padding: 22px; color:#333;">
          <p style="margin:0 0 8px;">Hi <strong>${customerName}</strong>,</p>
          <p style="margin:0 0 16px;">Thank you for your order! We've received your payment and are now processing your purchase. Below are your order details.</p>

          <h3 style="margin:18px 0 8px;">🧾 Order Summary</h3>
          <table style="width:100%; border-collapse: collapse; margin-top:8px;">
            <thead>
              <tr style="background:#f7faf7;">
                <th style="padding:10px; text-align:left; border:1px solid #eee;">Product</th>
                <th style="padding:10px; text-align:center; border:1px solid #eee;">Qty</th>
                <th style="padding:10px; text-align:right; border:1px solid #eee;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${
                productRows ||
                `<tr><td colspan="3" style="padding:12px;text-align:center;color:#777;">No items listed</td></tr>`
              }
            </tbody>
          </table>
          <p style="margin-top: 20px; font-size: 16px;">
            <strong>Original Subtotal:</strong> ₦${Number(
              subtotal
            ).toLocaleString()} <br>
            <strong>Coupon Discount:</strong> -₦${Number(
              discount
            ).toLocaleString()}<br>
            <strong>Final Total:</strong> ₦${Number(
              totalAmount
            ).toLocaleString()}
          </p>

          <p style="margin:0;">
            <strong>Address:</strong> ${
              order.deliveryAddress || "No address provided"
            }<br/>
            <strong>Phone:</strong> ${order.phone || "No phone provided"}<br/>
            <strong>Email:</strong> ${to}
          </p>

          <h3 style="margin:18px 0 8px;">💳 Payment Details</h3>
          <p style="margin:0 0 6px;">
            <strong>Payment Status:</strong> ${
              order.paymentStatus || "Confirmed"
            }<br/>
            <strong>Payment Type:</strong> ${payment_type}<br/>
            <strong>Transaction Ref:</strong> ${tx_ref}<br/>
            <strong>Transaction ID:</strong> ${transaction_id}
          </p>

          ${cardInfo}

          <p style="margin-top:20px; color:#555;">We'll send another email once your order ships.</p>

          
        </div>

        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
          <p style="margin: 0 0 10px 0;"><p style="margin-top:18px;">Thanks for choosing <strong>Eco~Store</strong> 🌱</p>
          <p style="margin: 0;">Need help? Contact us at <a href="mailto:${
            process.env.SUPPORT_EMAIL || "support@ecostore.example"
          }" 
             style="color: #10b981; text-decoration: none;">${
               process.env.SUPPORT_EMAIL || "support@ecostore.example"
             }</a></p>
        </div>
      </div>
    </div>
  `;

  // Plain text fallback
  const text = [
    `EcoStore — Order Confirmation`,
    ` ${order.orderNumber || "N/A"}`,
    `Customer: ${customerName}`,
    `Total: ₦${Number(totalAmount).toLocaleString()}`,
    `Delivery Address: ${order.deliveryAddress || "No address provided"}`,
    `Phone: ${order.phone || "No phone provided"}`,
    `Payment Status: ${order.paymentStatus || "Confirmed"}`,
    `Payment Type: ${payment_type}`,
    `Transaction Ref: ${tx_ref}`,
    `Transaction ID: ${transaction_id}`,
    ``,
    `Items:`,
    ...items.map(
      (it) =>
        ` - ${it.quantity || 1} x ${it.name || "Item"} — ₦${Number(
          it.price || 0
        ).toLocaleString()}`
    ),
    ``,
    `Thanks for shopping with Eco~Store!`,
  ].join("\n");

  // Send email
  await sendEmail({
    to,
    subject: `EcoStore — Order Confirmation #${order.orderNumber || "N/A"}`,
    html,
    text,
  });
};

// Add this function after sendDetailedOrderEmail
export const sendCouponEmail = async ({
  to,
  coupon,
  couponType = "welcome_coupon",
  orderCount = 1,
}) => {
  if (!to || !coupon) return;

  let subject = "";
  let title = "";
  let message = "";
  let couponValue = `${coupon.discountPercentage}% OFF`;

  // Different email content based on coupon type
  switch (couponType) {
    case "welcome_coupon":
      subject = `🎉 Welcome to EcoStore! Here's Your ${couponValue} Gift`;
      title = "Welcome to the EcoStore Family!";
      message = `
        <p>Thank you for joining us! To welcome you to our eco-friendly community, 
        we're giving you a special discount on your next purchase.</p>
        <p>We're thrilled to have you as part of our mission to make the world greener, one purchase at a time.</p>
      `;
      break;

    case "loyalty_coupon":
      subject = `🌟 Loyalty Reward! ${couponValue} for Being an Amazing Customer`;
      title = "You're Amazing! Here's a Thank You Gift";
      message = `
        <p>Wow! You've already placed ${orderCount} orders with us. We're truly grateful 
        for your loyalty and trust in EcoStore.</p>
        <p>As a token of our appreciation, please enjoy this special discount on your next eco-friendly purchase.</p>
      `;
      break;

    case "vip_coupon":
      subject = `🏆 VIP Treatment! ${couponValue} Exclusive Reward`;
      title = "You're Now an EcoStore VIP!";
      message = `
        <p>Congratulations! With ${orderCount} orders, you've officially reached VIP status 
        in our eco-friendly community.</p>
        <p>Thank you for being such a dedicated supporter of sustainable living. 
        Enjoy this exclusive VIP reward!</p>
      `;
      break;

    case "bigspender_coupon":
      subject = `💎 Premium Reward! ${couponValue} for Your Generous Order`;
      title = "Thank You for Your Generous Purchase!";
      message = `
        <p>We noticed your recent substantial investment in eco-friendly products, 
        and we're deeply grateful for your support!</p>
        <p>Your commitment to sustainable shopping helps us continue our mission. 
        Please accept this special reward for your next purchase.</p>
      `;
      break;

    default:
      subject = `🎁 Special ${couponValue} Gift from EcoStore`;
      title = "Here's a Special Gift For You!";
      message = `
        <p>Thank you for being a valued EcoStore customer! We appreciate your support 
        in making sustainable choices.</p>
        <p>Enjoy this discount on your next purchase of eco-friendly products.</p>
      `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f0f9f4; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: #fff;">
          <img src="${
            process.env.STORE_LOGO || ""
          }" alt="EcoStore Logo" style="max-height: 50px; display:block; margin: 0 auto 15px;" />
          <h1 style="margin:0; font-size: 28px; font-weight: bold;">${title}</h1>
          <div style="margin-top: 10px; font-size: 18px; opacity: 0.9;">Your Exclusive Discount Awaits!</div>
        </div>

        <div style="padding: 30px; color:#333;">
          ${message}

          <!-- Coupon Code Box -->
          <div style="background: linear-gradient(135deg, #fffbeb, #fed7aa); border: 2px dashed #d97706; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
            <div style="font-size: 14px; color: #92400e; margin-bottom: 8px;">YOUR DISCOUNT CODE</div>
            <div style="font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 3px; margin: 10px 0;">
              ${coupon.code}
            </div>
            <div style="font-size: 20px; color: #dc2626; font-weight: bold; margin: 8px 0;">
              ${couponValue}
            </div>
            <div style="font-size: 14px; color: #92400e;">
              Valid until: ${new Date(
                coupon.expirationDate
              ).toLocaleDateString()}
            </div>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin:0 0 12px 0; color: #1e293b;">✨ How to Use Your Coupon:</h3>
            <ol style="margin: 0; padding-left: 20px; color: #475569;">
              <li>Shop your favorite eco-friendly products</li>
              <li>Proceed to checkout</li>
              <li>Enter code <strong style="color: #ea580c;">${
                coupon.code
              }</strong> in the coupon field</li>
              <li>Enjoy your ${
                coupon.discountPercentage
              }% discount instantly!</li>
            </ol>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 25px;">
            This coupon is exclusively for you and cannot be transferred.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL || "https://your-ecostore.com"}" 
               style="background: #10b981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🛍️ Start Shopping Now
            </a>
          </div>
        </div>

        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
          <p style="margin: 0 0 10px 0;">Thank you for choosing sustainable shopping with Eco~Store 🌱</p>
          <p style="margin: 0;">Need help? Contact us at <a href="mailto:${
            process.env.SUPPORT_EMAIL || "support@ecostore.example"
          }" 
             style="color: #10b981; text-decoration: none;">${
               process.env.SUPPORT_EMAIL || "support@ecostore.example"
             }</a></p>
        </div>
      </div>
    </div>
  `;

  // Plain text version
  const text = `
${title}

${message.replace(/<[^>]*>/g, "").trim()}

YOUR DISCOUNT CODE: ${coupon.code}
DISCOUNT: ${couponValue}
VALID UNTIL: ${new Date(coupon.expirationDate).toLocaleDateString()}

How to Use:
1. Shop your favorite eco-friendly products
2. Proceed to checkout
3. Enter code ${coupon.code} in the coupon field
4. Enjoy your ${coupon.discountPercentage}% discount instantly!

Shop now: ${process.env.CLIENT_URL || "https://your-ecostore.com"}

This coupon is exclusively for you and cannot be transferred.

Thank you for choosing sustainable shopping with EcoStore 🌱
  `.trim();

  await sendEmail({
    to,
    subject,
    html,
    text,
  });
};

