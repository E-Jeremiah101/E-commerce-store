import Order from "../models/order.model.js";
import { sendEmail } from "../lib/mailer.js";
import User from "../models/user.model.js";
import Coupon from "../models/coupon.model.js";
import Product from "../models/product.model.js";
import { flw } from "../lib/flutterwave.js";

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

// Simple order recovery for support team


 
  export const supportRecoverOrder = async (req, res) => {
     function generateOrderNumber() {
    return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
    try {
      const { transaction_ref, flutterwave_ref, customer_email, amount } =
        req.body;

      console.log("🔄 Order recovery attempt:", {
        transaction_ref,
        flutterwave_ref,
        customer_email,
        amount,
      });

      // Validate input
      if (!transaction_ref && !flutterwave_ref) {
        return res.status(400).json({
          error:
            "Please provide either Transaction Reference or Flutterwave Reference",
        });
      }

      if (!customer_email || !amount) {
        return res.status(400).json({
          error: "Customer email and amount are required",
        });
      }

      let payment = null;
      let searchMethod = "";

      // STRATEGY 1: Search by Flutterwave Reference (Most Accurate - using transaction ID)
      if (flutterwave_ref) {
        console.log("🔍 Searching by Flutterwave Reference:", flutterwave_ref);

        try {
          // For Flutterwave references like "JayyTech_PZBXZJ1764348466589204262"
          // We need to find the transaction ID first
          const recentTx = await flw.Transaction.fetch({
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            status: "successful",
          });

          // Look for transaction with matching flw_ref
          const matchingPayment = recentTx.data.find(
            (tx) => tx.flw_ref === flutterwave_ref
          );

          if (matchingPayment) {
            payment = matchingPayment;
            searchMethod = "flutterwave_reference";
            console.log(
              "✅ Found payment via Flutterwave Reference:",
              payment.id
            );
          } else {
            console.log(
              "❌ No payment found with Flutterwave Reference:",
              flutterwave_ref
            );
          }
        } catch (error) {
          console.error("Flutterwave Reference search failed:", error.message);
        }
      }

      // STRATEGY 2: Search by Transaction Reference (Customer-friendly)
      if (!payment && transaction_ref) {
        console.log("🔍 Searching by Transaction Reference:", transaction_ref);

        try {
          const transactions = await flw.Transaction.fetch({
            tx_ref: transaction_ref,
          });

          if (transactions.data && transactions.data.length > 0) {
            // Filter by amount to find the correct payment
            const amountTolerance = 1;
            const successfulPayments = transactions.data.filter(
              (p) =>
                p.status === "successful" &&
                Math.abs(p.amount - parseFloat(amount)) <= amountTolerance
            );

            if (successfulPayments.length > 0) {
              // Use the most recent successful payment
              payment = successfulPayments.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
              )[0];
              searchMethod = "transaction_reference";
              console.log(
                "✅ Found payment via Transaction Reference:",
                payment.id
              );
            } else {
              console.log("❌ No successful payments match the amount");
              // Show what we found for debugging
              transactions.data.forEach((p) => {
                console.log(
                  `   - Amount: ${p.amount}, Status: ${p.status}, Date: ${p.created_at}`
                );
              });
            }
          } else {
            console.log(
              "❌ No payments found with Transaction Reference:",
              transaction_ref
            );
          }
        } catch (error) {
          console.error("Transaction Reference search failed:", error.message);
        }
      }

      if (!payment) {
        return res.status(404).json({
          error: "No successful payment found with the provided details",
          searchMethodsTried: [
            flutterwave_ref ? "Flutterwave Reference" : null,
            transaction_ref ? "Transaction Reference" : null,
          ].filter(Boolean),
          tips: [
            "For Flutterwave Reference: Use the exact reference from webhook logs (starts with JayyTech_)",
            "For Transaction Reference: Use the ECOSTORE- reference from customer receipt",
            "Verify the exact amount charged",
            'Confirm payment status is "successful"',
          ],
        });
      }

      // ✅ Check if order already exists
      const existingOrder = await Order.findOne({
        $or: [
          { flutterwaveTransactionId: payment.id },
          { flutterwaveRef: payment.tx_ref },
        ],
      });

      if (existingOrder) {
        console.log("🔄 Order already exists:", {
          orderNumber: existingOrder.orderNumber,
          transactionId: existingOrder.flutterwaveTransactionId,
          transactionRef: existingOrder.flutterwaveRef,
          status: existingOrder.status,
          createdAt: existingOrder.createdAt,
        });

        // Get user details for better context
        const user = await User.findById(existingOrder.user);

        return res.status(400).json({
          error: "Order already exists in system",
          orderDetails: {
            orderNumber: existingOrder.orderNumber,
            status: existingOrder.status,
            createdAt: existingOrder.createdAt,
            totalAmount: existingOrder.totalAmount,
            customer: user ? `${user.firstname} ${user.lastname}` : "Unknown",
            customerEmail: user?.email,
            products: existingOrder.products?.map((p) => p.name) || [],
          },
          paymentDetails: {
            transactionReference: existingOrder.flutterwaveRef,
            flutterwaveTransactionId: existingOrder.flutterwaveTransactionId,
            amount: existingOrder.totalAmount,
          },
          action: "No recovery needed - check order status or contact customer",
        });
      }

      // ✅ Find or create user
      let user = await User.findOne({ email: customer_email });
      if (!user) {
        user = await User.create({
          email: customer_email,
          firstname: payment.customer?.firstname || "Recovery",
          lastname: payment.customer?.lastname || "Customer",
          phones: payment.customer?.phone_number
            ? [{ number: payment.customer.phone_number }]
            : [],
        });
        console.log("✅ Created new user for recovery:", user.email);
      }

      // ✅ Create the recovered order
      const order = new Order({
        user: user._id,
        products: [], // Support will add products manually
        orderNumber: generateOrderNumber(),
        subtotal: amount || payment.amount,
        totalAmount: amount || payment.amount,
        deliveryAddress: "To be confirmed by customer",
        phone: payment.customer?.phone_number || "To be confirmed",
        flutterwaveRef: payment.tx_ref,
        flutterwaveTransactionId: payment.id,
        paymentStatus: "paid",
        status: "Pending",
        paymentMethod: {
          method: payment.payment_type || "card",
          status: "PAID",
          ...(payment.card
            ? {
                card: {
                  brand: payment.card.type || "Unknown",
                  last4: payment.card.last_4digits || null,
                  issuer: payment.card.issuer || null,
                },
              }
            : {}),
        },
        isProcessed: true,
        notes: `MANUALLY RECOVERED - Found via ${searchMethod}. 
              Flutterwave Ref: ${payment.flw_ref}
              Transaction Ref: ${payment.tx_ref}
              Recovered on: ${new Date().toLocaleString()}`,
      });

      await order.save();
      console.log("✅ Order recovered successfully:", order.orderNumber);

      res.json({
        success: true,
        message: `Order recovered successfully via ${searchMethod.replace(
          "_",
          " "
        )}!`,
        orderNumber: order.orderNumber,
        orderId: order._id,
        customerEmail: customer_email,
        amount: order.totalAmount,
        searchMethod: searchMethod.replace("_", " "),
        paymentDetails: {
          transactionReference: payment.tx_ref,
          flutterwaveReference: payment.flw_ref,
          flutterwaveTransactionId: payment.id,
          amount: payment.amount,
          paidAt: payment.created_at,
          paymentType: payment.payment_type,
        },
        nextSteps: [
          "Contact customer with order number",
          "Add products to the order manually",
          "Confirm delivery address with customer",
          "Update order status as needed",
        ],
      });
    } catch (error) {
      console.error("❌ Order recovery failed:", error);
      res.status(500).json({
        error: "Order recovery failed: " + error.message,
      });
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
