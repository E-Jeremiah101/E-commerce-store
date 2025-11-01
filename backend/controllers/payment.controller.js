import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import axios from "axios";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import { sendEmail } from "../lib/mailer.js";
import { flw } from "../lib/flutterwave.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const FLW_BASE_URL = "https://api.flutterwave.com/v3";
// Helper: generate unique order number
function generateOrderNumber() {
  return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

/**
 * Create a Flutterwave hosted payment link and return it to the frontend.
 * Expects req.user._id (protectRoute middleware) and body: { products: [], couponCode?: string }
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

    if (!defaultPhone?.number?.trim() || !defaultAddress?.address?.trim()) {
      return res.status(400).json({
        error: "You must add a phone number and address before checkout.",
      });
    }

  
    let total = 0;
    //  Compute raw subtotal (without coupon)
    const originalTotal = products.reduce((acc, p) => {
      const qty = p.quantity || 1;
      const price = Number(p.price) || 0;
      return acc + price * qty;
    }, 0);

    //  Compute discount
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      appliedCoupon = await Coupon.findOne({
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
        const lineItems = products.map((product) => {
          const amount = Math.round(product.price * 100); // stripe wants u to send in the format of cents
         

          return {
            price_data: {
              currency: "ngn",
              product_data: {
                name: product.name,
                images: [product.images?.[0]],
              },
              unit_amount: amount,
            },
            quantity: product.quantity || 1,
          };
        });

    //  Compute final total (amount to charge)
    const finalTotal = Math.max(0, originalTotal - discountAmount);

    // tx_ref
    const tx_ref = `ECOSTORE-${Date.now()}`;

    // Build payload for Flutterwave hosted payment (/v3/payments)
    const payload = {
      tx_ref,
      lineItems:lineItems,
      amount: finalTotal,
      currency: "NGN",
      redirect_url: `${process.env.CLIENT_URL}/purchase-success`,
      customer: {
        email: user.email,
        phonenumber: defaultPhone.number,
        name: user.name,
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
      },
      customizations: {
        title: "EcoStore Purchase",
        description: "Payment for items in your cart",
        logo: "https://yourstore.com/logo.png",
      },
    };

    // IMPORTANT: correct SDK call for flutterwave-node-v3 to initialize hosted payment link.
    // Use flw.Payment.create(payload) and read response.data.link or response.data.authorization_url
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const link = response?.data?.data?.link;

    // debug log
    console.log(
      "Flutterwave init response:",
      response?.status,
      response?.data?.link || response?.data?.authorization_url
    );

    // Typical response: response.data.link  OR response.data.authorization_url

    if (!link) {
      console.error("No payment link returned by Flutterwave:", response.data);
      return res.status(500).json({ message: "Failed to initialize payment" });
    }

    console.log(" Flutterwave payment initialized successfully!");
    console.log("Payment Link:", link);

    return res.status(200).json({ link });
  } catch (error) {
    console.error(" Error initializing Flutterwave payment:", error);
    return res.status(500).json({
      message: "Payment initialization failed",
      error: error?.message || String(error),
    });
  }
};

export const checkoutSuccess = async (req, res) => {
  try {
    const { tx_ref, transaction_id } = req.body;

    if (!transaction_id)
      return res.status(400).json({ error: "transaction_id is required" });

    // 1️⃣ Verify transaction directly from Flutterwave
    const verifyResp = await flw.Transaction.verify({ id: transaction_id });
    const data = verifyResp?.data;

    if (!data || data.status !== "successful")
      return res.status(400).json({ message: "Payment not successful" });

    // 2️⃣ Ensure we have a valid user
    const user = await User.findById(data.meta?.userId);
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found for transaction" });

    // 3️⃣ Prevent duplicate order creation
    const existingOrder = await Order.findOne({
      $or: [
        { flutterwaveRef: tx_ref || data.tx_ref || transaction_id },
        { flutterwaveTransactionId: transaction_id },
      ],
    });
    if (existingOrder) {
      console.log("Duplicate order detected — skipping creation.");
      return res.status(200).json({
        success: true,
        message: "Order already exists",
        orderNumber: existingOrder.orderNumber,
      });
    }

    // 4️⃣ Extract meta data safely
    const meta = data.meta || {};
    const userId = meta.userId;
    const parsedProducts = meta.products ? JSON.parse(meta.products) : [];
    const couponCode = meta.couponCode || "";

    const defaultPhone =
      user.phones?.find((p) => p.isDefault) || user.phones?.[0];
    const defaultAddress =
      user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

    const originalTotal = Number(meta.originalTotal) || data.amount || 0;
    const discountAmount = Number(meta.discountAmount) || 0;
    const finalTotal = Number(meta.finalTotal) || originalTotal;

    const orderNumber =
      "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();

    // 5️⃣ Create the order record quickly
    let order;

    try {
      order = await Order.create({
        user: user._id,
        products: parsedProducts.map((p) => ({
          product: p._id,
          name: p.name,
          image: (p.images && p.images[0]) || p.image || "/placeholder.png",
          quantity: p.quantity || 1,
          price: p.price || 0,
          selectedSize: p.size || "",
          selectedColor: p.color || "",
          selectedCategory: p.category || "",
        })),
        subtotal: originalTotal,
        discount: discountAmount,
        totalAmount: finalTotal,
        orderNumber,
        coupon: couponCode
          ? { code: couponCode, discount: discountAmount }
          : null,
        deliveryAddress: defaultAddress?.address || "No address provided",
        phone: defaultPhone?.number || "No phone provided",
        flutterwaveRef: tx_ref || data.tx_ref || transaction_id,
        flutterwaveTransactionId: transaction_id,
        status: "Pending",
        paymentMethod: {
          method: data.payment_type || "card",
          status: "PAID",
          card: {
            brand: data.card?.brand,
            last4: data.card?.last_4digits,
            type: data.card?.type,
            issuer: data.card?.issuer,
          },
        },
      });
    } catch (err) {
      if (err.code === 11000) {
        console.log(
          "⚠️ Duplicate order insert caught — returning existing order."
        );
        order = await Order.findOne({
          flutterwaveRef: tx_ref || data.tx_ref || transaction_id,
        });
      } else {
        throw err;
      }
    }

    // 6️⃣ Respond immediately — no more long wait!
    res.status(200).json({
      success: true,
      message: "Payment verified and order created",
      orderNumber: order.orderNumber,
    });

    // 7️⃣ Continue heavy tasks in background
    setImmediate(async () => {
      try {
        // Clear user cart
        await User.findByIdAndUpdate(userId, { cartItems: [] });

        // Deactivate used coupon
        if (couponCode) {
          await Coupon.findOneAndUpdate(
            { code: couponCode, userId },
            { isActive: false }
          );
        }

        // Send order confirmation email
       if (typeof buildOrderEmailHTML === "function") {
         await sendEmail({
           to: user.email,
           subject: `Your EcoStore Order Confirmation - ${order.orderNumber}`,
           html: buildOrderEmailHTML(user, order, parsedProducts),
         });
       } else {
         console.warn(
           "⚠️ buildOrderEmailHTML function missing — email skipped."
         );
       }


        // Reward coupon logic
        if (order.totalAmount >= 150000) {
          const rewardCoupon = await createNewCoupon(user._id);
          await sendEmail({
            to: user.email,
            subject: "🎁 You earned a special coupon from EcoStore!",
            html: buildRewardCouponEmailHTML(user, rewardCoupon),
          });
        }

        console.log("✅ Background post-payment tasks completed successfully.");
      } catch (err) {
        console.error("⚠️ Post-payment background tasks failed:", err);
      }
    });
  } catch (error) {
    console.error("❌ checkoutSuccess error:", error);
    return res.status(500).json({ error: "Server error verifying payment" });
  }
};


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
//    const paymentData = {
//      method: data.payment_type || "card",
//      status: "PAID",
//      card: {
//        brand: data.card?.brand || "Unknown",
//        last4: data.card?.last_4digits || null,
//        exp_month: data.card?.exp_month || null,
//        exp_year: data.card?.exp_year || null,
//        type: data.card?.type || null,
//        issuer: data.card?.issuer || null,
//      },
//    };


//     //  Check for duplicate orders
//     const existingOrder = await Order.findOne({
//       $or: [
//         { flutterwaveRef:  tx_ref || data.tx_ref || transaction_id, },
//         { flutterwaveTransactionId: transaction_id },
//       ],
//     });

//     if (existingOrder) {
//       console.log(
//         " Duplicate payment callback ignored — order already exists"
//       );
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

//     const originalTotal =
//       Number(meta.originalTotal) || Number(data.amount) || 0;
//     const discountAmount = Number(meta.discountAmount) || 0;
//     const finalTotal = Number(meta.finalTotal) || originalTotal;

//     const orderNumber = generateOrderNumber();

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
//       deliveryAddress: defaultAddress?.address || "No address provided",
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

//     //  Clear user’s cart
//     await User.findByIdAndUpdate(userId, { cartItems: [] });

//     //  Send confirmation email
//     try {
//       //  Build payment details text for email
//       let paymentDetailsHTML = "";

//       if (order.paymentMethod) {
//         const pm = order.paymentMethod;

//         if (pm.method === "card" && pm.card) {
//           paymentDetailsHTML = `
//       <p style="margin-top: 15px; font-size: 16px;">
//         <strong>Payment Method:</strong> ${pm.card.type || "Card"} ************ ${
//             pm.card.last4 || "****"
//           }<br>
//         <small>Expires ${pm.card.exp_month || "MM"}/${
//             pm.card.exp_year || "YY"
//           }</small>
//       </p>
//     `;
//         } else {
//           paymentDetailsHTML = `
//       <p style="margin-top: 15px; font-size: 16px;">
//         <strong>Payment Method:</strong> ${pm.method || "Unknown"}
//       </p>
//     `;
//         }
//       }

//       const totalsSection = couponCode
//         ? `
//     <p style="margin-top: 20px; font-size: 16px;">
//       <strong>Original Total:</strong> ₦${originalTotal.toLocaleString()} <br>
//       <strong>Coupon Discount:</strong> -₦${discountAmount.toLocaleString()} <br>
//       <strong>Final Total:</strong> ₦${finalTotal.toLocaleString()}
//     </p>
//   `
//         : `
//     <p style="margin-top: 20px; font-size: 16px;">
//       <strong>Total:</strong> ₦${finalTotal.toLocaleString()}
//     </p>
//   `;

//       const productRows = parsedProducts
//         .map((p) => {
//           let details = "";
//           if (p.size) details += `Size: ${p.size} `;
//           if (p.color) details += `| Color: ${p.color}`;
//           return `
//       <tr>
//         <td style="padding:8px;border:1px solid #ddd;">
//           ${p.name}${details ? `<br><small>${details.trim()}</small>` : ""}
//         </td>
//         <td style="padding:8px;border:1px solid #ddd;text-align:center;">${
//           p.quantity
//         }</td>
//         <td style="padding:8px;border:1px solid #ddd;text-align:right;">₦${p.price.toLocaleString()}</td>
//       </tr>`;
//         })
//         .join("");

//       await sendEmail({
//         to: user.email,
//         subject: `Your EcoStore Order Confirmation - ${order.orderNumber}`,
//         text: `Hi ${user.name}, thank you for your order! Your order number is ${order.orderNumber}.`,
//         html: `
//               <!DOCTYPE html>
//               <html>
//                 <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
//                   <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
//                     <h2 style="color: #2ecc71; text-align: center;"> Thank you for your order!</h2>
//                     <p>Hi <strong>${user.name}</strong>,</p>
//                     <p>We’ve received your order <strong>${order.orderNumber}</strong>.</p>
//                     <p><strong>Current Status:</strong> <span style="color: orange;">Pending</span></p>

//                     <h3 style="margin-top: 20px;">🛒 Order Summary</h3>
//                     <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
//                       <thead>
//                         <tr>
//                           <th style="padding: 8px; border: 1px solid #ddd; text-align:left;">Product</th>
//                           <th style="padding: 8px; border: 1px solid #ddd; text-align:center;">Qty</th>
//                           <th style="padding: 8px; border: 1px solid #ddd; text-align:right;">Price</th>
//                         </tr>
//                       </thead>
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
//       });
//     } catch (emailErr) {
//       console.error(" Email send failed:", emailErr);
//     }

//     //  Optional: reward coupon
//     if (order.totalAmount >= 150000) {
//       try {
//         const rewardCoupon = await createNewCoupon(user._id);
//         await sendEmail({
//           to: user.email,
//           subject: "🎁 You earned a special coupon from EcoStore!",
//           text: `Hi ${user.name}, congratulations! Use code: ${rewardCoupon.code} to enjoy ${rewardCoupon.discountPercentage}% off your next purchase.`,
//           html: `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; padding:20px; background:#fff; border-radius:8px;">
//               <h2 style="color:#2ecc71;">🎉 Congratulations!</h2>
//               <p>Hi <strong>${user.name}</strong>,</p>
//               <p>Since your purchase was above <strong>₦150,000</strong>, you’ve earned a special reward coupon:</p>
//               <p style="font-size:18px; background:#f4f4f4; padding:10px; border-radius:5px; text-align:center;">
//                 <strong>Coupon Code:</strong> <span style="color:#e74c3c;">${rewardCoupon.code}</span><br>
//                 <strong>Discount:</strong> ${rewardCoupon.discountPercentage}% OFF
//               </p>
//               <p>Apply this coupon at checkout on your next order 🚀</p>
//               <p style="margin-top:20px;">Thank you for shopping with EcoStore 🌱</p>
//             </div>
//           `,
//         });
//       } catch (err) {
//         console.error(" Reward coupon creation/email failed:", err);
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Payment verified and order created",
//       orderId: order._id,
//       orderNumber: order.orderNumber,
//     });
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


/**
 * Create a  coupon (optional). Returns coupon id or null.
 * This function will return null if Stripe isn't configured.
 */
async function createStripeCoupon(discountPercentage) {
  try {
    if (!stripe) {
      console.warn("Stripe key not configured — skipping createStripeCoupon");
      return null;
    }
    const coupon = await stripe.coupons.create({
      percent_off: discountPercentage,
      duration: "once",
    });
    return coupon.id;
  } catch (err) {
    console.error("createStripeCoupon error:", err);
    return null;
  }
}

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
