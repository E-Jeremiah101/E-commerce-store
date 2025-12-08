import Order from "../models/order.model.js";

export const getAllTransactions = async (req, res) => {
  try {
    const orders = await Order.find({
      flutterwaveTransactionId: { $exists: true },
      refundStatus: {
        $nin: ["Refunded", "Fully Refunded"],
      },
    })
      .populate("user", "firstname lastname email")
      .select(
        "orderNumber flutterwaveTransactionId flutterwaveRef totalAmount paymentMethod createdAt refundStatus"
      );

    const paymentTransactions = orders.map((order) => ({
      transactionId:
        order.flutterwaveTransactionId ||
        order.flutterwaveRef ||
        order.orderNumber,

      customer: {
        name: `${order.user.firstname} ${order.user.lastname}`,
        email: order.user.email,
      },

      amount: order.totalAmount - (order.totalRefunded || 0),
      paymentMethod: order.paymentMethod?.method || "flutterwave",
      type: "payment",
      status: "success",
      date: order.createdAt,
    }));

  const ordersWithRefunds = await Order.find({
    "refunds.0": { $exists: true },
    "refunds.status": { $in: ["Approved", "Refunded"] }, // Only completed refunds
  }).populate("user", "firstname lastname email");

  const refundTransactions = [];

  ordersWithRefunds.forEach((order) => {
    order.refunds.forEach((refund) => {
      if (["Approved", "Refunded", "Partially Refunded"].includes(refund.status)) {
        refundTransactions.push({
          transactionId: refund._id.toString(),
          customer: {
            name: `${order.user.firstname} ${order.user.lastname}`,
            email: order.user.email,
          },
          amount: refund.amount || 0 ,
          paymentMethod: "flutterwave",
          type: "refund",
          status: refund.status,
          date: refund.processedAt || refund.requestedAt,
        });
      }
    });
  });



    /**
     * ✅ COMBINE & SORT
     */
    const transactions = [...paymentTransactions, ...refundTransactions].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  

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