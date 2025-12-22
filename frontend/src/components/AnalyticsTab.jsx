import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";
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
  Scissors,
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
  const [productSales, setProductSales] = useState([]);
  const [productSummary, setProductSummary] = useState({});
  const [productSortConfig, setProductSortConfig] = useState({
    key: "unitsSold",
    direction: "descending",
  });
  const [couponTrend, setCouponTrend] = useState([]);
  const [couponPerformance, setCouponPerformance] = useState([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`/analytics?range=${selectedRange}`);
        console.log("📊 API Response:", res.data);
        console.log("📈 Sales Data:", res.data.salesData);
        console.log(
          "💰 Revenue in salesData:",
          res.data.salesData?.map((d) => ({
            date: d.date,
            sales: d.sales,
            revenue: d.revenue,
            deliveryFee: d.deliveryFee,
          }))
        );
        const {
          analyticsData,
          salesData,
          statusCharts,
          topProducts = [], // Default to empty array
          ordersTrend,
          visitorsTrend,
          productSalesData = { products: [], summary: {} },
          usersTrend,
          couponTrend,
          couponPerformance,
        } = res.data;

        setAnalyticsData(analyticsData);
        setProductSales(productSalesData.products || []);
        setProductSummary(productSalesData.summary || {});

        setAnalyticsData(analyticsData);
        const totalOrderAppearances = sortedProducts.reduce((sum, product) => {
          return sum + (product.orderCount || 0);
        }, 0);

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

        if (couponTrend && Array.isArray(couponTrend)) {
          const processedCouponTrend = couponTrend.map((item) => ({
            date: item._id,
            name: formatDateLabel(item._id, selectedRange),
            couponsUsed: item.count || 0,
            couponDiscount: item.totalDiscount || 0,
          }));
          setCouponTrend(processedCouponTrend);
        }

        // Process coupon performance data
        if (couponPerformance && Array.isArray(couponPerformance)) {
          setCouponPerformance(couponPerformance);
        }

        // Process sales data
        // Replace your mapping with this:
        const mappedSales = salesData.map((d) => {
          // Try to get totalAmount if available, otherwise calculate
          const totalRevenue =
            Number(d.totalAmount) ||
            Number(d.revenue || 0) + Number(d.deliveryFee || 0);

          return {
            rawDate: d.date,
            name: formatDateLabel(d.date, selectedRange),
            sales: Number(d.sales) || 0,
            revenue: totalRevenue,
            deliveryFee: Number(d.deliveryFee) || 0,
            couponsUsed: Number(d.couponsUsed) || 0,
            couponDiscount: Number(d.couponDiscount) || 0,
            avgCouponDiscount: Number(d.avgCouponDiscount) || 0,
          };
        });

       
        console.log("🔄 Mapped Sales Data (sample):", mappedSales.slice(0, 3));
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

  // Add product sorting function
  const requestProductSort = (key) => {
    let direction = "ascending";
    if (
      productSortConfig.key === key &&
      productSortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setProductSortConfig({ key, direction });
  };

  const sortedProducts = [...productSales].sort((a, b) => {
    if (a[productSortConfig.key] < b[productSortConfig.key]) {
      return productSortConfig.direction === "ascending" ? -1 : 1;
    }
    if (a[productSortConfig.key] > b[productSortConfig.key]) {
      return productSortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });
  const totalOrderAppearances = sortedProducts.reduce((sum, product) => {
    return sum + (product.orderCount || 0);
  }, 0);
  const pending = analyticsData.refundsPending || 0;
  const approved = analyticsData.refundsApproved || 0;
  const rejected = analyticsData.refundsRejected || 0;
  const processing = analyticsData.refundsProcessing || 0;
  const totalRefunds = pending + approved + rejected;

  const percentage =
    totalRefunds > 0
      ? {
          pending: (pending / totalRefunds) * 100,
          approved: (approved / totalRefunds) * 100,
          rejected: (rejected / totalRefunds) * 100,
          processing: (processing / totalRefunds) * 100,
        }
      : { pending: 0, approved: 0, rejected: 0, processing: 0 };

  const { settings } = useStoreSettings();

  if (isLoading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="flex space-x-3 mb-6">
          <div className="h-5 w-5 bg-gray-700 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-5 w-5 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-5 w-5 bg-gray-500 rounded-full animate-bounce"></div>
        </div>
        <p className="text-gray-700 font-medium text-lg animate-pulse">
          Please wait, Loading data
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Preparing your analytics dashboard...
        </p>
      </div>
    );

  return (
    <>
      <motion.div
        className="max-w-7xl mx-auto px-4 text-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header with range selector */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <p className="text-gray-600 text-center mb-4 capitalize">
            <strong>{selectedRange}</strong> Analytics overview
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                <p className="text-gray-600 text-sm font-medium">New Users</p>
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
                <p className="text-gray-600 text-sm font-medium">New Orders</p>
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
                  New Visitors
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

          {/* NEW: Average Unit Value Card */}
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-6 shadow-sm border border-cyan-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Avg. Item Value
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {analyticsData.auv
                    ? `${formatPrice(analyticsData.auv, settings?.currency)}`
                    : `${formatPrice(0, settings?.currency)}`}
                </h3>
                <p className="text-gray-500 text-xs mt-1">
                  {analyticsData.totalUnitsSold || 0} units sold
                </p>
              </div>
              <div className="bg-cyan-100 p-2 rounded-lg">
                <svg
                  className="h-6 w-6 text-cyan-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analyticsData.auvChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`font-medium ${
                  analyticsData.auvChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {analyticsData.auvChange >= 0 ? "+" : ""}
                {analyticsData.auvChange?.toFixed(1) || "0.0"}%
              </span>
              <span className="text-gray-500 text-xs">from last period</span>
            </div>
          </div>

          <div className="rounded-2xl shadow-sm  h-fi">
            <AnalyticsCard
              title="Pending Refunds"
              value={analyticsData.refundsPending || 0}
              icon={Hourglass}
              bgColor="bg-gradient-to-br from-yellow-50 to-amber-50"
              borderColor="border-yellow-100"
              iconColor="text-yellow-600"
              iconBg="bg-yellow-100"
              subtitle={`${percentage.pending.toFixed(1)}%`}
            />
          </div>
          <div className=" rounded-2xl shadow-sm  h-fi">
            <AnalyticsCard
              title="Approved Refunds"
              value={analyticsData.refundsApproved || 0}
              icon={CheckCircle}
              bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
              borderColor="border-green-100"
              iconColor="text-green-600"
              iconBg="bg-green-100"
              subtitle={`${percentage.approved.toFixed(1)}%`}
            />
          </div>
          <div className="rounded-2xl shadow-sm  h-fi">
            <AnalyticsCard
              title="Rejected Refunds"
              value={analyticsData.refundsRejected || 0}
              icon={XCircle}
              bgColor="bg-gradient-to-br from-red-50 to-pink-50"
              borderColor="border-red-100"
              iconColor="text-red-600"
              iconBg="bg-red-100"
              subtitle={`${percentage.rejected.toFixed(1)}% `}
            />
          </div>
          <div className="rounded-2xl shadow-sm  h-fit">
            <AnalyticsCard
              title="Processing Refunds"
              value={analyticsData.refundsProcessing || 0}
              icon={XCircle}
              bgColor="bg-gradient-to-br from-red-50 to-pink-50"
              borderColor="border-red-100"
              iconColor="text-red-600"
              iconBg="bg-red-100"
              subtitle={`${percentage.processing.toFixed(1)}% `}
            />
          </div>
          <div className="rounded-2xl shadow-sm  h-fit">
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

          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AnalyticsCard
              title="Pending Refunds"
              value={analyticsData.refundsPending || 0}
              icon={Hourglass}
              bgColor="bg-gradient-to-br from-yellow-50 to-amber-50"
              borderColor="border-yellow-100"
              iconColor="text-yellow-600"
              iconBg="bg-yellow-100"
              subtitle={`${percentage.pending.toFixed(1)}%`}
            />
            <AnalyticsCard
              title="Approved Refunds"
              value={analyticsData.refundsApproved || 0}
              icon={CheckCircle}
              bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
              borderColor="border-green-100"
              iconColor="text-green-600"
              iconBg="bg-green-100"
              subtitle={`${percentage.approved.toFixed(1)}%`}
            />
            <AnalyticsCard
              title="Rejected Refunds"
              value={analyticsData.refundsRejected || 0}
              icon={XCircle}
              bgColor="bg-gradient-to-br from-red-50 to-pink-50"
              borderColor="border-red-100"
              iconColor="text-red-600"
              iconBg="bg-red-100"
              subtitle={`${percentage.rejected.toFixed(1)}% `}
            />
            <AnalyticsCard
              title="Processing Refunds"
              value={analyticsData.refundsProcessing || 0}
              icon={XCircle}
              bgColor="bg-gradient-to-br from-red-50 to-pink-50"
              borderColor="border-red-100"
              iconColor="text-red-600"
              iconBg="bg-red-100"
              subtitle={`${percentage.processing.toFixed(1)}% `}
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
          </div> */}
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

            {/* Additional Analytics Cards */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Average Order Value Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-600 text-sm mb-2">
                  Average Order Value
                </p>
                <h4 className="text-2xl font-bold text-gray-900">
                  {analyticsData.aov
                    ? `${formatPrice(analyticsData.aov, settings?.currency)}`
                    : `${formatPrice(0, settings?.currency)}`}
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

              {/* Most Selling Products Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-800 text-sm mb-2">
                  Most Selling Products
                </p>
                <div className="space-y-3 mt-3">
                  {topProducts.length > 0 ? (
                    topProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {/* Product Image */}
                          <div className="relative">
                            {product.image ? (
                              <>
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    console.error(
                                      "❌ Image failed to load:",
                                      product.image
                                    );
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerHTML = `
                        <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                      `;
                                  }}
                                  onLoad={(e) => {
                                    console.log(
                                      "✅ Image loaded successfully:",
                                      product.image
                                    );
                                  }}
                                />
                                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {product.sales}
                                </div>
                              </>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {product.name}
                            </p>
                            <p className="text-gray-500 text-xs">
                              ID: {product.id?.slice(-10) || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Sales Count */}
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
                  title: "Refunded",
                  value: analyticsData.refundedOrders, // Or get this from backend: analyticsData.refundedOrders
                  color: "bg-purple-100 text-purple-800",
                  icon: DollarSign, // Or use a refund icon
                },
                {
                  title: "Partial Refund",
                  value: analyticsData.partiallyRefundedOrders, //
                  color: "bg-purple-100 text-purple-800",
                  icon: Scissors, // Or use a refund icon
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
                        {analyticsData.totalOrdersAllStatuses > 0
                          ? (
                              (item.value /
                                analyticsData.totalOrdersAllStatuses) *
                              100
                            ).toFixed(1)
                          : "0.0"}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* { delivery chart} */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Logistics & Delivery
          </h3>

          {/* Delivery Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Delivery Fees Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <svg
                    className="h-5 w-5 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Delivery Fees</p>
                  <p className="text-gray-500 text-xs">To logistics partner</p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {formatPrice(
                  analyticsData?.totalDeliveryFee,
                  settings?.currency
                ) || "0"}
              </h3>
              <div className="flex items-center gap-2">
                {analyticsData.deliveryFeeChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    analyticsData.deliveryFeeChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.deliveryFeeChange >= 0 ? "+" : ""}
                  {analyticsData.deliveryFeeChange?.toFixed(1) || "0.0"}% from
                  last period
                </span>
              </div>
            </div>

            {/* Average Delivery Fee per Order Card */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border border-teal-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <svg
                    className="h-5 w-5 text-teal-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Avg. Delivery Fee</p>
                  <p className="text-gray-500 text-xs">Per order</p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {analyticsData.allOrders > 0
                  ? formatPrice(
                      analyticsData.totalDeliveryFee / analyticsData.allOrders,
                      settings?.currency
                    )
                  : formatPrice(0, settings?.currency)}
              </h3>
              <p className="text-gray-500 text-sm">
                Based on {analyticsData.allOrders || 0} orders
              </p>
            </div>

            {/* Delivery Rate Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Delivery Rate</p>
                  <p className="text-gray-500 text-xs">Orders with delivery</p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {analyticsData.allOrders > 0
                  ? `${(
                      (analyticsData.deliveredOrders /
                        analyticsData.allOrders) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </h3>
              <p className="text-gray-500 text-sm">
                {analyticsData.deliveredOrders || 0} of{" "}
                {analyticsData.allOrders || 0} delivered
              </p>
            </div>

            {/* Logistics Efficiency Card */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg
                    className="h-5 w-5 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">
                    Fee to Revenue Ratio
                  </p>
                  <p className="text-gray-500 text-xs">
                    Delivery vs product revenue
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {analyticsData.grossRevenue > 0
                  ? `${(
                      (analyticsData.totalDeliveryFee /
                        analyticsData.grossRevenue) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </h3>
              <p className="text-gray-500 text-sm">
                {formatPrice(
                  analyticsData.totalDeliveryFee,
                  settings?.currency
                )}{" "}
                / {formatPrice(analyticsData.grossRevenue, settings?.currency)}
              </p>
            </div>
          </div>

          {/* Delivery Fee Trend Chart */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-gray-700 font-medium">Delivery Fee Trend</h4>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg">
                  Delivery Fees
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient
                    id="colorDeliveryFee"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) =>
                    `${formatPrice(
                      (value / 1000).toFixed(0),
                      settings?.currency
                    )}K`
                  }
                />
                <Tooltip
                  content={<DeliveryTooltip />}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="deliveryFee"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="url(#colorDeliveryFee)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coupon Analytics Section */}
        {/* Coupon Analytics Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Coupon & Discount Analytics
          </h3>

          {/* Coupon Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Coupons Used Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Coupons Used</p>
                  <p className="text-gray-500 text-xs">
                    Total discount codes applied
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {analyticsData.couponsUsed || 0}
              </h3>
              <div className="flex items-center gap-2">
                {analyticsData.couponsUsedChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    analyticsData.couponsUsedChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.couponsUsedChange >= 0 ? "+" : ""}
                  {analyticsData.couponsUsedChange?.toFixed(1) || "0.0"}% from
                  last period
                </span>
              </div>
            </div>

            {/* Total Coupon Discount Card */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg
                    className="h-5 w-5 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Total Discount</p>
                  <p className="text-gray-500 text-xs">
                    Amount saved by customers
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {formatPrice(
                  analyticsData.totalCouponDiscount || 0,
                  settings?.currency
                )}
              </h3>
              <div className="flex items-center gap-2">
                {analyticsData.couponDiscountChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    analyticsData.couponDiscountChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.couponDiscountChange >= 0 ? "+" : ""}
                  {analyticsData.couponDiscountChange?.toFixed(1) || "0.0"}%
                  from last period
                </span>
              </div>
            </div>

            {/* Unique Coupon Codes Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Unique Codes</p>
                  <p className="text-gray-500 text-xs">
                    Different coupon codes used
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {analyticsData.uniqueCouponsUsed || 0}
              </h3>
              <div className="flex items-center gap-2">
                {analyticsData.uniqueCouponsChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    analyticsData.uniqueCouponsChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.uniqueCouponsChange >= 0 ? "+" : ""}
                  {analyticsData.uniqueCouponsChange?.toFixed(1) || "0.0"}% from
                  last period
                </span>
              </div>
            </div>

            {/* Discount Rate Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <svg
                    className="h-5 w-5 text-orange-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Discount Rate</p>
                  <p className="text-gray-500 text-xs">Orders with coupons</p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {analyticsData.couponDiscountRate?.toFixed(1) || "0.0"}%
              </h3>
              <p className="text-gray-500 text-sm">
                {analyticsData.couponsUsed || 0} of{" "}
                {analyticsData.allOrders || 0} orders
              </p>
            </div>
          </div>

          {/* Coupon Usage Trend Chart */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-gray-700 font-medium">Coupon Usage Trend</h4>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg">
                  Coupons Used
                </button>
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg">
                  Discount Amount
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis
                  yAxisId="left"
                  stroke="#6B7280"
                  fontSize={12}
                  label={{
                    value: "Coupons",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) =>
                    `${formatPrice(value, settings?.currency)}`
                  }
                  label={{
                    value: "Discount",
                    angle: 90,
                    position: "insideRight",
                  }}
                />
                <Tooltip
                  content={<CouponTooltip />}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="couponsUsed"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Coupons Used"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="couponDiscount"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Total Discount"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Additional Coupon Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Avg. Discount per Coupon
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {analyticsData.couponsUsed > 0
                    ? formatPrice(
                        analyticsData.totalCouponDiscount /
                          analyticsData.couponsUsed,
                        settings?.currency
                      )
                    : formatPrice(0, settings?.currency)}
                </p>
                <p className="text-gray-500 text-xs">
                  Average saving per coupon used
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Discount to Revenue Ratio
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {analyticsData.grossRevenue > 0
                    ? `${(
                        (analyticsData.totalCouponDiscount /
                          analyticsData.grossRevenue) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </p>
                <p className="text-gray-500 text-xs">
                  Discount as % of gross revenue
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Avg. Orders per Code</p>
                <p className="text-lg font-semibold text-gray-900">
                  {analyticsData.uniqueCouponsUsed > 0
                    ? (
                        analyticsData.couponsUsed /
                        analyticsData.uniqueCouponsUsed
                      ).toFixed(1)
                    : "0"}
                </p>
                <p className="text-gray-500 text-xs">
                  Average usage per coupon code
                </p>
              </div>
            </div>
          </div>

          {/* Top Coupon Codes Table (if data exists) */}
          {couponPerformance && couponPerformance.length > 0 && (
            <div className="mt-8">
              <h4 className="text-gray-700 font-medium mb-4">
                Top Performing Coupon Codes
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coupon Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Times Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Discount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Discount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {couponPerformance.map((coupon, index) => (
                      <tr
                        key={coupon._id || index}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">
                            {coupon._id || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {coupon.usageCount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatPrice(
                            coupon.totalDiscount || 0,
                            settings?.currency
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              (coupon.averageDiscount || 0) >= 10000
                                ? "bg-green-100 text-green-800"
                                : (coupon.averageDiscount || 0) >= 5000
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {formatPrice(
                              coupon.averageDiscount || 0,
                              settings?.currency
                            )}
                          </div>
                        </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Product Sales Analysis Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Product Sales Analysis
              </h3>
              <p className="text-gray-500 text-sm">
                Breakdown of items sold in the selected{" "}
                <span className="uppercase font-bold">{selectedRange}</span>{" "}
                period
              </p>
            </div>
            <div className="flex items-center gap-4"></div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Products Sold</p>
              <p className="text-xl font-bold text-gray-900">
                {productSales.length || 0}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">
                {formatPrice(
                  productSummary?.totalRevenue,
                  settings?.currency
                ) || "0"}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Avg. Units per Product</p>
              <p className="text-xl font-bold text-gray-900">
                {productSales.length > 0
                  ? Math.round(productSummary.totalUnits / productSales.length)
                  : 0}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Avg. Revenue per Product</p>
              <p className="text-xl font-bold text-gray-900">
                {productSales.length > 0
                  ? formatPrice(
                      Math.round(
                        productSummary.totalRevenue / productSales.length
                      ),
                      settings?.currency
                    )
                  : "0"}
              </p>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestProductSort("unitsSold")}
                  >
                    <div className="flex items-center gap-1">
                      Units Sold
                      {productSortConfig.key === "unitsSold" && (
                        <span>
                          {productSortConfig.direction === "ascending"
                            ? "↑"
                            : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestProductSort("orderCount")}
                  >
                    <div className="flex items-center gap-1">
                      Product Orders
                      {productSortConfig.key === "orderCount" && (
                        <span>
                          {productSortConfig.direction === "ascending"
                            ? "↑"
                            : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestProductSort("totalRevenue")}
                  >
                    <div className="flex items-center gap-1">
                      Total Revenue
                      {productSortConfig.key === "totalRevenue" && (
                        <span>
                          {productSortConfig.direction === "ascending"
                            ? "↑"
                            : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestProductSort("averageUnitValue")}
                  >
                    <div className="flex items-center gap-1">
                      Avg. Unit Value
                      {productSortConfig.key === "averageUnitValue" && (
                        <span>
                          {productSortConfig.direction === "ascending"
                            ? "↑"
                            : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestProductSort("revenuePerUnit")}
                  ></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProducts.length > 0 &&
                  sortedProducts.map((product, index) => (
                    <>
                      <tr
                        key={product.productId || index}
                        className={`hover:bg-gray-50 ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerHTML = `
                            <div class="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </div>
                          `;
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name || `Product ${index + 1}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {product.category || "Uncategorized"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (product.unitsSold /
                                      Math.max(
                                        ...sortedProducts.map(
                                          (p) => p.unitsSold
                                        )
                                      )) *
                                      100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-semibold text-gray-900">
                              {product.unitsSold}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.orderCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatPrice(
                            product.formattedRevenue,
                            settings?.currency
                          ) ||
                            `${
                              formatPrice(
                                product.totalRevenue,
                                settings?.currency
                              ) || "0"
                            }`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              product.averageUnitValue >= 10000
                                ? "bg-green-100 text-green-800"
                                : product.averageUnitValue >= 5000
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {formatPrice(
                              product.formattedAUV,
                              settings?.currency
                            ) ||
                              `${
                                formatPrice(
                                  product?.averageUnitValue,
                                  settings?.currency
                                ) || "0"
                              }`}
                          </div>
                        </td>
                      </tr>
                    </>
                  ))}

                <tr className="bg-gray-50 font-semibold">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">
                      TOTAL
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">
                      {productSummary.totalUnits?.toLocaleString() || "0"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* FIXED: Show total orders, not total units */}
                    <span className="text-sm font-bold text-gray-900">
                      {/* {productSummary.totalOrders?.toLocaleString() || "0"} */}
                      {totalOrderAppearances}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">
                      {formatPrice(
                        productSummary?.totalRevenue,
                        settings?.currency
                      ) || "0"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">
                      {formatPrice(
                        productSummary?.overallAUV,
                        settings?.currency
                      ) || "0"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          {sortedProducts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Top Selling Product</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {sortedProducts.length > 0 ? sortedProducts[0].name : "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {sortedProducts.length > 0
                      ? `${sortedProducts[0].unitsSold} units sold`
                      : ""}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Highest Value Product</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {sortedProducts.length > 0
                      ? sortedProducts.reduce(
                          (max, product) =>
                            product.averageUnitValue > max.averageUnitValue
                              ? product
                              : max,
                          sortedProducts[0]
                        ).name
                      : "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {sortedProducts.length > 0
                      ? `${formatPrice(
                          Math.max(
                            ...sortedProducts.map((p) => p.averageUnitValue)
                          ),
                          settings?.currency
                        )} per unit`
                      : ""}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Most Ordered Product</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {sortedProducts.length > 0
                      ? sortedProducts.reduce(
                          (max, product) =>
                            product.orderCount > max.orderCount ? product : max,
                          sortedProducts[0]
                        ).name
                      : "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {sortedProducts.length > 0
                      ? `${Math.max(
                          ...sortedProducts.map((p) => p.orderCount)
                        )} orders`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Revenue Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mt-8">
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
                {formatPrice(analyticsData?.grossRevenue, settings?.currency) ||
                  "0"}
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
                {formatPrice(
                  analyticsData?.totalRefunded,
                  settings?.currency
                ) || "0"}
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
                {formatPrice(analyticsData?.netRevenue, settings?.currency) ||
                  "0"}
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
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) =>
                    `${formatPrice(
                      (value / 1000).toFixed(0),
                      settings?.currency
                    )}K`
                  }
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
        {subtitle && <p className="text-green-500 text-xs mt-1">{subtitle}</p>}
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

// Add this tooltip component near CustomTooltip and DeliveryTooltip
const CouponTooltip = ({ active, payload, label }) => {
  const { settings } = useStoreSettings();

  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-800 mb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Coupons Used:</span>
            <span className="font-medium text-purple-600">
              {data?.couponsUsed || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Total Discount:</span>
            <span className="font-medium text-amber-600">
              {formatPrice(data?.couponDiscount || 0, settings?.currency)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Avg. Discount:</span>
            <span className="font-medium text-green-600">
              {data?.couponsUsed > 0
                ? formatPrice(
                    (data?.couponDiscount || 0) / data?.couponsUsed,
                    settings?.currency
                  )
                : formatPrice(0, settings?.currency)}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Total Orders:</span>
              <span className="font-medium text-blue-600">
                {data?.sales || 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
              <span>Coupon Rate:</span>
              <span>
                {data?.sales > 0
                  ? ((data?.couponsUsed / data?.sales) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Add this component in your AnalyticsTab component
const DeliveryTooltip = ({ active, payload, label, settings }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-800 mb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Delivery Fees:</span>
            <span className="font-medium text-amber-600">
              {formatPrice(data?.deliveryFee || 0, settings?.currency)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Orders:</span>
            <span className="font-medium text-blue-600">
              {data?.sales || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Avg. Fee per Order:</span>
            <span className="font-medium text-green-600">
              {data?.sales > 0
                ? formatPrice(
                    (data?.deliveryFee || 0) / data?.sales,
                    settings?.currency
                  )
                : formatPrice(0, settings?.currency)}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Product Revenue:</span>
              <span className="font-medium text-purple-600">
                {formatPrice(data?.revenue || 0, settings?.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip components
const MiniChartTooltip = ({ active, payload }) =>
  active && payload && payload.length ? (
    <div className="bg-white text-gray-800 text-xs px-2 py-1 rounded-md border border-gray-300 shadow-sm">
      {payload[0].value}
    </div>
  ) : null;

const CustomTooltip = ({ active, payload, label }) => {
  const { settings } = useStoreSettings(); // ✅ hook at top

  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-3 text-gray-800 shadow-lg">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>

      {payload.map((item) => (
        <p key={item.dataKey} className="text-sm">
          <span style={{ color: item.color }}>● </span>
          {item.name}:{" "}
          <span className="font-semibold">
            {formatPrice(item.value, settings?.currency)}
          </span>
        </p>
      ))}
    </div>
  );
};

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
