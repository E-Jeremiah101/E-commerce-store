import Order from "../models/order.model.js";
import { sendEmail } from "../lib/mailer.js";
import User from "../models/user.model.js";
import Coupon from "../models/coupon.model.js";
import Product from "../models/product.model.js";

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .populate("products.product", "name image price")
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map((order) => {
      // 🔍 If any refund for this order has status "Approved"
      const hasApprovedRefund = order.refunds?.some(
        (refund) => refund.status === "Approved"
      );

      let displayStatus = order.status;
      const totalProducts = order.products.length;
      const approvedCount =
        order.refunds?.filter((r) => r.status === "Approved").length || 0;

      if (approvedCount > 0 && approvedCount < totalProducts) {
        displayStatus = "Partially Refunded";
      } else if (approvedCount === totalProducts) {
        displayStatus = "Refunded";
      }

      const products = order.products.map((p) => {
        // Check if this product has a refund request
        const refund = order.refunds?.find(
          (r) => r.product?.toString() === p.product?._id?.toString()
        );

        return {
          _id: p._id,
          product: p.product || null,
          quantity: p.quantity,
          price: p.price,
          size: p.selectedSize || null,
          color: p.selectedColor || null,
          selectedCategory: p.selectedCategory || null,
          name: p.name || p.product?.name || "Unknown Product",
          image: p.image  || "/placeholder.png", //changes made here
          refundStatus: refund?.status || null,
        };
      });

      return {
        count: orders.length,
        displayStatus,
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
        products,
      };
    });
    res.status(200).json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { sortBy, sortOrder = "desc", search } = req.query;

    // Build search filter
    let searchFilter = {};
    if (search) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(search); // check if search is a valid MongoDB ObjectId
      searchFilter = {
        $or: [
          { orderNumber: { $regex: search, $options: "i" } },
          { flutterwaveRef: { $regex: search, $options: "i" } },
          ...(isObjectId ? [{ _id: search }] : []),
          { "user.fistname": { $regex: search, $options: "i" } },
          { "user.lastname": { $regex: search, $options: "i" } },
        ],
      };
    }

    // Default mongo sort (used when not sorting by status)
    let sortOptions = {
      isProcessed: 1, // unprocessed first
      createdAt: -1, // newest first fallback
    };

    // If sorting by date or amount, merge into sortOptions
    if (sortBy === "date") {
      sortOptions = { isProcessed: 1, createdAt: sortOrder === "asc" ? 1 : -1 };
    } else if (sortBy === "totalAmount") {
      sortOptions = {
        isProcessed: 1,
        totalAmount: sortOrder === "asc" ? 1 : -1,
        createdAt: -1,
      };
    } else {
      // keep default isProcessed primary sort
      sortOptions = { ...sortOptions, createdAt: -1 };
    }

    // Fetch orders (do NOT ask Mongo to sort by custom status order)
    let orders = await Order.find(searchFilter)
      .populate("user", "firstname lastname email phone address")
      .populate("products.product", "name price image")
      .lean(); // use lean for faster in-memory sorting and to avoid mongoose docs

    // Handle status sorting manually (custom order)
    if (sortBy === "status") {
      const statusOrder = [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ];
      // Map status to index (unknown statuses get large index so they appear at end)
      const statusIndex = (s) => {
        const idx = statusOrder.indexOf(s);
        return idx === -1 ? statusOrder.length + 10 : idx;
      };

      orders.sort((a, b) => {
        const ai = statusIndex(a.status);
        const bi = statusIndex(b.status);
        // asc: Pending -> Cancelled, desc: Cancelled -> Pending
        return sortOrder === "asc" ? ai - bi : bi - ai;
      });

      // Still keep isProcessed unprocessed-first inside same status order:
      // stable sort: reorder so that within each status, isProcessed=false appear first
      orders = orders.sort((a, b) => {
        if (a.status === b.status) {
          // false (unprocessed) first
          return a.isProcessed === b.isProcessed ? 0 : a.isProcessed ? 1 : -1;
        }
        return 0; // keep relative order (status ordering already applied)
      });
    } else {
      // Not status-sorting: use Mongo-like sorting in-memory as fallback
      // This guarantees isProcessed primary sorting if present in sortOptions
      const mongoSortKeys = Object.keys(sortOptions);
      orders.sort((a, b) => {
        for (const key of mongoSortKeys) {
          const dir = sortOptions[key] === 1 ? 1 : -1;
          const va = a[key];
          const vb = b[key];
          if (va == null && vb == null) continue;
          if (va == null) return 1 * dir;
          if (vb == null) return -1 * dir;
          if (va < vb) return -1 * dir;
          if (va > vb) return 1 * dir;
        }
        return 0;
      });
    }

    // Map response (same shape you use)
    // Map response (same shape you use)
    res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map((order) => {
        //  Compute refund status dynamically
        const totalProducts = order.products.length;
        const approvedCount =
          order.refunds?.filter((r) => r.status === "Approved").length || 0;

        let refundStatus = "No Refund";
        if (approvedCount > 0 && approvedCount < totalProducts) {
          refundStatus = "Partially Refunded";
        } else if (approvedCount === totalProducts) {
          refundStatus = "Refunded";
        }

        return {
          _id: order._id,
          orderNumber: order.orderNumber,
          user: order.user,
          status: order.status,
          refundStatus,
          isProcessed: order.isProcessed,
          deliveredAt: order.deliveredAt,
          updatedAt: order.updatedAt,
          totalAmount: order.totalAmount,
          subtotal: order.subtotal,
          discount: order.discount,
          coupon: order.coupon,
          deliveryAddress: order.deliveryAddress,
          phone: order.phone,
          createdAt: order.createdAt,
          products: (order.products || []).map((p) => ({
            _id: p._id,
            product: p.product || null,
            quantity: p.quantity,
            price: p.price,
            size: p.selectedSize || null,
            color: p.selectedColor || null,
            selectedCategory: p.selectedCategory || null,
            name: p.name || p.product?.name || "Unknown Product",
            image: p.image || "/placeholder.png", //here also
          })),
        };
      }),
    });
  } catch (error) {
    console.error("getAllOrders error:", error);
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
    order.isProcessed = true;

    if (status === "Delivered") order.deliveredAt = Date.now();

    await order.save();

    // Styled HTML email
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eee;">
            <h2 style="color: #2c3e50; text-align: center;">📢 Order Status Update</h2>
            <p>Hi <strong>${order.user?.firstname || "Customer"}</strong>,</p>
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

    // Respond immediately so the client receives the update without waiting for email delivery
    console.log(" Order updated:", order);
    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });

    // Send notification email in background (fire-and-forget)
    (async () => {
      try {
        await sendEmail({
          to: order.user?.email,
          subject: `Update on your order ${order.orderNumber}`,
          html: emailHtml,
        });
      } catch (emailError) {
        console.error(
          "Background order update email failed:",
          emailError?.message || emailError
        );
      }
    })();
  } catch (error) {
    console.error(" Error updating order status:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Add this function to reduce variant stock when order is placed
const reduceVariantStock = async (orderItems) => {
  try {
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      // If product has variants, reduce specific variant stock
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => 
          v.size === item.selectedSize && v.color === item.selectedColor
        );
        
        if (variant) {
          if (variant.countInStock < item.quantity) {
            throw new Error(`Not enough stock for ${product.name} - ${item.selectedSize}/${item.selectedColor}`);
          }
          variant.countInStock -= item.quantity;
        }
      } else {
        // Fallback to overall product stock
        if (product.countInStock < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`);
        }
        product.countInStock -= item.quantity;
      }

      await product.save();
    }
  } catch (error) {
    throw error;
  }
};

// Create new order

export const createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "cartItems.product"
    );

    if (!user || !user.cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Get default phone & address
    const defaultPhone = user.phones.find((p) => p.isDefault) || user.phones[0];
    const defaultAddress =
      user.addresses.find((a) => a.isDefault) || user.addresses[0];

    // Build order items
    const orderItems = user.cartItems.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0] || item.product.image || "", 
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

        coupon = {
          code: foundCoupon.code,
          discountPercentage:
            foundCoupon.type === "percentage" ? foundCoupon.value : 0,
          discountAmount: discount,
        };
      }
    }
    const totalAmount = Math.max(subtotal - discount, 0);

    // REDUCE STOCK BEFORE CREATING ORDER
    await reduceVariantStock(orderItems);

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

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("Error creating order", err);
    
    // Provide specific error message for stock issues
    if (err.message.includes("Not enough stock")) {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: "Server error" });
  }
};
import mongoose from "mongoose";

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Prevent CastError if "id" is not a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(id)
      .populate("user", "firstname lastname email phone address")
      .populate("products.product", "name price image")
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("getOrderById error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
