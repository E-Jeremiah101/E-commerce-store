import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";
import User from "../models/user.model.js";
import { sendEmail } from "../lib/mailer.js";
import Product from "../models/product.model.js"

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    //Fetch user profile
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

   const defaultPhone = user.phones.find((p) => p.isDefault);
   const defaultAddress = user.addresses.find((a) => a.isDefault);

   if (!defaultPhone?.number?.trim() || !defaultAddress?.address?.trim()) {
     return res.status(400).json({
       error: "You must add a phone number and address before checkout.",
     });
   }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // stripe wants u to send in the format of cents
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "ngn",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        totalAmount -= Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
      }
    }

    const totalInNaira = totalAmount / 100;
    let rewardCoupon = null;
    if (totalInNaira >= 150000) {
      rewardCoupon = await createNewCoupon(req.user._id);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [
            {
              coupon: await createStripeCoupon(coupon.discountPercentage),
            },
          ]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
            name: p.name,
            image: p.image,
            size: p.size || null,
            color: p.color || null,
            category: p.category || null,
          }))
        ),
      },
    });

    
    res.status(200).json({ id: session.id, totalAmount: totalInNaira });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res
      .status(500)
      .json({ message: "Error processing checkout", error: error.message });
  }
};

// export const checkoutSuccess = async (req, res) => {
//   try {
//     const { sessionId } = req.body;
//     const session = await stripe.checkout.sessions.retrieve(sessionId);

//     if (session.payment_status !== "paid") {
//       return res.status(400).json({ error: "Payment not completed" });
//     }

//     // ✅ Upsert order (atomic, no duplicates)
//     const productPairs = session.metadata.productIds.split(",");
//     const products = await Promise.all(
//       productPairs.map(async (pair) => {
//         const [id, quantity] = pair.split(":");
//         const product = await Product.findById(id); // fetch full details from DB
//         return {
//           id: product._id,
//           name: product.name,
//           image: product.image,
//           price: product.price,
//           quantity: parseInt(quantity, 10),
//         };
//       })
//     );

    
   

//     // ✅ generate unique orderNumber
//     function generateOrderNumber() {
//       return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
//     }

//     // use findOneAndUpdate with upsert to prevent duplicates
//     let order = await Order.findOne({ stripeSessionId: sessionId });
//     let isNew = false;
//     if (!order) {
//       order = await Order.create({
//         user: session.metadata.userId,
//         products: products.map((p) => ({
//           product: p.id,
//           quantity: p.quantity,
//           price: p.price,
//         })),
//         totalAmount: session.amount_total / 100,
//         stripeSessionId: sessionId,
//         orderNumber: generateOrderNumber(),
//         deliveryAddress: defaultAddress?.address || "No address provided",
//         phone: defaultPhone?.number || "No phone provided",
//       });

//       isNew = true;

//       // deactivate coupon if used
//       if (session.metadata.couponCode) {
//         await Coupon.findOneAndUpdate(
//           {
//             code: session.metadata.couponCode,
//             userId: session.metadata.userId,
//           },
//           { isActive: false }
//         );
//       }

//       // clear cart only if this is a new order (not when returning existing)
//       await User.findByIdAndUpdate(session.metadata.userId, { cartItems: [] });

//       // send email only if new
//       if (isNew) {
//         const productRows = products
//           .map(
//             (p) => `
//           <tr>
//             <td style="padding:8px;border:1px solid #ddd;">${p.name}</td>
//             <td style="padding:8px;border:1px solid #ddd;text-align:center;">${
//               p.quantity
//             }</td>
//             <td style="padding:8px;border:1px solid #ddd;text-align:right;">#${p.price.toLocaleString()}</td>
//           </tr>`
//           )
//           .join("");

//           // ✅ Price breakdown if coupon applied
//       const originalTotal = session.amount_subtotal / 100; // before discount
//       const finalTotal = session.amount_total / 100; // after discount
//       const discountAmount = originalTotal - finalTotal;

//       const totalsSection = session.metadata.couponCode
//         ? `
//           <p style="margin-top: 20px; font-size: 16px;">
//             <strong>Original Total:</strong> ₦${originalTotal.toLocaleString()} <br>
//             <strong>Coupon Applied (${session.metadata.couponCode}):</strong> -₦${discountAmount.toLocaleString()} <br>
//             <strong>Final Total:</strong> ₦${finalTotal.toLocaleString()}
//           </p>
//         `
//         : `
//           <p style="margin-top: 20px; font-size: 16px;">
//             <strong>Total:</strong> ₦${finalTotal.toLocaleString()}
//           </p>
//         `;

//         try {
//           await sendEmail({
//             to: user.email,
//             subject: `Your EcoStore Order Confirmation -  ${order.orderNumber}`,
//             text: `Hi ${user.name}, thank you for your order! Your order number is ${order.orderNumber}.`,
//             html: `
//             <!DOCTYPE html>
//       <html>
//         <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
//           <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
//             <h2 style="color: #2ecc71; text-align: center;">🎉 Thank you for your order!</h2>
//             <p>Hi <strong>${user.name}</strong>,</p>
//             <p>We’ve received your order <strong>${
//               order.orderNumber
//             }</strong>.</p>
//             <p><strong>Current Status:</strong> <span style="color: orange;">Pending ⏳</span></p>
  
//             <h3 style="margin-top: 20px;">🛒 Order Summary</h3>
//             <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
//               <thead>
//                 <tr>
//                   <th style="padding: 8px; border: 1px solid #ddd; text-align:left;">Product</th>
//                   <th style="padding: 8px; border: 1px solid #ddd; text-align:center;">Qty</th>
//                   <th style="padding: 8px; border: 1px solid #ddd; text-align:right;">Price</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 ${productRows}
//               </tbody>
//             </table>
  
//             <p style="margin-top: 20px; font-size: 16px;">
//               <strong>Total:</strong> #${order.totalAmount.toLocaleString(
//                 undefined,
//                 {
//                   minimumFractionDigits: 0,
//                 }
//               )} <br>
//               <strong>Estimated delivery:</strong> 3–5 business days
//             </p>
  
//             <p>You’ll get another email once your items are shipped 🚚</p>
//             <p>If you have any questions, just reply to this email — we’re happy to help!</p>
  
//             <p style="margin-top: 30px; font-size: 14px; color: #555;">
//               Best regards, <br>
//               <strong>The EcoStore Team 🌱</strong>
//             </p>
//           </div>
//         </body>
//       </html>
//           `,
//           });
//         } catch (error) {
//           console.error("❌ Failed to send email:", error);
//         }
//       }
//     }

//     // Reward coupon if order is above ₦150,000
//     if (order.totalAmount >= 150000) {
//       const rewardCoupon = await createNewCoupon(user._id);

//       try {
//         await sendEmail({
//           to: user.email,
//           subject: "🎁 You earned a special coupon from EcoStore!",
//           text: `Hi ${user.name}, congratulations! Since your purchase was above ₦150,000, we've created a coupon just for you. Use code: ${rewardCoupon.code} to enjoy ${rewardCoupon.discountPercentage}% off your next purchase.`,
//           html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; padding:20px; background:#fff; border-radius:8px;">
//           <h2 style="color:#2ecc71;">🎉 Congratulations!</h2>
//           <p>Hi <strong>${user.name}</strong>,</p>
//           <p>Since your purchase was above <strong>₦150,000</strong>, you’ve earned a special reward coupon:</p>
//           <p style="font-size:18px; background:#f4f4f4; padding:10px; border-radius:5px; text-align:center;">
//             <strong>Coupon Code:</strong> <span style="color:#e74c3c;">${rewardCoupon.code}</span><br>
//             <strong>Discount:</strong> ${rewardCoupon.discountPercentage}% OFF
//           </p>
//           <p>Apply this coupon at checkout on your next order 🚀</p>
//           <p style="margin-top:20px;">Thank you for shopping with EcoStore 🌱</p>
//         </div>
//       `,
//         });
//         console.log("✅ Reward coupon email sent");
//       } catch (err) {
//         console.error("❌ Failed to send reward coupon email:", err);
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: "Payment successful",
//       orderId: order._id,
//       orderNumber: order.orderNumber, // send to frontend
//     });
//   } catch (error) {
//     console.error("Error processing successful checkout:", error);
//     res.status(500).json({
//       message: "Error processing successful checkout",
//       error: error.message,
//     });
//   }
// };


export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // ✅ Upsert order (atomic, no duplicates)
    const products = JSON.parse(session.metadata.products);

    // fetch user for email + defaults
    const user = await User.findById(session.metadata.userId);
    const defaultPhone =
      user.phones?.find((p) => p.isDefault) || user.phones?.[0];
    const defaultAddress =
      user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

    // ✅ generate unique orderNumber
    function generateOrderNumber() {
      return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // use findOneAndUpdate with upsert to prevent duplicates
    let order = await Order.findOne({ stripeSessionId: sessionId });
    let isNew = false;
    if (!order) {
      order = await Order.create({
        user: session.metadata.userId,
        products: products.map((p) => ({
          product: p.id,
          quantity: p.quantity,
          price: p.price,
          size: p.size || "",
          color: p.color || "",
          selectedCategory: p.category || "",
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
        orderNumber: generateOrderNumber(),
        deliveryAddress: defaultAddress?.address || "No address provided",
        phone: defaultPhone?.number || "No phone provided",
      });

      isNew = true;

      // deactivate coupon if used
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }

      // clear cart only if this is a new order (not when returning existing)
      await User.findByIdAndUpdate(session.metadata.userId, { cartItems: [] });

      // send email only if new
      if (isNew) {
        const productRows = products
          .map(
            (p) => `
          <tr>
            <td style="padding:8px;border:1px solid #ddd;">${p.name}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${
              p.quantity
            }</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">#${p.price.toLocaleString()}</td>
          </tr>`
          )
          .join("");

        try {
          await sendEmail({
            to: user.email,
            subject: `Your EcoStore Order Confirmation -  ${order.orderNumber}`,
            text: `Hi ${user.name}, thank you for your order! Your order number is ${order.orderNumber}.`,
            html: `
            <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2ecc71; text-align: center;">🎉 Thank you for your order!</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>We’ve received your order <strong>${
              order.orderNumber
            }</strong>.</p>
            <p><strong>Current Status:</strong> <span style="color: orange;">Pending ⏳</span></p>
  
            <h3 style="margin-top: 20px;">🛒 Order Summary</h3>
            <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align:left;">Product</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align:center;">Qty</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align:right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
            </table>
  
            <p style="margin-top: 20px; font-size: 16px;">
              <strong>Total:</strong> #${order.totalAmount.toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 0,
                }
              )} <br>
              <strong>Estimated delivery:</strong> 3–5 business days
            </p>
  
            <p>You’ll get another email once your items are shipped 🚚</p>
            <p>If you have any questions, just reply to this email — we’re happy to help!</p>
  
            <p style="margin-top: 30px; font-size: 14px; color: #555;">
              Best regards, <br>
              <strong>The EcoStore Team 🌱</strong>
            </p>
          </div>
        </body>
      </html>
          `,
          });
        } catch (error) {
          console.error("❌ Failed to send email:", error);
        }
      }
    }

    // Reward coupon if order is above ₦150,000
    if (order.totalAmount >= 150000) {
      const rewardCoupon = await createNewCoupon(user._id);

      try {
        await sendEmail({
          to: user.email,
          subject: "🎁 You earned a special coupon from EcoStore!",
          text: `Hi ${user.name}, congratulations! Since your purchase was above ₦150,000, we've created a coupon just for you. Use code: ${rewardCoupon.code} to enjoy ${rewardCoupon.discountPercentage}% off your next purchase.`,
          html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; padding:20px; background:#fff; border-radius:8px;">
          <h2 style="color:#2ecc71;">🎉 Congratulations!</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Since your purchase was above <strong>₦150,000</strong>, you’ve earned a special reward coupon:</p>
          <p style="font-size:18px; background:#f4f4f4; padding:10px; border-radius:5px; text-align:center;">
            <strong>Coupon Code:</strong> <span style="color:#e74c3c;">${rewardCoupon.code}</span><br>
            <strong>Discount:</strong> ${rewardCoupon.discountPercentage}% OFF
          </p>
          <p>Apply this coupon at checkout on your next order 🚀</p>
          <p style="margin-top:20px;">Thank you for shopping with EcoStore 🌱</p>
        </div>
      `,
        });
        console.log("✅ Reward coupon email sent");
      } catch (err) {
        console.error("❌ Failed to send reward coupon email:", err);
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment successful",
      orderId: order._id,
      orderNumber: order.orderNumber, // send to frontend
    });
  } catch (error) {
    console.error("Error processing successful checkout:", error);
    res.status(500).json({
      message: "Error processing successful checkout",
      error: error.message,
    });
  }
};
async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });

  return coupon.id;
}

async function createNewCoupon(userId) {
  await Coupon.findOneAndDelete({ userId });

  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    userId: userId,
  });

  await newCoupon.save();

  return newCoupon;
}
