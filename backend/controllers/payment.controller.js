import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";
import User from "../models/user.model.js";
import { sendEmail } from "../lib/mailer.js";

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // stripe wants u to send in the format of cents
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
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
          }))
        ),
      },
    });

    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }
    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res
      .status(500)
      .json({ message: "Error processing checkout", error: error.message });
  }
};

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: "Order already exists",
          orderId: existingOrder._id,
          orderNumber: existingOrder.orderNumber,
        });
      }

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

      // ✅ Generate unique order number
      function generateOrderNumber() {
        return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      }

      let orderNumber = generateOrderNumber();

      // ✅ Ensure orderNumber is unique (retry if collision happens)
      while (await Order.findOne({ orderNumber })) {
        orderNumber = generateOrderNumber();
      }

      // create a new Order
      const products = JSON.parse(session.metadata.products);

      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((product) => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100, // convert from cents to dollars
        stripeSessionId: sessionId,
        orderNumber, // ✅ now this exists
      });

      await newOrder.save();

      await User.findByIdAndUpdate(session.metadata.userId, { cartItems: [] });

      // ✅ Fetch user to get their email
      const user = await User.findById(session.metadata.userId);

      // ✅ Create product rows for the email
      const productRows = products
        .map(
          (p) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align:center;">${
        p.quantity
      }</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align:right;">$${p.price.toFixed(
        2
      )}</td>
    </tr>
  `
        )
        .join("");

      await sendEmail({
        to: user.email,
        subject: `Your EcoStore Order Confirmation -  ${newOrder.orderNumber}`,
        text: `Hi ${user.name}, thank you for your order! Your order number is ${newOrder.orderNumber}.`,
        html: `
          <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2ecc71; text-align: center;">🎉 Thank you for your order!</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>We’ve received your order <strong>${
            newOrder.orderNumber
          }</strong> and it’s now being processed.</p>

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
            <strong>Total:</strong> $${newOrder.totalAmount.toFixed(2)} <br>
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

      res.status(200).json({
        success: true,
        message:
          "Payment successful, order created, and coupon deactivated if used.",
        orderId: newOrder._id,
        orderNumber: newOrder.orderNumber, // send to frontend
      });
    }
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
