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
        } = res.data;

        setAnalyticsData(analyticsData);
        setSalesData(
          salesData.map((d) => ({
            name: formatDateLabel(d.date, selectedRange),
            sales: Number(d.sales),
            revenue: Number(d.revenue),
          }))
        );
        setAnalyticsData((prev) => ({
          ...prev,
          visitorsTrend,
          ordersTrend,
        }));
        setStatusCharts(
          Object.fromEntries(
            Object.entries(statusCharts || {}).map(([key, data]) => [
              key,
              data.map((d) => ({
                name: formatDateLabel(d.date, selectedRange),
                count: d.count,
              })),
            ])
          )
        );
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
      <div className="text-center my-6">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.name || "Admin"} 👋
        </h1>
        <p className="text-gray-500 mb-3">
          Analytics overview for this {selectedRange}.
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
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnalyticsCard title="Users" value={analyticsData.users} icon={Users} />
        <AnalyticsCard
          title="Products"
          value={analyticsData.products}
          icon={Package}
        />
        <AnalyticsCard
          title="Visitors"
          value={analyticsData.visitors}
          chartData={statusCharts?.visitors}
          icon={Users}
        />
        <AnalyticsCard
          title="Total Orders"
          value={analyticsData.allOrders}
          icon={ShoppingCart}
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
          title="Cancelled Orders"
          value={analyticsData.canceledOrders}
          icon={XCircle}
          chartData={statusCharts?.Cancelled}
          color="#EF4444"
        />
        <AnalyticsCard
          title="Total Revenue"
          value={`₦${analyticsData.totalRevenue?.toLocaleString()}`}
          icon={DollarSign}
          chartData={salesData}
          color="#6366F1"
          dataKey="revenue"
        />
      </div>

      {/* Main Chart */}
      <motion.div
        className="bg-gray-800 rounded-lg p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height={400}>
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
              dataKey="sales"
              stroke="#10B981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
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
function formatDateLabel(dateString, range) {
  const date = new Date(dateString);
  if (range === "daily")
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (range === "weekly" || range === "monthly")
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  if (range === "yearly")
    return date.toLocaleDateString([], { month: "short", year: "numeric" });
  return date.toLocaleDateString();
}
