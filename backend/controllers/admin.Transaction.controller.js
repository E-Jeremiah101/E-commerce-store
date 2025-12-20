import Order from "../models/order.model.js";

export const getAllTransactions = async (req, res) => {
  try {
    const { search = "", sortBy = "date", sortOrder = "desc" } = req.query;

    // Find payment orders
    const orders = await Order.find({
      flutterwaveTransactionId: { $exists: true },
      refundStatus: { $nin: ["Refunded", "Fully Refunded"] },
    })
      .populate("user", "firstname lastname email")
      .select(
        "orderNumber flutterwaveTransactionId flutterwaveRef totalAmount paymentMethod createdAt refundStatus"
      );

    const paymentTransactions = orders
      .map((order) => ({
        transactionId:
          order.flutterwaveTransactionId ||
          order.flutterwaveRef ||
          order.orderNumber,
        customer: {
          name: `${order.user.firstname} ${order.user.lastname }`,
          email: order.user.email,
        },
        amount: order.totalAmount - (order.totalRefunded || 0),
        paymentMethod: order.paymentMethod?.method || "flutterwave",
        type: "payment",
        status: "success", 
        date: order.createdAt,
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
            customer: {
              name: `${order.user.firstname} ${order.user.lastname}`,
              email: order.user.email,
            },
            amount: refund.amount || 0,
            paymentMethod: "flutterwave",
            type: "refund",
            status: refund.status,
            date: refund.processedAt || refund.requestedAt,
          };

          // Apply search filter if query is provided
          if (
            !search ||
            tx.transactionId.toLowerCase().includes(search.toLowerCase())
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
