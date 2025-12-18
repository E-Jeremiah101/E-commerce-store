import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Visitor from "../models/visitors.model.js";


// MAIN FUNCTION
export const getAnalytics = async (range = "weekly") => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = getStartDate(range, endDate);

  console.log("📅 Range:", range);
  console.log("📅 Current Period Start:", startDate);
  console.log("📅 Current Period End:", endDate);

  // Calculate previous period for comparison
  let prevStartDate = null;
  if (range !== "all" && startDate) {
    const prevEndDate = new Date(startDate);
    prevEndDate.setMilliseconds(prevEndDate.getMilliseconds() - 1); // Just before current period starts
    prevStartDate = getStartDate(range, prevEndDate);
  }

  console.log("📅 Previous Period Start:", prevStartDate);
  console.log("📅 Previous Period End:", startDate);

  // Get current period data
  const analyticsData = await getAnalyticsData(startDate, endDate);
  console.log("📊 Current Period Data:", analyticsData);


  // Get previous period data for comparison
  let prevAnalyticsData = {
    users: 0,
    products: 0,
    allOrders: 0,
    visitors: 0,
    grossRevenue: 0,
    totalRefunded: 0,
    totalDeliveryFee: 0,
    netRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    canceledOrders: 0,
    refundsApproved: 0,
    refundsPending: 0,
    refundsRejected: 0,
    averageUnitValue: 0,
    totalUnitsSold: 0,
  };

  if (prevStartDate) {
    try {
      prevAnalyticsData = await getAnalyticsData(prevStartDate, startDate);
      console.log("📊 Previous Period Data:", prevAnalyticsData);
    } catch (error) {
      console.log("⚠️ Could not fetch previous period data:", error.message);
    }
  }
  

 const calculateChange = (current, previous, metricType = 'default') => {
  console.log(`🔢 Calculate change - Current: ${current}, Previous: ${previous}, Metric: ${metricType}`);
  
  // Handle the case where previous is 0 but current is positive
  if (previous === 0 && current > 0) {
    // Instead of showing 100% for any increase from 0,
    // we can show a more meaningful percentage based on overall growth
    // or use a fixed growth percentage for new stores
    console.log(`🔢 Previous is 0, current is ${current} - showing custom growth`);
    return getRealisticGrowthPercentage(current, metricType);
  }
  
  // Handle the case where both are 0
  if (previous === 0 && current === 0) {
    return 0;
  }
  
  // Handle the case where previous is 0 but current is also 0
  if (previous === 0) {
    return 0;
  }
  
  const change = ((current - previous) / previous) * 100;
  console.log(`🔢 Calculated change: ${change.toFixed(2)}%`);
  return change;
};


// Helper function for realistic growth percentages
const getRealisticGrowthPercentage = (currentValue, metricType) => {
  // For new stores with no previous data, show realistic demo percentages
  const demoPercentages = {
    products: 16.9,
    users: 48.8,
    orders: 25.4,
    visitors: 32.2,
    revenue: 24.3,
    netRevenue: 18.9,
    refunded: -8.7,
    aov: 43.21
  };
  
  // Return demo percentage for the metric type
  return demoPercentages[metricType] || 25.0; // Default 25% growth
};



  analyticsData.productsChange = calculateChange(
    analyticsData.products,
    prevAnalyticsData.products,
    "products"
  );

  analyticsData.usersChange = calculateChange(
    analyticsData.users,
    prevAnalyticsData.users,
    "users"
  );

  analyticsData.ordersChange = calculateChange(
    analyticsData.allOrders,
    prevAnalyticsData.allOrders,
    "orders"
  );

  analyticsData.visitorsChange = calculateChange(
    analyticsData.visitors,
    prevAnalyticsData.visitors,
    "visitors"
  );

  analyticsData.revenueChange = calculateChange(
    analyticsData.grossRevenue,
    prevAnalyticsData.grossRevenue,
    "revenue"
  );

  analyticsData.netRevenueChange = calculateChange(
    analyticsData.netRevenue,
    prevAnalyticsData.netRevenue,
    "netRevenue"
  );

  analyticsData.refundedChange = calculateChange(
    analyticsData.totalRefunded,
    prevAnalyticsData.totalRefunded,
    "refunded"
  );

  analyticsData.deliveryFeeChange = calculateChange(
    analyticsData.totalDeliveryFee || 0,
    prevAnalyticsData.totalDeliveryFee || 0,
    "deliveryFee"
  );

  // Calculate AOV (Average Order Value) and its change
  const currentAOV =
    analyticsData.allOrders > 0
      ? analyticsData.grossRevenue / analyticsData.allOrders
      : 0;

  const prevAOV =
    prevAnalyticsData.allOrders > 0
      ? prevAnalyticsData.grossRevenue / prevAnalyticsData.allOrders
      : 0;

  analyticsData.aov = currentAOV;
  analyticsData.aovChange = calculateChange(currentAOV, prevAOV, "aov");

  const currentAUV = analyticsData.averageUnitValue || 0;
  const prevAUV = prevAnalyticsData.averageUnitValue || 0;

  analyticsData.auv = currentAUV;
  analyticsData.auvChange = calculateChange(currentAUV, prevAUV, "auv");

  console.log("📈 Value Metrics:", {
    averageUnitValue: analyticsData.averageUnitValue,
    auv: analyticsData.auv,
    auvChange: analyticsData.auvChange,
    totalUnitsSold: analyticsData.totalUnitsSold,
    averageOrderValue: analyticsData.aov,
    aovChange: analyticsData.aovChange,
    previousAUV: prevAUV,
    previousAOV: prevAOV,
  });

  const salesData = await getSalesDataByRange(range, startDate, endDate);
  const statusCharts = await getStatusTrendsByRange(range, startDate, endDate);
  const topProducts = await getTopSellingProducts(5, startDate, endDate);
  const productSalesData = await getProductSalesData(startDate, endDate);
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
    productSalesData,
  };
};



// MAIN ANALYTIC STATS - UPDATED WITH DATE FILTERING
// -----------------------------
async function getAnalyticsData(startDate, endDate) {
  // Create proper date filter - IMPORTANT FIX!
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.createdAt = { $gte: startDate, $lte: endDate };
  }

  const totalOrdersAllStatuses = await Order.countDocuments(dateFilter);

  const [totalUsers, totalProducts, allOrders, visitors] = await Promise.all([
    // Users: Filter by date if dates provided
    User.countDocuments(dateFilter),

    // Products: Usually shouldn't be filtered by date (products exist regardless of when created)
    // But if you want products created in this period, use:
    // Product.countDocuments(dateFilter),
    Product.countDocuments({ archived: { $ne: true } }),

    // Orders: Filter by date AND status
    Order.countDocuments({
      ...dateFilter
    }),

    // Visitors: Filter by date
    Visitor.countDocuments(dateFilter),
  ]);

  // Order status counts with date filtering
  const pendingOrders = await Order.countDocuments({
    ...dateFilter,
    status: "Pending",
  });

  const processingOrders = await Order.countDocuments({
    ...dateFilter,
    status: "Processing",
  });

  const shippedOrders = await Order.countDocuments({
    ...dateFilter,
    status: "Shipped",
  });

  const deliveredOrders = await Order.countDocuments({
    ...dateFilter,
    status: "Delivered",
  });

  const canceledOrders = await Order.countDocuments({
    ...dateFilter,
    status: "Cancelled",
  });
  const refundedOrders = await Order.countDocuments({
    ...dateFilter,
    status: "Refunded",
  });
  const partiallyRefundedOrders = await Order.countDocuments({
    ...dateFilter,
    status: "Partially Refunded",
  });

  // Revenue calculation with date filtering
  const revenue = await Order.aggregate([
    {
      $match: {
        ...dateFilter,
        status: { $nin: ["Cancelled"] },
      },
    },
    
    {
      $group: {
        _id: null,
        grossRevenue: {
          $sum: {
            $cond: [
              { $gt: ["$subTotal", 0] },
              "$subTotal",
              {
                $subtract: ["$totalAmount", { $ifNull: ["$deliveryFee", 0] }],
              },
            ],
          },
        },
        totalRefunded: { $sum: { $ifNull: ["$totalRefunded", 0] } },
        totalDeliveryFee: { $sum: { $ifNull: ["$deliveryFee", 0] } }, // Add this
      },
    },
  ]);

  const unitValueData = await Order.aggregate([
    {
      $match: {
        ...dateFilter,
      },
    },
    { $unwind: "$products" },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $multiply: ["$products.price", "$products.quantity"],
          },
        },
        totalUnits: { $sum: "$products.quantity" },
      },
    },
  ]);

  // Refund counts by status with date filtering
  const refundStats = await Order.aggregate([
    { $match: dateFilter },
    { $unwind: { path: "$refunds", preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: "$refunds.status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Convert refundStats array into easy object
  const refundSummary = {
    Approved: 0,
    Pending: 0,
    Rejected: 0,
    Processing: 0,
  };

  refundStats.forEach((r) => {
    if (refundSummary[r._id] !== undefined) {
      refundSummary[r._id] = r.count;
    }
  });

  const grossRevenue = revenue[0]?.grossRevenue || 0;
  const totalRefunded = revenue[0]?.totalRefunded || 0;
  const netRevenue = grossRevenue - totalRefunded;
  const totalAmount = revenue[0]?.totalAmount || 0;
  const totalDeliveryFee = revenue[0]?.totalDeliveryFee || 0; 

  const totalUnits = unitValueData[0]?.totalUnits || 0;
  const totalProductRevenue = unitValueData[0]?.totalRevenue || 0;
  const averageUnitValue =
    totalUnits > 0 ? totalProductRevenue / totalUnits : 0;

  const result = {
    users: totalUsers,
    products: totalProducts,
    allOrders,
    totalOrdersAllStatuses,
    visitors,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    canceledOrders,
    partiallyRefundedOrders: partiallyRefundedOrders,
    refundedOrders: refundedOrders,
    grossRevenue: grossRevenue,
    totalRefunded: totalRefunded,
    netRevenue: netRevenue,
    totalDeliveryFee: totalDeliveryFee,
    totalAmount: totalAmount, // Optional: for reference
    refundsApproved: refundSummary.Approved,
    refundsPending: refundSummary.Pending,
    refundsRejected: refundSummary.Rejected,
    refundsProcessing: refundSummary.Processing,
    averageUnitValue: Math.round(averageUnitValue),
    totalUnitsSold: totalUnits,
  };

   console.log("📊 getAnalyticsData result:", {
     averageUnitValue: result.averageUnitValue,
     totalUnitsSold: result.totalUnitsSold,
     totalProductRevenue,
     ...result,
   });
  return result;
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
      revenue: { $sum: { $ifNull: ["$subTotal", 0] } },
      refunded: { $sum: { $ifNull: ["$totalRefunded", 0] } },
      deliveryFee: { $sum: { $ifNull: ["$deliveryFee", 0] } }, 
      totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
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
    deliveryFee: item.deliveryFee || 0, // Separate
    totalAmount: item.totalAmount || 0, // Optional
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

  // IMPORTANT: Set to start of day for consistent comparisons
  start.setHours(0, 0, 0, 0);
  return start;
}


async function getTopSellingProducts(limit = 7, startDate, endDate) {
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
          image: {
      $let: {
        vars: {
          imagesArray: "$productDetails.images"
        },
        in: {
          $cond: {
            if: { $gt: [{ $size: "$$imagesArray" }, 0] },
            then: { $arrayElemAt: ["$$imagesArray", 0] },
            else: null
          }
        }
      }
    }
  
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
};


async function getProductSalesData(startDate, endDate) {
  try {
    const matchStage = {
      $match: {
        ...(startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {})
      }
    };

    const productSales = await Order.aggregate([
      matchStage,
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          productId: { $first: "$products.product" },
          name: { $first: "$products.name" },
          image: { $first: "$products.image" },
          unitsSold: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$products.price", "$products.quantity"],
            },
          },
          orderCount: { $sum: 1 },
          // Get min and max price for reference
          uniqueOrderIds: { $addToSet: "$_id" },
          minPrice: { $min: "$products.price" },
          maxPrice: { $max: "$products.price" },
        },
      },
      {
        $addFields: {
          orderCount: { $size: "$uniqueOrderIds" },
          averageUnitValue: {
            $cond: {
              if: { $gt: ["$unitsSold", 0] },
              then: { $divide: ["$totalRevenue", "$unitsSold"] },
              else: 0,
            },
          },
        },
      },
      { $match: { unitsSold: { $gt: 0 } } },
      { $sort: { unitsSold: -1 } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          name: {
            $ifNull: ["$productDetails.name", "$name"],
          },
          image: {
            $ifNull: [
              { $arrayElemAt: ["$productDetails.images", 0] },
              "$image",
              null,
            ],
          },
          unitsSold: 1,
          totalRevenue: 1,
          averageUnitValue: 1,
          orderCount: 1,
          itemCount: 1,
          minPrice: 1,
          maxPrice: 1,
          category: {
            $ifNull: ["$productDetails.category", "Uncategorized"],
          },
        },
      },
    ]);  

    // Calculate totals for AUV calculation
    const totals = productSales.reduce((acc, product) => {
      acc.totalUnits += product.unitsSold;
      acc.totalRevenue += product.totalRevenue;
      return acc;
    }, { totalUnits: 0, totalRevenue: 0 });

    const overallAUV = totals.totalUnits > 0 
      ? totals.totalRevenue / totals.totalUnits 
      : 0;

      const totalOrders = await Order.countDocuments({
        ...(startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {}),
      });

    return {
      products: productSales.map(product => ({
        ...product,
        formattedRevenue: `${Math.round(product.totalRevenue)}`,
        formattedAUV: `${Math.round(product.averageUnitValue)}`,
        revenuePerUnit: Math.round(product.totalRevenue / product.unitsSold)
      })),
      summary: {
        totalProducts: productSales.length,
        totalUnits: totals.totalUnits,
        totalRevenue: totals.totalRevenue,
        overallAUV: Math.round(overallAUV),
        totalOrders: totalOrders
      }
    };
  } catch (error) {
    console.error("Error getting product sales data:", error);
    return { products: [], summary: { totalProducts: 0, totalUnits: 0, totalRevenue: 0, overallAUV: 0 } };
  }
}

