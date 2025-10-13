import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Visitor from "../models/visitors.model.js"; // ✅ Capitalized and matches your model file

// MAIN FUNCTION: used by your route
export const getAnalytics = async (range = "weekly") => {
  const endDate = new Date();
  const startDate = getStartDate(range, endDate);

  // ✅ Pass startDate and endDate properly
  const analyticsData = await getAnalyticsData(startDate, endDate);
  const salesData = await getSalesDataByRange(range, startDate, endDate);

  return { analyticsData, salesData };
};

// -----------------------------
// Analytics (users, products, revenue, etc)
// -----------------------------
export const getAnalyticsData = async (startDate, endDate) => {
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();
  const deliveredOrders = await Order.countDocuments({ status: "Delivered" });
  const canceledOrders = await Order.countDocuments({ status: "Cancelled" });
  const allOrders = await Order.countDocuments();

  // ✅ Count visitors properly
  const visitors = await Visitor.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });
  

  // ✅ Calculate total sales & revenue
  const salesData = await Order.aggregate([
    {
      $match: {
        status: { $nin: ["Cancelled"] }, // ignore cancelled
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const { totalSales, totalRevenue } = salesData[0] || {
    totalSales: 0,
    totalRevenue: 0,
  };

  return {
    users: totalUsers,
    products: totalProducts,
    totalSales,
    totalRevenue,
    deliveredOrders,
    canceledOrders,
    allOrders,
    visitors,
  };
};

// -----------------------------
// Dynamic Sales Data
// -----------------------------
async function getSalesDataByRange(range, startDate, endDate) {
  const matchStage = {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ["Cancelled"] },
    },
  };

  let groupStage;
  switch (range) {
    case "daily":
    case "weekly":
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      };
      break;
    case "monthly":
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      };
      break;
    case "yearly":
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      };
      break;
    default:
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      };
  }

  const data = await Order.aggregate([
    matchStage,
    groupStage,
    { $sort: { _id: 1 } },
  ]);

  return data.map((item) => ({
    date: item._id,
    sales: item.sales,
    revenue: item.revenue,
  }));
}

// -----------------------------
// Helpers
// -----------------------------
function getStartDate(range, endDate) {
  const startDate = new Date(endDate);
  switch (range) {
    case "daily":
      startDate.setDate(endDate.getDate() - 1);
      break;
    case "weekly":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "monthly":
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case "yearly":
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
  }
  return startDate;
}
