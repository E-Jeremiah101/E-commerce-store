import Order from "../models/order.model.js";
import axios from "axios";


//  User: Request Refund
export const requestRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, quantity, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "Delivered")
      return res
        .status(400)
        .json({ message: "Refunds are only allowed for delivered orders" });

    const product = order.products.find(
      (p) => p.product.toString() === productId
    );
    if (!product)
      return res.status(400).json({ message: "Product not found in order" });
    if (quantity > product.quantity)
      return res.status(400).json({ message: "Invalid quantity" });

    // Check if refund already exists for this product
    const existingRefund = order.refunds.find(
      (r) => r.product.toString() === productId
    );
    if (existingRefund) {
      if (existingRefund.status === "Approved")
        return res
          .status(400)
          .json({ message: "Refund already approved for this product" });
      if (existingRefund.status === "Rejected")
        return res
          .status(400)
          .json({ message: "Refund request was rejected for this product" });
      return res
        .status(400)
        .json({ message: "Refund already pending for this product" });
    }

    const refundAmount = product.price * quantity;

    // Add new refund request
    order.refunds.push({
      product: productId,
      quantity,
      amount: refundAmount,
      reason,
      status: "Pending",
    });

    // Update order refund status
    order.refundStatus =
      order.refunds.length === order.products.length
        ? "Full Refund Requested"
        : "Partial Refund Requested";

    await order.save({ validateBeforeSave: false });

    res
      .status(200)
      .json({ success: true, message: "Refund requested successfully", order });
  } catch (err) {
    console.error("Refund request error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 *  ADMIN: View all refund requests
 */
export const getAllRefundRequests = async (req, res) => {
  try {
    

      const { status, startDate, endDate, search } = req.query;

      const filter = { "refunds.0": { $exists: true } };
      if (startDate || endDate) {
        filter["refunds.requestedAt"] = {};
        if (startDate) filter["refunds.requestedAt"].$gte = new Date(startDate);
        if (endDate) filter["refunds.requestedAt"].$lte = new Date(endDate);
      }
      const orders = await Order.find(filter)
        .populate("user", "name email")
        .populate("refunds.product", "name images price");

    let refundRequests = [];

    orders.forEach((order) => {
      order.refunds.forEach((ref) => {
        if (status && ref.status !== status) return;
        refundRequests.push({
          orderId: order._id,
          refundId: ref._id,
          orderNumber: order.orderNumber,
          product: ref.product,
          user: order.user,
          amount: ref.amount,
          reason: ref.reason,
          status: ref.status,
          requestedAt: ref.requestedAt,
          processedAt: ref.processedAt,
        });
      });
    });

    if (search) {
      const lower = search.toLowerCase();
      refundRequests = refundRequests.filter(
        (r) =>
          r.orderNumber?.toLowerCase().includes(lower) ||
          r.orderId?.toString().includes(lower)
      );
    }

    res.status(200).json({ success: true, refundRequests });
  } catch (err) {
    console.error("Fetch refund requests error:", err);
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
 * ❌ ADMIN: Reject Refund
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
