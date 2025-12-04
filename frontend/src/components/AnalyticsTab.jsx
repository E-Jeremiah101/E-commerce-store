import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";
import {
  Users,
  ShoppingCart,
  Package,
  XCircle,
  CheckCircle,
  DollarSign,
  Hourglass,
  Truck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

const AnalyticsTab = () => {
  const [analyticsData, setAnalyticsData] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [statusCharts, setStatusCharts] = useState({});
  const [visitorsCharts, setVisitorsCharts] = useState({});
  const [usersCharts, setUsersCharts] = useState([]);
  const [ordersCharts, setOrdersCharts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [selectedRange, setSelectedRange] = useState("weekly");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUserStore();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`/analytics?range=${selectedRange}`);

        // DEBUG: Check what percentage changes are coming from API
        console.log("📊 API Response analyticsData:", res.data.analyticsData);
        console.log("📈 Percentage Changes from API:", {
          productsChange: res.data.analyticsData?.productsChange,
          usersChange: res.data.analyticsData?.usersChange,
          ordersChange: res.data.analyticsData?.ordersChange,
          visitorsChange: res.data.analyticsData?.visitorsChange,
          aovChange: res.data.analyticsData?.aovChange,
        });

        const {
          analyticsData,
          salesData,
          statusCharts,
          topProducts = [], // Default to empty array
          ordersTrend,
          visitorsTrend,
          usersTrend,
        } = res.data;

        setAnalyticsData(analyticsData);

        // Handle top products with better error handling
        if (
          topProducts &&
          Array.isArray(topProducts) &&
          topProducts.length > 0
        ) {
          console.log("✅ Found top products from API:", topProducts.length);
          const processedProducts = topProducts.map((product, index) => ({
            id:
              product._id ||
              product.productId ||
              product.id ||
              `product-${index}`,
            name: product.name || product.productName || `Product ${index + 1}`,
            sales: product.totalSold || product.sales || product.quantity || 0,
            revenue: product.totalRevenue || 0,
            image: product.image || product.images?.[0] || null,
          }));
          setTopProducts(processedProducts);
        } else {
          console.log("⚠️ No top products from API, using fallback data");
          // Fallback dummy data
          setTopProducts([
            { name: "Selecter Vento", id: "2444300", sales: 128 },
            { name: "Blue backpack", id: "241518", sales: 401 },
            { name: "Water Bottle", id: "249876", sales: 287 },
          ]);
        }

        // Process sales data
        const mappedSales = salesData.map((d) => ({
          rawDate: d.date,
          name: formatDateLabel(d.date, selectedRange),
          sales: Number(d.sales) || 0,
          revenue: Number(d.revenue) || 0,
        }));
        setSalesData(mappedSales);

        const labels = mappedSales.map((s) => s.name);
        setAnalyticsData((prev) => ({
          ...prev,
          visitorsTrend,
          ordersTrend,
          usersTrend,
        }));

        // Process status charts
        const normalizedStatus = Object.fromEntries(
          Object.entries(statusCharts || {}).map(([key, data]) => {
            const mapByName = new Map(
              (data || []).map((d) => [
                formatDateLabel(d.date, selectedRange),
                d.count,
              ])
            );
            const filled = labels.map((name) => ({
              name,
              count: Number(mapByName.get(name) || 0),
            }));
            return [key, filled];
          })
        );
        setStatusCharts(normalizedStatus);

        // Process visitors data
        const visitorsMap = new Map(
          (visitorsTrend || []).map((d) => [d._id || d.date || d, d.count])
        );
        const usersMap = new Map(
          (usersTrend || []).map((d) => [d._id || d.date || d, d.count])
        );
        const ordersMap = new Map(
          (ordersTrend || []).map((d) => [d._id || d.date || d, d.count])
        );

        const filledVisitors = labels.length
          ? labels.map((name, idx) => {
              const raw = mappedSales[idx]?.rawDate;
              const val = visitorsMap.get(raw) ?? visitorsMap.get(name) ?? 0;
              return { name, count: Number(val) };
            })
          : (visitorsTrend || []).map((d) => ({
              name: formatDateLabel(d._id || d.date || d, selectedRange),
              count: d.count || 0,
            }));

        const filledOrders = labels.length
          ? labels.map((name, idx) => {
              const raw = mappedSales[idx]?.rawDate;
              const val = ordersMap.get(raw) ?? ordersMap.get(name) ?? 0;
              return { name, count: Number(val) };
            })
          : (ordersTrend || []).map((d) => ({
              name: formatDateLabel(d._id || d.date || d, selectedRange),
              count: d.count || 0,
            }));

        setVisitorsCharts(filledVisitors);

        // Process users data
        const filledUsers = labels.length
          ? labels.map((name, idx) => {
              const raw = mappedSales[idx]?.rawDate;
              const val = usersMap.get(raw) ?? usersMap.get(name) ?? 0;
              return { name, count: Number(val) };
            })
          : (usersTrend || []).map((d) => ({
              name: formatDateLabel(d._id || d.date || d, selectedRange),
              count: d.count || 0,
            }));

        setUsersCharts(filledUsers);
        setOrdersCharts(filledOrders);
      } catch (err) {
        console.error("❌ Error fetching analytics:", err);
        // Set fallback data on error
        setTopProducts([
          { name: "Selecter Vento", id: "2444300", sales: 128 },
          { name: "Blue backpack", id: "241518", sales: 401 },
          { name: "Water Bottle", id: "249876", sales: 287 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedRange]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex justify-center items-center text-black py-5">
          <h1 className="text-3xl font-bold">
            Welcome👋 {user?.firstname || "Admin"}
          </h1>
        </div>
      </motion.div>

      <motion.div
        className="max-w-7xl mx-auto px-4 text-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header with range selector */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-center mb-4">
            Analytics overview for the {selectedRange}.
          </p>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-gray-800">
                Dashboard Overview
              </h2>
              <p className="text-gray-500 text-sm">
                Monitor your store's performance
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-gray-600 text-sm font-medium">
                View range:
              </label>
              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Products
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {analyticsData.products || 0}
                </h3>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analyticsData.productsChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`font-medium ${
                  analyticsData.productsChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {analyticsData.productsChange >= 0 ? "+" : ""}
                {analyticsData.productsChange?.toFixed(1) || "0.0"}%
              </span>
            </div>
          </div>
          {/* Total Users Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-green-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {analyticsData.users || 0}
                </h3>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analyticsData.usersChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`font-medium ${
                  analyticsData.usersChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {analyticsData.usersChange >= 0 ? "+" : ""}
                {analyticsData.usersChange?.toFixed(1) || "0.0"}%
              </span>
            </div>
          </div>
          {/* Total Orders Card */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 shadow-sm border border-purple-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Orders
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {analyticsData.allOrders || 0}
                </h3>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analyticsData.ordersChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`font-medium ${
                  analyticsData.ordersChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {analyticsData.ordersChange >= 0 ? "+" : ""}
                {analyticsData.ordersChange?.toFixed(1) || "0.0"}%
              </span>
            </div>
          </div>
          {/* Total Visitors Card */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-sm border border-orange-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Visitors
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {analyticsData.visitors || 0}
                </h3>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analyticsData.visitorsChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`font-medium ${
                  analyticsData.visitorsChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {analyticsData.visitorsChange >= 0 ? "+" : ""}
                {analyticsData.visitorsChange?.toFixed(1) || "0.0"}%
              </span>
            </div>
          </div>
        </div>

        {/* Second Row - Charts and Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Purchase Rate Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Report Purchase Rate
                </h3>
                <p className="text-gray-500 text-sm">
                  Current period performance
                </p>
              </div>
              <div className="bg-indigo-50 px-3 py-1 rounded-full">
                <span className="text-indigo-700 font-medium">
                  {salesData.length > 0
                    ? `${(
                        (analyticsData.allOrders /
                          (analyticsData.visitors || 1)) *
                          100 || 0
                      ).toFixed(2)}%`
                    : "0%"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Average Order Value Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-600 text-sm mb-2">
                  Average Order Value
                </p>
                <h4 className="text-2xl font-bold text-gray-900">
                  {analyticsData.aov
                    ? `₦${analyticsData.aov.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "₦0.00"}
                </h4>
                <div className="flex items-center gap-1 mt-2">
                  {analyticsData.aovChange > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 text-sm">
                        +{analyticsData.aovChange?.toFixed(2) || "0.00"}%
                      </span>
                    </>
                  ) : analyticsData.aovChange < 0 ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 text-sm">
                        {analyticsData.aovChange?.toFixed(2) || "0.00"}%
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm">No trend data</span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-600 text-sm mb-2">
                  Most Selling Products
                </p>
                <div className="space-y-3 mt-3">
                  {topProducts.length > 0 ? (
                    topProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {product.name}
                          </p>
                          <p className="text-gray-500 text-xs">
                            ID: {product.id?.slice(-6) || "N/A"}
                          </p>
                        </div>
                        <div className="bg-blue-50 px-3 py-1 rounded-full">
                          <span className="text-blue-700 font-medium">
                            {product.sales} Sales
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No sales data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="mt-6">
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={salesData.slice(-7)}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                  <Tooltip content={<MiniChartTooltip />} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">
              Order Status
            </h3>
            <div className="space-y-4">
              {[
                {
                  title: "Pending Orders",
                  value: analyticsData.pendingOrders || 0,
                  color: "bg-yellow-100 text-yellow-800",
                  icon: Hourglass,
                },
                {
                  title: "Processing",
                  value: analyticsData.processingOrders || 0,
                  color: "bg-blue-100 text-blue-800",
                  icon: Hourglass,
                },
                {
                  title: "Shipped",
                  value: analyticsData.shippedOrders || 0,
                  color: "bg-cyan-100 text-cyan-800",
                  icon: Truck,
                },
                {
                  title: "Delivered",
                  value: analyticsData.deliveredOrders || 0,
                  color: "bg-green-100 text-green-800",
                  icon: CheckCircle,
                },
                {
                  title: "Cancelled",
                  value: analyticsData.canceledOrders || 0,
                  color: "bg-red-100 text-red-800",
                  icon: XCircle,
                },
                {
                  title: "Approved Refunds",
                  value: analyticsData.canceledOrders || 0,
                  color: "bg-red-100 text-red-800",
                  icon: XCircle,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${item.color.split(" ")[0]}`}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {item.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {item.value}
                    </span>
                    <div
                      className={`px-2 py-1 rounded-full text-xs ${item.color}`}
                    >
                      <span>
                        {(
                          (item.value / (analyticsData.allOrders || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Revenue Analytics
          </h3>

          {/* Revenue Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-indigo-600" />
                </div>
                <p className="text-gray-600 font-medium">Gross Revenue</p>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ₦{analyticsData.grossRevenue?.toLocaleString() || "0"}
              </h3>
              <div className="flex items-center gap-2">
                {analyticsData.revenueChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    analyticsData.revenueChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.revenueChange >= 0 ? "+" : ""}
                  {analyticsData.revenueChange?.toFixed(1) || "0.0"}% from last
                  period
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-gray-600 font-medium">Refunded Amount</p>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ₦{analyticsData.totalRefunded?.toLocaleString() || "0"}
              </h3>
              <div className="flex items-center gap-2">
                {analyticsData.refundedChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    analyticsData.refundedChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.refundedChange >= 0 ? "+" : ""}
                  {analyticsData.refundedChange?.toFixed(1) || "0.0"}% from last
                  period
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-gray-600 font-medium">Net Revenue</p>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ₦{analyticsData.netRevenue?.toLocaleString() || "0"}
              </h3>
              <div className="flex items-center gap-2">
                {analyticsData.netRevenueChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    analyticsData.netRevenueChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.netRevenueChange >= 0 ? "+" : ""}
                  {analyticsData.netRevenueChange?.toFixed(1) || "0.0"}% from
                  last period
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-gray-700 font-medium">Revenue Trend</h4>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg">
                  Revenue
                </button>
                <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">
                  Orders
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Pending Refunds"
            value={analyticsData.refundsPending || 0}
            icon={Hourglass}
            bgColor="bg-gradient-to-br from-yellow-50 to-amber-50"
            borderColor="border-yellow-100"
            iconColor="text-yellow-600"
            iconBg="bg-yellow-100"
          />
          <AnalyticsCard
            title="Approved Refunds"
            value={analyticsData.refundsApproved || 0}
            icon={CheckCircle}
            bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
            borderColor="border-green-100"
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          <AnalyticsCard
            title="Rejected Refunds"
            value={analyticsData.refundsRejected || 0}
            icon={XCircle}
            bgColor="bg-gradient-to-br from-red-50 to-pink-50"
            borderColor="border-red-100"
            iconColor="text-red-600"
            iconBg="bg-red-100"
          />
          <AnalyticsCard
            title="Refund Status"
            value={`${analyticsData.refundsApproved || 0}/${
              analyticsData.refundsPending || 0
            }`}
            icon={CheckCircle}
            bgColor="bg-gradient-to-br from-orange-50 to-amber-50"
            borderColor="border-orange-100"
            iconColor="text-orange-600"
            iconBg="bg-orange-100"
            subtitle={`${analyticsData.refundsRejected || 0} rejected`}
          />
        </div>
      </motion.div>
    </>
  );
};

// Updated AnalyticsCard component with screenshot-inspired design
const AnalyticsCard = ({
  title,
  value,
  icon: Icon,
  chartData,
  bgColor = "bg-gradient-to-br from-gray-50 to-white",
  borderColor = "border-gray-200",
  iconColor = "text-gray-600",
  iconBg = "bg-gray-100",
  subtitle,
  dataKey = "count",
}) => (
  <motion.div
    className={`rounded-2xl p-6 shadow-sm border ${borderColor} ${bgColor}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
    </div>

    {chartData && chartData.length > 0 && (
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={chartData.slice(-8)}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={iconColor.replace("text-", "#")}
            strokeWidth={2}
            dot={false}
          />
          <Tooltip content={<MiniChartTooltip />} />
        </LineChart>
      </ResponsiveContainer>
    )}
  </motion.div>
);

// Tooltip components
const MiniChartTooltip = ({ active, payload }) =>
  active && payload && payload.length ? (
    <div className="bg-white text-gray-800 text-xs px-2 py-1 rounded-md border border-gray-300 shadow-sm">
      {payload[0].value}
    </div>
  ) : null;

const CustomTooltip = ({ active, payload, label }) =>
  active && payload && payload.length ? (
    <div className="bg-white border border-gray-300 rounded-lg p-3 text-gray-800 shadow-lg">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-sm">
          <span style={{ color: item.color }}>● </span>
          {item.name}:{" "}
          <span className="font-semibold">₦{item.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  ) : null;

/* -----------------------------
   Date Label Formatter
----------------------------- */
export const formatDateLabel = (item, range) => {
  const value =
    typeof item === "string" ? item : item?.date || item?.weekStart || item;

  if (range === "daily") {
    if (typeof value === "string" && value.includes("T")) {
      const date = new Date(value + ":00:00");
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      });
    }
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (range === "weekly") {
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }

  if (range === "monthly") {
    if (typeof value === "string" && /^\d{4}-\d{2}$/.test(value)) {
      return new Date(value + "-01").toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  if (range === "yearly") {
    if (typeof value === "string" && /^\d{4}$/.test(value)) return value;
    const d = new Date(value);
    return d.getFullYear();
  }

  const d = new Date(value);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default AnalyticsTab;
