import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import axios from "axios";
import mongoose from "mongoose";

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
async function reserveInventory(products, reservationId, timeoutMinutes = 10) {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      for (const item of products) {
        if (!item._id) continue;

        console.log(`🔄 Attempting to reserve: ${item.name}, Qty: ${item.quantity}`);

        let updateResult;

        if (item.size && item.color) {
          // Get current state for logging
          const beforeProduct = await Product.findById(item._id).session(session);
          const beforeVariant = beforeProduct?.variants?.find(
            v => v.size === item.size && v.color === item.color
          );
          
          console.log(`Before reservation - Variant ${item.size}/${item.color}: CountInStock: ${beforeVariant?.countInStock}, Reserved: ${beforeVariant?.reserved}`);

          updateResult = await Product.findOneAndUpdate(
            {
              _id: item._id,
              "variants.size": item.size,
              "variants.color": item.color,
              "variants.countInStock": { $gte: item.quantity }
            },
            {
              $inc: {
                "variants.$.countInStock": -item.quantity,
                "variants.$.reserved": item.quantity
              }
            },
            { session, new: true }
          );

          if (updateResult) {
            const afterVariant = updateResult.variants.find(
              v => v.size === item.size && v.color === item.color
            );
            console.log(`After reservation - Variant ${item.size}/${item.color}: CountInStock: ${afterVariant?.countInStock}, Reserved: ${afterVariant?.reserved}`);
          }
        } else {
          // Get current state for logging
          const beforeProduct = await Product.findById(item._id).session(session);
          console.log(`Before reservation - Product: CountInStock: ${beforeProduct?.countInStock}, Reserved: ${beforeProduct?.reserved}`);

          updateResult = await Product.findOneAndUpdate(
            {
              _id: item._id,
              countInStock: { $gte: item.quantity }
            },
            {
              $inc: {
                countInStock: -item.quantity,
                reserved: item.quantity
              }
            },
            { session, new: true }
          );

          if (updateResult) {
            console.log(`After reservation - Product: CountInStock: ${updateResult.countInStock}, Reserved: ${updateResult.reserved}`);
          }
        }

        if (!updateResult) {
          throw new Error(`Insufficient stock for ${item.name}. Please refresh your cart.`);
        }

        console.log(`✅ Reserved ${item.quantity} of ${item.name}`);
      }

      // Store reservation only if ALL items were successfully reserved
      inventoryReservations.set(reservationId, {
        products,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000)
      });
    });
    
    return true;
  } catch (error) {
    console.error('❌ Inventory reservation failed:', error);
    
    // Release any partially reserved inventory
    try {
      await releaseInventory(reservationId);
    } catch (releaseError) {
      console.error('Failed to release inventory after reservation failure:', releaseError);
    }
    
    throw error;
  } finally {
    await session.endSession();
  }
}

// Release reserved inventory
async function releaseInventory(reservationId) {
  const reservation = inventoryReservations.get(reservationId);
  if (!reservation) return;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      for (const item of reservation.products) {
        if (!item._id) continue;

        if (item.size && item.color) {
          await Product.findOneAndUpdate(
            {
              _id: item._id,
              "variants.size": item.size,
              "variants.color": item.color,
            },
            {
              $inc: {
                "variants.$.countInStock": item.quantity,
                "variants.$.reserved": -item.quantity,
              },
            },
            { session }
          );
        } else {
          await Product.findOneAndUpdate(
            { _id: item._id },
            {
              $inc: {
                countInStock: item.quantity,
                reserved: -item.quantity,
              },
            },
            { session }
          );
        }
      }
    });

    inventoryReservations.delete(reservationId);
    console.log(`Released reservation: ${reservationId}`);
  } catch (error) {
    console.error("Inventory release failed:", error);
  } finally {
    await session.endSession();
  }
}

// Confirm inventory (convert reservation to permanent deduction)
// Confirm inventory (convert reservation to permanent deduction)
async function confirmInventory(reservationId) {
  const reservation = inventoryReservations.get(reservationId);
  if (!reservation) {
    console.log(`No reservation found for: ${reservationId}`);
    return;
  }
  
  console.log(`Confirming inventory for reservation: ${reservationId}`);
  
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      for (const item of reservation.products) {
        if (!item._id) continue;

        console.log(`Processing item: ${item.name}, Qty: ${item.quantity}`);

        if (item.size && item.color) {
          // For variants: just remove the reservation, countInStock already reduced
          const result = await Product.findOneAndUpdate(
            {
              _id: item._id,
              "variants.size": item.size,
              "variants.color": item.color
            },
            {
              $inc: {
                "variants.$.reserved": -item.quantity
              }
            },
            { session, new: true }
          );
          
          if (result) {
            console.log(`✅ Confirmed variant inventory: ${item.name} - ${item.size}/${item.color}`);
            
            // Update total product countInStock
            const updatedProduct = await Product.findById(item._id).session(session);
            if (updatedProduct && updatedProduct.variants) {
              updatedProduct.countInStock = updatedProduct.variants.reduce(
                (total, v) => total + v.countInStock,
                0
              );
              await updatedProduct.save({ session });
              console.log(`✅ Updated total countInStock: ${updatedProduct.countInStock}`);
            }
          } else {
            console.error(`❌ Failed to confirm variant: ${item.name}`);
          }
        } else {
          // For simple products: just remove the reservation, countInStock already reduced
          const result = await Product.findOneAndUpdate(
            { _id: item._id },
            {
              $inc: {
                reserved: -item.quantity
              }
            },
            { session, new: true }
          );
          
          if (result) {
            console.log(`✅ Confirmed simple product inventory: ${item.name}`);
            console.log(`✅ Final countInStock: ${result.countInStock}, Reserved: ${result.reserved}`);
          } else {
            console.error(`❌ Failed to confirm product: ${item.name}`);
          }
        }
      }
    });
    
    inventoryReservations.delete(reservationId);
    console.log(`✅ Inventory confirmed and reservation removed: ${reservationId}`);
  } catch (error) {
    console.error('❌ Inventory confirmation failed:', error);
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

    // 5. HANDLE COUPON
    if (couponCode?.trim()) {
      await Coupon.findOneAndUpdate(
        { code: couponCode.trim().toUpperCase(), userId, isActive: true },
        { isActive: false, usedAt: new Date(), usedInOrder: tx_ref }
      );
      console.log(` Coupon applied: ${couponCode}`);
    }

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
      await reserveInventory(products, reservationId, 10); // Reserve for 10 minutes
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
        ` Webhook: Order already processed: ${existingPaidOrder.orderNumber}`
      );

      // Release inventory if it was reserved but order already exists
      const reservationId = event.data.meta?.reservationId;
      if (reservationId) {
        await releaseInventory(reservationId);
      }

      return res.status(200).send("Order already processed");
    }

    if (status !== "successful") {
      console.log(`Payment not successful: ${status} for ${tx_ref}`);

      // Release inventory if payment failed
      const reservationId = event.data.meta?.reservationId;
      if (reservationId) {
        await releaseInventory(reservationId);
      }

      return res.status(200).send("Payment not successful");
    }

    console.log(`Processing webhook for successful payment: ${tx_ref}`);

    const processingKey = `webhook_${transaction_id}_${tx_ref}`;
    if (global.webhookProcessing && global.webhookProcessing[processingKey]) {
      console.log(`Webhook already being processed: ${processingKey}`);
      return res.status(200).send("Webhook already being processed");
    }

    if (!global.webhookProcessing) global.webhookProcessing = {};
    global.webhookProcessing[processingKey] = true;

    let data;

    try {
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

        return res.status(400).send("Missing userId");
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
          }

          try {
            const user = await User.findById(userId);
            if (user && user.email) {
              await sendDetailedOrderEmail({
                to: user.email,
                order,
                flutterwaveData: data,
              });
              console.log(
                `Confirmation email sent for order: ${order.orderNumber}`
              );
            }
          } catch (emailErr) {
            console.error("Email send failed (webhook):", emailErr);
          }
        });

        console.log("Database transaction committed successfully");
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
      delete global.webhookProcessing[processingKey];
    }
  } catch (err) {
    console.error(`Webhook processing error:`, err);
    return res.status(500).send("Webhook processing failed");
  }
};

// ==================== UPDATED CHECKOUT SUCCESS ====================

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

// import path from "path";
// import dotenv from "dotenv";
// import { fileURLToPath } from "url";
// import axios from "axios";
// import mongoose from "mongoose";

// import Coupon from "../models/coupon.model.js";
// import Order from "../models/order.model.js";
// import User from "../models/user.model.js";
// import Product from "../models/product.model.js";
// import { sendEmail } from "../lib/mailer.js";
// import { flw } from "../lib/flutterwave.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// dotenv.config({ path: path.join(__dirname, "../../.env") });

// async function checkCouponEligibility(userId, orderAmount) {
//   try {
//     const orderCount = await Order.countDocuments({
//       user: userId,
//       paymentStatus: "paid",
//     });

//     console.log(
//       `Checking coupon eligibility for user ${userId}: ${orderCount} orders, ₦${orderAmount}`
//     );

//     const activeCoupon = await Coupon.findOne({
//       userId: userId,
//       isActive: true,
//       expirationDate: { $gt: new Date() },
//     });

//     if (activeCoupon) {
//       console.log(
//         `User ${userId} already has active coupon: ${activeCoupon.code}`
//       );
//       return null;
//     }

//     if (orderCount === 1) {
//       console.log(`User ${userId} eligible for FIRST ORDER coupon`);
//       return {
//         discountPercentage: 10,
//         codePrefix: "WELCOME",
//         reason: "first_order",
//         emailType: "welcome_coupon",
//       };
//     } else if (orderCount === 3) {
//       console.log(`User ${userId} eligible for THIRD ORDER coupon`);
//       return {
//         discountPercentage: 15,
//         codePrefix: "LOYAL",
//         reason: "third_order_milestone",
//         emailType: "loyalty_coupon",
//       };
//     } else if (orderCount >= 5 && orderCount % 5 === 0) {
//       console.log(
//         `User ${userId} eligible for VIP coupon (${orderCount} orders)`
//       );
//       return {
//         discountPercentage: 20,
//         codePrefix: "VIP",
//         reason: "every_five_orders",
//         emailType: "vip_coupon",
//       };
//     } else if (orderAmount > 175000) {
//       console.log(
//         `User ${userId} eligible for BIG SPENDER coupon (₦${orderAmount})`
//       );
//       return {
//         discountPercentage: 15,
//         codePrefix: "BIGSPEND",
//         reason: "high_value_order",
//         emailType: "bigspender_coupon",
//       };
//     }

//     console.log(
//       `User ${userId} not eligible for coupon (${orderCount} orders, ₦${orderAmount})`
//     );
//     return null;
//   } catch (error) {
//     console.error("Error checking coupon eligibility:", error);
//     return null;
//   }
// }

// async function createNewCoupon(userId, options = {}) {
//   const {
//     discountPercentage = 10,
//     daysValid = 30,
//     couponType = "GIFT",
//     reason = "general",
//   } = options;

//   try {
//     console.log(`Starting coupon creation for user ${userId}...`);

//     const newCode =
//       couponType + Math.random().toString(36).substring(2, 8).toUpperCase();

//     console.log(`Generated coupon code: ${newCode}`);

//     const coupon = await Coupon.findOneAndUpdate(
//       { userId: userId },
//       {
//         code: newCode,
//         discountPercentage,
//         expirationDate: new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000),
//         isActive: true,
//         couponReason: reason,
//         deactivatedAt: null,
//         deactivationReason: null,
//         usedAt: null,
//         usedInOrder: null,
//       },
//       {
//         upsert: true,
//         new: true,
//         runValidators: true,
//         setDefaultsOnInsert: true,
//       }
//     );

//     console.log(
//       `Successfully ${coupon.$isNew ? "CREATED" : "UPDATED"} coupon: ${
//         coupon.code
//       } for user ${userId}`
//     );
//     return coupon;
//   } catch (error) {
//     console.error("Failed to create/update coupon:", error);

//     if (error.code === 11000) {
//       console.log(`Duplicate key error, trying alternative approach...`);

//       try {
//         const existingCoupon = await Coupon.findOne({ userId });
//         if (existingCoupon) {
//           console.log(`Updating existing coupon: ${existingCoupon.code}`);
//           existingCoupon.code =
//             couponType +
//             Math.random().toString(36).substring(2, 8).toUpperCase();
//           existingCoupon.discountPercentage = discountPercentage;
//           existingCoupon.expirationDate = new Date(
//             Date.now() + daysValid * 24 * 60 * 60 * 1000
//           );
//           existingCoupon.isActive = true;
//           existingCoupon.couponReason = reason;
//           existingCoupon.deactivatedAt = null;
//           existingCoupon.deactivationReason = null;

//           await existingCoupon.save();
//           console.log(`Updated existing coupon: ${existingCoupon.code}`);
//           return existingCoupon;
//         }
//       } catch (fallbackError) {
//         console.error("Fallback approach also failed:", fallbackError);
//       }
//     }

//     return null;
//   }
// }

// function generateOrderNumber() {
//   return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
// }

// function createPaymentMethodData(flutterwaveData) {
//   const paymentType = flutterwaveData.payment_type || "card";

//   return {
//     method: paymentType,
//     status: "PAID",
//     card: {
//       brand: flutterwaveData.card?.brand || "Unknown",
//       last4: flutterwaveData.card?.last_4digits || null,
//       exp_month: flutterwaveData.card?.exp_month || null,
//       exp_year: flutterwaveData.card?.exp_year || null,
//       type: flutterwaveData.card?.type || null,
//       issuer: flutterwaveData.card?.issuer || null,
//     },
//   };
// }

// async function processOrderCreation(transactionData) {
//   const {
//     transaction_id,
//     tx_ref,
//     data,
//     meta,
//     userId,
//     parsedProducts,
//     couponCode,
//   } = transactionData;

//   console.log(` STARTING order processing for: ${tx_ref}`);

//   // 1. IMMEDIATE DUPLICATE CHECK
//   const existingOrder = await Order.findOne({
//     $or: [
//       { flutterwaveTransactionId: transaction_id },
//       { flutterwaveRef: tx_ref },
//     ],
//   });

//   if (existingOrder) {
//     console.log(` ORDER ALREADY EXISTS: ${existingOrder.orderNumber}`);
//     return { order: existingOrder, isNew: false };
//   }

//   // 2. CHECK INVENTORY FIRST (before creating order)
//   console.log(` Checking inventory for ${parsedProducts.length} products`);
//   await checkInventoryAvailability(parsedProducts);

//   // 3. CREATE ORDER
//   try {
//     console.log(` CREATING NEW ORDER for user: ${userId}`);

//     const user = await User.findById(userId);
//     if (!user) throw new Error("User not found");

//     const products = parsedProducts.map((p) => ({
//       product: p._id,
//       name: p.name || "Unknown Product",
//       image: (p.images && p.images[0]) || "/placeholder.png",
//       quantity: p.quantity || 1,
//       price: p.price || 0,
//       selectedSize: p.size || "",
//       selectedColor: p.color || "",
//       selectedCategory: p.category || "",
//     }));

//     const order = new Order({
//       user: user._id,
//       products,
//       subtotal: Number(meta.originalTotal) || Number(data.amount) || 0,
//       discount: Number(meta.discountAmount) || 0,
//       totalAmount: Number(meta.finalTotal) || Number(data.amount) || 0,
//       orderNumber: generateOrderNumber(),
//       couponCode: couponCode || null,
//       deliveryAddress: meta.deliveryAddress || "No address provided",
//       phone: meta.phoneNumber || "No phone provided",
//       flutterwaveRef: tx_ref,
//       flutterwaveTransactionId: transaction_id,
//       paymentStatus: "paid",
//       status: "Pending",
//       paymentMethod: createPaymentMethodData(data),
//       isProcessed: true,
//     });

//     // Save order (will fail if duplicate due to unique indexes)
//     await order.save();

//     console.log(` SUCCESS: Created order ${order.orderNumber}`);

//     // 4. REDUCE INVENTORY (only after order is successfully created)
//     console.log(` Reducing inventory for order ${order.orderNumber}`);
//     await reduceInventory(parsedProducts);

//     // 5. CLEAR CART
//     await User.findByIdAndUpdate(userId, { cartItems: [] });

//     // 6. HANDLE COUPON
//     if (couponCode?.trim()) {
//       await Coupon.findOneAndUpdate(
//         { code: couponCode.trim().toUpperCase(), userId, isActive: true },
//         { isActive: false, usedAt: new Date(), usedInOrder: tx_ref }
//       );
//       console.log(` Coupon applied: ${couponCode}`);
//     }

//     return { order, isNew: true };
//   } catch (error) {
//     // Handle duplicate order error
//     if (error.code === 11000) {
//       console.log(`🔄 Duplicate key error - finding existing order...`);
//       const existingOrder = await Order.findOne({
//         $or: [
//           { flutterwaveTransactionId: transaction_id },
//           { flutterwaveRef: tx_ref },
//         ],
//       });

//       if (existingOrder) {
//         console.log(` Found existing order: ${existingOrder.orderNumber}`);
//         return { order: existingOrder, isNew: false };
//       }
//     }

//     console.error(`❌ ORDER CREATION FAILED:`, error);
//     throw error;
//   }
// }

// // Check inventory availability (READ ONLY - no changes)
// async function checkInventoryAvailability(parsedProducts) {
//   for (const item of parsedProducts) {
//     if (!item._id) continue;

//     const isTestProduct =
//       item._id === "65a1b2c3d4e5f67890123457" ||
//       item._id === "507f1f77bcf86cd799439011";
//     if (isTestProduct) {
//       console.log(` Test product - skipping inventory check`);
//       continue;
//     }

//     const product = await Product.findById(item._id);
//     if (!product) {
//       throw new Error(`Product ${item.name} not found`);
//     }

//     if (product.variants && product.variants.length > 0) {
//       const variant = product.variants.find(
//         (v) => v.size === item.size && v.color === item.color
//       );

//       if (!variant) {
//         throw new Error(
//           `Variant ${item.size}/${item.color} not found for ${item.name}`
//         );
//       }

//       if (variant.countInStock < item.quantity) {
//         throw new Error(
//           `Insufficient stock for ${item.name} - ${item.size}/${item.color}. Available: ${variant.countInStock}, Requested: ${item.quantity}`
//         );
//       }
//     } else {
//       if (product.countInStock < item.quantity) {
//         throw new Error(
//           `Insufficient stock for ${item.name}. Available: ${product.countInStock}, Requested: ${item.quantity}`
//         );
//       }
//     }

//     console.log(` Inventory available: ${item.name} - Qty: ${item.quantity}`);
//   }
// }

// // Reduce inventory (ATOMIC updates to prevent race conditions)
// async function reduceInventory(parsedProducts) {
//   for (const item of parsedProducts) {
//     if (!item._id) continue;

//     const isTestProduct =
//       item._id === "65a1b2c3d4e5f67890123457" ||
//       item._id === "507f1f77bcf86cd799439011";
//     if (isTestProduct) {
//       console.log(` Test product - skipping inventory reduction`);
//       continue;
//     }

//     try {
//       let updateResult;

//       // For products with variants
//       const product = await Product.findById(item._id);
//       if (product.variants && product.variants.length > 0) {
//         updateResult = await Product.findOneAndUpdate(
//           {
//             _id: item._id,
//             "variants.size": item.size,
//             "variants.color": item.color,
//             "variants.countInStock": { $gte: item.quantity },
//           },
//           {
//             $inc: {
//               "variants.$.countInStock": -item.quantity,
//             },
//           },
//           { new: true }
//         );

//         if (updateResult) {
//           // Update total countInStock
//           const updatedProduct = await Product.findById(item._id);
//           updatedProduct.countInStock = updatedProduct.variants.reduce(
//             (total, v) => total + v.countInStock,
//             0
//           );
//           await updatedProduct.save();
//         }
//       } else {
//         // For simple products
//         updateResult = await Product.findOneAndUpdate(
//           { _id: item._id, countInStock: { $gte: item.quantity } },
//           { $inc: { countInStock: -item.quantity } },
//           { new: true }
//         );
//       }

//       if (updateResult) {
//         console.log(` Inventory reduced: ${item.name} by ${item.quantity}`);
//       } else {
//         // This should rarely happen since we checked availability
//         console.error(
//           `Inventory reduction failed for: ${item.name} - manual review needed`
//         );
//       }
//     } catch (error) {
//       console.error(` Inventory reduction error for ${item.name}:`, error);
//       // Don't throw - order is already created, log for manual review
//     }
//   }
// }

// export const createCheckoutSession = async (req, res) => {
//   try {
//     const { products, couponCode } = req.body;
//     const userId = req.user._id;

//     if (!Array.isArray(products) || products.length === 0) {
//       return res.status(400).json({ error: "Invalid or empty products array" });
//     }

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const defaultPhone =
//       user.phones?.find((p) => p.isDefault) || user.phones?.[0];
//     const defaultAddress =
//       user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

//     const addressString = defaultAddress
//       ? (defaultAddress.address && defaultAddress.address.trim()) ||
//         `${defaultAddress.landmark ? defaultAddress.landmark + ", " : ""}${
//           defaultAddress.lga ? defaultAddress.lga + ", " : ""
//         }${defaultAddress.city ? defaultAddress.city + ", " : ""}${
//           defaultAddress.state || ""
//         }`.trim()
//       : "";

//     if (!defaultPhone?.number?.trim() || !addressString) {
//       return res.status(400).json({
//         error: "You must add a phone number and address before checkout.",
//       });
//     }

//     const originalTotal = products.reduce((acc, p) => {
//       const qty = p.quantity || 1;
//       const price = Number(p.price) || 0;
//       return acc + price * qty;
//     }, 0);

//     let discountAmount = 0;
//     let validCoupon = null;

//     if (couponCode && couponCode.trim() !== "") {
//       try {
//         validCoupon = await Coupon.findOne({
//           code: couponCode.trim().toUpperCase(),
//           userId,
//           isActive: true,
//           expirationDate: { $gt: new Date() },
//         });

//         if (validCoupon) {
//           discountAmount = Math.round(
//             (originalTotal * validCoupon.discountPercentage) / 100
//           );
//           console.log(
//             `Coupon applied: ${couponCode} - Discount: ₦${discountAmount}`
//           );
//         } else {
//           console.log(`Invalid or expired coupon: ${couponCode}`);
//         }
//       } catch (error) {
//         console.error("Error validating coupon:", error);
//       }
//     }

//     const finalTotal = Math.max(0, originalTotal - discountAmount);

//     const tx_ref = `ECOSTORE-${Date.now()}`;

//     const payload = {
//       tx_ref,
//       amount: finalTotal,
//       currency: "NGN",
//       redirect_url: `${process.env.CLIENT_URL}/purchase-success`,
//       customer: {
//         email: user.email,
//         phonenumber: defaultPhone.number,
//         firstname: user.firstname || "",
//         lastname: user.lastname || "",
//         name:
//           (user.firstname || "") + (user.lastname ? ` ${user.lastname}` : ""),
//       },
//       payment_options: "card",
//       meta: {
//         userId: userId.toString(),
//         products: JSON.stringify(
//           products.map((p) => ({
//             _id: p._id || p.id || null,
//             name: p.name,
//             images: p.images || [],
//             quantity: p.quantity || 1,
//             price: p.price,
//             size: p.size || null,
//             color: p.color || null,
//             category: p.category || null,
//           }))
//         ),
//         couponCode: couponCode || "",
//         originalTotal,
//         discountAmount,
//         finalTotal,
//         deliveryAddress: addressString || "",
//         phoneNumber: defaultPhone.number || "",
//       },
//       customizations: {
//         title: "EcoStore Purchase",
//         description: "Payment for items in your cart",
//         logo: process.env.STORE_LOGO || "https://yourstore.com/logo.png",
//       },
//     };

//     const response = await axios.post(
//       "https://api.flutterwave.com/v3/payments",
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//         timeout: 20000,
//       }
//     );

//     const link =
//       response?.data?.data?.link || response?.data?.data?.authorization_url;

//     if (!link) {
//       console.error("No payment link returned by Flutterwave:", response.data);
//       return res.status(500).json({ message: "Failed to initialize payment" });
//     }

//     console.log("Flutterwave payment initialized:", tx_ref, "link:", link);
//     return res.status(200).json({ link, tx_ref });
//   } catch (err) {
//     console.error("Error initializing Flutterwave payment:", err);
//     return res.status(500).json({
//       message: "Payment initialization failed",
//       error: err?.message || String(err),
//     });
//   }
// };

// export const handleFlutterwaveWebhook = async (req, res) => {
//   console.log("WEBHOOK CALLED - STARTING PROCESS");

//   try {
//     const signature = req.headers["verif-hash"];
//     console.log("Signature received:", signature);

//     if (!signature) {
//       console.warn("Missing verif-hash header");
//       return res.status(401).send("Missing signature");
//     }

//     if (signature !== process.env.FLW_WEBHOOK_HASH) {
//       console.warn("Invalid webhook signature - possible forgery attempt");
//       console.log("Received signature:", signature);
//       console.log("Expected signature:", process.env.FLW_WEBHOOK_HASH);
//       return res.status(401).send("Invalid signature");
//     }

//     console.log("Webhook signature validated successfully");

//     const event = req.body;
//     if (!event) {
//       console.warn("Empty webhook event body");
//       return res.status(400).send("No event body");
//     }

//     console.log(`Webhook received: ${event.event} for ${event.data?.tx_ref}`);

//     if (event.event !== "charge.completed") {
//       console.log(`Ignoring webhook event: ${event.event}`);
//       return res.status(200).send("Ignored event type");
//     }

//     const { id: transaction_id, tx_ref, status } = event.data;

//     // === ENHANCED DUPLICATE PROTECTION ===

//     const existingPaidOrder = await Order.findOne({
//       $or: [
//         { flutterwaveTransactionId: transaction_id },
//         { flutterwaveRef: tx_ref },
//       ],
//       paymentStatus: "paid",
//     });

//     if (existingPaidOrder) {
//       console.log(
//         ` Webhook: Order already processed: ${existingPaidOrder.orderNumber}`
//       );
//       return res.status(200).send("Order already processed");
//     }

//     if (status !== "successful") {
//       console.log(`Payment not successful: ${status} for ${tx_ref}`);
//       return res.status(200).send("Payment not successful");
//     }

//     console.log(`Processing webhook for successful payment: ${tx_ref}`);

//     const processingKey = `webhook_${transaction_id}_${tx_ref}`;
//     if (global.webhookProcessing && global.webhookProcessing[processingKey]) {
//       console.log(`Webhook already being processed: ${processingKey}`);
//       return res.status(200).send("Webhook already being processed");
//     }

//     if (!global.webhookProcessing) global.webhookProcessing = {};
//     global.webhookProcessing[processingKey] = true;

//     let data;

//     try {
//       const isTestTransaction =
//         transaction_id === 285959875 ||
//         tx_ref.includes("TEST") ||
//         tx_ref.includes("ECOSTORE-");

//       if (isTestTransaction) {
//         console.log(
//           "Test transaction detected - bypassing Flutterwave verification"
//         );
//         data = event.data;
//         data.payment_type = data.payment_type || "card";
//         data.amount = data.amount || 100;
//         data.currency = data.currency || "NGN";
//         console.log("Using webhook data directly for test transaction");
//       } else {
//         console.log(
//           `Verifying real transaction with Flutterwave: ${transaction_id}`
//         );
//         const verifyResp = await flw.Transaction.verify({ id: transaction_id });

//         if (!verifyResp?.data || verifyResp.data.status !== "successful") {
//           console.error(`Webhook verification failed for: ${transaction_id}`);
//           console.log("Verification response:", verifyResp);
//           return res.status(400).send("Payment verification failed");
//         }

//         data = verifyResp.data;
//         console.log("Real transaction verified successfully");
//       }

//       const meta_data = event.meta_data || {};

//       let parsedProducts = [];
//       if (meta_data.products) {
//         try {
//           if (typeof meta_data.products === "string") {
//             parsedProducts = JSON.parse(meta_data.products);
//           } else {
//             parsedProducts = meta_data.products;
//           }
//           parsedProducts = parsedProducts.map((p) => ({
//             _id: p._id || p.id || null,
//             name: p.name,
//             images: p.images || [],
//             quantity: p.quantity || 1,
//             price: p.price,
//             size: p.size || null,
//             color: p.color || null,
//             category: p.category || null,
//           }));
//         } catch (error) {
//           console.error("Error parsing products:", error);
//           parsedProducts = [];
//         }
//       }

//       let userId = meta_data.userId;
//       const couponCode = meta_data.couponCode || "";
//       const originalTotal =
//         Number(meta_data.originalTotal) || Number(data.amount) || 0;
//       const discountAmount = Number(meta_data.discountAmount) || 0;
//       const finalTotal =
//         Number(meta_data.finalTotal) || Number(data.amount) || 0;
//       const deliveryAddress = meta_data.deliveryAddress || "";
//       const phoneNumber = event.data.customer?.phone_number || "";

//       console.log("UserId from meta_data:", userId);
//       console.log("Phone number:", phoneNumber);
//       console.log("Parsed products count:", parsedProducts.length);
//       console.log(
//         `Extracted metadata - User: ${userId}, Products: ${parsedProducts.length}, Coupon: ${couponCode}`
//       );

//       if (!userId) {
//         console.error(
//           "Missing userId in webhook data. Full meta_data:",
//           JSON.stringify(meta_data, null, 2)
//         );
//         const fallbackUser = await User.findOne();
//         if (fallbackUser) {
//           console.log(`Using fallback user: ${fallbackUser._id}`);
//           userId = fallbackUser._id.toString();
//         } else {
//           return res.status(400).send("Missing userId");
//         }
//       }

//       console.log(`Checking for existing order with tx_ref: ${tx_ref}`);
//       const existingOrder = await Order.findOne({
//         $or: [
//           { flutterwaveTransactionId: transaction_id },
//           { flutterwaveRef: tx_ref },
//         ],
//       });

//       if (existingOrder) {
//         console.log(
//           `Found existing order: ${existingOrder.orderNumber} with status: ${existingOrder.paymentStatus}`
//         );
//         if (existingOrder.paymentStatus === "paid") {
//           console.log(`Order already processed: ${existingOrder.orderNumber}`);
//           return res.status(200).send("Order already processed");
//         }
//       } else {
//         console.log("No existing order found - creating new order");
//       }

//       console.log("Starting database transaction...");
//       const session = await mongoose.startSession();

//       try {
//         await session.withTransaction(async () => {
//           const transactionData = {
//             transaction_id,
//             tx_ref,
//             data,
//             meta: {
//               userId: userId,
//               products: meta_data.products,
//               couponCode: couponCode,
//               originalTotal: originalTotal,
//               discountAmount: discountAmount,
//               finalTotal: finalTotal,
//               deliveryAddress: deliveryAddress || "No address provided",
//               phoneNumber:
//                 event.data.customer?.phone_number ||
//                 phoneNumber ||
//                 "No phone number",
//             },
//             userId,
//             parsedProducts,
//             couponCode,
//           };

//           console.log("Processing order creation...");
//           const { order, isNew } = await processOrderCreation(
//             transactionData,
//             session
//           );

//           console.log(
//             `${isNew ? "Created new" : "Updated existing"} order: ${
//               order.orderNumber
//             } for user: ${userId}`
//           );

//           if (isNew) {
//             try {
//               console.log(`STARTING COUPON PROCESS FOR USER: ${userId}`);
//               console.log(`Order amount: ₦${order.totalAmount}`);

//               const couponEligibility = await checkCouponEligibility(
//                 userId,
//                 order.totalAmount
//               );
//               console.log(`Coupon eligibility result:`, couponEligibility);

//               if (couponEligibility) {
//                 console.log(
//                   `User eligible for ${couponEligibility.reason} coupon`
//                 );

//                 console.log(`Calling createNewCoupon with:`, {
//                   userId,
//                   discountPercentage: couponEligibility.discountPercentage,
//                   couponType: couponEligibility.codePrefix,
//                   reason: couponEligibility.reason,
//                 });

//                 const newCoupon = await createNewCoupon(userId, {
//                   discountPercentage: couponEligibility.discountPercentage,
//                   couponType: couponEligibility.codePrefix,
//                   reason: couponEligibility.reason,
//                   daysValid: 30,
//                 });

//                 console.log(`createNewCoupon returned:`, newCoupon);

//                 if (newCoupon && newCoupon.isActive) {
//                   console.log(
//                     `Successfully created ACTIVE coupon: ${newCoupon.code}`
//                   );

//                   try {
//                     const user = await User.findById(userId);
//                     console.log(`User found for email:`, user?.email);

//                     if (user && user.email) {
//                       console.log(
//                         `Attempting to send coupon email to: ${user.email}`
//                       );
//                       await sendCouponEmail({
//                         to: user.email,
//                         coupon: newCoupon,
//                         couponType: couponEligibility.emailType,
//                         orderCount: await Order.countDocuments({
//                           user: userId,
//                           paymentStatus: "paid",
//                         }),
//                       });
//                       console.log(`Coupon email sent for: ${newCoupon.code}`);
//                     } else {
//                       console.log(`No user or email found for coupon`);
//                     }
//                   } catch (emailErr) {
//                     console.error("Coupon email send failed:", emailErr);
//                     console.error("Email error details:", emailErr.message);
//                   }
//                 } else {
//                   console.log(`Coupon creation returned:`, newCoupon);
//                   if (!newCoupon) {
//                     console.log(`Coupon creation returned NULL`);
//                   } else if (!newCoupon.isActive) {
//                     console.log(`Coupon created but is INACTIVE`);
//                   }
//                 }
//               } else {
//                 console.log(`User not eligible for coupon at this time`);
//               }
//             } catch (error) {
//               console.error("Coupon creation failed:", error);
//               console.error("Error stack:", error.stack);
//             }
//           }

//           try {
//             const user = await User.findById(userId);
//             if (user && user.email) {
//               await sendDetailedOrderEmail({
//                 to: user.email,
//                 order,
//                 flutterwaveData: data,
//               });
//               console.log(
//                 `Confirmation email sent for order: ${order.orderNumber}`
//               );
//             } else {
//               console.log("User not found or no email for order confirmation");
//             }
//           } catch (emailErr) {
//             console.error("Email send failed (webhook):", emailErr);
//           }
//         });

//         console.log("Database transaction committed successfully");
//       } finally {
//         await session.endSession();
//       }

//       console.log(`Webhook processing completed successfully`);
//       return res.status(200).send("Order processed successfully");
//     } finally {
//       delete global.webhookProcessing[processingKey];
//     }
//   } catch (err) {
//     console.error(`Webhook processing error:`, err);
//     return res.status(500).send("Webhook processing failed");
//   }
// };

// async function withRetry(fn, retries = 3, delay = 200) {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       return await fn();
//     } catch (err) {
//       const transient =
//         err?.codeName === "WriteConflict" ||
//         (err?.errorLabels &&
//           err.errorLabels.includes("TransientTransactionError"));

//       if (transient && attempt < retries) {
//         console.warn(`Transient error, retrying ${attempt}/${retries}...`);
//         await new Promise((r) => setTimeout(r, delay * attempt));
//         continue;
//       }
//       throw err;
//     }
//   }
// }

// export const checkoutSuccess = async (req, res) => {
//   try {
//     const { tx_ref, transaction_id } = req.body;

//     if (!transaction_id) {
//       return res.status(400).json({ error: "transaction_id is required" });
//     }
//     // === ENHANCED DUPLICATE PROTECTION ===
//     const existingPaidOrder = await Order.findOne({
//       $or: [
//         { flutterwaveTransactionId: transaction_id },
//         { flutterwaveRef: tx_ref },
//       ],
//       paymentStatus: "paid",
//     });

//     if (existingPaidOrder) {
//       console.log(
//         `🔄 CheckoutSuccess: Order already processed: ${existingPaidOrder.orderNumber}`
//       );
//       return res.status(200).json({
//         success: true,
//         message: "Order already processed",
//         orderId: existingPaidOrder._id,
//         orderNumber: existingPaidOrder.orderNumber,
//       });
//     }

//     const verifyResp = await flw.Transaction.verify({ id: transaction_id });
//     const data = verifyResp?.data;

//     if (!data || data.status !== "successful") {
//       return res.status(400).json({ error: "Payment verification failed" });
//     }

//     const meta = data.meta || {};
//     const userId = meta.userId;
//     const parsedProducts = meta.products ? JSON.parse(meta.products) : [];
//     const couponCode = meta.couponCode || "";

//     if (!userId) {
//       return res
//         .status(400)
//         .json({ error: "Missing userId in payment metadata" });
//     }

//     const existingOrder = await Order.findOne({
//       $or: [
//         { flutterwaveTransactionId: transaction_id },
//         { flutterwaveRef: tx_ref },
//       ],
//     });

//     if (existingOrder && existingOrder.paymentStatus === "paid") {
//       return res.status(200).json({
//         success: true,
//         message: "Order already processed",
//         orderId: existingOrder._id,
//         orderNumber: existingOrder.orderNumber,
//       });
//     }

//     let finalOrder;

//     await withRetry(async () => {
//       const session = await mongoose.startSession();

//       try {
//         await session.withTransaction(async () => {
//           const transactionData = {
//             transaction_id,
//             tx_ref,
//             data,
//             meta,
//             userId,
//             parsedProducts,
//             couponCode,
//           };

//           const { order } = await processOrderCreation(
//             transactionData,
//             session
//           );
//           finalOrder = order;

//           const couponEligibility = await checkCouponEligibility(
//             userId,
//             finalOrder.totalAmount
//           );
//           if (couponEligibility) {
//             const newCoupon = await createNewCoupon(userId, {
//               discountPercentage: couponEligibility.discountPercentage,
//               couponType: couponEligibility.codePrefix,
//               reason: couponEligibility.reason,
//               daysValid: 30,
//             });

//             if (newCoupon) {
//               console.log(
//                 `Created ${couponEligibility.reason} coupon: ${newCoupon.code}`
//               );

//               try {
//                 const user = await User.findById(userId);
//                 if (user && user.email) {
//                   await sendCouponEmail({
//                     to: user.email,
//                     coupon: newCoupon,
//                     couponType: couponEligibility.emailType,
//                     orderCount: await Order.countDocuments({
//                       user: userId,
//                       paymentStatus: "paid",
//                     }),
//                   });
//                 }
//               } catch (emailErr) {
//                 console.error("Coupon email send failed:", emailErr);
//               }
//             }
//           }

//           (async () => {
//             try {
//               const user = await User.findById(userId);
//               await sendDetailedOrderEmail({
//                 to: user.email,
//                 order,
//                 flutterwaveData: data,
//               });
//             } catch (emailErr) {
//               console.error("Email send failed (checkoutSuccess):", emailErr);
//             }
//           })();
//         });
//       } finally {
//         await session.endSession();
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Payment verified and order finalized",
//       orderId: finalOrder._id,
//       orderNumber: finalOrder.orderNumber,
//     });
//   } catch (error) {
//     console.error("checkoutSuccess failed:", error);
//     return res.status(500).json({
//       error: error.message || "Checkout failed",
//     });
//   }
// };

// // Update your email function to use paymentMethod instead of paymentData
// export const sendDetailedOrderEmail = async ({
//   to,
//   order,
//   flutterwaveData,
// }) => {
//   if (!to || !order) return;

//   let customerName = "";
//   try {
//     const userDoc = await User.findById(order.user).select(
//       "firstname lastname"
//     );
//     if (userDoc) {
//       customerName =
//         userDoc.firstname || userDoc.lastname || order.user?.name || "Customer";
//     }
//   } catch (err) {
//     console.error("Error fetching user name for email:", err);
//   }

//   // Use paymentMethod from order instead of paymentData
//   const paymentMethod = order.paymentMethod || {};
//   const tx_ref = order.flutterwaveRef || "N/A";
//   const transaction_id = order.flutterwaveTransactionId || "N/A";
//   const payment_type = paymentMethod.method || "N/A";
//   const card = paymentMethod.card || {};

//   // Prepare items array
//   const items = order.products || order.items || [];

//   const productRows = items
//     .map((item) => {
//       let details = "";
//       if (item.selectedSize) details += `Size: ${item.selectedSize} `;
//       if (item.selectedColor) details += `| Color: ${item.selectedColor}`;

//       return `
//         <tr>
//           <td style="padding: 8px 12px; border:1px solid #eee;">
//           <p display:block; margin-top: 1; margin-bottom:1>${
//             item.name || item.productName || "Item"
//           }</p>
//             <img src="${item.image}" alt="${
//         item.name
//       }" width="60" height="60" style="border-radius: 6px; object-fit: cover;" />

//             ${
//               details
//                 ? `<br/><small style="color:#666;">${details || ""}</small>`
//                 : ""
//             }
//           </td>
//           <td style="padding: 8px 12px; text-align:center; border:1px solid #eee;">${
//             item.quantity || 1
//           }</td>
//           <td style="padding: 8px 12px; text-align:right; border:1px solid #eee;">₦${Number(
//             item.price || item.unitPrice || 0
//           ).toLocaleString()}</td>
//         </tr>`;
//     })
//     .join("");

//   const totalAmount = order.totalAmount || order.totalPrice || order.total || 0;
//   const subtotal = order.subtotal || order.subTotal || 0;
//   const discount = order.discount || 0;

//   // Card info block (masked)
//   const maskedLast4 = card.last4 || card.last_4digits || "****";
//   const cardBrand = card.type || "Card";

//   const cardInfo = card.last4
//     ? `
//     <div style="margin-top:10px;font-size:14px;color:#333;">
//       <strong>Payment Method:</strong> ${cardBrand} **** ${maskedLast4}<br/>
//     </div>`
//     : "";

//   // HTML email (your existing email template with paymentMethod adjustments)
//   const html = `
//     <div style="font-family: Arial, sans-serif; background-color: #f6f8fa; padding: 20px;">
//       <div style="max-width: 700px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.06);">
//         <div style="background: #10b981; padding: 22px; text-align: center; color: #fff;">
//           <img src="${
//             process.env.STORE_LOGO || ""
//           }" alt="Store Logo" style="max-height:50px; display:block; margin: 0 auto 8px;" />
//           <h1 style="margin:0; font-size:20px;">Order Confirmation</h1>
//           <div style="margin-top:6px; font-size:15px;">${
//             order.orderNumber || "N/A"
//           }</div>
//         </div>

//         <div style="padding: 22px; color:#333;">
//           <p style="margin:0 0 8px;">Hi <strong>${customerName}</strong>,</p>
//           <p style="margin:0 0 16px;">Thank you for your order! We've received your payment and are now processing your purchase. Below are your order details.</p>

//           <h3 style="margin:18px 0 8px;">🧾 Order Summary</h3>
//           <table style="width:100%; border-collapse: collapse; margin-top:8px;">
//             <thead>
//               <tr style="background:#f7faf7;">
//                 <th style="padding:10px; text-align:left; border:1px solid #eee;">Product</th>
//                 <th style="padding:10px; text-align:center; border:1px solid #eee;">Qty</th>
//                 <th style="padding:10px; text-align:right; border:1px solid #eee;">Price</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${
//                 productRows ||
//                 `<tr><td colspan="3" style="padding:12px;text-align:center;color:#777;">No items listed</td></tr>`
//               }
//             </tbody>
//           </table>
//           <p style="margin-top: 20px; font-size: 16px;">
//             <strong>Original Subtotal:</strong> ₦${Number(
//               subtotal
//             ).toLocaleString()} <br>
//             <strong>Coupon Discount:</strong> -₦${Number(
//               discount
//             ).toLocaleString()}<br>
//             <strong>Final Total:</strong> ₦${Number(
//               totalAmount
//             ).toLocaleString()}
//           </p>

//           <p style="margin:0;">
//             <strong>Address:</strong> ${
//               order.deliveryAddress || "No address provided"
//             }<br/>
//             <strong>Phone:</strong> ${order.phone || "No phone provided"}<br/>
//             <strong>Email:</strong> ${to}
//           </p>

//           <h3 style="margin:18px 0 8px;">💳 Payment Details</h3>
//           <p style="margin:0 0 6px;">
//             <strong>Payment Status:</strong> ${
//               order.paymentStatus || "Confirmed"
//             }<br/>
//             <strong>Payment Type:</strong> ${payment_type}<br/>
//             <strong>Transaction Ref:</strong> ${tx_ref}<br/>
//             <strong>Transaction ID:</strong> ${transaction_id}
//           </p>

//           ${cardInfo}

//           <p style="margin-top:20px; color:#555;">We'll send another email once your order ships.</p>

//         </div>

//         <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
//           <p style="margin: 0 0 10px 0;"><p style="margin-top:18px;">Thanks for choosing <strong>Eco~Store</strong> 🌱</p>
//           <p style="margin: 0;">Need help? Contact us at <a href="mailto:${
//             process.env.SUPPORT_EMAIL || "support@ecostore.example"
//           }"
//              style="color: #10b981; text-decoration: none;">${
//                process.env.SUPPORT_EMAIL || "support@ecostore.example"
//              }</a></p>
//         </div>
//       </div>
//     </div>
//   `;

//   // Plain text fallback
//   const text = [
//     `EcoStore — Order Confirmation`,
//     ` ${order.orderNumber || "N/A"}`,
//     `Customer: ${customerName}`,
//     `Total: ₦${Number(totalAmount).toLocaleString()}`,
//     `Delivery Address: ${order.deliveryAddress || "No address provided"}`,
//     `Phone: ${order.phone || "No phone provided"}`,
//     `Payment Status: ${order.paymentStatus || "Confirmed"}`,
//     `Payment Type: ${payment_type}`,
//     `Transaction Ref: ${tx_ref}`,
//     `Transaction ID: ${transaction_id}`,
//     ``,
//     `Items:`,
//     ...items.map(
//       (it) =>
//         ` - ${it.quantity || 1} x ${it.name || "Item"} — ₦${Number(
//           it.price || 0
//         ).toLocaleString()}`
//     ),
//     ``,
//     `Thanks for shopping with Eco~Store!`,
//   ].join("\n");

//   // Send email
//   await sendEmail({
//     to,
//     subject: `EcoStore — Order Confirmation #${order.orderNumber || "N/A"}`,
//     html,
//     text,
//   });
// };

// // Add this function after sendDetailedOrderEmail
// export const sendCouponEmail = async ({
//   to,
//   coupon,
//   couponType = "welcome_coupon",
//   orderCount = 1,
// }) => {
//   if (!to || !coupon) return;

//   let subject = "";
//   let title = "";
//   let message = "";
//   let couponValue = `${coupon.discountPercentage}% OFF`;

//   // Different email content based on coupon type
//   switch (couponType) {
//     case "welcome_coupon":
//       subject = `🎉 Welcome to EcoStore! Here's Your ${couponValue} Gift`;
//       title = "Welcome to the EcoStore Family!";
//       message = `
//         <p>Thank you for joining us! To welcome you to our eco-friendly community,
//         we're giving you a special discount on your next purchase.</p>
//         <p>We're thrilled to have you as part of our mission to make the world greener, one purchase at a time.</p>
//       `;
//       break;

//     case "loyalty_coupon":
//       subject = `🌟 Loyalty Reward! ${couponValue} for Being an Amazing Customer`;
//       title = "You're Amazing! Here's a Thank You Gift";
//       message = `
//         <p>Wow! You've already placed ${orderCount} orders with us. We're truly grateful
//         for your loyalty and trust in EcoStore.</p>
//         <p>As a token of our appreciation, please enjoy this special discount on your next eco-friendly purchase.</p>
//       `;
//       break;

//     case "vip_coupon":
//       subject = `🏆 VIP Treatment! ${couponValue} Exclusive Reward`;
//       title = "You're Now an EcoStore VIP!";
//       message = `
//         <p>Congratulations! With ${orderCount} orders, you've officially reached VIP status
//         in our eco-friendly community.</p>
//         <p>Thank you for being such a dedicated supporter of sustainable living.
//         Enjoy this exclusive VIP reward!</p>
//       `;
//       break;

//     case "bigspender_coupon":
//       subject = `💎 Premium Reward! ${couponValue} for Your Generous Order`;
//       title = "Thank You for Your Generous Purchase!";
//       message = `
//         <p>We noticed your recent substantial investment in eco-friendly products,
//         and we're deeply grateful for your support!</p>
//         <p>Your commitment to sustainable shopping helps us continue our mission.
//         Please accept this special reward for your next purchase.</p>
//       `;
//       break;

//     default:
//       subject = `🎁 Special ${couponValue} Gift from EcoStore`;
//       title = "Here's a Special Gift For You!";
//       message = `
//         <p>Thank you for being a valued EcoStore customer! We appreciate your support
//         in making sustainable choices.</p>
//         <p>Enjoy this discount on your next purchase of eco-friendly products.</p>
//       `;
//   }

//   const html = `
//     <div style="font-family: Arial, sans-serif; background-color: #f0f9f4; padding: 20px;">
//       <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
//         <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: #fff;">
//           <img src="${
//             process.env.STORE_LOGO || ""
//           }" alt="EcoStore Logo" style="max-height: 50px; display:block; margin: 0 auto 15px;" />
//           <h1 style="margin:0; font-size: 28px; font-weight: bold;">${title}</h1>
//           <div style="margin-top: 10px; font-size: 18px; opacity: 0.9;">Your Exclusive Discount Awaits!</div>
//         </div>

//         <div style="padding: 30px; color:#333;">
//           ${message}

//           <!-- Coupon Code Box -->
//           <div style="background: linear-gradient(135deg, #fffbeb, #fed7aa); border: 2px dashed #d97706; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
//             <div style="font-size: 14px; color: #92400e; margin-bottom: 8px;">YOUR DISCOUNT CODE</div>
//             <div style="font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 3px; margin: 10px 0;">
//               ${coupon.code}
//             </div>
//             <div style="font-size: 20px; color: #dc2626; font-weight: bold; margin: 8px 0;">
//               ${couponValue}
//             </div>
//             <div style="font-size: 14px; color: #92400e;">
//               Valid until: ${new Date(
//                 coupon.expirationDate
//               ).toLocaleDateString()}
//             </div>
//           </div>

//           <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
//             <h3 style="margin:0 0 12px 0; color: #1e293b;">✨ How to Use Your Coupon:</h3>
//             <ol style="margin: 0; padding-left: 20px; color: #475569;">
//               <li>Shop your favorite eco-friendly products</li>
//               <li>Proceed to checkout</li>
//               <li>Enter code <strong style="color: #ea580c;">${
//                 coupon.code
//               }</strong> in the coupon field</li>
//               <li>Enjoy your ${
//                 coupon.discountPercentage
//               }% discount instantly!</li>
//             </ol>
//           </div>

//           <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 25px;">
//             This coupon is exclusively for you and cannot be transferred.
//           </p>

//           <div style="text-align: center; margin-top: 30px;">
//             <a href="${process.env.CLIENT_URL || "https://your-ecostore.com"}"
//                style="background: #10b981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
//               🛍️ Start Shopping Now
//             </a>
//           </div>
//         </div>

//         <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
//           <p style="margin: 0 0 10px 0;">Thank you for choosing sustainable shopping with Eco~Store 🌱</p>
//           <p style="margin: 0;">Need help? Contact us at <a href="mailto:${
//             process.env.SUPPORT_EMAIL || "support@ecostore.example"
//           }"
//              style="color: #10b981; text-decoration: none;">${
//                process.env.SUPPORT_EMAIL || "support@ecostore.example"
//              }</a></p>
//         </div>
//       </div>
//     </div>
//   `;

//   // Plain text version
//   const text = `
// ${title}

// ${message.replace(/<[^>]*>/g, "").trim()}

// YOUR DISCOUNT CODE: ${coupon.code}
// DISCOUNT: ${couponValue}
// VALID UNTIL: ${new Date(coupon.expirationDate).toLocaleDateString()}

// How to Use:
// 1. Shop your favorite eco-friendly products
// 2. Proceed to checkout
// 3. Enter code ${coupon.code} in the coupon field
// 4. Enjoy your ${coupon.discountPercentage}% discount instantly!

// Shop now: ${process.env.CLIENT_URL || "https://your-ecostore.com"}

// This coupon is exclusively for you and cannot be transferred.

// Thank you for choosing sustainable shopping with EcoStore 🌱
//   `.trim();

//   await sendEmail({
//     to,
//     subject,
//     html,
//     text,
//   });
// };
