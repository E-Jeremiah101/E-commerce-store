import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";
import {
  Users,
  ShoppingCart,
  Package,
  XCircle,
  CheckCircle,
  Currency,
  DollarSign,
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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState("weekly"); // 👈 new state for range
  const { user } = useUserStore();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`/analytics?range=${selectedRange}`); // 

        const { analyticsData, salesData: fetchedSales } = res.data;

        setAnalyticsData(analyticsData);

        const formattedData = fetchedSales.map((item) => ({
          name: item.date,
          sales: Number(item.sales),
          revenue: Number(item.revenue),
        }));
        setSalesData(formattedData);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalyticsData();
  }, [selectedRange]); // 👈 refetch when range changes

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-700">
      {/* Header Section */}
      <div className="text-center my-6">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.name || "Admin"} 👋
        </h1>
        <h2 className="text-xl mt-2"></h2>
        <p className="text-gray-800 mb-3">
          Here’s your analytics overview for this {selectedRange}.
        </p>

        {/* Range Selector */}
        <div className="flex justify-center items-center gap-2 mt-3">
          <label htmlFor="range" className="text-gray-400 text-sm">
            View range:
          </label>
          <select
            id="range"
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="bg-gray-700 text-white rounded-md px-3 py-1 outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnalyticsCard
          title="Total Users"
          value={analyticsData.users}
          icon={Users}
          color="from-emerald-500 to-teal-700"
          tooltip="Total registered users on the platform."
        />
        <AnalyticsCard
          title="Total Visitor"
          value={analyticsData.visitors}
          icon={Users}
          color="from-emerald-500 to-teal-700"
          tooltip="Total registered users on the platform."
        />
        <AnalyticsCard
          title="Total Products"
          value={analyticsData.products}
          icon={Package}
          chartColor="#3B82F6"
          color="from-emerald-500 to-teal-700"
          tooltip="Number of products currently available in your store."
        />
        <AnalyticsCard
          title="All Orders"
          value={analyticsData.allOrders}
          icon={ShoppingCart}
          chartColor="#10B981"
          chartData={salesData}
          dataKey="sales"
          tooltip="Total number of all orders, including delivered, pending, and cancelled."
        />
        <AnalyticsCard
          title="Delivered Orders"
          value={analyticsData.deliveredOrders}
          icon={CheckCircle}
          chartColor="#10B981"
          chartData={salesData}
          dataKey="sales"
          tooltip="Total number of all delivered orders."
        />

        <AnalyticsCard
          title="Canceled Orders"
          value={analyticsData.canceledOrders}
          icon={XCircle}
          chartColor="#EF4444"
          chartData={salesData}
          dataKey="sales"
          tooltip="Total Number of Cancelled orders"
        />
        <AnalyticsCard
          title="Total Revenue"
          value={`₦ ${analyticsData.totalRevenue.toLocaleString()}`}
          tooltip="Total successful orders excluding cancellations."
          icon={DollarSign}
          chartData={salesData}
          color="from-emerald-500 to-teal-700"
          chartColor="#3B82F6"
          dataKey="revenue"
        />
      </div>

      {/* Main Sales Chart */}
      <motion.div
        className="bg-gray-800/90 rounded-lg p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={salesData}>
            <defs>
              {/* Gradient for Sales */}
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
              {/* Gradient for Revenue */}
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2D3748"
              opacity={0.2}
            />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#9CA3AF"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#6EE7B7", strokeWidth: 1 }}
            />

            {/* Sales Line */}
            <Line
              type="basis"
              dataKey="sales"
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#colorSales)"
              fillOpacity={0.3}
              dot={{ r: 4, strokeWidth: 2, fill: "#10B981" }}
              activeDot={{ r: 6, strokeWidth: 2, fill: "#10B981" }}
              name="Sales"
            />

            {/* Revenue Line */}
            <Line
              type="basis"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#colorRevenue)"
              fillOpacity={0.3}
              dot={{ r: 4, strokeWidth: 2, fill: "#3B82F6" }}
              activeDot={{ r: 6, strokeWidth: 2, fill: "#3B82F6" }}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default AnalyticsTab;

const MiniChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-gray-900/90 text-white text-xs px-2 py-1 rounded-md shadow-md border border-gray-700">
        {isNaN(value) ? "-" : value.toLocaleString()}
      </div>
    );
  }
  return null;
};

// Small analytics card
const AnalyticsCard = ({
  title,
  value,
  tooltip,
  icon: Icon,
  chartData,
  chartColor,
  dataKey,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState("top");
  const cardRef = useRef(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      // ✅ Flip tooltip below if card is near the top
      setTooltipPosition(rect.top < 80 ? "bottom" : "top");
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => setShowTooltip(false);

  return (
    <motion.div
      ref={cardRef}
      className="relative bg-gray-800 rounded-lg p-6 shadow-lg overflow-visible group cursor-pointer" // 👈 change overflow-hidden → overflow-visible
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: tooltipPosition === "top" ? 5 : -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`absolute left-1/2 transform -translate-x-1/2 bg-white text-gray-800 text-sm py-1 px-3 rounded-md shadow-md z-20 whitespace-nowrap ${
            tooltipPosition === "top" ? "-top-10" : "top-full mt-2"
          }`}
        >
          {tooltip}
          {/* Tooltip Arrow */}
          <div
            className={`absolute left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-black ${
              tooltipPosition === "top" ? "bottom-[-4px]" : "top-[-4px]"
            }`}
          />
        </motion.div>
      )}

      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
        </div>
        <Icon className="h-10 w-10 text-gray-400" />
      </div>

      {chartData && (
        <ResponsiveContainer width="100%" height={70}>
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={chartColor || "#10B981"}
              dot={false}
              strokeWidth={2}
            />
            <Tooltip
              content={<MiniChartTooltip />}
              cursor={{ stroke: "#6EE7B7", strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
};


const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const sales = payload.find((item) => item.dataKey === "sales")?.value || 0;
    const revenue = payload.find((item) => item.dataKey === "revenue")?.value || 0;

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-md text-white">
        <p className="font-semibold">{label}</p>
        <p className="text-emerald-400">Sales: {sales.toLocaleString()}</p>
        <p className="text-blue-400">Revenue: ₦{revenue.toLocaleString()}</p>
      </div>
    );
  }
}