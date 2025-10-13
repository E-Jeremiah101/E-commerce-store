import Order from "../models/order.model.js";
import {sendEmail} from "../lib/mailer.js";
import User from "../models/user.model.js";
import Coupon from "../models/coupon.model.js";

export const getUserOrders = async (req, res) => {
    try {
        const userId =  req.user._id;

        const orders = await Order.find({user: userId}).populate("products.product", "name image price").sort({createdAt: -1}).lean();

        // res.status(200).json({ success: true, orders });
        res.status(200).json({
          success: true,
          count: orders.length,
          orders: orders.map((order) => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            deliveredAt: order.deliveredAt,
            totalAmount: order.totalAmount,
            subtotal: order.subtotal,
            discount: order.discount,
            coupon: order.coupon,
            deliveryAddress: order.deliveryAddress,
            phone: order.phone,
            createdAt: order.createdAt,
            products: order.products.map((p) => ({
              _id: p._id,
              product: p.product || null,
              quantity: p.quantity,
              price: p.price,
              size: p.selectedSize || null,
              color: p.selectedColor || null,
              selectedCategory: p.selectedCategory || null,
              name: p.name || p.product?.name || "Unknown Product",
              image: p.image || p.product?.image || "/placeholder.png",
            })),
          })),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// Get all orders (for admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone address") // show user info
      .populate("products.product", "name price image ")
      .sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        count: orders.length,
        orders: orders.map((order) => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          user: order.user,
          status: order.status,
          deliveredAt: order.deliveredAt,
          updatedAt:order.updatedAt,
          totalAmount: order.totalAmount,
          subtotal: order.subtotal,
          discount: order.discount,
          coupon: order.coupon,
          deliveryAddress: order.deliveryAddress,
          phone: order.phone,
          createdAt: order.createdAt,
          products: order.products.map((p) => ({
            _id: p._id,
            product: p.product || null,
            quantity: p.quantity,
            price: p.price,
            size: p.selectedSize || null,
            color: p.selectedColor || null,
            selectedCategory: p.selectedCategory || null,
            name: p.name || p.product?.name || "Unknown Product",
            image: p.image || p.product?.image || "/placeholder.png",
          })),
        })),
      });
    // res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).populate("user");
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;

    if (status === "Delivered") order.deliveredAt = Date.now();

    await order.save();

    // ✅ Styled HTML email
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eee;">
            <h2 style="color: #2c3e50; text-align: center;">📢 Order Status Update</h2>
            <p>Hi <strong>${order.user?.name || "Customer"}</strong>,</p>
            <p>Your order <strong>${
              order.orderNumber
            }</strong> has been updated.</p>
            
            <p style="font-size: 16px;">
              <strong>Current Status:</strong> 
              <span style="color: ${
                status === "Shipped"
                  ? "green"
                  : status === "Delivered"
                  ? "#2ecc71"
                  : status === "Cancelled"
                  ? "red"
                  : "orange"
              }; font-weight: bold;">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </p>

            ${
              status === "Delivered"
                ? `<p>Your package has been delivered. We hope you enjoy your purchase!</p>`
                : status === "Shipped"
                ? `<p>🚚 Your order is on the way! You’ll receive it soon.</p>`
                : status === "Processing"
                ? `<p>We’re currently preparing your order.</p>`
                : status === "Cancelled"
                ? `<p>❌ Unfortunately, your order has been cancelled. Please contact support if this wasn’t expected.</p>`
                : ""
            }

            <p style="margin-top: 30px; font-size: 14px; color: #555;">
              Best regards, <br>
              <strong>The Eco-Store Team 🌱</strong>
            </p>
          </div>
        </body>
      </html>
    `;

    // ✅ Send email
    console.log("📦 Order updated:", order);
   try {
     await sendEmail({
       to: order.user?.email,
       subject: `Update on your order ${order.orderNumber}`,
       html: emailHtml,
     });
   } catch (emailError) {
    console.error("Fail to send email:", emailError.message);
   }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error.message);
    res.status(500).json({ message: error.message });;
  }
};

// Create new order
export const createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cartItems.product");

    if (!user || !user.cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Get default phone & address
    const defaultPhone = user.phones.find((p) => p.isDefault) || user.phones[0];
    const defaultAddress = user.addresses.find((a) => a.isDefault) || user.addresses[0];

    // Build order items
    const orderItems = user.cartItems.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.image,
      price: item.product.price,
      quantity: item.quantity,
      selectedSize: item.size || null,
      selectedColor: item.color || null,
      selectedCategory: item.category || null,
    }));

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let discount = 0;
    let coupon = null;

    if (req.body.couponCode) {
      const foundCoupon = await Coupon.findOne({
        code: req.body.couponCode,
        isActive: true,
      });

      if (foundCoupon) {
        if (foundCoupon.type === "percentage") {
          discount = Math.round((subtotal * foundCoupon.value) / 100);
        } else if (foundCoupon.type === "fixed") {
          discount = Math.min(foundCoupon.value, subtotal);
        }

        coupon = { code: foundCoupon.code, discountPercentage: foundCoupon.type === "percentage" ? foundCoupon.value: 0,
          discountAmount: discount,
        };
      }
    }
        const totalAmount = Math.max(subtotal - discount, 0);


    // Create order snapshot
    const order = new Order({
      user: user._id,
      products: orderItems,
      subtotal,
      discount,
      totalAmount,
      coupon,
      phone: defaultPhone?.number || "",
      deliveryAddress: defaultAddress?.address || "",
      status: "Pending",
    });

    await order.save();

    // Clear cart after order
    user.cartItems = [];
    await user.save();

    res.status(201).json({ message: "Order placed ✅", order });
  } catch (err) {
    console.error("Error creating order", err);
    res.status(500).json({ message: "Server error" });
  }
};
