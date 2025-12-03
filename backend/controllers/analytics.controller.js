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
  const topProducts = await getTopSellingProducts(5, startDate, endDate);
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
    topProducts,
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



// Add this function after getStatusTrendsByRange function
// Replace your current getTopSellingProducts function with this:
async function getTopSellingProducts(limit = 5, startDate, endDate) {
  try {
    console.log("🔍 Getting top selling products...");
    
    const matchStage = {
      status: { $nin: ["Cancelled"] },
      ...(startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {})
    };

    console.log("📊 Match stage:", matchStage);
    
    const topProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          productId: { $first: "$products.product" },
          name: { $first: "$products.name" },
          totalSold: { $sum: "$products.quantity" },
          totalRevenue: { 
            $sum: { 
              $multiply: ["$products.price", "$products.quantity"] 
            } 
          },
          orderCount: { $sum: 1 }
        }
      },
      { $match: { totalSold: { $gt: 0 } } }, // Only products that were sold
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          productId: 1,
          name: { $ifNull: ["$productDetails.name", "$name"] },
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1,
          image: { $ifNull: ["$productDetails.images.0", "$products.image"] }
        }
      }
    ]);

    console.log("✅ Found top products:", topProducts.length);
    console.log("📦 Top products data:", JSON.stringify(topProducts, null, 2));
    
    return topProducts;
  } catch (error) {
    console.error("❌ Error getting top selling products:", error);
    console.error("Error stack:", error.stack);
    return []; // Return empty array on error
  }
}

// OR if you want to fetch directly from Product model with order counts:
async function getTopSellingProductsAlt(limit = 5, startDate, endDate) {
  const dateFilter = startDate ? { 
    createdAt: { $gte: startDate, $lte: endDate } 
  } : {};

  const topProducts = await Product.aggregate([
    {
      $lookup: {
        from: "orderitems", // or "orders" if you have different structure
        localField: "_id",
        foreignField: "items.productId",
        pipeline: [
          {
            $lookup: {
              from: "orders",
              localField: "orderId",
              foreignField: "_id",
              as: "order"
            }
          },
          { $unwind: "$order" },
          { $match: { "order.status": { $nin: ["Cancelled"] }, ...dateFilter } }
        ],
        as: "orderItems"
      }
    },
    {
      $addFields: {
        totalSold: { $sum: "$orderItems.quantity" },
        totalRevenue: { 
          $sum: { 
            $multiply: ["$orderItems.price", "$orderItems.quantity"] 
          } 
        }
      }
    },
    { $match: { totalSold: { $gt: 0 } } },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        images: 1,
        sku: 1,
        totalSold: 1,
        totalRevenue: 1
      }
    }
  ]);

  return topProducts;
}