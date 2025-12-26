import Order from "../models/order.model.js";
export const getAllTransactions = async (req, res) => {
  try {
    const { search = "", sortBy = "date", sortOrder = "desc" } = req.query;

    // Find ALL payment orders (don't filter by refund status)
    const orders = await Order.find({
      flutterwaveTransactionId: { $exists: true },
    })
      .populate("user", "firstname lastname email")
      .select(
        "orderNumber flutterwaveTransactionId flutterwaveRef totalAmount paymentMethod createdAt refundStatus refunds totalRefunded"
      );

    const paymentTransactions = orders
      .map((order) => ({
        transactionId:
          order.flutterwaveTransactionId ||
          order.flutterwaveRef ||
          order.orderNumber,
        orderId: order._id, // Add order ID for reference
        customer: {
          name: `${order.user.firstname} ${order.user.lastname}`,
          email: order.user.email,
        },
        amount: order.totalAmount,
        netAmount: order.totalAmount - (order.totalRefunded || 0), // Add net amount after refunds
        paymentMethod: order.paymentMethod?.method || "flutterwave",
        type: "payment",
        status: order.refundStatus ? getPaymentStatus(order) : "success",
        date: order.createdAt,
        originalOrder: order._id,
        refunds: order.refunds || [],
        totalRefunded: order.totalRefunded || 0,
      }))
      .filter((tx) =>
        search
          ? tx.transactionId.toLowerCase().includes(search.toLowerCase())
          : true
      );

    // Find completed refund orders
    const ordersWithRefunds = await Order.find({
      "refunds.0": { $exists: true },
      "refunds.status": { $in: ["Approved", "Refunded", "Partially Refunded"] },
    }).populate("user", "firstname lastname email");

    const refundTransactions = [];
    ordersWithRefunds.forEach((order) => {
      order.refunds.forEach((refund) => {
        if (
          ["Approved", "Refunded", "Partially Refunded"].includes(refund.status)
        ) {
          const tx = {
            transactionId: refund._id.toString(),
            orderId: order._id, // Link to original order
            originalTransactionId:
              order.flutterwaveTransactionId ||
              order.flutterwaveRef ||
              order.orderNumber,
            customer: {
              name: `${order.user.firstname} ${order.user.lastname}`,
              email: order.user.email,
            },
            amount: refund.amount || 0,
            paymentMethod: "flutterwave",
            type: "refund",
            status: refund.status,
            date: refund.processedAt || refund.requestedAt,
            linkedPaymentId:
              order.flutterwaveTransactionId || order.flutterwaveRef,
          };

          // Apply search filter if query is provided
          if (
            !search ||
            tx.transactionId.toLowerCase().includes(search.toLowerCase()) ||
            tx.originalTransactionId
              .toLowerCase()
              .includes(search.toLowerCase())
          ) {
            refundTransactions.push(tx);
          }
        }
      });
    });

    // Combine payments + refunds
    let transactions = [...paymentTransactions, ...refundTransactions];

    // Sort
    transactions.sort((a, b) => {
      if (sortBy === "status") {
        if (sortOrder === "asc") return a.status.localeCompare(b.status);
        return b.status.localeCompare(a.status);
      } else {
        // Default: date
        return sortOrder === "asc"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
    });

    res.status(200).json({
      success: true,
      total: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Transaction fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

// Helper function to determine payment status based on refunds
function getPaymentStatus(order) {
  if (!order.refundStatus && !order.totalRefunded) return "success";

  if (order.refundStatus === "Fully Refunded") return "fully refunded";
  if (order.refundStatus === "Partially Refunded") return "partially refunded";
  if (order.refundStatus === "Refunded") return "refunded";

  // Fallback based on totalRefunded
  if (order.totalRefunded >= order.totalAmount) return "fully refunded";
  if (order.totalRefunded > 0) return "partially refunded";

  return "success";
}