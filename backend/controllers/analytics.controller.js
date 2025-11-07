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
  // visitorsTrend and ordersTrend should respect the selected range (or include all when startDate is null)
  const visitorFormat =
    range === "yearly"
      ? "%Y"
      : range === "monthly"
      ? "%Y-%m"
      : range === "daily"
      ? "%Y-%m-%dT%H"
      : "%Y-%m-%d";
  const visitorsMatch = startDate
    ? { createdAt: { $gte: startDate, $lte: endDate } }
    : {};

  const visitorsTrend = await Visitor.aggregate([
    { $match: visitorsMatch },
    {
      $group: {
        _id: { $dateToString: { format: visitorFormat, date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const usersMatch = startDate
    ? { createdAt: { $gte: startDate, $lte: endDate } }
    : {};

  const usersTrend = await User.aggregate([
    { $match: usersMatch },
    {
      $group: {
        _id: { $dateToString: { format: visitorFormat, date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const ordersMatch = startDate
    ? { createdAt: { $gte: startDate, $lte: endDate } }
    : {};

  const ordersTrend = await Order.aggregate([
    { $match: ordersMatch },
    {
      $group: {
        _id: { $dateToString: { format: visitorFormat, date: "$createdAt" } },
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
    usersTrend,
    ordersTrend,
    refundTrend,
  };
};

// -----------------------------
// MAIN ANALYTIC STATS
// -----------------------------
async function getAnalyticsData(startDate, endDate) {
  const dateFilter = startDate
    ? { createdAt: { $gte: startDate, $lte: endDate } }
    : {};

  const [totalUsers, totalProducts, allOrders, visitors] = await Promise.all([
    User.countDocuments(dateFilter),
    Product.countDocuments(),
    Order.countDocuments({ status: { $nin: ["Cancelled"] } }),
    Visitor.countDocuments(dateFilter),
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
    $match: Object.assign(
      {
        status: { $nin: ["Cancelled"] },
      },
      startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {}
    ),
  };

  // For daily range we need hourly buckets, for others use date/month/year granularity
  const dateFormat =
    range === "yearly"
      ? "%Y"
      : range === "monthly"
      ? "%Y-%m"
      : range === "daily"
      ? "%Y-%m-%dT%H"
      : "%Y-%m-%d";

  const groupStage = {
    $group: {
      _id: {
        $dateToString: {
          format: dateFormat,
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
  ];
  const format =
    range === "yearly"
      ? "%Y"
      : range === "monthly"
      ? "%Y-%m"
      : range === "daily"
      ? "%Y-%m-%dT%H"
      : "%Y-%m-%d";

  const charts = {};

  for (const status of statuses) {
    const match = Object.assign(
      { status },
      startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {}
    );

    const data = await Order.aggregate([
      { $match: match },
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
  // return null when requesting 'all' so callers can omit date filtering
  if (range === "all") return null;

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

// // ===========================================
// // MAIN FUNCTION
// // ===========================================
// export const getAnalytics = async (range = "weekly") => {
//   const endDate = new Date();
//   const startDate = range === "all" ? null : getStartDate(range, endDate);

//   const analyticsData = await getAnalyticsData(startDate, endDate);
//   const salesData = await getSalesDataByRange(range, startDate, endDate);
//   const statusCharts = await getStatusTrendsByRange(range, startDate, endDate);

//   const visitorsTrend = await getVisitorsTrend(range, startDate, endDate);
//   const ordersTrend = await getOrdersTrend(range, startDate, endDate);

//   const refundTrend = await Order.aggregate([
//     { $unwind: "$refunds" },
//     ...(startDate
//       ? [
//           {
//             $match: {
//               "refunds.processedAt": { $gte: startDate, $lte: endDate },
//             },
//           },
//         ]
//       : []),
//     {
//       $group: {
//         _id: {
//           $dateToString: { format: "%Y-%m-%d", date: "$refunds.processedAt" },
//         },
//         totalRefunds: { $sum: "$refunds.amount" },
//         count: { $sum: 1 },
//       },
//     },
//     { $sort: { _id: 1 } },
//   ]);

//   return {
//     analyticsData,
//     salesData,
//     statusCharts,
//     visitorsTrend,
//     ordersTrend,
//     refundTrend,
//   };
// };

// // ===========================================
// // MAIN ANALYTIC STATS
// // ===========================================
// async function getAnalyticsData(startDate, endDate) {
//   const dateFilter = startDate
//     ? { createdAt: { $gte: startDate, $lte: endDate } }
//     : {};

//   const [totalUsers, totalProducts, allOrders, visitors] = await Promise.all([
//     User.countDocuments(),
//     Product.countDocuments(),
//     Order.countDocuments({ status: { $nin: ["Cancelled"] } }),
//     Visitor.countDocuments(dateFilter),
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
//         grossRevenue: { $sum: "$totalAmount" },
//         totalRefunded: { $sum: { $ifNull: ["$totalRefunded", 0] } },
//       },
//     },
//   ]);

//   const refundStats = await Order.aggregate([
//     { $unwind: { path: "$refunds", preserveNullAndEmptyArrays: false } },
//     {
//       $group: {
//         _id: "$refunds.status",
//         count: { $sum: 1 },
//       },
//     },
//   ]);

//   const refundSummary = {
//     Approved: 0,
//     Pending: 0,
//     Rejected: 0,
//   };
//   refundStats.forEach((r) => {
//     if (refundSummary[r._id] !== undefined) refundSummary[r._id] = r.count;
//   });

//   const grossRevenue = revenue[0]?.grossRevenue || 0;
//   const totalRefunded = revenue[0]?.totalRefunded || 0;
//   const netRevenue = grossRevenue - totalRefunded;

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
//     grossRevenue,
//     totalRefunded,
//     netRevenue,
//     refundsApproved: refundSummary.Approved,
//     refundsPending: refundSummary.Pending,
//     refundsRejected: refundSummary.Rejected,
//   };
// }

// // ===========================================
// // SALES DATA (Main Chart)
// // ===========================================
// async function getSalesDataByRange(range, startDate, endDate) {
//   const matchStage = {
//     $match: {
//       ...(startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {}),
//       status: { $nin: ["Cancelled"] },
//     },
//   };

//   let pipeline;

//   if (range === "weekly") {
//     // --- Weekly (Monday–Sunday ISO weeks) ---
//     pipeline = [
//       matchStage,
//       {
//         $group: {
//           _id: {
//             $dateToString: { format: "%G-%V", date: "$createdAt" }, // ISO week
//           },
//           sales: { $sum: 1 },
//           revenue: { $sum: "$totalAmount" },
//         },
//       },
//       {
//         $addFields: {
//           weekStart: {
//             $dateFromParts: {
//               isoWeekYear: {
//                 $toInt: { $arrayElemAt: [{ $split: ["$_id", "-"] }, 0] },
//               },
//               isoWeek: {
//                 $toInt: { $arrayElemAt: [{ $split: ["$_id", "-"] }, 1] },
//               },
//             },
//           },
//         },
//       },
//       {
//         $addFields: {
//           label: {
//             $dateToString: { format: "%b %d", date: "$weekStart" },
//           },
//         },
//       },
//       { $sort: { weekStart: 1 } },
//     ];
//   } else {
//     const format =
//       range === "daily"
//         ? "%Y-%m-%d"
//         : range === "monthly"
//         ? "%Y-%m"
//         : range === "yearly"
//         ? "%Y"
//         : "%Y-%m-%d";

//     pipeline = [
//       matchStage,
//       {
//         $group: {
//           _id: { $dateToString: { format, date: "$createdAt" } },
//           sales: { $sum: 1 },
//           revenue: { $sum: "$totalAmount" },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ];
//   }

//   const data = await Order.aggregate(pipeline);

//   return data.map((item) => ({
//     date: item.label || item._id,
//     sales: item.sales,
//     revenue: item.revenue,
//   }));
// }

// // ===========================================
// // STATUS CHARTS (Weekly Monday–Sunday)
// // ===========================================
// async function getStatusTrendsByRange(range, startDate, endDate) {
//   const statuses = [
//     "Pending",
//     "Processing",
//     "Shipped",
//     "Delivered",
//     "Cancelled",
//   ];

//   const charts = {};

//   for (const status of statuses) {
//     let pipeline = [];

//     if (range === "weekly") {
//       pipeline = [
//         {
//           $match: {
//             status,
//             createdAt: { $gte: startDate, $lte: endDate },
//           },
//         },
//         {
//           $group: {
//             _id: { $dateToString: { format: "%G-%V", date: "$createdAt" } },
//             count: { $sum: 1 },
//           },
//         },
//         {
//           $addFields: {
//             weekStart: {
//               $dateFromParts: {
//                 isoWeekYear: {
//                   $toInt: { $arrayElemAt: [{ $split: ["$_id", "-"] }, 0] },
//                 },
//                 isoWeek: {
//                   $toInt: { $arrayElemAt: [{ $split: ["$_id", "-"] }, 1] },
//                 },
//               },
//             },
//           },
//         },
//         {
//           $addFields: {
//             label: {
//               $dateToString: { format: "%b %d", date: "$weekStart" },
//             },
//           },
//         },
//         { $sort: { weekStart: 1 } },
//       ];
//     } else {
//       const format =
//         range === "yearly" ? "%Y" : range === "monthly" ? "%Y-%m" : "%Y-%m-%d";

//       pipeline = [
//         {
//           $match: {
//             status,
//             ...(startDate
//               ? { createdAt: { $gte: startDate, $lte: endDate } }
//               : {}),
//           },
//         },
//         {
//           $group: {
//             _id: { $dateToString: { format, date: "$createdAt" } },
//             count: { $sum: 1 },
//           },
//         },
//         { $sort: { _id: 1 } },
//       ];
//     }

//     const data = await Order.aggregate(pipeline);
//     charts[status] = data.map((item) => ({
//       date: item.label || item._id,
//       count: item.count,
//     }));
//   }

//   return charts;
// }

// // ===========================================
// // VISITORS TREND (Weekly Monday–Sunday)
// // ===========================================
// async function getVisitorsTrend(range, startDate, endDate) {
//   if (range === "weekly") {
//     return await Visitor.aggregate([
//       { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
//       {
//         $group: {
//           _id: { $dateToString: { format: "%G-%V", date: "$createdAt" } },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $addFields: {
//           weekStart: {
//             $dateFromParts: {
//               isoWeekYear: {
//                 $toInt: { $arrayElemAt: [{ $split: ["$_id", "-"] }, 0] },
//               },
//               isoWeek: {
//                 $toInt: { $arrayElemAt: [{ $split: ["$_id", "-"] }, 1] },
//               },
//             },
//           },
//         },
//       },
//       {
//         $addFields: {
//           label: { $dateToString: { format: "%b %d", date: "$weekStart" } },
//         },
//       },
//       { $sort: { weekStart: 1 } },
//     ]);
//   }

//   const format =
//     range === "yearly" ? "%Y" : range === "monthly" ? "%Y-%m" : "%Y-%m-%d";

//   return await Visitor.aggregate([
//     {
//       $match: startDate
//         ? { createdAt: { $gte: startDate, $lte: endDate } }
//         : {},
//     },
//     {
//       $group: {
//         _id: { $dateToString: { format, date: "$createdAt" } },
//         count: { $sum: 1 },
//       },
//     },
//     { $sort: { _id: 1 } },
//   ]);
// }

// // ===========================================
// // ORDERS TREND (Weekly Monday–Sunday)
// // ===========================================
// async function getOrdersTrend(range, startDate, endDate) {
//   if (range === "weekly") {
//     return await Order.aggregate([
//       { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
//       {
//         $group: {
//           _id: { $dateToString: { format: "%G-%V", date: "$createdAt" } },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $addFields: {
//           weekStart: {
//             $dateFromParts: {
//               isoWeekYear: {
//                 $toInt: { $arrayElemAt: [{ $split: ["$_id", "-"] }, 0] },
//               },
//               isoWeek: {
//                 $toInt: { $arrayElemAt: [{ $split: ["$_id", "-"] }, 1] },
//               },
//             },
//           },
//         },
//       },
//       {
//         $addFields: {
//           label: { $dateToString: { format: "%b %d", date: "$weekStart" } },
//         },
//       },
//       { $sort: { weekStart: 1 } },
//     ]);
//   }

//   const format =
//     range === "yearly" ? "%Y" : range === "monthly" ? "%Y-%m" : "%Y-%m-%d";

//   return await Order.aggregate([
//     {
//       $match: startDate
//         ? { createdAt: { $gte: startDate, $lte: endDate } }
//         : {},
//     },
//     {
//       $group: {
//         _id: { $dateToString: { format, date: "$createdAt" } },
//         count: { $sum: 1 },
//       },
//     },
//     { $sort: { _id: 1 } },
//   ]);
// }

// // ===========================================
// // RANGE HELPER
// // ===========================================
// function getStartDate(range, endDate) {
//   const start = new Date(endDate);
//   switch (range) {
//     case "daily":
//       start.setHours(endDate.getHours() - 24);
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
