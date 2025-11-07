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
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AnalyticsTab = () => {
  const [analyticsData, setAnalyticsData] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [statusCharts, setStatusCharts] = useState({});
  const [visitorsCharts, setVisitorsCharts] = useState({});
  const [usersCharts, setUsersCharts] = useState([]);
  const [ordersCharts, setOrdersCharts] = useState([]);
  const [selectedRange, setSelectedRange] = useState("weekly");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUserStore();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`/analytics?range=${selectedRange}`);
        const {
          analyticsData,
          salesData,
          statusCharts,
          ordersTrend,
          visitorsTrend,
          usersTrend,
        } = res.data;

        setAnalyticsData(analyticsData);
        // map sales data and build the full label set we'll use to align other charts
        const mappedSales = salesData.map((d) => ({
          rawDate: d.date,
          name: formatDateLabel(d.date, selectedRange),
          sales: Number(d.sales),
          revenue: Number(d.revenue),
        }));
        setSalesData(mappedSales);
        const labels = mappedSales.map((s) => s.name);
        setAnalyticsData((prev) => ({
          ...prev,
          visitorsTrend,
          ordersTrend,
          usersTrend,
        }));
        // map status charts into chart-friendly shape (name, count)
        // normalize status charts so they have entries for each sales label (fill zeros where missing)
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

        // Normalize visitors and orders to the same labels (so charts align)
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
              // try to find raw key by comparing formatted labels; fallback to 0
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
        // build users chart aligned to sales labels
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
        // optionally set orders trend on analyticsData too
        setAnalyticsData((prev) => ({ ...prev, ordersTrend }));
      } catch (err) {
        console.error("Error fetching analytics:", err);
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
    <div className="max-w-7xl mx-auto px-4 text-gray-700">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.firstname || "Admin"}
        </h1>
        <p className="text-gray-500 my-3">
          Analytics overview the {selectedRange}.
        </p>

        <div className="flex justify-center gap-2 mt-3">
          <label className="text-gray-400 text-sm">View range:</label>
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="bg-gray-800 text-white rounded-md px-3 py-1 outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnalyticsCard
          title="Users"
          value={analyticsData.users}
          icon={Users}
          chartData={usersCharts}
        />
        <AnalyticsCard
          title="Products"
          value={analyticsData.products}
          icon={Package}
        />
        <AnalyticsCard
          title="Visitors"
          value={analyticsData.visitors}
          chartData={visitorsCharts}
          icon={Users}
        />
        <AnalyticsCard
          title="Total Orders"
          value={analyticsData.allOrders}
          icon={ShoppingCart}
          chartData={ordersCharts}
        />

        <AnalyticsCard
          title="Pending Orders"
          value={analyticsData.pendingOrders}
          icon={Hourglass}
          chartData={statusCharts?.Pending}
          color="#FACC15"
        />
        <AnalyticsCard
          title="Processing Orders"
          value={analyticsData.processingOrders}
          icon={Hourglass}
          chartData={statusCharts?.Processing}
          color="#3B82F6"
        />
        <AnalyticsCard
          title="Shipped Orders"
          value={analyticsData.shippedOrders}
          icon={Truck}
          chartData={statusCharts?.Shipped}
          color="#06B6D4"
        />
        <AnalyticsCard
          title="Delivered Orders"
          value={analyticsData.deliveredOrders}
          icon={CheckCircle}
          chartData={statusCharts?.Delivered}
          color="#10B981"
        />
        <AnalyticsCard
          title="Approved Refunds"
          value={analyticsData.refundsApproved}
          icon={CheckCircle}
          color="#10B981"
        />

        <AnalyticsCard
          title="Pending Refunds"
          value={analyticsData.refundsPending}
          icon={Hourglass}
          color="#FACC15"
        />

        <AnalyticsCard
          title="Rejected Refunds"
          value={analyticsData.refundsRejected}
          icon={XCircle}
          color="#EF4444"
        />

        <AnalyticsCard
          title="Cancelled Orders"
          value={analyticsData.canceledOrders}
          icon={XCircle}
          chartData={statusCharts?.Cancelled}
          color="#EF4444"
        />
        {/*  Revenue Summary */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg col-span-1 sm:col-span-2 lg:col-span-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Gross Revenue */}
            <div className="flex flex-col items-center justify-center bg-gray-900/40 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Gross Revenue</p>
              <h3 className="text-2xl font-bold text-indigo-400">
                ₦{analyticsData.grossRevenue?.toLocaleString() || 0}
              </h3>
            </div>

            {/* Refunded Amount */}
            <div className="flex flex-col items-center justify-center bg-gray-900/40 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Refunded Amount</p>
              <h3 className="text-2xl font-bold text-red-400">
                ₦{analyticsData.totalRefunded?.toLocaleString() || 0}
              </h3>
            </div>

            {/* Net Revenue */}
            <div className="flex flex-col items-center justify-center bg-gray-900/40 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Net Revenue</p>
              <h3 className="text-2xl font-bold text-emerald-400">
                ₦{analyticsData.netRevenue?.toLocaleString() || 0}
              </h3>
            </div>
          </div>

          {/* Optional: Revenue Chart */}
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salesData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366F1"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;

/* -----------------------------
   Helper Components
----------------------------- */
const AnalyticsCard = ({
  title,
  value,
  icon: Icon,
  chartData,
  color = "#10B981",
  dataKey = "count",
}) => (
  <motion.div
    className="bg-gray-800 rounded-lg p-6 shadow-lg"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex justify-between items-center mb-3">
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <Icon className="h-10 w-10 text-gray-400" />
    </div>
    {chartData && chartData.length > 0 && (
      <ResponsiveContainer width="100%" height={70}>
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
          <Tooltip content={<MiniChartTooltip />} />
          <XAxis dataKey="name" hide />
        </LineChart>
      </ResponsiveContainer>
    )}
  </motion.div>
);

const MiniChartTooltip = ({ active, payload }) =>
  active && payload && payload.length ? (
    <div className="bg-gray-900/90 text-white text-xs px-2 py-1 rounded-md border border-gray-700">
      {payload[0].value}
    </div>
  ) : null;

const CustomTooltip = ({ active, payload, label }) =>
  active && payload && payload.length ? (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
      <p className="font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {item.value.toLocaleString()}
        </p>
      ))}
    </div>
  ) : null;

/* -----------------------------
   Date Label Formatter
----------------------------- */
// utils/formatDateLabel.js
export const formatDateLabel = (item, range) => {
  // Accept either a date string or an object depending on source
  const value =
    typeof item === "string" ? item : item?.date || item?.weekStart || item;

  if (range === "daily") {
    // expected format from backend for hourly bucket: YYYY-MM-DDTHH (e.g. 2025-11-07T13)
    if (typeof value === "string" && value.includes("T")) {
      const date = new Date(value + ":00:00");
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      });
    }

    // fallback to day label
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (range === "weekly") {
    // Show weekday short label (Mon, Tue, ...)
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }

  if (range === "monthly") {
    // value expected as YYYY-MM or a Date-like string
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
    // value may be YYYY
    if (typeof value === "string" && /^\d{4}$/.test(value)) return value;
    const d = new Date(value);
    return d.getFullYear();
  }

  // All or default: show a short date
  const d = new Date(value);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
