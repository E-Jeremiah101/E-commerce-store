import Order from "../models/order.model.js";

export const getAllTransactions = async (req, res) => {
  try {
    const { search = "", sortBy = "date", sortOrder = "desc" } = req.query;

    // Find ALL payment orders (including refunded ones)
    const orders = await Order.find({
      $or: [
        { flutterwaveTransactionId: { $exists: true, $ne: null } },
        { flutterwaveRef: { $exists: true, $ne: null } },
      ],
    })
      .populate("user", "firstname lastname email")
      .select(
        "orderNumber flutterwaveTransactionId flutterwaveRef totalAmount paymentMethod createdAt refundStatus refunds totalRefunded"
      );

    const paymentTransactions = orders
      .map((order) => {
        // Get the main transaction ID (prefer flutterwaveTransactionId)
        const transactionId =
          order.flutterwaveTransactionId ||
          order.flutterwaveRef ||
          order.orderNumber;

        // Calculate refund status based on refundStatus field and refunds array
        let status = "success";
        if (order.refundStatus === "Fully Refunded") {
          status = "fully refunded";
        } else if (order.refundStatus === "Refunded") {
          status = "refunded";
        } else if (order.refundStatus === "Partially Refunded") {
          status = "partially refunded";
        } else if (
          order.refundStatus === "Partial Refund Requested" ||
          order.refundStatus === "Full Refund Requested"
        ) {
          status = "pending";
        } else if (order.refundStatus === "No Refund") {
          status = "success";
        }

        return {
          transactionId,
          orderId: order._id,
          orderNumber: order.orderNumber,
          customer: {
            name: `${order.user?.firstname || ""} ${
              order.user?.lastname || ""
            }`.trim(),
            email: order.user?.email || "",
          },
          amount: order.totalAmount || 0,
          netAmount: order.totalAmount - (order.totalRefunded || 0),
          paymentMethod: order.paymentMethod?.method || "flutterwave",
          type: "payment",
          status: status,
          date: order.createdAt,
          originalOrder: order._id,
          refunds: order.refunds || [],
          totalRefunded: order.totalRefunded || 0,
          refundStatus: order.refundStatus || "No Refund",
        };
      })
      .filter((tx) =>
        search
          ? tx.transactionId.toLowerCase().includes(search.toLowerCase()) ||
            tx.orderNumber.toLowerCase().includes(search.toLowerCase())
          : true
      );

    // Find completed refund orders
    const ordersWithRefunds = await Order.find({
      "refunds.0": { $exists: true },
      "refunds.status": { $in: ["Approved", "Processing"] },
    }).populate("user", "firstname lastname email");

    const refundTransactions = [];
    ordersWithRefunds.forEach((order) => {
      order.refunds.forEach((refund) => {
        // Only include approved or processing refunds
        if (["Approved", "Processing"].includes(refund.status)) {
          const refundStatus =
            refund.status === "Approved" ? "refunded" : "processing";

          const tx = {
            transactionId: refund._id.toString(),
            orderId: order._id,
            orderNumber: order.orderNumber,
            originalTransactionId:
              order.flutterwaveTransactionId ||
              order.flutterwaveRef ||
              order.orderNumber,
            customer: {
              name: `${order.user?.firstname || ""} ${
                order.user?.lastname || ""
              }`.trim(),
              email: order.user?.email || "",
            },
            amount: refund.amount || 0,
            paymentMethod: "flutterwave",
            type: "refund",
            status: refundStatus,
            date: refund.processedAt || refund.requestedAt || order.createdAt,
            linkedPaymentId:
              order.flutterwaveTransactionId || order.flutterwaveRef,
            refundDetails: {
              reason: refund.reason,
              productName: refund.productSnapshot?.name,
              quantity: refund.quantity,
            },
          };

          // Apply search filter
          if (
            !search ||
            tx.transactionId.toLowerCase().includes(search.toLowerCase()) ||
            tx.originalTransactionId
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            tx.orderNumber.toLowerCase().includes(search.toLowerCase())
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
      } else if (sortBy === "amount") {
        if (sortOrder === "asc") return (a.amount || 0) - (b.amount || 0);
        return (b.amount || 0) - (a.amount || 0);
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
