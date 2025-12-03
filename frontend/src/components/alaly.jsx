// import React, { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import axios from "../lib/axios";
// import { useUserStore } from "../stores/useUserStore";

// import {
//   Users,
//   ShoppingCart,
//   Package,
//   XCircle,
//   CheckCircle,
//   DollarSign,
//   Hourglass,
//   Truck,
//   TrendingUp,
//   TrendingDown,
// } from "lucide-react";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   CartesianGrid,
//   Tooltip,
//   XAxis,
//   YAxis,
//   Area,
//   AreaChart,
// } from "recharts";

// const AnalyticsTab = () => {
//   const [analyticsData, setAnalyticsData] = useState({});
//   const [salesData, setSalesData] = useState([]);
//   const [statusCharts, setStatusCharts] = useState({});
//   const [visitorsCharts, setVisitorsCharts] = useState({});
//   const [usersCharts, setUsersCharts] = useState([]);
//   const [ordersCharts, setOrdersCharts] = useState([]);
//   const [selectedRange, setSelectedRange] = useState("weekly");
//   const [isLoading, setIsLoading] = useState(true);
//   const { user } = useUserStore();

//   // Mock data for top products (replace with actual data from your API)
//   const [topProducts, setTopProducts] = useState([
//     { name: "Selecter Vento", id: "2444300", sales: 128 },
//     { name: "Blue backpack", id: "241518", sales: 401 },
//     { name: "Water Bottle", id: "249876", sales: 287 },
//   ]);

//   useEffect(() => {
//     const fetchAnalyticsData = async () => {
//       try {
//         setIsLoading(true);
//         const res = await axios.get(`/analytics?range=${selectedRange}`);
//         const {
//           analyticsData,
//           salesData,
//           statusCharts,
//           ordersTrend,
//           visitorsTrend,
//           usersTrend,
//         } = res.data;

//         setAnalyticsData(analyticsData);
//         // map sales data and build the full label set we'll use to align other charts
//         const mappedSales = salesData.map((d) => ({
//           rawDate: d.date,
//           name: formatDateLabel(d.date, selectedRange),
//           sales: Number(d.sales),
//           revenue: Number(d.revenue),
//         }));
//         setSalesData(mappedSales);
//         const labels = mappedSales.map((s) => s.name);
//         setAnalyticsData((prev) => ({
//           ...prev,
//           visitorsTrend,
//           ordersTrend,
//           usersTrend,
//         }));
//         // map status charts into chart-friendly shape (name, count)
//         // normalize status charts so they have entries for each sales label (fill zeros where missing)
//         const normalizedStatus = Object.fromEntries(
//           Object.entries(statusCharts || {}).map(([key, data]) => {
//             const mapByName = new Map(
//               (data || []).map((d) => [
//                 formatDateLabel(d.date, selectedRange),
//                 d.count,
//               ])
//             );
//             const filled = labels.map((name) => ({
//               name,
//               count: Number(mapByName.get(name) || 0),
//             }));
//             return [key, filled];
//           })
//         );
//         setStatusCharts(normalizedStatus);

//         // Normalize visitors and orders to the same labels (so charts align)
//         const visitorsMap = new Map(
//           (visitorsTrend || []).map((d) => [d._id || d.date || d, d.count])
//         );
//         const usersMap = new Map(
//           (usersTrend || []).map((d) => [d._id || d.date || d, d.count])
//         );
//         const ordersMap = new Map(
//           (ordersTrend || []).map((d) => [d._id || d.date || d, d.count])
//         );

//         const filledVisitors = labels.length
//           ? labels.map((name, idx) => {
//               // try to find raw key by comparing formatted labels; fallback to 0
//               const raw = mappedSales[idx]?.rawDate;
//               const val = visitorsMap.get(raw) ?? visitorsMap.get(name) ?? 0;
//               return { name, count: Number(val) };
//             })
//           : (visitorsTrend || []).map((d) => ({
//               name: formatDateLabel(d._id || d.date || d, selectedRange),
//               count: d.count || 0,
//             }));

//         const filledOrders = labels.length
//           ? labels.map((name, idx) => {
//               const raw = mappedSales[idx]?.rawDate;
//               const val = ordersMap.get(raw) ?? ordersMap.get(name) ?? 0;
//               return { name, count: Number(val) };
//             })
//           : (ordersTrend || []).map((d) => ({
//               name: formatDateLabel(d._id || d.date || d, selectedRange),
//               count: d.count || 0,
//             }));

//         setVisitorsCharts(filledVisitors);
//         // build users chart aligned to sales labels
//         const filledUsers = labels.length
//           ? labels.map((name, idx) => {
//               const raw = mappedSales[idx]?.rawDate;
//               const val = usersMap.get(raw) ?? usersMap.get(name) ?? 0;
//               return { name, count: Number(val) };
//             })
//           : (usersTrend || []).map((d) => ({
//               name: formatDateLabel(d._id || d.date || d, selectedRange),
//               count: d.count || 0,
//             }));

//         setUsersCharts(filledUsers);
//         setOrdersCharts(filledOrders);
//         // optionally set orders trend on analyticsData too
//         setAnalyticsData((prev) => ({ ...prev, ordersTrend }));
//       } catch (err) {
//         console.error("Error fetching analytics:", err);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchAnalyticsData();
//   }, [selectedRange]);

//   if (isLoading)
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
//       </div>
//     );

//   return (
//     <>
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//       >
//         <div className="flex justify-center items-center text-black py-5">
//           <h1 className="text-3xl font-bold">
//             Welcome👋 {user?.firstname || "Admin"}
//           </h1>
//         </div>
//       </motion.div>

//       <motion.div
//         className="max-w-7xl mx-auto px-4 text-gray-700"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8 }}
//       >
//         {/* Header with range selector - Light background */}
//         <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
//           <p className="text-gray-600 text-center mb-4">
//             Analytics overview for the {selectedRange}.
//           </p>

//           <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
//             <div className="text-center sm:text-left">
//               <h2 className="text-xl font-semibold text-gray-800">
//                 Dashboard Overview
//               </h2>
//               <p className="text-gray-500 text-sm">
//                 Monitor your store's performance
//               </p>
//             </div>

//             <div className="flex items-center gap-3">
//               <label className="text-gray-600 text-sm font-medium">
//                 View range:
//               </label>
//               <select
//                 value={selectedRange}
//                 onChange={(e) => setSelectedRange(e.target.value)}
//                 className="bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="daily">Daily</option>
//                 <option value="weekly">Weekly</option>
//                 <option value="monthly">Monthly</option>
//                 <option value="yearly">Yearly</option>
//                 <option value="all">All</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Main Stats Grid - Similar to screenshot */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {/* Revenue Card - Similar to screenshot design */}
//           <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <p className="text-gray-600 text-sm font-medium">
//                   Ecommerce Revenue
//                 </p>
//                 <h3 className="text-2xl font-bold text-gray-900 mt-1">
//                   $245,450
//                 </h3>
//               </div>
//               <div className="bg-blue-100 p-2 rounded-lg">
//                 <DollarSign className="h-6 w-6 text-blue-600" />
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <TrendingUp className="h-4 w-4 text-green-500" />
//               <span className="text-green-600 font-medium">+16.9%</span>
//               <span className="text-gray-500 text-sm ml-1">(+43.21%)</span>
//             </div>
//           </div>

//           {/* New Customers Card */}
//           <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-green-100">
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <p className="text-gray-600 text-sm font-medium">
//                   New Customers
//                 </p>
//                 <h3 className="text-2xl font-bold text-gray-900 mt-1">684</h3>
//               </div>
//               <div className="bg-green-100 p-2 rounded-lg">
//                 <Users className="h-6 w-6 text-green-600" />
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <TrendingUp className="h-4 w-4 text-green-500" />
//               <span className="text-green-600 font-medium">+48.8%</span>
//               <span className="text-gray-500 text-sm ml-1">
//                 from last period
//               </span>
//             </div>
//           </div>

//           {/* Total Orders Card */}
//           <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 shadow-sm border border-purple-100">
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <p className="text-gray-600 text-sm font-medium">
//                   Total Orders
//                 </p>
//                 <h3 className="text-2xl font-bold text-gray-900 mt-1">
//                   34,300
//                 </h3>
//               </div>
//               <div className="bg-purple-100 p-2 rounded-lg">
//                 <ShoppingCart className="h-6 w-6 text-purple-600" />
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <TrendingUp className="h-4 w-4 text-green-500" />
//               <span className="text-green-600 font-medium">+25.4%</span>
//               <span className="text-gray-500 text-sm ml-1">(+30.11%)</span>
//             </div>
//           </div>

//           {/* Conversion Rate Card */}
//           <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-sm border border-orange-100">
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <p className="text-gray-600 text-sm font-medium">
//                   Conversion Rate
//                 </p>
//                 <h3 className="text-2xl font-bold text-gray-900 mt-1">
//                   32.65%
//                 </h3>
//               </div>
//               <div className="bg-orange-100 p-2 rounded-lg">
//                 <TrendingUp className="h-6 w-6 text-orange-600" />
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <TrendingUp className="h-4 w-4 text-green-500" />
//               <span className="text-green-600 font-medium">+32.2%</span>
//               <span className="text-gray-500 text-sm ml-1">(+5.94%)</span>
//             </div>
//           </div>
//         </div>

//         {/* Second Row - Charts and Additional Metrics */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//           {/* Purchase Rate Card */}
//           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 lg:col-span-2">
//             <div className="flex justify-between items-center mb-6">
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-800">
//                   Report Purchase Rate
//                 </h3>
//                 <p className="text-gray-500 text-sm">
//                   Current period performance
//                 </p>
//               </div>
//               <div className="bg-indigo-50 px-3 py-1 rounded-full">
//                 <span className="text-indigo-700 font-medium">75.12%</span>
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-6">
//               <div className="bg-gray-50 rounded-xl p-4">
//                 <p className="text-gray-600 text-sm mb-2">
//                   Average Order Value
//                 </p>
//                 <h4 className="text-2xl font-bold text-gray-900">$2,412.23</h4>
//                 <div className="flex items-center gap-1 mt-2">
//                   <TrendingUp className="h-4 w-4 text-green-500" />
//                   <span className="text-green-600 text-sm">+12.62%</span>
//                 </div>
//               </div>

//               <div className="bg-gray-50 rounded-xl p-4">
//                 <p className="text-gray-600 text-sm mb-2">
//                   Most Selling Products
//                 </p>
//                 <div className="space-y-3 mt-3">
//                   {topProducts.map((product) => (
//                     <div
//                       key={product.id}
//                       className="flex justify-between items-center"
//                     >
//                       <div>
//                         <p className="font-medium text-gray-800">
//                           {product.name}
//                         </p>
//                         <p className="text-gray-500 text-xs">
//                           ID: {product.id}
//                         </p>
//                       </div>
//                       <div className="bg-blue-50 px-3 py-1 rounded-full">
//                         <span className="text-blue-700 font-medium">
//                           {product.sales} Sales
//                         </span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Mini Chart */}
//             <div className="mt-6">
//               <ResponsiveContainer width="100%" height={100}>
//                 <AreaChart data={salesData.slice(-7)}>
//                   <defs>
//                     <linearGradient
//                       id="colorRevenue"
//                       x1="0"
//                       y1="0"
//                       x2="0"
//                       y2="1"
//                     >
//                       <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
//                       <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
//                     </linearGradient>
//                   </defs>
//                   <Area
//                     type="monotone"
//                     dataKey="revenue"
//                     stroke="#4F46E5"
//                     strokeWidth={2}
//                     fill="url(#colorRevenue)"
//                   />
//                   <Tooltip content={<MiniChartTooltip />} />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           {/* Order Status Summary */}
//           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
//             <h3 className="text-lg font-semibold text-gray-800 mb-6">
//               Order Status
//             </h3>
//             <div className="space-y-4">
//               {[
//                 {
//                   title: "Pending Orders",
//                   value: analyticsData.pendingOrders || 0,
//                   color: "bg-yellow-100 text-yellow-800",
//                   icon: Hourglass,
//                 },
//                 {
//                   title: "Processing",
//                   value: analyticsData.processingOrders || 0,
//                   color: "bg-blue-100 text-blue-800",
//                   icon: Hourglass,
//                 },
//                 {
//                   title: "Shipped",
//                   value: analyticsData.shippedOrders || 0,
//                   color: "bg-cyan-100 text-cyan-800",
//                   icon: Truck,
//                 },
//                 {
//                   title: "Delivered",
//                   value: analyticsData.deliveredOrders || 0,
//                   color: "bg-green-100 text-green-800",
//                   icon: CheckCircle,
//                 },
//                 {
//                   title: "Cancelled",
//                   value: analyticsData.canceledOrders || 0,
//                   color: "bg-red-100 text-red-800",
//                   icon: XCircle,
//                 },
//               ].map((item) => (
//                 <div
//                   key={item.title}
//                   className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div
//                       className={`p-2 rounded-lg ${item.color.split(" ")[0]}`}
//                     >
//                       <item.icon className="h-4 w-4" />
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-gray-700">
//                         {item.title}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <span className="text-lg font-bold text-gray-900">
//                       {item.value}
//                     </span>
//                     <div
//                       className={`px-2 py-1 rounded-full text-xs ${item.color}`}
//                     >
//                       <span>
//                         {(
//                           (item.value / (analyticsData.allOrders || 1)) *
//                           100
//                         ).toFixed(1)}
//                         %
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Revenue Section - Updated design */}
//         <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
//           <h3 className="text-lg font-semibold text-gray-800 mb-6">
//             Revenue Analytics
//           </h3>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
//               <div className="flex items-center gap-3 mb-3">
//                 <div className="bg-indigo-100 p-2 rounded-lg">
//                   <DollarSign className="h-5 w-5 text-indigo-600" />
//                 </div>
//                 <p className="text-gray-600 font-medium">Gross Revenue</p>
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-2">
//                 ₦{analyticsData.grossRevenue?.toLocaleString() || "0"}
//               </h3>
//               <div className="flex items-center gap-2">
//                 <TrendingUp className="h-4 w-4 text-green-500" />
//                 <span className="text-green-600 text-sm">
//                   +24.3% from last period
//                 </span>
//               </div>
//             </div>

//             <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-100">
//               <div className="flex items-center gap-3 mb-3">
//                 <div className="bg-red-100 p-2 rounded-lg">
//                   <XCircle className="h-5 w-5 text-red-600" />
//                 </div>
//                 <p className="text-gray-600 font-medium">Refunded Amount</p>
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-2">
//                 ₦{analyticsData.totalRefunded?.toLocaleString() || "0"}
//               </h3>
//               <div className="flex items-center gap-2">
//                 <TrendingDown className="h-4 w-4 text-red-500" />
//                 <span className="text-red-600 text-sm">
//                   -8.7% from last period
//                 </span>
//               </div>
//             </div>

//             <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
//               <div className="flex items-center gap-3 mb-3">
//                 <div className="bg-emerald-100 p-2 rounded-lg">
//                   <CheckCircle className="h-5 w-5 text-emerald-600" />
//                 </div>
//                 <p className="text-gray-600 font-medium">Net Revenue</p>
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-2">
//                 ₦{analyticsData.netRevenue?.toLocaleString() || "0"}
//               </h3>
//               <div className="flex items-center gap-2">
//                 <TrendingUp className="h-4 w-4 text-green-500" />
//                 <span className="text-green-600 text-sm">
//                   +18.9% from last period
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Revenue Chart */}
//           <div className="mt-6">
//             <div className="flex justify-between items-center mb-4">
//               <h4 className="text-gray-700 font-medium">Revenue Trend</h4>
//               <div className="flex gap-2">
//                 <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg">
//                   Revenue
//                 </button>
//                 <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">
//                   Orders
//                 </button>
//               </div>
//             </div>
//             <ResponsiveContainer width="100%" height={250}>
//               <LineChart data={salesData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
//                 <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
//                 <YAxis
//                   stroke="#6B7280"
//                   fontSize={12}
//                   tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
//                 />
//                 <Tooltip
//                   content={<CustomTooltip />}
//                   contentStyle={{
//                     backgroundColor: "white",
//                     border: "1px solid #E5E7EB",
//                     borderRadius: "8px",
//                     boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//                   }}
//                 />
//                 <Line
//                   type="monotone"
//                   dataKey="revenue"
//                   stroke="#4F46E5"
//                   strokeWidth={3}
//                   dot={{ r: 4 }}
//                   activeDot={{ r: 6, strokeWidth: 0 }}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Additional Analytics Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <AnalyticsCard
//             title="Total Products"
//             value={analyticsData.products}
//             icon={Package}
//             bgColor="bg-gradient-to-br from-purple-50 to-pink-50"
//             borderColor="border-purple-100"
//             iconColor="text-purple-600"
//             iconBg="bg-purple-100"
//           />
//           <AnalyticsCard
//             title="Total Visitors"
//             value={analyticsData.visitors}
//             icon={Users}
//             bgColor="bg-gradient-to-br from-cyan-50 to-blue-50"
//             borderColor="border-cyan-100"
//             iconColor="text-cyan-600"
//             iconBg="bg-cyan-100"
//           />
//           <AnalyticsCard
//             title="Active Users"
//             value={analyticsData.users}
//             icon={Users}
//             bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
//             borderColor="border-green-100"
//             iconColor="text-green-600"
//             iconBg="bg-green-100"
//           />
//           <AnalyticsCard
//             title="Refund Status"
//             value={`${analyticsData.refundsApproved || 0}/${
//               analyticsData.refundsPending || 0
//             }`}
//             icon={CheckCircle}
//             bgColor="bg-gradient-to-br from-orange-50 to-amber-50"
//             borderColor="border-orange-100"
//             iconColor="text-orange-600"
//             iconBg="bg-orange-100"
//             subtitle={`${analyticsData.refundsRejected || 0} rejected`}
//           />
//         </div>
//       </motion.div>
//     </>
//   );
// };

// // Updated AnalyticsCard component with screenshot-inspired design
// const AnalyticsCard = ({
//   title,
//   value,
//   icon: Icon,
//   chartData,
//   bgColor = "bg-gradient-to-br from-gray-50 to-white",
//   borderColor = "border-gray-200",
//   iconColor = "text-gray-600",
//   iconBg = "bg-gray-100",
//   subtitle,
//   dataKey = "count",
// }) => (
//   <motion.div
//     className={`rounded-2xl p-6 shadow-sm border ${borderColor} ${bgColor}`}
//     initial={{ opacity: 0, y: 10 }}
//     animate={{ opacity: 1, y: 0 }}
//     transition={{ duration: 0.3 }}
//   >
//     <div className="flex justify-between items-start mb-4">
//       <div>
//         <p className="text-gray-600 text-sm font-medium">{title}</p>
//         <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
//         {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
//       </div>
//       <div className={`p-3 rounded-xl ${iconBg}`}>
//         <Icon className={`h-6 w-6 ${iconColor}`} />
//       </div>
//     </div>

//     {chartData && chartData.length > 0 && (
//       <ResponsiveContainer width="100%" height={60}>
//         <LineChart data={chartData.slice(-8)}>
//           <Line
//             type="monotone"
//             dataKey={dataKey}
//             stroke={iconColor.replace("text-", "#")}
//             strokeWidth={2}
//             dot={false}
//           />
//           <Tooltip content={<MiniChartTooltip />} />
//         </LineChart>
//       </ResponsiveContainer>
//     )}
//   </motion.div>
// );

// // Tooltip components remain the same
// const MiniChartTooltip = ({ active, payload }) =>
//   active && payload && payload.length ? (
//     <div className="bg-white text-gray-800 text-xs px-2 py-1 rounded-md border border-gray-300 shadow-sm">
//       {payload[0].value}
//     </div>
//   ) : null;

// const CustomTooltip = ({ active, payload, label }) =>
//   active && payload && payload.length ? (
//     <div className="bg-white border border-gray-300 rounded-lg p-3 text-gray-800 shadow-lg">
//       <p className="font-semibold text-gray-900 mb-1">{label}</p>
//       {payload.map((item) => (
//         <p key={item.dataKey} className="text-sm">
//           <span style={{ color: item.color }}>● </span>
//           {item.name}:{" "}
//           <span className="font-semibold">₦{item.value?.toLocaleString()}</span>
//         </p>
//       ))}
//     </div>
//   ) : null;

// /* -----------------------------
//    Date Label Formatter
// ----------------------------- */
// export const formatDateLabel = (item, range) => {
//   const value =
//     typeof item === "string" ? item : item?.date || item?.weekStart || item;

//   if (range === "daily") {
//     if (typeof value === "string" && value.includes("T")) {
//       const date = new Date(value + ":00:00");
//       return date.toLocaleTimeString("en-US", {
//         hour: "numeric",
//         hour12: true,
//       });
//     }
//     const d = new Date(value);
//     return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
//   }

//   if (range === "weekly") {
//     const d = new Date(value);
//     return d.toLocaleDateString("en-US", { weekday: "short" });
//   }

//   if (range === "monthly") {
//     if (typeof value === "string" && /^\d{4}-\d{2}$/.test(value)) {
//       return new Date(value + "-01").toLocaleDateString("en-US", {
//         month: "short",
//         year: "numeric",
//       });
//     }
//     const d = new Date(value);
//     return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
//   }

//   if (range === "yearly") {
//     if (typeof value === "string" && /^\d{4}$/.test(value)) return value;
//     const d = new Date(value);
//     return d.getFullYear();
//   }

//   const d = new Date(value);
//   return d.toLocaleDateString("en-US", {
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   });
// };


















































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
    <>
    <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className=" flex justify-center align-middle text-black py-5 ">
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
      <div className="text-center mb-6">
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
    </motion.div>
    </>
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
