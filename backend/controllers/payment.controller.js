
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


function generateOrderNumber() {
  return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

/**
 * createCheckoutSession
 * - DOES NOT create any order in DB (important: per your request).
 * - Builds Flutterwave hosted payment payload and returns hosted link.
 * - Includes meta payload with userId, products, totals, deliveryAddress so checkoutSuccess/webhook can finalize.
 */
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

    const originalTotal = products.reduce((acc, p) => {
      const qty = p.quantity || 1;
      const price = Number(p.price) || 0;
      return acc + price * qty;
    }, 0);

    let discountAmount = 0;
    if (couponCode) {
      const appliedCoupon = await Coupon.findOne({
        code: couponCode,
        userId,
        isActive: true,
      });
      if (appliedCoupon) {
        discountAmount = Math.round(
          (originalTotal * appliedCoupon.discountPercentage) / 100
        );
      }
    }

    const finalTotal = Math.max(0, originalTotal - discountAmount);


    const tx_ref = `ECOSTORE-${Date.now()}`;

    // Build Flutterwave payload.
    // IMPORTANT: do not create any DB order here.
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
      // meta: include enough info to recreate order safely server-side later
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
      console.error("No payment link returned by Flutterwave:", response.data);
      return res.status(500).json({ message: "Failed to initialize payment" });
    }

    console.log("Flutterwave payment initialized:", tx_ref, "link:", link);
    // return tx_ref as well (helpful for client debugging)
    return res.status(200).json({ link, tx_ref });
  } catch (err) {
    console.error("Error initializing Flutterwave payment:", err);
    return res.status(500).json({
      message: "Payment initialization failed",
      error: err?.message || String(err),
    });
  }
};

/**
 * handleFlutterwaveWebhook
 * - Endpoint Flutterwave will POST to (set this in dashboard)
 * - Verifies signature, checks event, verifies payment via API, creates/updates order idempotently
 */
export const handleFlutterwaveWebhook = async (req, res) => {
  try {
    const signature = req.headers["verif-hash"];
    if (!signature || signature !== process.env.FLW_WEBHOOK_HASH) {
      console.warn("Invalid webhook signature");
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;
    if (!event) return res.status(400).send("No event body");

    // Only act on completed charges
    if (event.event !== "charge.completed") {
      return res.status(200).send("Ignored event");
    }

    const { id: transaction_id, tx_ref, status } = event.data;
    if (status !== "successful") return res.status(200).send("Not successful");

    // Verify with Flutterwave API too (defense in depth)
    const verifyResp = await flw.Transaction.verify({ id: transaction_id });
    if (!verifyResp?.data || verifyResp.data.status !== "successful") {
      console.error("Webhook verification failed for:", transaction_id);
      return res.status(400).send("Payment verification failed");
    }

    const data = verifyResp.data;
    const meta = data.meta || {};
    const userId = meta.userId;
    const parsedProducts = meta.products ? JSON.parse(meta.products) : [];
    const couponCode = meta.couponCode || "";
        const paymentData = {
          method: data.payment_type || "card",
          status: "PAID",
          card: {
            brand: data.card?.brand || "Unknown",
            last4: data.card?.last_4digits || null,
            exp_month: data.card?.exp_month || null,
            exp_year: data.card?.exp_year || null,
            type: data.card?.type || null,
            issuer: data.card?.issuer || null,
          },
        };

    if (!userId) {
      console.error("Missing userId in webhook meta");
      return res.status(400).send("Missing userId");
    }

    // Idempotency check: find existing order by flutterwaveTransactionId or tx_ref
    let existingOrder = await Order.findOne({
      $or: [
        { flutterwaveTransactionId: transaction_id },
        { flutterwaveRef: tx_ref },
      ],
    });

    if (existingOrder && existingOrder.paymentStatus === "paid") {
      return res.status(200).send("Already processed");
    }

    // Start transaction to commit stock changes + order update atomically
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Reduce stock
      for (const item of parsedProducts) {
        if (!item._id) continue;
        const upd = await Product.findOneAndUpdate(
          { _id: item._id, countInStock: { $gte: item.quantity } },
          { $inc: { countInStock: -item.quantity } },
          { new: true, session }
        );
        if (!upd) {
          throw new Error(`Insufficient stock for product ${item.name}`);
        }
      }

      // Deactivate coupon if used
      if (couponCode) {
        await Coupon.findOneAndUpdate(
          { code: couponCode },
          { isActive: false },
          { session }
        );
      }

      // If order exists (pending) update it otherwise create new order
      let order;
      if (existingOrder) {
        existingOrder.paymentStatus = "paid";
        existingOrder.status = "Pending";
        existingOrder.flutterwaveTransactionId = transaction_id;
        existingOrder.totalAmount =
          Number(data.amount) || existingOrder.totalAmount;
        order = await existingOrder.save({ session });
      } else {
        // Build product docs for order
        const products = parsedProducts.map((p) => ({
          product: p._id || null,
          name: p.name || "Unknown",
          image: (p.images && p.images[0]) || "/placeholder.png",
          quantity: p.quantity || 1,
          price: p.price || 0,
          selectedSize: p.size || "",
          selectedColor: p.color || "",
          selectedCategory: p.category || "",
        }));

        const user = await User.findById(userId).session(session);
        if (!user) throw new Error("User not found");

        order = new Order({
          user: user._id,
          products: products,
          subtotal: Number(meta.originalTotal) || Number(data.amount) || 0,
          discount: Number(meta.discountAmount) || 0,
          totalAmount: Number(meta.finalTotal) || Number(data.amount) || 0,
          orderNumber: generateOrderNumber(),
          couponCode: couponCode || null,
          deliveryAddress:
            meta.deliveryAddress ||
            user.addresses?.[0]?.address ||
            "No address provided",
          phone: user.phones?.[0]?.number || "No phone provided",
          flutterwaveRef: tx_ref,
          flutterwaveTransactionId: transaction_id,
          paymentStatus: "paid",
          status: "Pending",
          paymentData: {
            method: data.payment_type || "card",
            status: "PAID",
            card: {
              brand: data.card?.brand || null,
              last4: data.card?.last_4digits || null,
              exp_month: data.card?.exp_month || null,
              exp_year: data.card?.exp_year || null,
              type: data.card?.type || null,
              issuer: data.card?.issuer || null,
            },
          },
          paymentMethod: paymentData,
        });

        await order.save({ session });
      }

      // Clear user cart
      const userToClear = await User.findById(userId).session(session);
      if (userToClear) {
        userToClear.cartItems = [];
        await userToClear.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      // Send detailed confirmation email (non-blocking)
      (async () => {
        try {
          const userEmail = (await User.findById(userId))?.email;
          if (userEmail) {
            await sendDetailedOrderEmail({
              to: userEmail,
              order,
              flutterwaveData: data,
            });
          }
        } catch (emailErr) {
          console.error("Email send failed (webhook):", emailErr);
        }
      })();

      return res.status(200).send("Order processed successfully");
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      console.error("Webhook transaction failed:", txErr);
      return res.status(500).send("Internal Server Error");
    }
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * checkoutSuccess
 * - Called from front-end when the user returns to client after payment (frontend should POST transaction_id and tx_ref to this route).
 * - Verifies payment with Flutterwave, then creates or finalizes order.
 * - Uses retry helper for transient write conflicts.
 */
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
    await withRetry(async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const { tx_ref, transaction_id } = req.body;
        if (!transaction_id) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ error: "transaction_id is required" });
        }

        // 1) Verify with Flutterwave
        const verifyResp = await flw.Transaction.verify({ id: transaction_id });
        const data = verifyResp?.data;
        if (!data || data.status !== "successful") {
          throw new Error("Payment verification failed");
        }

        const meta = data.meta || {};
        const userId = meta.userId;
        const parsedProducts = meta.products ? JSON.parse(meta.products) : [];
        const couponCode = meta.couponCode || "";

        if (!userId) throw new Error("Missing userId in payment metadata");
            const paymentData = {
              method: data.payment_type || "card",
              status: "PAID",
              card: {
                brand: data.card?.brand || "Unknown",
                last4: data.card?.last_4digits || null,
                exp_month: data.card?.exp_month || null,
                exp_year: data.card?.exp_year || null,
                type: data.card?.type || null,
                issuer: data.card?.issuer || null,
              },
            };

        // Idempotency: check if order exists already
        let existingOrder = await Order.findOne({
          $or: [
            { flutterwaveTransactionId: transaction_id },
            { flutterwaveRef: tx_ref },
          ],
        }).session(session);

        // If order exists and is paid -> early return success
        if (existingOrder && existingOrder.paymentStatus === "paid") {
          await session.endSession();
          return res.status(200).json({
            success: true,
            message: "Order already processed",
            orderId: existingOrder._id,
            orderNumber: existingOrder.orderNumber,
          });
        }

        // Get user
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error("User not found");

        // Update stock (check qty)
        // for (const p of parsedProducts) {
        //   if (!p._id) continue;
        //   const updated = await Product.findOneAndUpdate(
        //     { _id: p._id, countInStock: { $gte: p.quantity } },
        //     { $inc: { countInStock: -p.quantity } },
        //     { new: true, session }
        //   );
        //   if (!updated) {
        //     throw new Error(`Product ${p.name} is out of stock`);
        //   }
        // }

        // Deactivate coupon if used
        if (couponCode) {
          await Coupon.findOneAndUpdate(
            { code: couponCode, userId },
            { isActive: false },
            { session }
          );
        }

        let order;
        if (existingOrder) {
          // finalize existing pending order
          existingOrder.paymentStatus = "paid";
          existingOrder.status = "Pending";
          existingOrder.flutterwaveTransactionId = transaction_id;
          existingOrder.totalAmount =
            Number(meta.finalTotal) ||
            Number(data.amount) ||
            existingOrder.totalAmount;
          order = await existingOrder.save({ session });
        } else {
          // create new order (backup case)
          const products = parsedProducts.map((p) => ({
            product: p._id || null,
            name: p.name || "Unknown Product",
            image: (p.images && p.images[0]) || "/placeholder.png",
            quantity: p.quantity || 1,
            price: p.price || 0,
            selectedSize: p.size || "",
            selectedColor: p.color || "",
            selectedCategory: p.category || "",
          }));

          const defaultPhone =
            user.phones?.find((ph) => ph.isDefault) || user.phones?.[0];
          const defaultAddress =
            user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

          const addressString = defaultAddress
            ? (defaultAddress.address && defaultAddress.address.trim()) ||
              `${
                defaultAddress.landmark ? defaultAddress.landmark + ", " : ""
              }${defaultAddress.lga ? defaultAddress.lga + ", " : ""}${
                defaultAddress.city ? defaultAddress.city + ", " : ""
              }${defaultAddress.state || ""}`.trim()
            : "";

          order = new Order({
            user: user._id,
            products: products,
            subtotal: Number(meta.originalTotal) || Number(data.amount) || 0,
            discount: Number(meta.discountAmount) || 0,
            totalAmount: Number(meta.finalTotal) || Number(data.amount) || 0,
            orderNumber: generateOrderNumber(),
            couponCode: couponCode || null,
            deliveryAddress:
              addressString || meta.deliveryAddress || "No address provided",
            phone: defaultPhone?.number || "No phone provided",
            flutterwaveRef: tx_ref || data.tx_ref || transaction_id,
            flutterwaveTransactionId: transaction_id,
            paymentStatus: "paid",
            status: "Pending",
            paymentData: {
              method: data.payment_type || "card",
              status: "PAID",
              card: {
                brand: data.card?.brand || null,
                last4: data.card?.last_4digits || null,
                exp_month: data.card?.exp_month || null,
                exp_year: data.card?.exp_year || null,
                type: data.card?.type || null,
                issuer: data.card?.issuer || null,
              },
            },
            paymentMethod: paymentData,
          });

          await order.save({ session });
        }

        // Clear user's cart (atomic)
        await User.findByIdAndUpdate(userId, { cartItems: [] }, { session });

        await session.commitTransaction();
        session.endSession();

        // Send detailed email (non-blocking)
        (async () => {
          try {
            await sendDetailedOrderEmail({
              to: user.email,
              order,
              flutterwaveData: data,
            });
          } catch (emailErr) {
            console.error("Email send failed (checkoutSuccess):", emailErr);
          }
        })();

        // Response to frontend
        return res.status(200).json({
          success: true,
          message: "Payment verified and order finalized",
          orderId: order._id,
          orderNumber: order.orderNumber,
        });
      } catch (innerErr) {
        await session.abortTransaction();
        session.endSession();
        throw innerErr;
      }
    });
  } catch (error) {
    console.error("checkoutSuccess transaction failed:", error);
    // If this is called by the frontend, they can retry sending transaction_id later.
    return res.status(500).json({
      error: error.message || "Checkout failed",
    });
  }
};

/**
 * sendDetailedOrderEmail - builds and sends a full order confirmation email (HTML + text).
 * Includes:
 *  - Order number, totals
 *  - Product table with qty and unit prices
 *  - Delivery address and phone
 *  - Masked card details (brand, last4, exp)
 *  - Flutterwave tx_ref and transaction id
 */

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

  // Normalize flutterwave data (be tolerant of different shapes)
  const tx_ref =
    flutterwaveData?.tx_ref ||
    flutterwaveData?.txRef ||
    flutterwaveData?.reference ||
    flutterwaveData?.reference_no ||
    "N/A";
  const transaction_id =
    flutterwaveData?.id ||
    flutterwaveData?.transaction_id ||
    flutterwaveData?.transactionId ||
    "N/A";
  const payment_type =
    flutterwaveData?.payment_type ||
    flutterwaveData?.payment_type ||
    flutterwaveData?.paymentType ||
    order.paymentMethod?.method ||
    "N/A";
  const card = flutterwaveData?.card || order.paymentMethod?.card || {};

  // Prepare items array (supports order.products or order.items)
  const items = order.products || order.items || [];

  const productRows = items
    .map((item) => {
    
      
           let details = "";
            if (item.size) details += `Size: ${item.size} `;
            if (item.color) details += `| Color: ${item.color}`;
      

      return `
        <tr>
          <td style="padding: 8px 12px; border:1px solid #eee;">
            ${item.name || item.productName || "Item"}
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
  const maskedLast4 =
    card.last_4digits ||
    card.last4 ||
    card.last4digits ||
    card.lastDigits ||
    "****";
  const cardBrand = card.brand || card.type || "Card";


  const cardInfo = card
    ? `
    <div style="margin-top:10px;font-size:14px;color:#333;">
      <strong>Payment Method:</strong> ${cardBrand}  **** ${maskedLast4}<br/>
    </div>`
    : "";

  // HTML email
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f6f8fa; padding: 20px;">
      <div style="max-width: 700px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.06);">
        <div style="background: #10b981; padding: 22px; text-align: center; color: #fff;">
          <img src="${
            process.env.STORE_LOGO || ""
          }" alt="Store Logo" style="max-height:50px; display:block; margin: 0 auto 8px;" />
          <h1 style="margin:0; font-size:20px;">Order Confirmation</h1>
          <div style="margin-top:6px; font-size:14px;">Order #${
            order.orderNumber || "N/A"
          }</div>
        </div>

        <div style="padding: 22px; color:#333;">
          <p style="margin:0 0 8px;">Hi <strong>${customerName}</strong>,</p>
          <p style="margin:0 0 16px;">Thank you for your order! We’ve received your payment and are now processing your purchase. Below are your order details.</p>

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
      <strong>Coupon Discount:</strong> ${Number(discount).toLocaleString()}<br>
       <strong>Final Total:</strong> ₦${Number(totalAmount).toLocaleString()}
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
              flutterwaveData?.status || order.paymentStatus || "Confirmed"
            }<br/>
            <strong>Payment Type:</strong> ${payment_type || "N/A"}<br/>
            <strong>Transaction Ref:</strong> ${tx_ref}<br/>
            <strong>Transaction ID:</strong> ${transaction_id}
          </p>

          ${cardInfo}

          <p style="margin-top:20px; color:#555;">We’ll send another email once your order ships. If you need help, just reply to this email — we’re happy to assist.</p>

          <p style="margin-top:18px;">Thanks for choosing <strong>EcoStore</strong> 🌱</p>
        </div>

        <div style="background:#fbfcfb; padding:14px; text-align:center; font-size:13px; color:#666;">
          Need help? Contact us at <a href="mailto:${
            process.env.SUPPORT_EMAIL || "support@ecostore.example"
          }" style="color:#10b981;">${
    process.env.SUPPORT_EMAIL || "support@ecostore.example"
  }</a>
        </div>
      </div>
    </div>
  `;

  // Plain text fallback
  const text = [
    `EcoStore — Order Confirmation`,
    `Order #: ${order.orderNumber || "N/A"}`,
    `Customer: ${customerName}`,
    `Total: ₦${Number(totalAmount).toLocaleString()}`,
    `Delivery Address: ${order.deliveryAddress || "No address provided"}`,
    `Phone: ${order.phone || "No phone provided"}`,
    `Payment Status: ${
      flutterwaveData?.status || order.paymentStatus || "Confirmed"
    }`,
    `Payment Type: ${payment_type || "N/A"}`,
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
    `Thanks for shopping with EcoStore!`,
  ].join("\n");

  // Send email
  await sendEmail({
    to,
    subject: `EcoStore — Order Confirmation #${order.orderNumber || "N/A"}`,
    html,
    text,
  });
};



/**
 * Create a new reward coupon in the DB for a user (deletes any old one)
 */
async function createNewCoupon(userId) {
  await Coupon.findOneAndDelete({ userId });
  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userId,
  });
  await newCoupon.save();
  return newCoupon;
}

// import path from "path";
// import dotenv from "dotenv";
// import { fileURLToPath } from "url";
// import axios from "axios";
// import Coupon from "../models/coupon.model.js";
// import Order from "../models/order.model.js";
// import User from "../models/user.model.js";
// import Product from "../models/product.model.js";
// import { sendEmail } from "../lib/mailer.js";
// import { flw } from "../lib/flutterwave.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// dotenv.config({ path: path.join(__dirname, "../../.env") });

// const FLW_BASE_URL = "https://api.flutterwave.com/v3";
// // Helper: generate unique order number
// function generateOrderNumber() {
//   return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
// }

// /**
//  * Create a Flutterwave hosted payment link and return it to the frontend.
//  * Expects req.user._id (protectRoute middleware) and body: { products: [], couponCode?: string }
//  */
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

//     // Build full name and address string from possibly-split fields
//     const fullName =
//       (user.name && user.name.trim()) ||
//       `${user.firstname || ""}${
//         user.lastname ? " " + user.lastname : ""
//       }`.trim();

//     const addressString = defaultAddress
//       ? (defaultAddress.address && defaultAddress.address.trim()) ||
//         `${defaultAddress.landmark ? defaultAddress.landmark + ", " : ""}${
//           defaultAddress.lga ? defaultAddress.lga + ", " : ""
//         }${defaultAddress.city ? defaultAddress.city + ", " : ""}${
//           defaultAddress.state || ""
//         }`.trim()
//       : "";

//     // Build a usable address string from saved address fields.

//     if (!defaultPhone?.number?.trim() || !addressString) {
//       return res.status(400).json({
//         error: "You must add a phone number and address before checkout.",
//       });
//     }

//     let total = 0;
//     //  Compute raw subtotal (without coupon)
//     const originalTotal = products.reduce((acc, p) => {
//       const qty = p.quantity || 1;
//       const price = Number(p.price) || 0;
//       return acc + price * qty;
//     }, 0);

//     //  Compute discount
//     let discountAmount = 0;
//     let appliedCoupon = null;

//     if (couponCode) {
//       appliedCoupon = await Coupon.findOne({
//         code: couponCode,
//         userId,
//         isActive: true,
//       });
//       if (appliedCoupon) {
//         discountAmount = Math.round(
//           (originalTotal * appliedCoupon.discountPercentage) / 100
//         );
//       }
//     }
//     const lineItems = products.map((product) => {
//       const amount = Math.round(product.price * 100); // stripe wants u to send in the format of cents

//       return {
//         price_data: {
//           currency: "ngn",
//           product_data: {
//             name: product.name,
//             images: [product.images?.[0]],
//           },
//           unit_amount: amount,
//         },
//         quantity: product.quantity || 1,
//       };
//     });

//     //  Compute final total (amount to charge)
//     const finalTotal = Math.max(0, originalTotal - discountAmount);

//     // tx_ref
//     const tx_ref = `ECOSTORE-${Date.now()}`;

//     // Build payload for Flutterwave hosted payment (/v3/payments)
//     const payload = {
//       tx_ref,
//       lineItems: lineItems,
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
//       },
//       customizations: {
//         title: "EcoStore Purchase",
//         description: "Payment for items in your cart",
//         logo: "https://yourstore.com/logo.png",
//       },
//     };

//     // IMPORTANT: correct SDK call for flutterwave-node-v3 to initialize hosted payment link.
//     // Use flw.Payment.create(payload) and read response.data.link or response.data.authorization_url
//     const response = await axios.post(
//       "https://api.flutterwave.com/v3/payments",
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const link = response?.data?.data?.link;

//     // debug log
//     console.log(
//       "Flutterwave init response:",
//       response?.status,
//       response?.data?.link || response?.data?.authorization_url
//     );

//     // Typical response: response.data.link  OR response.data.authorization_url

//     if (!link) {
//       console.error("No payment link returned by Flutterwave:", response.data);
//       return res.status(500).json({ message: "Failed to initialize payment" });
//     }

//     console.log(" Flutterwave payment initialized successfully!");
//     console.log("Payment Link:", link);

//     return res.status(200).json({ link });
//   } catch (error) {
//     console.error(" Error initializing Flutterwave payment:", error);
//     return res.status(500).json({
//       message: "Payment initialization failed",
//       error: error?.message || String(error),
//     });
//   }
// };

// export const handleFlutterwaveWebhook = async (req, res) => {
//   try {
//     const secret = process.env.FLW_SECRET_HASH;
//     const signature = req.headers["verif-hash"];

//     if (!signature || signature !== secret) {
//       return res.status(401).send("Invalid signature");
//     }

//     const payload = req.body;
//     if (payload.event === "charge.completed") {
//       const data = payload.data;

//       // Prevent duplicates
//       const existing = await Order.findOne({ flutterwaveRef: data.tx_ref });
//       if (existing) return res.status(200).send("Already processed");

//       // Create order automatically
//       const user = await User.findOne({ email: data.customer.email });

//       await Order.create({
//         user: user?._id,
//         orderNumber: "ORD-" + Math.floor(100000 + Math.random() * 900000),
//         flutterwaveRef: data.tx_ref,
//         flutterwaveTransactionId: data.id,
//         totalAmount: data.amount,
//         status: data.status === "successful" ? "Pending" : "Cancelled",
//         paymentMethod: {
//           method: data.payment_type,
//           status: data.status,
//         },
//       });

//       console.log("✅ Order created via webhook");
//     }

//     return res.status(200).send("Webhook processed");
//   } catch (error) {
//     console.error("Webhook Error:", error);
//     res.status(500).send("Server error");
//   }
// };

// export const checkoutSuccess = async (req, res) => {
//   try {
//     const { tx_ref, transaction_id } = req.body;

//     if (!transaction_id) {
//       return res.status(400).json({ error: "transaction_id is required" });
//     }

//     //  Verify transaction from Flutterwave
//     const verifyResp = await flw.Transaction.verify({ id: transaction_id });
//     const data = verifyResp?.data;

//     if (!data || data.status !== "successful") {
//       return res
//         .status(400)
//         .json({ message: "Payment verification failed or not successful" });
//     }

//     //  Get User
//     const user = await User.findById(data.meta?.userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (!data) {
//       console.error(
//         " No data returned from Flutterwave verification:",
//         verifyResp
//       );
//       return res.status(500).json({ error: "Failed to verify transaction" });
//     }

//     if (data.status !== "successful") {
//       return res.status(400).json({ error: "Payment not successful", data });
//     }

//     // Extract card/payment method info
//     const paymentData = {
//       method: data.payment_type || "card",
//       status: "PAID",
//       card: {
//         brand: data.card?.brand || "Unknown",
//         last4: data.card?.last_4digits || null,
//         exp_month: data.card?.exp_month || null,
//         exp_year: data.card?.exp_year || null,
//         type: data.card?.type || null,
//         issuer: data.card?.issuer || null,
//       },
//     };

//     //  Check for duplicate orders
//     const existingOrder = await Order.findOne({
//       $or: [
//         { flutterwaveRef: tx_ref || data.tx_ref || transaction_id },
//         { flutterwaveTransactionId: transaction_id },
//       ],
//     });

//     if (existingOrder) {
//       console.log(" Duplicate payment callback ignored — order already exists");
//       return res.status(200).json({
//         success: true,
//         message: "Order already exists",
//         orderId: existingOrder._id,
//         orderNumber: existingOrder.orderNumber,
//       });
//     }

//     // Extract meta data passed during payment initialization
//     const meta = data.meta || {};
//     const userId = meta.userId;
//     const couponCode = meta.couponCode || meta.coupon || null;
//     const parsedProducts = meta.products ? JSON.parse(meta.products) : [];

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

//     const originalTotal =
//       Number(meta.originalTotal) || Number(data.amount) || 0;
//     const discountAmount = Number(meta.discountAmount) || 0;
//     const finalTotal = Number(meta.finalTotal) || originalTotal;

//     const orderNumber = generateOrderNumber();

//     if (data.status !== "successful") {
//       await Order.create({
//         user: user._id,
//         orderNumber: generateOrderNumber(),
//         flutterwaveRef: tx_ref,
//         flutterwaveTransactionId: transaction_id,
//         status: "Cancelled",
//         totalAmount: Number(data.amount || 0),
//         paymentMethod: {
//           method: data.payment_type || "unknown",
//           status: "FAILED",
//         },
//       });
//       return res
//         .status(400)
//         .json({ message: "Payment failed, order cancelled." });
//     }

//     //  Create Order
//     const order = await Order.create({
//       user: user._id,
//       products: parsedProducts.map((p) => ({
//         product: p._id || null,
//         name: p.name || "Unknown Product",
//         image: (p.images && p.images[0]) || p.image || "/placeholder.png",
//         quantity: p.quantity || 1,
//         price: p.price || 0,
//         selectedSize: p.size || "",
//         selectedColor: p.color || "",
//         selectedCategory: p.category || "",
//       })),
//       subtotal: originalTotal,
//       discount: discountAmount,
//       totalAmount: finalTotal,
//       orderNumber,
//       coupon: couponCode
//         ? { code: couponCode, discount: discountAmount }
//         : null,
//       couponCode: couponCode || null,
//       deliveryAddress: addressString || "No address provided",
//       phone: defaultPhone?.number || "No phone provided",
//       flutterwaveRef: tx_ref || data.tx_ref || transaction_id,
//       flutterwaveTransactionId: transaction_id,
//       status: "Pending",
//       isProcessed: false,
//       paymentMethod: paymentData,
//     });

//     //  Deactivate used coupon
//     if (couponCode) {
//       await Coupon.findOneAndUpdate(
//         { code: couponCode, userId },
//         { isActive: false }
//       );
//     }

//     // reduce item after sale
//     for (const p of parsedProducts) {
//       if (!p._id) continue;

//       const product = await Product.findById(p._id);
//       if (product) {
//         if (product.countInStock < p.quantity) {
//           console.warn(`Product ${product.name} is out of stock!`);
//           // Optionally, handle overselling (e.g., cancel order or partially fulfill)
//           continue;
//         }
//         product.countInStock -= p.quantity;
//         await product.save();
//       }
//     }

//     //  Clear user’s cart
//     await User.findByIdAndUpdate(userId, { cartItems: [] });

//     // Respond to client immediately after order creation and cart clear so UI isn't blocked
//     res.status(200).json({
//       success: true,
//       message: "Payment verified and order created",
//       orderId: order._id,
//       orderNumber: order.orderNumber,
//     });

//     // Execute post-order tasks in background: send confirmation email and optional reward coupon
//     (async () => {
//       try {
//         //  Build payment details text for email
//         let paymentDetailsHTML = "";

//         if (order.paymentMethod) {
//           const pm = order.paymentMethod;

//           if (pm.method === "card" && pm.card) {
//             paymentDetailsHTML = `
//       <p style="margin-top: 15px; font-size: 16px;">
//         <strong>Payment Method:</strong> ${
//           pm.card.type || "Card"
//         } ************ ${pm.card.last4 || "****"}<br>
//         <small>Expires ${pm.card.exp_month || "MM"}/${
//               pm.card.exp_year || "YY"
//             }</small>
//       </p>
//     `;
//           } else {
//             paymentDetailsHTML = `
//       <p style="margin-top: 15px; font-size: 16px;">
//         <strong>Payment Method:</strong> ${pm.method || "Unknown"}
//       </p>
//     `;
//           }
//         }

//         const totalsSection = couponCode
//           ? `
//     <p style="margin-top: 20px; font-size: 16px;">
//       <strong>Original Total:</strong> ₦${originalTotal.toLocaleString()} <br>
//       <strong>Coupon Discount:</strong> -₦${discountAmount.toLocaleString()} <br>
//       <strong>Final Total:</strong> ₦${finalTotal.toLocaleString()}
//     </p>
//   `
//           : `
//     <p style="margin-top: 20px; font-size: 16px;">
//       <strong>Total:</strong> ₦${finalTotal.toLocaleString()}
//     </p>
//   `;

//         const productRows = parsedProducts
//           .map((p) => {
//             let details = "";
//             if (p.size) details += `Size: ${p.size} `;
//             if (p.color) details += `| Color: ${p.color}`;
//             return `
      // <tr>
      //   <td style="padding:8px;border:1px solid #ddd;">
      //     ${p.name}${details ? `<br><small>${details.trim()}</small>` : ""}
      //   </td>
      //   <td style="padding:8px;border:1px solid #ddd;text-align:center;">${
      //     p.quantity
      //   }</td>
      //   <td style="padding:8px;border:1px solid #ddd;text-align:right;">₦${p.price.toLocaleString()}</td>
      // </tr>`;
      //     })
      //     .join("");

//         try {
//           await sendEmail({
//             to: user.email,
//             subject: `Your EcoStore Order Confirmation - ${order.orderNumber}`,
//             text: `Hi ${user.firstname}, thank you for your order! Your order number is ${order.orderNumber}.`,
//             html: `
//               <!DOCTYPE html>
//               <html>
//                 <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
//                   <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
//                     <h2 style="color: #2ecc71; text-align: center;"> Thank you for your order!</h2>
//                     <p>Hi <strong>${user.firstname}</strong>,</p>
//                     <p>We’ve received your order <strong>${order.orderNumber}</strong>.</p>
//                     <p><strong>Current Status:</strong> <span style="color: orange;">Pending</span></p>

//                     <h3 style="margin-top: 20px;">🛒 Order Summary</h3>
//                     <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
                      // <thead>
                      //   <tr>
                      //     <th style="padding: 8px; border: 1px solid #ddd; text-align:left;">Product</th>
                      //     <th style="padding: 8px; border: 1px solid #ddd; text-align:center;">Qty</th>
                      //     <th style="padding: 8px; border: 1px solid #ddd; text-align:right;">Price</th>
                      //   </tr>
                      // </thead>
//                       <tbody>
//                         ${productRows}
//                       </tbody>
//                     </table>
//                     ${paymentDetailsHTML}

//                     ${totalsSection}

//                     <p>You’ll get another email once your items are shipped 🚚</p>
//                     <p>If you have any questions, just reply to this email — we’re happy to help!</p>

//                     <p style="margin-top: 30px; font-size: 14px; color: #555;">
//                       Best regards, <br>
//                       <strong>The Eco-Store Team 🌱</strong>
//                     </p>
//                   </div>
//                 </body>
//               </html>
//         `,
//           });
//         } catch (emailErr) {
//           console.error(" Email send failed (background):", emailErr);
//         }

//         //  Optional: reward coupon (background)
//         if (order.totalAmount >= 150000) {
//           try {
//             const rewardCoupon = await createNewCoupon(user._id);
//             try {
//               await sendEmail({
//                 to: user.email,
//                 subject: "🎁 You earned a special coupon from EcoStore!",
//                 text: `Hi ${user.firstname}, congratulations! Use code: ${rewardCoupon.code} to enjoy ${rewardCoupon.discountPercentage}% off your next purchase.`,
//                 html: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; padding:20px; background:#fff; border-radius:8px;">
//               <h2 style="color:#2ecc71;">🎉 Congratulations!</h2>
//               <p>Hi <strong>${user.firstname}</strong>,</p>
//               <p>Since your purchase was above <strong>₦150,000</strong>, you’ve earned a special reward coupon:</p>
//               <p style="font-size:18px; background:#f4f4f4; padding:10px; border-radius:5px; text-align:center;">
//                 <strong>Coupon Code:</strong> <span style="color:#e74c3c;">${rewardCoupon.code}</span><br>
//                 <strong>Discount:</strong> ${rewardCoupon.discountPercentage}% OFF
//               </p>
//               <p>Apply this coupon at checkout on your next order 🚀</p>
//               <p style="margin-top:20px;">Thank you for shopping with EcoStore 🌱</p>
//             </div>
//           `,
//               });
//             } catch (emailErr) {
//               console.error(
//                 "Reward coupon email failed (background):",
//                 emailErr
//               );
//             }
//           } catch (err) {
//             console.error(
//               " Reward coupon creation/email failed (background):",
//               err
//             );
//           }
//         }
//       } catch (bgErr) {
//         console.error("Background post-order tasks failed:", bgErr);
//       }
//     })();
//   } catch (error) {
//     if (error.code === 11000) {
//       console.warn(" Duplicate order prevented:", error.keyValue);
//       const existing = await Order.findOne({
//         $or: [
//           { flutterwaveRef: req.body.tx_ref },
//           { flutterwaveTransactionId: req.body.transaction_id },
//         ],
//       });
//       if (existing) {
//         return res.status(200).json({
//           success: true,
//           message: "Duplicate prevented, existing order returned",
//           orderId: existing._id,
//           orderNumber: existing.orderNumber,
//         });
//       }
//     }

//     console.error(" checkoutSuccess error:", error);
//     return res.status(500).json({ error: "Server error verifying payment" });
//   }
// };

// /**
//  * Create a new reward coupon in the DB for a user (deletes any old one)
//  */
// async function createNewCoupon(userId) {
//   await Coupon.findOneAndDelete({ userId });
//   const newCoupon = new Coupon({
//     code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
//     discountPercentage: 10,
//     expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//     userId,
//   });
//   await newCoupon.save();
//   return newCoupon;
// }
