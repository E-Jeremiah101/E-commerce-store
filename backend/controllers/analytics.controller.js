








import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Visitor from "../models/visitors.model.js";

// MAIN FUNCTION
export const getAnalytics = async (range = "weekly") => {
  const endDate = new Date();
  const startDate = getStartDate(range, endDate);

  const analyticsData = await getAnalyticsData(startDate, endDate);
  const salesData = await getSalesDataByRange(range, startDate, endDate);
  const statusCharts = await getStatusTrendsByRange(range, startDate, endDate);
  const visitorsTrend = await Visitor.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const ordersTrend = await Order.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const refundTrend = await Order.aggregate([
    { $unwind: "$refunds" },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$refunds.processedAt" },
        },
        totalRefunds: { $sum: "$refunds.amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);


  return {
    analyticsData,
    salesData,
    statusCharts,
    visitorsTrend,
    ordersTrend,
    refundTrend,
  };
};

// -----------------------------
// MAIN ANALYTIC STATS
// -----------------------------
async function getAnalyticsData(startDate, endDate) {
  const [totalUsers, totalProducts, allOrders, visitors] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments({ status: { $nin: ["Cancelled"] } }),
    Visitor.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
  ]);

  const pendingOrders = await Order.countDocuments({ status: "Pending" });
  const processingOrders = await Order.countDocuments({ status: "Processing" });
  const shippedOrders = await Order.countDocuments({ status: "Shipped" });
  const deliveredOrders = await Order.countDocuments({ status: "Delivered" });
  const canceledOrders = await Order.countDocuments({ status: "Cancelled" });

  const revenue = await Order.aggregate([
    { $match: { status: { $nin: ["Cancelled"] } } },
    {
      $group: {
        _id: null,
        grossRevenue: { $sum: "$totalAmount" },
        totalRefunded: { $sum: { $ifNull: ["$totalRefunded", 0] } },
      },
    },
  ]);

  // Refund counts by status
  const refundStats = await Order.aggregate([
    { $unwind: { path: "$refunds", preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: "$refunds.status", // e.g. "Approved", "Pending", "Declined"
        count: { $sum: 1 },
      },
    },
  ]);

  // Convert refundStats array into easy object
  const refundSummary = {
    Approved: 0,
    Pending: 0,
    Rejected: 0,
  };

  refundStats.forEach((r) => {
    if (refundSummary[r._id] !== undefined) {
      refundSummary[r._id] = r.count;
    }
  });

  const grossRevenue = revenue[0]?.grossRevenue || 0;
  const totalRefunded = revenue[0]?.totalRefunded || 0;
  const netRevenue = grossRevenue - totalRefunded;

  return {
    users: totalUsers,
    products: totalProducts,
    allOrders,
    visitors,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    canceledOrders,
    grossRevenue: grossRevenue,
    totalRefunded: totalRefunded,
    netRevenue: netRevenue,
    refundsApproved: refundSummary.Approved,
    refundsPending: refundSummary.Pending,
    refundsRejected: refundSummary.Rejected,
  };
}

// -----------------------------
// SALES DATA (Main Chart)
// -----------------------------
async function getSalesDataByRange(range, startDate, endDate) {
  const matchStage = {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ["Cancelled"] },
    },
  };

  const groupStage = {
    $group: {
      _id: {
        $dateToString: {
          format:
            range === "yearly"
              ? "%Y"
              : range === "monthly"
              ? "%Y-%m"
              : "%Y-%m-%d",
          date: "$createdAt",
        },
      },
      sales: { $sum: 1 },
      revenue: { $sum: "$totalAmount" },
      refunded: { $sum: { $ifNull: ["$totalRefunded", 0] } },
    },
  };

  const data = await Order.aggregate([
    matchStage,
    groupStage,
    { $sort: { _id: 1 } },
  ]);

  return data.map((item) => ({
    date: item._id,
    sales: item.sales,
    revenue: item.revenue,
    refunded: item.refunded,
    netRevenue: item.revenue - item.refunded,

  }));
}

// -----------------------------
// STATUS CHARTS FOR EACH TYPE
// -----------------------------
async function getStatusTrendsByRange(range, startDate, endDate) {
  const statuses = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
    "visitors",
  ];
  const format =
    range === "yearly" ? "%Y" : range === "monthly" ? "%Y-%m" : "%Y-%m-%d";

  const charts = {};

  for (const status of statuses) {
    const data = await Order.aggregate([
      {
        $match: {
          status,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format, date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    charts[status] = data.map((item) => ({
      date: item._id,
      count: item.count,
    }));
  }

  return charts;
}

// -----------------------------
// RANGE HELPER
// -----------------------------
function getStartDate(range, endDate) {
  const start = new Date(endDate);
  switch (range) {
    case "daily":
      start.setDate(endDate.getDate() - 1);
      break;
    case "weekly":
      start.setDate(endDate.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(endDate.getMonth() - 1);
      break;
    case "yearly":
      start.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      start.setDate(endDate.getDate() - 7);
  }
  return start;
}





















// import Order from "../models/order.model.js";
// import Product from "../models/product.model.js";
// import User from "../models/user.model.js";
// import Visitor from "../models/visitors.model.js";

// // MAIN FUNCTION
// export const getAnalytics = async (range = "weekly") => {
//   const endDate = new Date();
//   const startDate = getStartDate(range, endDate);

//   const analyticsData = await getAnalyticsData(startDate, endDate);
//   const salesData = await getSalesDataByRange(range, startDate, endDate);
//   const statusCharts = await getStatusTrendsByRange(range, startDate, endDate);
//   const visitorsTrend = await Visitor.aggregate([
//     {
//       $group: {
//         _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//         count: { $sum: 1 },
//       },
//     },
//     { $sort: { _id: 1 } },
//   ]);

//   const ordersTrend = await Order.aggregate([
//     {
//       $group: {
//         _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//         count: { $sum: 1 },
//       },
//     },
//     { $sort: { _id: 1 } },
//   ]);


//   return { analyticsData, salesData, statusCharts, visitorsTrend, ordersTrend };
// };

// // -----------------------------
// // MAIN ANALYTIC STATS
// // -----------------------------
// async function getAnalyticsData(startDate, endDate) {
//   const [totalUsers, totalProducts, allOrders, visitors] = await Promise.all([
//     User.countDocuments(),
//     Product.countDocuments(),
//     Order.countDocuments(),
//     Visitor.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
//   ]);

//   const pendingOrders = await Order.countDocuments({ status: "Pending" });
//   const processingOrders = await Order.countDocuments({ status: "Processing" });
//   const shippedOrders = await Order.countDocuments({ status: "Shipped" });
//   const deliveredOrders = await Order.countDocuments({ status: "Delivered" });
//   const canceledOrders = await Order.countDocuments({ status: "Cancelled" });

//   const revenue = await Order.aggregate([
//     { $match: { status: { $nin: ["Cancelled"] } } },
//     {
//       $group: {
//         _id: null,
//         totalRevenue: { $sum: "$totalAmount" },
//       },
//     },
//   ]);

//   return {
//     users: totalUsers,
//     products: totalProducts,
//     allOrders,
//     visitors,
//     pendingOrders,
//     processingOrders,
//     shippedOrders,
//     deliveredOrders,
//     canceledOrders,
//     totalRevenue: revenue[0]?.totalRevenue || 0,
//   };
// }

// // -----------------------------
// // SALES DATA (Main Chart)
// // -----------------------------
// async function getSalesDataByRange(range, startDate, endDate) {
//   const matchStage = {
//     $match: {
//       createdAt: { $gte: startDate, $lte: endDate },
//       status: { $nin: ["Cancelled"] },
//     },
//   };

//   const groupStage = {
//     $group: {
//       _id: {
//         $dateToString: {
//           format:
//             range === "yearly"
//               ? "%Y"
//               : range === "monthly"
//               ? "%Y-%m"
//               : "%Y-%m-%d",
//           date: "$createdAt",
//         },
//       },
//       sales: { $sum: 1 },
//       revenue: { $sum: "$totalAmount" },
//     },
//   };

//   const data = await Order.aggregate([
//     matchStage,
//     groupStage,
//     { $sort: { _id: 1 } },
//   ]);

//   return data.map((item) => ({
//     date: item._id,
//     sales: item.sales,
//     revenue: item.revenue,
//   }));
// }

// // -----------------------------
// // STATUS CHARTS FOR EACH TYPE
// // -----------------------------
// async function getStatusTrendsByRange(range, startDate, endDate) {
//   const statuses = [
//     "Pending",
//     "Processing",
//     "Shipped",
//     "Delivered",
//     "Cancelled",
//     "visitors"
//   ];
//   const format =
//     range === "yearly" ? "%Y" : range === "monthly" ? "%Y-%m" : "%Y-%m-%d";

//   const charts = {};

//   for (const status of statuses) {
//     const data = await Order.aggregate([
//       {
//         $match: {
//           status,
//           createdAt: { $gte: startDate, $lte: endDate },
//         },
//       },
//       {
//         $group: {
//           _id: { $dateToString: { format, date: "$createdAt" } },
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ]);

//     charts[status] = data.map((item) => ({
//       date: item._id,
//       count: item.count,
//     }));
//   }

//   return charts;
// }

// // -----------------------------
// // RANGE HELPER
// // -----------------------------
// function getStartDate(range, endDate) {
//   const start = new Date(endDate);
//   switch (range) {
//     case "daily":
//       start.setDate(endDate.getDate() - 1);
//       break;
//     case "weekly":
//       start.setDate(endDate.getDate() - 7);
//       break;
//     case "monthly":
//       start.setMonth(endDate.getMonth() - 1);
//       break;
//     case "yearly":
//       start.setFullYear(endDate.getFullYear() - 1);
//       break;
//     default:
//       start.setDate(endDate.getDate() - 7);
//   }
//   return start;
// }
