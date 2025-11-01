import Order from "../models/order.model.js";
import axios from "axios";

//  Generate a consistent fallback ID for deleted products
const getDeletedProductId = (p, orderId) => {
  return `deleted-${orderId}-${p.name?.replace(/\s+/g, "_")?.trim()}-${
    p.price
  }`;
};

export const requestRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, quantity, reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ message: "Refund reason is required." });
    }

    const order = await Order.findById(orderId).populate("products.product");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "Delivered") {
      return res
        .status(400)
        .json({ message: "Refunds are only allowed for delivered orders" });
    }

    // Consistent helper for deleted product IDs
    const getDeletedProductId = (p) => {
      const safeName = (p.name || p.product?.name || "")
        .trim()
        .replace(/\s+/g, "_");
      const price = p.price || p.product?.price || 0;
      return `deleted-${orderId}-${safeName}-${price}`;
    };

    // Find product (even if deleted)
    const product = order.products.find(
      (p) =>
        p.product?._id?.toString() === productId ||
        getDeletedProductId(p) === productId
    );

    if (!product) {
      return res
        .status(400)
        .json({ message: "This item was not part of your original order." });
    }

    if (quantity > product.quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid refund quantity." });
    }

    // Create consistent refundKey
    const refundKey =
      product.product?._id?.toString() || getDeletedProductId(product);

    //  STRONG duplicate check
    const duplicateRefund = order.refunds.some((r) => {
      const existingKey =
        r.product?.toString() ||
        r.productSnapshot?._id ||
        getDeletedProductId(r.productSnapshot || {});
      return existingKey === refundKey;
    });

    if (duplicateRefund) {
      return res
        .status(400)
        .json({ message: "Refund already requested for this product." });
    }

    // Create product snapshot
    const snapshot = {
      _id: refundKey,
      name: product.product?.name || product.name || "Deleted Product",
      image:
        product.product?.images?.[0] || product.image || "/images/deleted.png",
      price: product.product?.price || product.price || 0,
    };

    // Calculate refund amount
    const refundAmount = snapshot.price * quantity;

    // Push refund
    order.refunds.push({
      product: product.product?._id || null,
      quantity,
      amount: refundAmount,
      reason,
      productSnapshot: snapshot,
      status: "Pending",
    });

    order.refundStatus =
      order.refunds.length === order.products.length
        ? "Full Refund Requested"
        : "Partial Refund Requested";

    await order.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Refund requested successfully",
      order,
    });
  } catch (err) {
    console.error("Refund request error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 *  ADMIN: View all refund requests
 */

export const getAllRefundRequests = async (req, res) => {
  try {
    
    const orders = await Order.find({ "refunds.0": { $exists: true } })
      .populate("user", "name email")
      .populate("refunds.product", "name images price")
      .sort({ createdAt: -1 });

    const refunds = orders.flatMap((order) =>
      order.refunds.map((refund) => {
        const productData = refund.product || {};
        const snapshot = refund.productSnapshot || {};

        return {
          orderId: order._id,
          user: order.user,
          orderNumber: order.orderNumber,
          refundId: refund._id,
          productId: refund.product?._id || snapshot._id,
          productName: productData.name || snapshot.name || "Deleted Product",
          productImage:
            productData.images?.[0] || snapshot.image || "/images/deleted.png",
          productPrice: productData.price || snapshot.price || 0,
          quantity: refund.quantity,
          amount: refund.amount,
          reason: refund.reason,
          status: refund.status,
          requestedAt: refund.requestedAt,
          processedAt: refund.processedAt,
        };
      })
    );

    res.status(200).json(refunds);
  } catch (err) {
    console.error("Error fetching refund requests:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 *  ADMIN: Approve Refund (Flutterwave API)
 */
export const approveRefund = async (req, res) => {
  try {
    const { orderId, refundId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const refund = order.refunds.id(refundId);
    if (!refund) return res.status(404).json({ message: "Refund not found" });

    if (refund.status !== "Pending")
      return res.status(400).json({ message: "Refund already processed" });

    // Approve refund
    refund.status = "Approved";
    refund.processedAt = Date.now();

    //  Flutterwave refund API
    const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
    const transactionId = order.flutterwaveTransactionId;

    // if (!transactionId)
    //   return res
    //     .status(400)
    //     .json({ message: "No Flutterwave transaction ID found" });

    // await axios.post(
    //   "https://api.flutterwave.com/v3/refunds",
    //   {
    //     transaction_id: transactionId,
    //     amount: refund.amount,
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${FLW_SECRET_KEY}`,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // ); i commented this out because i dont have a valid payment yet

    if (transactionId) {
      await axios.post(
        "https://api.flutterwave.com/v3/refunds",
        { transaction_id: transactionId, amount: refund.amount },
        {
          headers: {
            Authorization: `Bearer ${FLW_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      console.log("Skipping Flutterwave refund: no transaction ID");
    }


    // Update order refund status
    const approvedRefunds = order.refunds.filter(
      (r) => r.status === "Approved"
    ).length;
    order.refundStatus =
      approvedRefunds === order.products.length
        ? "Fully Refunded"
        : "Partial Refunded";

   await order.save({ validateBeforeSave: false });


    res.status(200).json({
      success: true,
      message: "Refund approved successfully",
      order,
    });
  } catch (err) {
    console.error("Approve refund error:", err.response?.data || err);
    res.status(500).json({ message: "Failed to approve refund" });
  }
};

/**
 *  ADMIN: Reject Refund
 */
export const rejectRefund = async (req, res) => {
  try {
    const { orderId, refundId } = req.params;

    const order = await Order.findById(orderId);
    const refund = order?.refunds.id(refundId);
    if (!refund) return res.status(404).json({ message: "Refund not found" });

    refund.status = "Rejected";
    refund.processedAt = Date.now();

    await order.save();

    res.status(200).json({ success: true, message: "Refund rejected", order });
  } catch (err) {
    console.error("Reject refund error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
