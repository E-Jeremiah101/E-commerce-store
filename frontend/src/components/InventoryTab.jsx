// import React, { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { ShoppingBag, Layers} from "lucide-react";
// import { useUserStore } from "../stores/useUserStore.js";
// import { useInventoryStore } from "../stores/useInventoryStore.js";
// import { exportInventoryPDF, exportSimpleInventoryPDF } from "../utils/exportInventoryPdf.js";
// import axios from "../lib/axios.js";
// import {
//   Package,
//   AlertTriangle,
//   TrendingUp,
//   TrendingDown,
//   DollarSign,
//   TrendingDown as SlashIcon,
//   RefreshCw as UpdateIcon,
//   Undo as ResetIcon,
//   XCircle as CloseIcon,
//   Warehouse,
//   Undo,

//   History,
//   RefreshCw,
//   BarChart,
//   ShoppingCart,
//   CheckCircle,
//   XCircle,
//   Plus,
//   Minus,
//   Download,
//   FileText,
//   Upload,
//   Tag,
//   Filter,
//   Search,
//   ArrowUpDown,
//   Calendar,
//   PieChart,
//   MapPin,
//   Bell,
//   Settings,
//   Eye,
//   Clock,
//   MoreVertical,
//   ChevronDown,
//   AlertCircle,
// } from "lucide-react";
// import toast from "react-hot-toast";

// const InventoryTab = () => {
//   const {
//     // State
//     loading,
//     dashboardData,
//     stockLevels,
//     lowStockAlerts,
//     reorderSuggestions,
//     inventoryValuation,
//     stockHistory,
//     inventoryByLocation,
//     inventoryAging,
//     fetchInventoryAging,

//     // Actions
//     fetchDashboard,
//     fetchStockLevels,
//     fetchLowStockAlerts,
//     fetchReorderSuggestions,
//     fetchInventoryValuation,
//     fetchStockHistory,
//     fetchInventoryByLocation,
//     adjustStock,
//     exportInventoryReport,
//     updateFilters,
//     clearFilters,
//     getInventoryStats,
//     setActiveTab,
//     activeTab,
// updateProductPrice,
//     // Computed
//     pagination,
//     filters,
//   } = useInventoryStore();
//   useEffect(() => {
//     console.log(" Stock Levels Data:", stockLevels);
//     console.log(" First Product:", stockLevels[0]);
//     console.log(" First Product Variants:", stockLevels[0]?.variants);
//   }, [stockLevels]);
//   const [expandedBuckets, setExpandedBuckets] = useState({});

//   const handleRefresh = () => {
//     toast.loading("Refreshing data...");
//     switch (activeTab) {
//       case "dashboard":
//         fetchDashboard();
//         break;
//       case "stock-levels":
//         fetchStockLevels(pagination.currentPage, filters);
//         break;
//       case "low-stock":
//         fetchLowStockAlerts(10);
//         break;
//       case "price-management": // New case
//         fetchStockLevels(pagination.currentPage, filters);
//         break;
//       case "valuation":
//         fetchInventoryValuation();
//         break;
//       case "history":
//         fetchStockHistory();
//         break;
//       case "locations":
//         fetchInventoryByLocation();
//         break;
//       default:
//         fetchDashboard();
//     }

//     // Dismiss loading toast after 1 second
//     setTimeout(() => {
//       toast.dismiss();
//       toast.success("Data refreshed successfully!");
//     }, 1000);
//   };

//   const [showAdjustModal, setShowAdjustModal] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [adjustmentData, setAdjustmentData] = useState({
//     adjustmentType: "add",
//     quantity: 1,
//     reason: "restock",
//     notes: "",
//   });
//   const [showPriceModal, setShowPriceModal] = useState(false);
//   const [selectedProductForPrice, setSelectedProductForPrice] = useState(null);

//   const handlePriceAction = (product) => {
//     setSelectedProductForPrice(product);
//     setShowPriceModal(true);
//   };

//   const handlePriceUpdate = (updatedProduct) => {
//     // Update local state
//     setSelectedProductForPrice(updatedProduct);
//   };

//   const { user } = useUserStore();

//   // Fetch dashboard on mount
//   useEffect(() => {
//     fetchDashboard();
//   }, []);
//   useEffect(() => {
//     console.log("📊 Current pagination:", pagination);
//     console.log("📦 Stock levels count:", stockLevels.length);
//     console.log("🔍 Has next page?", pagination.hasNextPage);
//     console.log("🔍 Has prev page?", pagination.hasPrevPage);
//   }, [pagination, stockLevels]);

//   // Load data based on active tab
//   useEffect(() => {
//     if (activeTab === "stock-levels") {
//       fetchStockLevels(1, filters);
//     }
//     if (activeTab === "low-stock") {
//       fetchLowStockAlerts(10);
//     }
//     if (activeTab === "valuation") {
//       fetchInventoryAging();
//     }
//      if (activeTab === "price-management") {
//        // Fetch stock levels with price-related filters
//        fetchStockLevels(1, { ...filters, sortBy: "price" });
//      }
//     if (activeTab === "valuation") {
//       fetchInventoryValuation();
//     }
//     if (activeTab === "history") {
//       fetchStockHistory();
//     }
//     if (activeTab === "locations") {
//       fetchInventoryByLocation();
//     }
//   }, [activeTab]);

//   // Get stats for display
//   const stats = getInventoryStats();

//   // Update the export function in InventoryTab
//   const handleExportPDF = () => {
//     try {
//       // Prepare data for export
//       const exportData = stockLevels.flatMap((product) => {
//         if (!product.variants || product.variants.length === 0) {
//           return [
//             {
//               name: product.name,
//               product: product.name,
//               category: product.category,
//               countInStock: product.totalStock || 0,
//               stock: product.totalStock || 0,
//               price: product.price || 0,
//               totalValue: product.totalValue || 0,
//             },
//           ];
//         }

//         return product.variants.map((variant) => ({
//           name: product.name,
//           product: product.name,
//           category: product.category,
//           color: variant.color,
//           size: variant.size,
//           countInStock: variant.countInStock || 0,
//           stock: variant.countInStock || 0,
//           price: variant.price || product.price || 0,
//           sku: variant.sku,
//           variantValue: variant.variantValue || 0,
//         }));
//       });

//       // Get summary
//       const summary = {
//         totalProducts: stockLevels.length,
//         totalValue: stockLevels.reduce(
//           (sum, p) => sum + (p.totalValue || 0),
//           0
//         ),
//         lowStockCount: stockLevels.filter((p) => p.status === "low").length,
//         outOfStockCount: stockLevels.filter((p) => p.status === "out").length,
//       };

//       // Use the simple version (most reliable)
//       exportSimpleInventoryPDF(exportData);

//       toast.success("PDF exported successfully!");
//     } catch (error) {
//       console.error("Export error:", error);
//       toast.error("Failed to export PDF");
//     }
//   };



//   const handleAdjustStock = (product) => {
//     console.log("🔄 Adjusting product:", product);

//     setSelectedProduct({
//       id: product.id,
//       name: product.name,
//       image: product.image,
//       category: product.category,
//       price: product.price,
//       variants: product.variants || [],
//     });

//     setAdjustmentData({
//       adjustmentType: "add",
//       quantity: 1,
//       reason: "restock",
//       notes: "",
//     });
//     setShowAdjustModal(true);
//   };

//   // Update the submitAdjustment function to pass variantId
//   const submitAdjustment = async (adjustmentDataWithVariant) => {
//     if (!selectedProduct) return;

//     try {
//       await adjustStock(selectedProduct.id, adjustmentDataWithVariant);
//       setShowAdjustModal(false);
//       setSelectedProduct(null);

//       // Refresh current view
//       if (activeTab === "stock-levels") {
//         fetchStockLevels(pagination.currentPage, filters);
//       }
//       if (activeTab === "low-stock") {
//         fetchLowStockAlerts(10);
//       }
//       if (activeTab === "dashboard") {
//         fetchDashboard();
//       }
//     } catch (error) {
//       // Error is handled in store
//     }
//   };

//   const handleSearch = (e) => {
//     const searchValue = e.target.value;
//     updateFilters({ search: searchValue });
//     // Debounce or call fetch after search
//     if (activeTab === "stock-levels") {
//       setTimeout(
//         () => fetchStockLevels(1, { ...filters, search: searchValue }),
//         500
//       );
//     }
//   };
//   const handleSyncOrders = async () => {
//     try {
//       toast.loading("Syncing orders with inventory...");
//       const res = await axios.post("/inventory/sync-orders");
//       toast.dismiss();
//       toast.success(`Synced ${res.data.synced || 0} orders successfully!`);

//       // Refresh dashboard data
//       fetchDashboard();
//     } catch (error) {
//       toast.dismiss();
//       toast.error("Failed to sync orders");
//     }
//   };

//   if (loading && !dashboardData) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="bg-white shadow-sm border-b"
//       >
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">
//                 Inventory Management
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 Welcome back, {user?.firstname || "Admin"}! Manage your store's
//                 inventory.
//               </p>
//             </div>
//             <div className="flex items-center gap-3 mt-4 sm:mt-0">
//               <div className="flex flex-wrap gap-2">
//                 <button
//                   onClick={handleExportPDF}
//                   className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//                 >
//                   <FileText className="h-4 w-4" />
//                   Export PDF
//                 </button>
//               </div>

//               <button
//                 onClick={handleSyncOrders}
//                 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
//               >
//                 <RefreshCw className="h-4 w-4" />
//                 Sync Orders
//               </button>
//               <button
//                 onClick={handleRefresh}
//                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 <RefreshCw className="h-4 w-4" />
//                 Refresh
//               </button>
//             </div>
//           </div>


//           {/* Tabs */}
//           <div className="flex space-x-1 overflow-x-auto pb-2">
//             {[
//               { id: "dashboard", label: "Dashboard", icon: BarChart },
//               { id: "stock-levels", label: "Stock Levels", icon: Package },
//               { id: "low-stock", label: "Low Stock", icon: AlertTriangle },
//               { id: "price-management", label: "Price Management", icon: Tag },
//               { id: "valuation", label: "Valuation", icon: DollarSign },
//               { id: "locations", label: "Locations", icon: MapPin },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
//                   activeTab === tab.id
//                     ? "bg-blue-600 text-white"
//                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                 }`}
//               >
//                 <tab.icon className="h-4 w-4" />
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       </motion.div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {activeTab === "dashboard" && dashboardData && (
//           <DashboardView data={dashboardData} />
//         )}

//         {activeTab === "stock-levels" && (
//           <StockLevelsView
//             stockLevels={stockLevels}
//             onAdjust={handleAdjustStock}
//             loading={loading}
//             onSearch={handleSearch}
//             filters={filters}
//             updateFilters={updateFilters} // Add this
//             clearFilters={clearFilters} // Add this
//             pagination={pagination} // Add this
//             onPageChange={(page) => fetchStockLevels(page, filters)}
//           />
//         )}

//         {activeTab === "low-stock" && (
//           <LowStockView alerts={lowStockAlerts} onAdjust={handleAdjustStock} />
//         )}

//         {activeTab === "price-management" && (
//           <PriceManagementView
//             products={stockLevels}
//             loading={loading}
//             onPriceAction={handlePriceAction}
//             filters={filters}
//             updateFilters={updateFilters}
//             clearFilters={clearFilters}
//             pagination={pagination}
//             onPageChange={(page) =>
//               fetchStockLevels(page, { ...filters, sortBy: "price" })
//             }
//             updateProductPrice={updateProductPrice}
//           />
//         )}
//         {activeTab === "valuation" && <AgingReportView data={inventoryAging} />}

//         {activeTab === "valuation" && inventoryValuation && (
//           <ValuationView data={inventoryValuation} />
//         )}

//         {activeTab === "history" && (
//           <HistoryView history={stockHistory} loading={loading} />
//         )}

//         {activeTab === "locations" && (
//           <LocationsView locations={inventoryByLocation} />
//         )}
//       </div>

//       {/* Adjust Stock Modal */}
//       {showAdjustModal && selectedProduct && (
//         <AdjustStockModal
//           product={selectedProduct}
//           data={adjustmentData}
//           onChange={setAdjustmentData}
//           onSubmit={submitAdjustment}
//           onClose={() => setShowAdjustModal(false)}
//         />
//       )}
//       {showPriceModal && selectedProductForPrice && (
//         <PriceManagementModal
//           product={selectedProductForPrice}
//           onClose={() => {
//             setShowPriceModal(false);
//             setSelectedProductForPrice(null);
//           }}
//           onUpdate={handlePriceUpdate}
//         />
//       )}
//     </div>
//   );
// };


// const LocationsView = ({ locations }) => (
//   <div className="space-y-6">
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//       {locations.map((location) => (
//         <div
//           key={location.id}
//           className="bg-white rounded-xl shadow-sm border p-6"
//         >
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-lg font-semibold text-gray-800">
//               {location.name}
//             </h3>
//             <MapPin className="h-5 w-5 text-gray-400" />
//           </div>
//           <p className="text-gray-600 text-sm mb-4">{location.address}</p>
//           <div className="space-y-3">
//             <div className="flex justify-between">
//               <span className="text-gray-600">Total Items:</span>
//               <span className="font-semibold">{location.totalItems}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-600">Total Value:</span>
//               <span className="font-semibold">
//                 ₦{location.totalValue?.toLocaleString()}
//               </span>
//             </div>
//           </div>
//           <div className="mt-6">
//             <h4 className="text-sm font-medium text-gray-700 mb-2">
//               Top Products
//             </h4>
//             <div className="space-y-2">
//               {location.products?.map((product) => (
//                 <div
//                   key={product.productId}
//                   className="flex justify-between text-sm"
//                 >
//                   <span className="truncate">{product.productName}</span>
//                   <span className="font-medium">{product.stock} units</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// // Add this component before the StockLevelsView function
// const PriceDisplay = ({
//   price,
//   previousPrice,
//   isPriceSlashed,
//   discountPercentage,
// }) => {
//   if (isPriceSlashed && previousPrice) {
//     const discount =
//       discountPercentage ||
//       (((previousPrice - price) / previousPrice) * 100).toFixed(1);

//     return (
//       <div className="flex flex-col">
//         <div className="flex items-center gap-2">
//           <span className="font-semibold text-green-700">
//             ₦{price?.toLocaleString()}
//           </span>
//           <span className="text-gray-500 line-through text-sm">
//             ₦{previousPrice?.toLocaleString()}
//           </span>
//           <span className="bg-red-100 text-red-800 text-xs font-medium px-1.5 py-0.5 rounded">
//             {discount}% OFF
//           </span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <span className="font-semibold text-gray-900">
//       ₦{price?.toLocaleString()}
//     </span>
//   );
// };

// // Add this component for price management
// const PriceManagementModal = ({ product, onClose, onUpdate }) => {
//   const { slashProductPrice, resetProductPrice, updateProductPrice } =
//     useInventoryStore();
//   const [newPrice, setNewPrice] = useState("");
//   const [reason, setReason] = useState("");
//   const [action, setAction] = useState("update");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async () => {
//     if (!newPrice && action !== "reset") {
//       toast.error("Please enter a price");
//       return;
//     }

//     setLoading(true);
//     try {
//       let result;

//       switch (action) {
//         case "slash":
//           result = await slashProductPrice(
//             product.id,
//             parseFloat(newPrice),
//             reason
//           );
//           break;
//         case "reset":
//           result = await resetProductPrice(product.id, reason);
//           break;
//         case "update":
//         default:
//           result = await updateProductPrice(
//             product.id,
//             parseFloat(newPrice),
//             reason
//           );
//           break;
//       }

//       toast.success(result.message || "Price updated successfully");
//       if (onUpdate) {
//         onUpdate(result.product);
//       }
//       onClose();
//     } catch (error) {
//       // Error is handled in store
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//         <div className="p-6">
//           {/* Header */}
//           <div className="flex justify-between items-start mb-6">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-800">
//                 Manage Price
//               </h3>
//               <p className="text-sm text-gray-500 mt-1">{product.name}</p>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600 p-1"
//             >
//               {/* <CloseIcon className="h-5 w-5" /> */}
//             </button>
//           </div>

//           {/* Current Price Info */}
//           <div className="mb-6 p-4 bg-gray-50 rounded-lg">
//             <div className="flex justify-between items-center mb-2">
//               <span className="text-gray-600">Current Price:</span>
//               <PriceDisplay
//                 price={product.price}
//                 previousPrice={product.previousPrice}
//                 isPriceSlashed={product.isPriceSlashed}
//                 discountPercentage={product.discountPercentage}
//               />
//             </div>
//             {product.isPriceSlashed && product.previousPrice && (
//               <div className="flex justify-between items-center text-sm">
//                 <span className="text-gray-500">Original Price:</span>
//                 <span className="text-gray-500 line-through">
//                   ₦{product.previousPrice?.toLocaleString()}
//                 </span>
//               </div>
//             )}
//           </div>

//           {/* Action Selection */}
//           <div className="mb-6">
//             <label className="block text-sm font-medium text-gray-700 mb-3">
//               Select Action
//             </label>
//             <div className="grid grid-cols-3 gap-3">
//               {[
//                 {
//                   value: "update",
//                   label: "Update",
//                   icon: UpdateIcon,
//                   color: "bg-blue-50 border-blue-200 text-blue-700",
//                 },
//                 {
//                   value: "slash",
//                   label: "Slash",
//                   icon: SlashIcon,
//                   color: "bg-red-50 border-red-200 text-red-700",
//                   disabled: product.isPriceSlashed,
//                 },
//                 {
//                   value: "reset",
//                   label: "Reset",
//                   icon: ResetIcon,
//                   color: "bg-gray-50 border-gray-200 text-gray-700",
//                   disabled: !product.isPriceSlashed,
//                 },
//               ].map((type) => (
//                 <button
//                   key={type.value}
//                   type="button"
//                   onClick={() => setAction(type.value)}
//                   disabled={type.disabled}
//                   className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
//                     action === type.value
//                       ? `${type.color} ring-2 ring-offset-1 ring-opacity-30`
//                       : "border-gray-300 hover:bg-gray-50"
//                   } ${type.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
//                 >
//                   <type.icon className="h-5 w-5" />
//                   <span className="text-sm font-medium">{type.label}</span>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Price Input (only for update and slash) */}
//           {action !== "reset" && (
//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 New Price
//               </label>
//               <div className="relative">
//                 <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                   ₦
//                 </span>
//                 <input
//                   type="number"
//                   value={newPrice}
//                   onChange={(e) => setNewPrice(e.target.value)}
//                   className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="0.00"
//                   min="0"
//                   step="0.01"
//                 />
//               </div>
//               {action === "slash" &&
//                 newPrice &&
//                 parseFloat(newPrice) >= product.price && (
//                   <p className="text-red-500 text-xs mt-1">
//                     Slash price must be lower than current price
//                   </p>
//                 )}
//             </div>
//           )}

//           {/* Reason Input */}
//           <div className="mb-6">
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Reason {action !== "reset" && "(Optional)"}
//             </label>
//             <input
//               type="text"
//               value={reason}
//               onChange={(e) => setReason(e.target.value)}
//               className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               placeholder="e.g., Sale, Clearance, Promotion"
//             />
//           </div>

//           {/* Summary */}
//           <div className="mb-6 p-4 bg-gray-50 rounded-lg">
//             <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
//             <div className="space-y-1 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Action:</span>
//                 <span className="font-medium capitalize">{action}</span>
//               </div>
//               {action !== "reset" && newPrice && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">New Price:</span>
//                   <span className="font-medium">
//                     ₦{parseFloat(newPrice).toLocaleString()}
//                   </span>
//                 </div>
//               )}
//               {action === "reset" && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Will reset to:</span>
//                   <span className="font-medium text-blue-600">
//                     ₦{product.previousPrice?.toLocaleString()}
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex justify-end gap-3">
//             <button
//               onClick={onClose}
//               className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSubmit}
//               disabled={
//                 loading ||
//                 (action !== "reset" && !newPrice) ||
//                 (action === "slash" &&
//                   newPrice &&
//                   parseFloat(newPrice) >= product.price)
//               }
//               className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
//             >
//               {loading ? (
//                 <div className="flex items-center gap-2">
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   Processing...
//                 </div>
//               ) : action === "reset" ? (
//                 "Reset Price"
//               ) : (
//                 "Apply Changes"
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };


// // Update the StockLevelsView component
// const StockLevelsView = ({
//   stockLevels,
//   onAdjust,
//   loading,
//   onSearch,
//   filters,
//   updateFilters,
//   clearFilters,
//   pagination,
//   onPageChange,
// }) => {
//   const [expandedProducts, setExpandedProducts] = useState({});
//   const [showPriceModal, setShowPriceModal] = useState(false);
//   const [selectedProductForPrice, setSelectedProductForPrice] = useState(null);

//   const toggleProductExpand = (productId) => {
//     setExpandedProducts((prev) => ({
//       ...prev,
//       [productId]: !prev[productId],
//     }));
//   };

//   const handlePriceAction = (product) => {
//     setSelectedProductForPrice(product);
//     setShowPriceModal(true);
//   };

//   const handlePriceUpdate = (updatedProduct) => {
//     // Update local state
//     setSelectedProductForPrice(updatedProduct);
//   };

//   return (
//     <>
//       <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
//         <div className="p-6 border-b">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//             <h2 className="text-xl font-semibold text-gray-800">
//               Stock Levels
//             </h2>
//             <div className="flex items-center gap-3">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search products..."
//                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   value={filters.search || ""}
//                   onChange={onSearch}
//                 />
//               </div>
//               <select
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 value={filters.category || ""}
//                 onChange={(e) => updateFilters({ category: e.target.value })}
//               >
//                 <option value="">All Categories</option>
//                 <option value="electronics">Electronics</option>
//                 <option value="fashion">Fashion</option>
//                 <option value="home">Home</option>
//               </select>
//               <button
//                 className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
//                 onClick={() => clearFilters()}
//               >
//                 <Filter className="h-4 w-4" />
//               </button>
//             </div>
//           </div>
//         </div>
//         {loading ? (
//           <div className="flex justify-center items-center p-12">
//             <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Product
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Category
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Price
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Total Stock
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Value
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {stockLevels.map((product) => (
//                   <React.Fragment key={product.id}>
//                     {/* Product Summary Row */}
//                     <tr className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           {product.image && (
//                             <img
//                               src={product.image}
//                               alt={product.name}
//                               className="h-10 w-10 rounded object-cover mr-3"
//                             />
//                           )}
//                           <div>
//                             <div className="text-sm font-medium text-gray-900">
//                               {product.name}
//                             </div>
//                             <div className="text-xs text-gray-500">
//                               {product.variantsCount} variants
//                             </div>
//                             {product.variantsCount > 0 && (
//                               <button
//                                 onClick={() => toggleProductExpand(product.id)}
//                                 className="text-xs text-blue-600 hover:text-blue-800 mt-1"
//                               >
//                                 {expandedProducts[product.id] ? "Hide" : "Show"}{" "}
//                                 variants
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
//                           {product.category}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <PriceDisplay
//                           price={product.price}
//                           previousPrice={product.previousPrice}
//                           isPriceSlashed={product.isPriceSlashed}
//                           discountPercentage={product.discountPercentage}
//                         />
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">
//                           {product.totalStock || 0}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <StockStatusBadge status={product.status} />
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">
//                           ₦{product.totalValue?.toLocaleString() || "0"}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                         <div className="flex items-center gap-2">
//                           <button
//                             onClick={() =>
//                               onAdjust({
//                                 ...product,
//                                 variants: product.variants || [],
//                               })
//                             }
//                             className="text-blue-600 hover:text-blue-900"
//                             title="Adjust Stock"
//                           >
//                             Adjust
//                           </button>
//                           <span className="text-gray-300">|</span>
//                           <button
//                             onClick={() => handlePriceAction(product)}
//                             className="text-green-600 hover:text-green-900"
//                             title="Manage Price"
//                           >
//                             Price
//                           </button>
//                           <span className="text-gray-300">|</span>
//                           <button className="text-gray-600 hover:text-gray-900">
//                             <Eye className="h-4 w-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>

//                     {/* Variant Rows */}
//                     {expandedProducts[product.id] &&
//                       product.variants &&
//                       product.variants.length > 0 && (
//                         <>
//                           {product.variants.map((variant) => (
//                             <tr
//                               key={variant._id}
//                               className="bg-gray-50 hover:bg-gray-100"
//                             >
//                               <td className="px-6 py-3 pl-10">
//                                 <div className="flex items-center">
//                                   <div className="ml-2">
//                                     <div className="text-sm text-gray-900 flex items-center gap-2">
//                                       <span className="font-medium">
//                                         {variant.color || "Default"}
//                                       </span>
//                                       <span className="text-gray-500">-</span>
//                                       <span className="font-medium">
//                                         {variant.size || "One Size"}
//                                       </span>
//                                     </div>
//                                     <div className="text-xs text-gray-500">
//                                       SKU: {variant.sku || "N/A"}
//                                     </div>
//                                   </div>
//                                 </div>
//                               </td>
//                               <td className="px-6 py-3">
//                                 <span className="text-xs text-gray-500">
//                                   Variant
//                                 </span>
//                               </td>
//                               <td className="px-6 py-3">
//                                 <span className="text-sm font-medium text-gray-900">
//                                   ₦{variant.price?.toLocaleString() || "0"}
//                                 </span>
//                               </td>
//                               <td className="px-6 py-3">
//                                 <div className="text-sm font-medium text-gray-900">
//                                   {variant.countInStock}
//                                 </div>
//                               </td>
//                               <td className="px-6 py-3">
//                                 <StockStatusBadge
//                                   status={
//                                     variant.countInStock === 0
//                                       ? "out"
//                                       : variant.countInStock <= 5
//                                       ? "low"
//                                       : "healthy"
//                                   }
//                                 />
//                               </td>
//                               <td className="px-6 py-3">
//                                 <div className="text-sm text-gray-900">
//                                   ₦
//                                   {variant.variantValue?.toLocaleString() ||
//                                     "0"}
//                                 </div>
//                               </td>
//                               <td className="px-6 py-3 text-sm font-medium">
//                                 <button
//                                   onClick={() =>
//                                     onAdjust({
//                                       ...product,
//                                       variantId: variant._id,
//                                       variantName: `${
//                                         variant.color || "Default"
//                                       } - ${variant.size || "One Size"}`,
//                                       currentStock: variant.countInStock,
//                                     })
//                                   }
//                                   className="text-blue-600 hover:text-blue-900 text-xs"
//                                 >
//                                   Adjust Variant
//                                 </button>
//                               </td>
//                             </tr>
//                           ))}
//                         </>
//                       )}
//                   </React.Fragment>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Pagination */}
//         <div className="flex justify-center gap-2 p-4 border-t">
//           <button
//             onClick={() => onPageChange(pagination.currentPage - 1)}
//             disabled={!pagination.hasPrevPage}
//             className={`px-3 py-1 rounded ${
//               pagination.hasPrevPage
//                 ? "bg-gray-200 hover:bg-gray-300"
//                 : "bg-gray-100 text-gray-400 cursor-not-allowed"
//             }`}
//           >
//             Previous
//           </button>
//           <button
//             onClick={() => onPageChange(pagination.currentPage + 1)}
//             disabled={!pagination.hasNextPage}
//             className={`px-3 py-1 rounded ${
//               pagination.hasNextPage
//                 ? "bg-gray-200 hover:bg-gray-300"
//                 : "bg-gray-100 text-gray-400 cursor-not-allowed"
//             }`}
//           >
//             Next
//           </button>
//         </div>
//       </div>

//       {/* Price Management Modal */}
//       {showPriceModal && selectedProductForPrice && (
//         <PriceManagementModal
//           product={selectedProductForPrice}
//           onClose={() => {
//             setShowPriceModal(false);
//             setSelectedProductForPrice(null);
//           }}
//           onUpdate={handlePriceUpdate}
//         />
//       )}
//     </>
//   );
// };


// const DashboardView = ({ data }) => (
//   <div className="space-y-6">
//     {/* Stats Cards - SHOW ALL METRICS */}
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//       <StatCard
//         title="Total Stock Value"
//         value={`₦${data.summary?.totalStockValue?.toLocaleString() || "0"}`}
//         icon={DollarSign}
//         trend="+12.5%"
//         color="blue"
//       />

//       {/* Second Row of Stats */}

//       <StatCard
//         title="Low Stock"
//         value={data.summary?.lowStockCount || 0}
//         icon={AlertTriangle}
//         trend="+3"
//         color="yellow"
//       />
//       <StatCard
//         title="Total Products"
//         value={data.summary?.totalProducts || 0}
//         icon={Layers}
//         trend="+5"
//         color="green"
//       />
//     </div>

//     {/* Fast Moving / Top Selling Products */}
//     <div className="bg-white rounded-xl shadow-sm border p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800">
//             {data.summary?.hasOrderData
//               ? "Top Selling Products (Last 30 Days)"
//               : "Fast Moving Products"}
//           </h3>
//           <p className="text-gray-600 mt-1">
//             {data.summary?.hasOrderData
//               ? "Based on actual delivered orders"
//               : "Based on current stock levels"}
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Calendar className="h-4 w-4 text-gray-400" />
//           <span className="text-sm text-gray-500">Last 30 days</span>
//         </div>
//       </div>

//       {data.fastMovingProducts && data.fastMovingProducts.length > 0 ? (
//         <div className="space-y-4">
//           {data.fastMovingProducts.map((product, index) => (
//             <div
//               key={product.id}
//               className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100"
//             >
//               <div className="flex items-center gap-4">
//                 {/* Rank Badge */}
//                 <div
//                   className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                     index === 0
//                       ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
//                       : index === 1
//                       ? "bg-gray-100 text-gray-800 border-2 border-gray-300"
//                       : index === 2
//                       ? "bg-orange-100 text-orange-800 border-2 border-orange-300"
//                       : "bg-blue-100 text-blue-800 border-2 border-blue-300"
//                   }`}
//                 >
//                   <span className="font-bold text-sm">#{index + 1}</span>
//                 </div>

//                 {/* Product Image */}
//                 <div className="relative">
//                   {product.image ? (
//                     <img
//                       src={product.image}
//                       alt={product.name}
//                       className="h-12 w-12 rounded-lg object-cover border"
//                     />
//                   ) : (
//                     <div className="h-12 w-12 rounded-lg bg-gray-100 border flex items-center justify-center">
//                       <Package className="h-6 w-6 text-gray-400" />
//                     </div>
//                   )}
//                 </div>

//                 {/* Product Info */}
//                 <div>
//                   <p className="font-medium text-gray-900">{product.name}</p>
//                   <div className="flex items-center gap-3 mt-1">
//                     {product.category && (
//                       <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
//                         {product.category}
//                       </span>
//                     )}
//                     <div className="flex items-center gap-2">
//                       <div className="flex items-center gap-1">
//                         <ShoppingBag className="h-3 w-3 text-green-600" />
//                         <span className="text-sm font-medium text-green-700">
//                           {product.totalQuantitySold ||
//                             product.currentStock ||
//                             0}{" "}
//                           {product.source === "orders" ? "sold" : "in stock"}
//                         </span>
//                       </div>
//                       {product.orderCount > 0 && (
//                         <>
//                           <span className="text-xs text-gray-400">•</span>
//                           <span className="text-xs text-gray-500">
//                             {product.orderCount} orders
//                           </span>
//                         </>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Revenue/Value */}
//               <div className="text-right">
//                 <p className="font-bold text-gray-900 text-lg">
//                   ₦{product.value?.toLocaleString() || "0"}
//                 </p>
//                 <p className="text-sm text-gray-500">
//                   {product.source === "orders" ? "Revenue" : "Stock Value"}
//                 </p>

//                 {/* Unit price */}
//                 {product.price > 0 && (
//                   <p className="text-xs text-gray-500 mt-1">
//                     ₦{product.price?.toLocaleString()} each
//                   </p>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         /* Empty State */
//         <div className="text-center py-12">
//           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
//             <ShoppingBag className="h-8 w-8 text-blue-400" />
//           </div>
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">
//             No Sales Data Available
//           </h3>
//           <p className="text-gray-600 max-w-md mx-auto">
//             Top selling products will appear here once orders are delivered and
//             processed.
//           </p>
//         </div>
//       )}
//     </div>

//     {/* Alerts Summary */}
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//       <div className="bg-white rounded-xl shadow-sm border p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-800">
//             Low Stock Alerts
//           </h3>
//           <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
//             {data.alerts?.lowStock?.length || 0} items
//           </span>
//         </div>
//         <div className="space-y-3">
//           {data.alerts?.lowStock?.slice(0, 5).map((product) => (
//             <div
//               key={product.id}
//               className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
//             >
//               <div className="flex items-center gap-3">
//                 {product.image && (
//                   <img
//                     src={product.image}
//                     alt={product.name}
//                     className="w-10 h-10 rounded object-cover"
//                   />
//                 )}
//                 <div>
//                   <p className="font-medium text-gray-800">{product.name}</p>
//                   <p className="text-sm text-gray-500">{product.category}</p>
//                 </div>
//               </div>
//               <div className="text-right">
//                 <p className="font-bold text-yellow-700">
//                   {product.currentStock} left
//                 </p>
//                 <p className="text-xs text-gray-500">
//                   Threshold: {product.threshold}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm border p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-800">Out of Stock</h3>
//           <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
//             {data.alerts?.outOfStock?.length || 0} items
//           </span>
//         </div>
//         <div className="space-y-3">
//           {data.alerts?.outOfStock?.slice(0, 5).map((product) => (
//             <div
//               key={product.id}
//               className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
//             >
//               <div className="flex items-center gap-3">
//                 {product.image && (
//                   <img
//                     src={product.image}
//                     alt={product.name}
//                     className="w-10 h-10 rounded object-cover"
//                   />
//                 )}
//                 <div>
//                   <p className="font-medium text-gray-800">{product.name}</p>
//                   <p className="text-sm text-gray-500">{product.category}</p>
//                 </div>
//               </div>
//               <div className="text-right">
//                 <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
//                   OUT OF STOCK
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   </div>
// );

// // Add the PriceManagementView component before the HistoryView component
// const PriceManagementView = ({
//   products,
//   loading,
//   onPriceAction,
//   filters,
//   updateFilters,
//   clearFilters,
//   pagination,
//   onPageChange,
//   updateProductPrice,
// }) => {
//   const [priceFilters, setPriceFilters] = useState({
//     minPrice: "",
//     maxPrice: "",
//     showSlashedOnly: false,
//     sortBy: "price",
//     sortOrder: "asc",
//   });

//   // Use local state for search with debouncing
//   const [searchInput, setSearchInput] = useState(filters.search || "");

//   // Debounce search to trigger API calls
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       // Only update if search actually changed
//       if (searchInput !== filters.search) {
//         updateFilters({ search: searchInput });

//         // Trigger API call with a slight delay
//         if (onPageChange) {
//           setTimeout(() => {
//             onPageChange(1); // Go to first page when searching
//           }, 100);
//         }
//       }
//     }, 500); // 500ms debounce

//     return () => clearTimeout(timer);
//   }, [searchInput, filters.search, updateFilters, onPageChange]);

//   // Also handle when global filters.search changes externally
//   useEffect(() => {
//     if (filters.search !== searchInput) {
//       setSearchInput(filters.search || "");
//     }
//   }, [filters.search]);


//   const handleSearch = (e) => {
//     const value = e.target.value;
//     setSearchInput(value);
//   };

//   const clearAllFilters = () => {
//     setSearchInput("");
//     setPriceFilters({
//       minPrice: "",
//       maxPrice: "",
//       showSlashedOnly: false,
//       sortBy: "price",
//       sortOrder: "asc",
//     });
//     clearFilters();
//   };

//   const [selectedProducts, setSelectedProducts] = useState([]);
//   const [bulkPriceChange, setBulkPriceChange] = useState({
//     action: "increase",
//     type: "percentage",
//     value: "",
//     reason: "",
//   });

//   const [showBulkModal, setShowBulkModal] = useState(false);

//   const filteredProducts = products
//     .filter((product) => {
//       if (
//         priceFilters.minPrice &&
//         product.price < parseFloat(priceFilters.minPrice)
//       )
//         return false;
//       if (
//         priceFilters.maxPrice &&
//         product.price > parseFloat(priceFilters.maxPrice)
//       )
//         return false;
//       if (priceFilters.showSlashedOnly && !product.isPriceSlashed) return false;
//       return true;
//     })
//     .sort((a, b) => {
//       const sortKey = priceFilters.sortBy;
//       const order = priceFilters.sortOrder === "asc" ? 1 : -1;

//       if (sortKey === "price") {
//         return (a.price - b.price) * order;
//       } else if (sortKey === "name") {
//         return a.name.localeCompare(b.name) * order;
//       } else if (sortKey === "discount") {
//         const discountA = productDiscount(a);
//         const discountB = productDiscount(b);
//         return (discountA - discountB) * order;
//       }
//       return 0;
//     });

//   const productDiscount = (product) => {
//     if (!product.isPriceSlashed || !product.previousPrice) return 0;
//     return (
//       ((product.previousPrice - product.price) / product.previousPrice) * 100
//     );
//   };

//   const toggleSelectProduct = (productId) => {
//     setSelectedProducts((prev) =>
//       prev.includes(productId)
//         ? prev.filter((id) => id !== productId)
//         : [...prev, productId]
//     );
//   };

//   const toggleSelectAll = () => {
//     if (selectedProducts.length === filteredProducts.length) {
//       setSelectedProducts([]);
//     } else {
//       setSelectedProducts(filteredProducts.map((p) => p.id));
//     }
//   };

//   const handleBulkPriceChange = async () => {
//     if (!bulkPriceChange.value || selectedProducts.length === 0) {
//       toast.error("Please select products and enter a value");
//       return;
//     }

//     if (!updateProductPrice) {
//       toast.error("Price update function not available");
//       return;
//     }

//     try {
//       toast.loading(
//         `Updating prices for ${selectedProducts.length} products...`
//       );

//       const promises = selectedProducts.map((productId) => {
//         const product = products.find((p) => p.id === productId);
//         if (!product) return Promise.resolve();

//         let newPrice;
//         const currentPrice = product.price;

//         if (bulkPriceChange.type === "percentage") {
//           const percentage = parseFloat(bulkPriceChange.value);
//           if (bulkPriceChange.action === "increase") {
//             newPrice = currentPrice * (1 + percentage / 100);
//           } else {
//             newPrice = currentPrice * (1 - percentage / 100);
//           }
//         } else {
//           const amount = parseFloat(bulkPriceChange.value);
//           if (bulkPriceChange.action === "increase") {
//             newPrice = currentPrice + amount;
//           } else {
//             newPrice = currentPrice - amount;
//           }
//         }

//         // Ensure price doesn't go negative
//         newPrice = Math.max(newPrice, 0.01);

//         // Use the passed function
//         return updateProductPrice(productId, newPrice, bulkPriceChange.reason);
//       });

//       await Promise.all(promises);
//       toast.dismiss();
//       toast.success(
//         `Updated ${selectedProducts.length} products successfully!`
//       );

//       setShowBulkModal(false);
//       setSelectedProducts([]);
//       setBulkPriceChange({
//         action: "increase",
//         type: "percentage",
//         value: "",
//         reason: "",
//       });

//       // Refresh data
//       if (onPageChange && pagination) {
//         onPageChange(pagination.currentPage);
//       }
//     } catch (error) {
//       toast.dismiss();
//       toast.error("Failed to update some prices");
//       console.error("Bulk price update error:", error);
//     }
//   };

//   const calculateSummary = () => {
//     const totalProducts = filteredProducts.length;
//     const slashedProducts = filteredProducts.filter(
//       (p) => p.isPriceSlashed
//     ).length;
//     const avgPrice =
//       totalProducts > 0
//         ? filteredProducts.reduce((sum, p) => sum + p.price, 0) / totalProducts
//         : 0;
//     const totalValue = filteredProducts.reduce(
//       (sum, p) => sum + p.totalValue,
//       0
//     );

//     let maxDiscount = 0;
//     let maxDiscountProduct = null;
//     filteredProducts.forEach((p) => {
//       if (p.isPriceSlashed && p.previousPrice) {
//         const discount = ((p.previousPrice - p.price) / p.previousPrice) * 100;
//         if (discount > maxDiscount) {
//           maxDiscount = discount;
//           maxDiscountProduct = p;
//         }
//       }
//     });

//     return {
//       totalProducts,
//       slashedProducts,
//       avgPrice,
//       totalValue,
//       maxDiscount,
//       maxDiscountProduct,
//       discountRate:
//         totalProducts > 0 ? (slashedProducts / totalProducts) * 100 : 0,
//     };
//   };

//   const summary = calculateSummary();

//   return (
//     <div className="space-y-6">
//       {/* Summary Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <div className="bg-white p-4 rounded-lg shadow border">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Total Products</p>
//               <p className="text-xl font-bold">{summary.totalProducts}</p>
//             </div>
//             <Package className="h-8 w-8 text-blue-400" />
//           </div>
//           <div className="mt-2 text-xs text-gray-500">
//             {summary.slashedProducts} with discounts
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-lg shadow border">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Average Price</p>
//               <p className="text-xl font-bold">
//                 ₦
//                 {summary.avgPrice.toLocaleString(undefined, {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 })}
//               </p>
//             </div>
//             <DollarSign className="h-8 w-8 text-green-400" />
//           </div>
//           <div className="mt-2 text-xs text-gray-500">Across all products</div>
//         </div>

//         <div className="bg-white p-4 rounded-lg shadow border">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Discount Rate</p>
//               <p className="text-xl font-bold">
//                 {summary.discountRate.toFixed(1)}%
//               </p>
//             </div>
//             <Tag className="h-8 w-8 text-red-400" />
//           </div>
//           <div className="mt-2 text-xs text-gray-500">
//             {summary.slashedProducts} discounted products
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-lg shadow border">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Total Value</p>
//               <p className="text-xl font-bold">
//                 ₦{summary.totalValue.toLocaleString()}
//               </p>
//             </div>
//             <TrendingUp className="h-8 w-8 text-purple-400" />
//           </div>
//           <div className="mt-2 text-xs text-gray-500">
//             Current inventory value
//           </div>
//         </div>
//       </div>

//       {/* Controls Bar */}
//       <div className="bg-white rounded-xl shadow-sm border p-4">
//         <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
//           <div className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={selectedProducts.length === filteredProducts.length}
//               onChange={toggleSelectAll}
//               className="h-4 w-4 rounded border-gray-300"
//             />
//             <span className="text-sm text-gray-600">
//               {selectedProducts.length} of {filteredProducts.length} selected
//             </span>
//           </div>

//           <div className="flex flex-wrap gap-3">
//             {/* Search */}
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search products..."
//                 className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 value={searchInput}
//                 onChange={handleSearch}
//               />
//             </div>

//             {/* Price Range */}
//             <div className="flex items-center gap-2">
//               <input
//                 type="number"
//                 placeholder="Min ₦"
//                 value={priceFilters.minPrice}
//                 onChange={(e) =>
//                   setPriceFilters((prev) => ({
//                     ...prev,
//                     minPrice: e.target.value,
//                   }))
//                 }
//                 className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
//                 min="0"
//                 step="0.01"
//               />
//               <span className="text-gray-400">-</span>
//               <input
//                 type="number"
//                 placeholder="Max ₦"
//                 value={priceFilters.maxPrice}
//                 onChange={(e) =>
//                   setPriceFilters((prev) => ({
//                     ...prev,
//                     maxPrice: e.target.value,
//                   }))
//                 }
//                 className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
//                 min="0"
//                 step="0.01"
//               />
//             </div>

//             {/* Filters */}
//             <select
//               className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
//               value={priceFilters.sortBy}
//               onChange={(e) =>
//                 setPriceFilters((prev) => ({ ...prev, sortBy: e.target.value }))
//               }
//             >
//               <option value="price">Sort by Price</option>
//               <option value="name">Sort by Name</option>
//               <option value="discount">Sort by Discount</option>
//             </select>

//             <select
//               className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
//               value={priceFilters.sortOrder}
//               onChange={(e) =>
//                 setPriceFilters((prev) => ({
//                   ...prev,
//                   sortOrder: e.target.value,
//                 }))
//               }
//             >
//               <option value="asc">Ascending</option>
//               <option value="desc">Descending</option>
//             </select>

//             <button
//               onClick={() =>
//                 setPriceFilters((prev) => ({
//                   ...prev,
//                   showSlashedOnly: !prev.showSlashedOnly,
//                 }))
//               }
//               className={`px-3 py-2 rounded-lg text-sm font-medium ${
//                 priceFilters.showSlashedOnly
//                   ? "bg-red-100 text-red-700 border border-red-300"
//                   : "bg-gray-100 text-gray-700 border border-gray-300"
//               }`}
//             >
//               {priceFilters.showSlashedOnly
//                 ? "Showing Discounted"
//                 : "Show Discounted"}
//             </button>

//             <button
//               onClick={() => {
//                 setPriceFilters({
//                   minPrice: "",
//                   maxPrice: "",
//                   showSlashedOnly: false,
//                   sortBy: "price",
//                   sortOrder: "asc",
//                 });
//                 clearFilters();
//               }}
//               className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
//             >
//               Clear All
//             </button>

//             {selectedProducts.length > 0 && (
//               <button
//                 onClick={() => setShowBulkModal(true)}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
//               >
//                 Bulk Update ({selectedProducts.length})
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Products Table */}
//       <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
//                   <input
//                     type="checkbox"
//                     checked={
//                       selectedProducts.length === filteredProducts.length &&
//                       filteredProducts.length > 0
//                     }
//                     onChange={toggleSelectAll}
//                     className="h-4 w-4 rounded border-gray-300"
//                   />
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Product
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Current Price
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Original Price
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Discount
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Stock Value
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Status
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {loading ? (
//                 <tr>
//                   <td colSpan="8" className="px-6 py-12 text-center">
//                     <div className="flex justify-center">
//                       <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
//                     </div>
//                   </td>
//                 </tr>
//               ) : filteredProducts.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan="8"
//                     className="px-6 py-12 text-center text-gray-500"
//                   >
//                     No products found. Try adjusting your filters.
//                   </td>
//                 </tr>
//               ) : (
//                 filteredProducts.map((product) => {
//                   const discount = productDiscount(product);
//                   const isSelected = selectedProducts.includes(product.id);

//                   return (
//                     <tr
//                       key={product.id}
//                       className={`hover:bg-gray-50 ${
//                         isSelected ? "bg-blue-50" : ""
//                       }`}
//                     >
//                       <td className="px-6 py-4">
//                         <input
//                           type="checkbox"
//                           checked={isSelected}
//                           onChange={() => toggleSelectProduct(product.id)}
//                           className="h-4 w-4 rounded border-gray-300"
//                         />
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="flex items-center">
//                           {product.image && (
//                             <img
//                               src={product.image}
//                               alt={product.name}
//                               className="h-10 w-10 rounded object-cover mr-3"
//                             />
//                           )}
//                           <div>
//                             <div className="text-sm font-medium text-gray-900">
//                               {product.name}
//                             </div>
//                             <div className="text-xs text-gray-500">
//                               {product.category}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-lg font-bold text-gray-900">
//                           ₦
//                           {product.price.toLocaleString(undefined, {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </div>
//                         <div className="text-xs text-gray-500">per unit</div>
//                       </td>
//                       <td className="px-6 py-4">
//                         {product.isPriceSlashed && product.previousPrice ? (
//                           <>
//                             <div className="text-sm text-gray-500 line-through">
//                               ₦
//                               {product.previousPrice.toLocaleString(undefined, {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               })}
//                             </div>
//                             <div className="text-xs text-gray-500">
//                               Original
//                             </div>
//                           </>
//                         ) : (
//                           <div className="text-sm text-gray-400">-</div>
//                         )}
//                       </td>
//                       <td className="px-6 py-4">
//                         {product.isPriceSlashed && discount > 0 ? (
//                           <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
//                             {discount.toFixed(1)}% OFF
//                           </div>
//                         ) : (
//                           <div className="text-sm text-gray-400">-</div>
//                         )}
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm font-medium text-gray-900">
//                           ₦{(product.totalValue || 0).toLocaleString()}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {product.totalStock || 0} units
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <StockStatusBadge status={product.status} />
//                         {product.isPriceSlashed && (
//                           <div className="mt-1">
//                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
//                               <Tag className="h-3 w-3 mr-1" />
//                               Discounted
//                             </span>
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="flex items-center gap-2">
//                           <button
//                             onClick={() => onPriceAction(product)}
//                             className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
//                           >
//                             Manage Price
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         {filteredProducts.length > 0 && (
//           <div className="flex justify-between items-center p-4 border-t">
//             <div className="text-sm text-gray-600">
//               Showing {filteredProducts.length} products
//             </div>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => onPageChange(pagination.currentPage - 1)}
//                 disabled={!pagination.hasPrevPage}
//                 className={`px-3 py-1 rounded text-sm ${
//                   pagination.hasPrevPage
//                     ? "bg-gray-200 hover:bg-gray-300"
//                     : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                 }`}
//               >
//                 Previous
//               </button>
//               <span className="px-3 py-1 text-sm text-gray-700">
//                 Page {pagination.currentPage} of {pagination.totalPages}
//               </span>
//               <button
//                 onClick={() => onPageChange(pagination.currentPage + 1)}
//                 disabled={!pagination.hasNextPage}
//                 className={`px-3 py-1 rounded text-sm ${
//                   pagination.hasNextPage
//                     ? "bg-gray-200 hover:bg-gray-300"
//                     : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                 }`}
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Bulk Update Modal */}
//       {showBulkModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-scroll no-scroll">
//           <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
//             <div className="p-6">
//               <div className="flex justify-between items-start mb-6">
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-800">
//                     Bulk Price Update
//                   </h3>
//                   <p className="text-sm text-gray-500 mt-1">
//                     Update prices for {selectedProducts.length} selected
//                     products
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => setShowBulkModal(false)}
//                   className="text-gray-400 hover:text-gray-600"
//                 >
//                   <XCircle className="h-5 w-5" />
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Action
//                   </label>
//                   <div className="grid grid-cols-2 gap-3">
//                     <button
//                       onClick={() =>
//                         setBulkPriceChange((prev) => ({
//                           ...prev,
//                           action: "increase",
//                         }))
//                       }
//                       className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
//                         bulkPriceChange.action === "increase"
//                           ? "border-green-500 bg-green-50 text-green-700"
//                           : "border-gray-300 hover:bg-gray-50"
//                       }`}
//                     >
//                       <TrendingUp className="h-5 w-5" />
//                       <span className="text-sm font-medium">Increase</span>
//                     </button>
//                     <button
//                       onClick={() =>
//                         setBulkPriceChange((prev) => ({
//                           ...prev,
//                           action: "decrease",
//                         }))
//                       }
//                       className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
//                         bulkPriceChange.action === "decrease"
//                           ? "border-red-500 bg-red-50 text-red-700"
//                           : "border-gray-300 hover:bg-gray-50"
//                       }`}
//                     >
//                       <TrendingDown className="h-5 w-5" />
//                       <span className="text-sm font-medium">Decrease</span>
//                     </button>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Type
//                   </label>
//                   <div className="grid grid-cols-2 gap-3">
//                     <button
//                       onClick={() =>
//                         setBulkPriceChange((prev) => ({
//                           ...prev,
//                           type: "percentage",
//                         }))
//                       }
//                       className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
//                         bulkPriceChange.type === "percentage"
//                           ? "border-blue-500 bg-blue-50 text-blue-700"
//                           : "border-gray-300 hover:bg-gray-50"
//                       }`}
//                     >
//                       <span className="text-lg">%</span>
//                       <span className="text-sm font-medium">Percentage</span>
//                     </button>
//                     <button
//                       onClick={() =>
//                         setBulkPriceChange((prev) => ({
//                           ...prev,
//                           type: "amount",
//                         }))
//                       }
//                       className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
//                         bulkPriceChange.type === "amount"
//                           ? "border-blue-500 bg-blue-50 text-blue-700"
//                           : "border-gray-300 hover:bg-gray-50"
//                       }`}
//                     >
//                       <DollarSign className="h-5 w-5" />
//                       <span className="text-sm font-medium">Fixed Amount</span>
//                     </button>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Value
//                   </label>
//                   <div className="relative">
//                     {bulkPriceChange.type === "percentage" ? (
//                       <div className="flex items-center">
//                         <input
//                           type="number"
//                           value={bulkPriceChange.value}
//                           onChange={(e) =>
//                             setBulkPriceChange((prev) => ({
//                               ...prev,
//                               value: e.target.value,
//                             }))
//                           }
//                           className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                           placeholder="0.00"
//                           min="0"
//                           step="0.01"
//                         />
//                         <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                           %
//                         </span>
//                       </div>
//                     ) : (
//                       <div className="flex items-center">
//                         <span className="absolute left-3 text-gray-500">₦</span>
//                         <input
//                           type="number"
//                           value={bulkPriceChange.value}
//                           onChange={(e) =>
//                             setBulkPriceChange((prev) => ({
//                               ...prev,
//                               value: e.target.value,
//                             }))
//                           }
//                           className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                           placeholder="0.00"
//                           min="0"
//                           step="0.01"
//                         />
//                       </div>
//                     )}
//                   </div>
//                   <p className="text-xs text-gray-500 mt-1">
//                     {bulkPriceChange.action === "increase"
//                       ? "Increase"
//                       : "Decrease"}{" "}
//                     by {bulkPriceChange.value || "0"}{" "}
//                     {bulkPriceChange.type === "percentage" ? "%" : "₦"}
//                   </p>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Reason (Optional)
//                   </label>
//                   <input
//                     type="text"
//                     value={bulkPriceChange.reason}
//                     onChange={(e) =>
//                       setBulkPriceChange((prev) => ({
//                         ...prev,
//                         reason: e.target.value,
//                       }))
//                     }
//                     className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="e.g., Seasonal sale, Clearance"
//                   />
//                 </div>

//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <h4 className="text-sm font-medium text-gray-700 mb-2">
//                     Summary
//                   </h4>
//                   <div className="space-y-1 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Products to update:</span>
//                       <span className="font-medium">
//                         {selectedProducts.length}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Action:</span>
//                       <span className="font-medium capitalize">
//                         {bulkPriceChange.action} {bulkPriceChange.type}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Value:</span>
//                       <span className="font-medium">
//                         {bulkPriceChange.value || "0"}{" "}
//                         {bulkPriceChange.type === "percentage" ? "%" : "₦"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
//                 <button
//                   onClick={() => setShowBulkModal(false)}
//                   className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleBulkPriceChange}
//                   disabled={
//                     !bulkPriceChange.value || selectedProducts.length === 0
//                   }
//                   className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
//                 >
//                   Apply to {selectedProducts.length} Products
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
// const LowStockView = ({ alerts, onAdjust }) => {
//   // Group alerts by product for better organization
//   const groupedAlerts = alerts.reduce((groups, alert) => {
//     const productId = alert.productId || alert.id.split("-")[0];
//     if (!groups[productId]) {
//       groups[productId] = {
//         productId,
//         name: alert.name,
//         image: alert.image,
//         category: alert.category,
//         price: alert.price,
//         alerts: [],
//       };
//     }
//     groups[productId].alerts.push(alert);
//     return groups;
//   }, {});

//   // Calculate urgency level for each product
//   const calculateProductUrgency = (alerts) => {
//     if (alerts.some((a) => a.status === "out")) return "critical";
//     if (alerts.some((a) => a.currentStock <= 2)) return "high";
//     if (alerts.some((a) => a.status === "low")) return "medium";
//     return "low";
//   };

//   // Get urgency color
//   const getUrgencyColor = (urgency) => {
//     const colors = {
//       critical: "bg-gradient-to-r from-red-500 to-red-600",
//       high: "bg-gradient-to-r from-orange-500 to-orange-600",
//       medium: "bg-gradient-to-r from-yellow-500 to-yellow-600",
//       low: "bg-gradient-to-r from-blue-500 to-blue-600",
//     };
//     return colors[urgency] || colors.medium;
//   };

//   // Sort products by urgency
//   const sortedProducts = Object.values(groupedAlerts).sort((a, b) => {
//     const urgencyA = calculateProductUrgency(a.alerts);
//     const urgencyB = calculateProductUrgency(b.alerts);
//     const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
//     return urgencyOrder[urgencyA] - urgencyOrder[urgencyB];
//   });

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="mb-8">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">
//               Stock Alert Dashboard
//             </h1>
//             <p className="text-gray-600 mt-2">
//               Manage inventory levels across {Object.keys(groupedAlerts).length}{" "}
//               products
//             </p>
//           </div>
//           <div className="flex items-center space-x-4">
//             <div className="text-right">
//               <p className="text-sm text-gray-500">Priority Items</p>
//               <p className="text-2xl font-bold text-red-600">
//                 {
//                   alerts.filter(
//                     (a) => a.status === "out" || a.currentStock <= 2
//                   ).length
//                 }
//               </p>
//             </div>
//             <div className="h-8 w-px bg-gray-300"></div>
//             <div className="text-right">
//               <p className="text-sm text-gray-500">Total Alerts</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {alerts.length}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Filter Tabs */}
//       <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
//         <button className="px-4 py-2 rounded-full bg-red-100 text-red-700 font-medium text-sm">
//           Out of Stock ({alerts.filter((a) => a.status === "out").length})
//         </button>
//         <button className="px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-medium text-sm">
//           Critical ({alerts.filter((a) => a.currentStock <= 2).length})
//         </button>
//         <button className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-medium text-sm">
//           Low Stock (
//           {
//             alerts.filter((a) => a.status === "low" && a.currentStock > 2)
//               .length
//           }
//           )
//         </button>
//         <button className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium text-sm">
//           All Products ({Object.keys(groupedAlerts).length})
//         </button>
//       </div>

//       {/* Product Cards Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {sortedProducts.map((group) => {
//           const urgency = calculateProductUrgency(group.alerts);
//           const outOfStockVariants = group.alerts.filter(
//             (a) => a.status === "out"
//           );
//           const lowStockVariants = group.alerts.filter(
//             (a) => a.status === "low" && a.currentStock > 0
//           );

//           return (
//             <div
//               key={group.productId}
//               className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col justify-between p-5"
//             >
//               {/* Urgency Indicator */}
//               <div
//                 className={`h-2 rounded-b-full mb-2 ${getUrgencyColor(
//                   urgency
//                 )}`}
//               ></div>

//               {/* Product Header */}
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex items-start space-x-4">
//                   <div className="relative">
//                     {group.image ? (
//                       <img
//                         src={group.image}
//                         alt={group.name}
//                         className="h-16 w-16 rounded-xl object-cover border"
//                       />
//                     ) : (
//                       <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center">
//                         <Package className="h-8 w-8 text-gray-400" />
//                       </div>
//                     )}
//                     {urgency === "critical" && (
//                       <div className="absolute -top-1 -right-1">
//                         <AlertCircle className="h-5 w-5 text-red-500 fill-red-100" />
//                       </div>
//                     )}
//                   </div>
//                   <div>
//                     <h3 className="font-semibold text-gray-900 line-clamp-1">
//                       {group.name}
//                     </h3>
//                     <p className="text-sm text-gray-500 mt-1">
//                       {group.category}
//                     </p>
//                     <div className="flex items-center mt-2">
//                       <div
//                         className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           urgency === "critical"
//                             ? "bg-red-100 text-red-700"
//                             : urgency === "high"
//                             ? "bg-orange-100 text-orange-700"
//                             : "bg-yellow-100 text-yellow-700"
//                         }`}
//                       >
//                         {urgency === "critical"
//                           ? "Out of Stock"
//                           : urgency === "high"
//                           ? "Critical"
//                           : "Low Stock"}
//                       </div>
//                       <span className="text-xs text-gray-400 mx-2">•</span>
//                       <span className="text-xs text-gray-500">
//                         {group.alerts.length} variant
//                         {group.alerts.length !== 1 ? "s" : ""}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Stock Status Visualization */}
//               <div className="mb-6">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-sm font-medium text-gray-700">
//                     Stock Levels
//                   </span>
//                   <span className="text-xs text-gray-500">
//                     {outOfStockVariants.length} out, {lowStockVariants.length}{" "}
//                     low
//                   </span>
//                 </div>

//                 <div className="space-y-2">
//                   {group.alerts.map((alert, index) => (
//                     <div
//                       key={index}
//                       className="flex items-center justify-between"
//                     >
//                       <div className="flex items-center">
//                         <div
//                           className={`w-3 h-3 rounded-full mr-3 ${
//                             alert.status === "out"
//                               ? "bg-red-500"
//                               : alert.currentStock <= 2
//                               ? "bg-orange-500"
//                               : "bg-yellow-500"
//                           }`}
//                         ></div>
//                         <span className="text-sm text-gray-700">
//                           {alert.variantName ||
//                             (alert.variantInfo
//                               ? `${alert.variantInfo.color || ""} - ${
//                                   alert.variantInfo.size || ""
//                                 }`
//                               : "Variant")}
//                         </span>
//                       </div>
//                       <div className="flex items-center space-x-2">
//                         {alert.status === "out" ? (
//                           <span className="text-xs font-medium text-red-600">
//                             OUT
//                           </span>
//                         ) : (
//                           <div className="flex items-center">
//                             <div className="relative w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
//                               <div
//                                 className={`absolute h-full ${
//                                   alert.currentStock <= 2
//                                     ? "bg-orange-500"
//                                     : "bg-yellow-500"
//                                 }`}
//                                 style={{
//                                   width: `${Math.min(
//                                     100,
//                                     (alert.currentStock / 10) * 100
//                                   )}%`,
//                                 }}
//                               ></div>
//                             </div>
//                             <span className="text-xs font-medium text-gray-700 ml-2 min-w-[2rem]">
//                               {alert.currentStock}
//                             </span>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Action Button */}
//               <div>
//                 <button
//                   onClick={() =>
//                     onAdjust({
//                       id: group.productId,
//                       name: group.name,
//                       image: group.image,
//                       category: group.category,
//                       price: group.price,
//                       variants: group.alerts.map((a) => ({
//                         _id: a.variantId,
//                         color: a.variantInfo?.color,
//                         size: a.variantInfo?.size,
//                         countInStock: a.currentStock,
//                         sku: a.variantInfo?.sku,
//                       })),
//                     })
//                   }
//                   className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium transition-all duration-200 flex items-center justify-center"
//                 >
//                   <Plus className="h-5 w-5 mr-2" />
//                   Restock Product
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Empty State */}
//       {sortedProducts.length === 0 && (
//         <div className="text-center py-16">
//           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
//             <CheckCircle className="h-8 w-8 text-green-600" />
//           </div>
//           <h3 className="text-xl font-semibold text-gray-900 mb-2">
//             All Stock Levels Are Healthy!
//           </h3>
//           <p className="text-gray-600 max-w-md mx-auto">
//             No products are currently low on stock. You're doing great!
//           </p>
//         </div>
//       )}

//       {/* Stats Footer */}
//       <div className="mt-8 pt-6 border-t border-gray-200">
//         <div className="flex flex-wrap justify-center gap-6 text-center">
//           <div>
//             <div className="text-2xl font-bold text-gray-900">
//               {alerts.length}
//             </div>
//             <div className="text-sm text-gray-600">Total Alerts</div>
//           </div>
//           <div>
//             <div className="text-2xl font-bold text-red-600">
//               {alerts.filter((a) => a.status === "out").length}
//             </div>
//             <div className="text-sm text-gray-600">Out of Stock</div>
//           </div>
//           <div>
//             <div className="text-2xl font-bold text-orange-600">
//               {alerts.filter((a) => a.currentStock <= 2).length}
//             </div>
//             <div className="text-sm text-gray-600">Critical Items</div>
//           </div>
//           <div>
//             <div className="text-2xl font-bold text-blue-600">
//               {Object.keys(groupedAlerts).length}
//             </div>
//             <div className="text-sm text-gray-600">Affected Products</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };


// const AgingReportView = ({ data }) => {
//   const [expandedBuckets, setExpandedBuckets] = useState({});

//   if (!data) return null;

//   const getBucketColor = (bucketLabel) => {
//     if (bucketLabel.includes("Fresh")) return "bg-gradient-to-r from-green-500 to-green-600";
//     if (bucketLabel.includes("Aging")) return "bg-gradient-to-r from-yellow-500 to-yellow-600";
//     if (bucketLabel.includes("Stale")) return "bg-gradient-to-r from-orange-500 to-orange-600";
//     return "bg-gradient-to-r from-red-500 to-red-600";
//   };

//   const handleExportReport = () => {
//     // Add your export logic here
//     console.log("Exporting aging report...");
//   };

//   const handleCreateActionPlan = () => {
//     // Add your action plan logic here
//     console.log("Creating action plan...");
//   };

//   const handleRefreshData = () => {
//     // Add your refresh logic here
//     console.log("Refreshing data...");
//   };

//   const handleToggleExpand = (bucketId) => {
//     setExpandedBuckets(prev => ({
//       ...prev,
//       [bucketId]: !prev[bucketId]
//     }));
//   };

//   return (
//     <div className="space-y-6">
//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <div className="bg-white rounded-xl shadow-sm border p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Aging Score</p>
//               <div className="flex items-center gap-2 mt-1">
//                 <div className="text-2xl font-bold text-gray-900">
//                   {data.summary?.agingScore || 0}/5
//                 </div>
//                 <div
//                   className={`w-3 h-3 rounded-full ${
//                     data.summary?.agingScore <= 2
//                       ? "bg-green-500"
//                       : data.summary?.agingScore <= 3
//                       ? "bg-yellow-500"
//                       : "bg-red-500"
//                   }`}
//                 ></div>
//               </div>
//             </div>
//             <TrendingDown className="h-8 w-8 text-gray-300" />
//           </div>
//           <p className="text-xs text-gray-500 mt-2">
//             {data.summary?.agingScore <= 2
//               ? "Excellent turnover"
//               : data.summary?.agingScore <= 3
//               ? "Good turnover"
//               : "Needs attention"}
//           </p>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Fresh Stock</p>
//               <p className="text-2xl font-bold text-green-600 mt-1">
//                 {data.summary?.freshPercentage || 0}%
//               </p>
//             </div>
//             <Package className="h-8 w-8 text-green-300" />
//           </div>
//           <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Stale Stock</p>
//               <p className="text-2xl font-bold text-orange-600 mt-1">
//                 {data.summary?.stalePercentage || 0}%
//               </p>
//             </div>
//             <AlertTriangle className="h-8 w-8 text-orange-300" />
//           </div>
//           <p className="text-xs text-gray-500 mt-2">Over 90 days</p>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Total Items</p>
//               <p className="text-2xl font-bold text-gray-900 mt-1">
//                 {data.summary?.totalItems?.toLocaleString() || 0}
//               </p>
//             </div>
//             <Layers className="h-8 w-8 text-blue-300" />
//           </div>
//           <p className="text-xs text-gray-500 mt-2">All stock units</p>
//         </div>
//       </div>

//       {/* Aging Buckets Visualization */}
//       <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
//           <div>
//             <h3 className="text-xl md:text-2xl font-bold text-gray-900">
//               Inventory Age Distribution
//             </h3>
//             <p className="text-gray-600 mt-2 max-w-2xl">
//               Visual breakdown of inventory based on how long items have been in
//               stock
//             </p>
//           </div>
//           <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
//             <Calendar className="h-4 w-4 text-blue-600" />
//             <span className="text-sm font-medium text-blue-700">
//               As of {new Date().toLocaleDateString()}
//             </span>
//           </div>
//         </div>

//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//           <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
//                   Fresh Stock
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900 mt-1">
//                   {data.agingBuckets?.find((b) => b.label.includes("Fresh"))
//                     ?.totalItems || 0}
//                 </p>
//                 <p className="text-sm text-blue-600 mt-1">Last 30 days</p>
//               </div>
//               <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
//                 <Package className="h-5 w-5 text-blue-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">
//                   Aging Stock
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900 mt-1">
//                   {data.agingBuckets?.find((b) => b.label.includes("Aging"))
//                     ?.totalItems || 0}
//                 </p>
//                 <p className="text-sm text-yellow-600 mt-1">31-90 days</p>
//               </div>
//               <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
//                 <Clock className="h-5 w-5 text-yellow-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">
//                   Stale Stock
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900 mt-1">
//                   {data.agingBuckets?.find((b) => b.label.includes("Stale"))
//                     ?.totalItems || 0}
//                 </p>
//                 <p className="text-sm text-orange-600 mt-1">91-180 days</p>
//               </div>
//               <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
//                 <AlertTriangle className="h-5 w-5 text-orange-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xs font-medium text-red-700 uppercase tracking-wide">
//                   Old Stock
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900 mt-1">
//                   {data.agingBuckets?.find((b) => b.label.includes("Old"))
//                     ?.totalItems || 0}
//                 </p>
//                 <p className="text-sm text-red-600 mt-1">180+ days</p>
//               </div>
//               <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
//                 <AlertCircle className="h-5 w-5 text-red-600" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Main Visualization */}
//         <div className="space-y-6 md:space-y-8">
//           {data.agingBuckets?.map((bucket, index) => {
//             const percentage = Math.round(
//               (bucket.totalValue / data.summary.totalValue) * 100
//             );
//             const bucketColor = getBucketColor(bucket.label);
//             const bucketId = `bucket-${index}`;
//             const isExpanded = expandedBuckets[bucketId];

//             return (
//               <div
//                 key={index}
//                 className="group hover:bg-gray-50 transition-all duration-200 p-4 rounded-xl border border-gray-200"
//               >
//                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
//                   <div className="flex items-center gap-4">
//                     <div
//                       className={`w-12 h-12 rounded-xl ${
//                         bucketColor.includes('gradient') 
//                           ? 'bg-gradient-to-br from-green-500/20 to-green-600/20' 
//                           : `${bucketColor} bg-opacity-20`
//                       } flex items-center justify-center`}
//                     >
//                       <div
//                         className={`w-6 h-6 rounded-full ${bucketColor}`}
//                       ></div>
//                     </div>
//                     <div>
//                       <h4 className="font-bold text-gray-900 text-lg">
//                         {bucket.label}
//                       </h4>
//                       <p className="text-gray-600 text-sm mt-1">
//                         {bucket.totalItems} units • ₦
//                         {bucket.totalValue?.toLocaleString()} value
//                       </p>
//                     </div>
//                   </div>

//                   <div className="text-right">
//                     <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
//                       <div className="text-2xl font-bold text-gray-900">
//                         {percentage}%
//                       </div>
//                       <div className="text-sm text-gray-600">
//                         of total value
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Progress Bar */}
//                 <div className="relative mb-6">
//                   <div className="flex justify-between text-sm text-gray-600 mb-2">
//                     <span>0%</span>
//                     <span className="font-medium">{percentage}%</span>
//                     <span>100%</span>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
//                     <div
//                       className={`h-full rounded-full transition-all duration-500 ${bucketColor}`}
//                       style={{ width: `${percentage}%` }}
//                     >
//                       <div className="h-full w-full rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Sample Items with Expand/Collapse */}
//                 {bucket.products.length > 0 && (
//                   <div className="mt-6 pt-6 border-t border-gray-200">
//                     <div className="flex items-center justify-between mb-4">
//                       <h5 className="font-medium text-gray-700 flex items-center gap-2">
//                         <Eye className="h-4 w-4" />
//                         {isExpanded ? "All Items" : "Top Items"} in this Category
//                       </h5>
//                       <span className="text-xs text-gray-500">
//                         {isExpanded
//                           ? `${bucket.products.length} items`
//                           : `Showing ${Math.min(
//                               bucket.products.length,
//                               3
//                             )} of ${bucket.products.length}`}
//                       </span>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
//                       {(isExpanded
//                         ? bucket.products
//                         : bucket.products.slice(0, 3)
//                       ).map((item, idx) => (
//                         <div
//                           key={idx}
//                           className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
//                         >
//                           <div className="flex items-start justify-between">
//                             <div className="flex-1">
//                               <p className="font-medium text-gray-900 text-sm truncate">
//                                 {item.name}
//                               </p>
//                               <p className="text-xs text-gray-500 mt-1">
//                                 {item.variantName}
//                               </p>
//                               <div className="flex items-center gap-3 mt-3">
//                                 <div className="flex items-center gap-1">
//                                   <Clock className="h-3 w-3 text-gray-400" />
//                                   <span className="text-xs font-medium text-gray-700">
//                                     {item.ageInDays}d old
//                                   </span>
//                                 </div>
//                                 <div className="flex items-center gap-1">
//                                   <Package className="h-3 w-3 text-gray-400" />
//                                   <span className="text-xs font-medium text-gray-700">
//                                     {item.stock} units
//                                   </span>
//                                 </div>
//                               </div>
//                             </div>
//                             <div className="ml-3">
//                               <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
//                                 ₦
//                                 {Math.round(
//                                   item.totalValue
//                                 ).toLocaleString()}
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>

//                     {bucket.products.length > 3 && (
//                       <div className="mt-4 text-center">
//                         <button
//                           onClick={() => handleToggleExpand(bucketId)}
//                           className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 mx-auto"
//                         >
//                           <span>
//                             {isExpanded
//                               ? "Show less"
//                               : `View all ${bucket.products.length} items`}
//                           </span>
//                           <ChevronDown
//                             className={`h-4 w-4 transition-transform duration-200 ${
//                               isExpanded ? "rotate-180" : ""
//                             }`}
//                           />
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>

//         {/* Legend */}
//         <div className="mt-8 pt-6 border-t border-gray-200">
//           <h5 className="font-medium text-gray-700 mb-4">Color Legend</h5>
//           <div className="flex flex-wrap gap-4">
//             {[
//               { label: "Fresh (0-30 days)", color: "bg-green-500" },
//               { label: "Aging (31-90 days)", color: "bg-yellow-500" },
//               { label: "Stale (91-180 days)", color: "bg-orange-500" },
//               { label: "Old (180+ days)", color: "bg-red-500" },
//             ].map((item, idx) => (
//               <div key={idx} className="flex items-center gap-2">
//                 <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
//                 <span className="text-sm text-gray-600">{item.label}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="mt-8 flex flex-col sm:flex-row gap-3">
//           <button 
//             onClick={handleExportReport}
//             className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2"
//           >
//             <Download className="h-4 w-4" />
//             Export Aging Report
//           </button>
//           <button 
//             onClick={handleCreateActionPlan}
//             className="px-5 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-xl font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 flex items-center justify-center gap-2"
//           >
//             <AlertTriangle className="h-4 w-4" />
//             Create Action Plan
//           </button>
//           <button 
//             onClick={handleRefreshData}
//             className="px-5 py-3 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-xl font-medium hover:from-green-200 hover:to-green-300 transition-all duration-200 flex items-center justify-center gap-2"
//           >
//             <RefreshCw className="h-4 w-4" />
//             Refresh Data
//           </button>
//         </div>
//       </div>

//       {/* Slow Movers */}
//       {data.slowMovers && data.slowMovers.length > 0 && (
//         <div className="bg-white rounded-xl shadow-sm border p-6">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-800">
//                 Slow Moving Items
//               </h3>
//               <p className="text-gray-600 text-sm">
//                 Highest value items aging in inventory
//               </p>
//             </div>
//             <AlertTriangle className="h-5 w-5 text-yellow-500" />
//           </div>

//           <div className="space-y-3">
//             {data.slowMovers.map((item, index) => (
//               <div
//                 key={index}
//                 className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors duration-200"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
//                     <Package className="h-4 w-4 text-yellow-600" />
//                   </div>
//                   <div>
//                     <p className="font-medium text-gray-800">{item.name}</p>
//                     <p className="text-sm text-gray-600">{item.variantName}</p>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <p className="font-bold text-gray-900">
//                     ₦{item.totalValue?.toLocaleString()}
//                   </p>
//                   <div className="flex items-center gap-2 text-sm text-gray-500">
//                     <span>{item.ageInDays} days old</span>
//                     <span>•</span>
//                     <span>{item.stock} units</span>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Recommendations */}
//       {data.recommendations && data.recommendations.length > 0 && (
//         <div className="bg-white rounded-xl shadow-sm border p-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">
//             Recommendations
//           </h3>

//           <div className="space-y-4">
//             {data.recommendations.map((rec, index) => (
//               <div
//                 key={index}
//                 className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
//                   rec.type === "urgent"
//                     ? "bg-red-50 border-red-200 hover:bg-red-100"
//                     : rec.type === "warning"
//                     ? "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
//                     : rec.type === "success"
//                     ? "bg-green-50 border-green-200 hover:bg-green-100"
//                     : "bg-blue-50 border-blue-200 hover:bg-blue-100"
//                 }`}
//               >
//                 <div className="flex items-start gap-3">
//                   {rec.type === "urgent" && (
//                     <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
//                   )}
//                   {rec.type === "warning" && (
//                     <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
//                   )}
//                   {rec.type === "success" && (
//                     <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
//                   )}
//                   <div className="flex-1">
//                     <h4 className="font-medium text-gray-800">{rec.title}</h4>
//                     <p className="text-gray-600 text-sm mt-1">{rec.message}</p>
//                     <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
//                       {rec.action}
//                       <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };








// const ValuationView = ({ data }) => {
//   // Calculate summary from the array if summary doesn't exist
//   const valuationArray = data.valuation || [];
  
//   const calculateSummary = () => {
//     if (data.valuation?.summary) {
//       return data.valuation.summary;
//     }
    
//     // Calculate from array
//     const totalValue = valuationArray.reduce((sum, cat) => sum + (cat.totalValue || 0), 0);
//     const totalProducts = valuationArray.reduce((sum, cat) => sum + (cat.totalProducts || 0), 0);
//     const totalVariants = valuationArray.reduce((sum, cat) => sum + (cat.totalVariants || 0), 0);
//     const totalStock = valuationArray.reduce((sum, cat) => {
//       if (cat.totalStock) return sum + cat.totalStock;
//       // Calculate from products array
//       return sum + (cat.products?.reduce((pSum, p) => pSum + (p.totalStock || 0), 0) || 0);
//     }, 0);
    
//     return {
//       totalValue,
//       totalProducts,
//       totalVariants,
//       totalStock,
//       averageValuePerItem: totalStock > 0 ? totalValue / totalStock : 0,
//     };
//   };

//   const summary = calculateSummary();
//   const displayValuation = data.valuation?.summary ? data.valuation.categories || [] : valuationArray;

//   return (
//     <div className="space-y-6 mt-10">
//       {/* Summary Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <div className="bg-white rounded-xl shadow-sm border p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Total Inventory Value</p>
//               <p className="text-2xl font-bold text-gray-900 mt-1">
//                 ₦{summary.totalValue?.toLocaleString() || "0"}
//               </p>
//             </div>
//             <DollarSign className="h-8 w-8 text-blue-500" />
//           </div>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Total Products</p>
//               <p className="text-2xl font-bold text-gray-900 mt-1">
//                 {summary.totalProducts || "0"}
//               </p>
//             </div>
//             <Package className="h-8 w-8 text-green-500" />
//           </div>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Total Variants</p>
//               <p className="text-2xl font-bold text-gray-900 mt-1">
//                 {summary.totalVariants || "0"}
//               </p>
//             </div>
//             <Layers className="h-8 w-8 text-purple-500" />
//           </div>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm text-gray-600">Avg. Value per Unit</p>
//               <p className="text-2xl font-bold text-gray-900 mt-1">
//                 ₦
//                 {summary.averageValuePerItem
//                   ? summary.averageValuePerItem.toLocaleString(undefined, {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })
//                   : "0"}
//               </p>
//             </div>
//             <TrendingUp className="h-8 w-8 text-orange-500" />
//           </div>
//         </div>
//       </div>

//       {/* Category Valuation Table */}
//       <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
//         <div className="p-6 border-b">
//           <h3 className="text-lg font-semibold text-gray-800">
//             Inventory Value by Category
//           </h3>
//           <p className="text-gray-600 text-sm mt-1">
//             Distribution of inventory value across product categories
//           </p>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Category
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Products
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Variants
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Stock Units
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Total Value
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   % of Total
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Avg. Unit Value
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {displayValuation.map((category, index) => {
//                 const totalStock =
//                   category.totalStock ||
//                   category.products?.reduce(
//                     (sum, p) => sum + (p.totalStock || 0),
//                     0
//                   ) ||
//                   0;
//                 const avgUnitValue =
//                   totalStock > 0 ? category.totalValue / totalStock : 0;
//                 const percentage =
//                   summary.totalValue > 0
//                     ? (
//                         (category.totalValue / summary.totalValue) *
//                         100
//                       ).toFixed(1)
//                     : "0.0";

//                 return (
//                   <tr key={index} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <span className="text-sm font-medium text-gray-900">
//                           {category.category || "Uncategorized"}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="text-sm text-gray-900">
//                         {category.totalProducts}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="text-sm text-gray-900">
//                         {category.totalVariants}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="text-sm text-gray-900">
//                         {totalStock.toLocaleString()}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="text-sm font-semibold text-gray-900">
//                         ₦{category.totalValue?.toLocaleString()}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
//                           <div
//                             className="bg-blue-600 h-2 rounded-full"
//                             style={{
//                               width: `${Math.min(
//                                 100,
//                                 parseFloat(percentage)
//                               )}%`,
//                             }}
//                           ></div>
//                         </div>
//                         <span className="text-sm font-medium text-gray-900">
//                           {percentage}%
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="text-sm text-gray-900">
//                         ₦
//                         {avgUnitValue.toLocaleString(undefined, {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}
//                       </span>
//                     </td>
//                   </tr>
//                 );
//               })}

//               {/* Total Row */}
//               <tr className="bg-gray-50 font-semibold">
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="text-sm font-bold text-gray-900">TOTAL</span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="text-sm font-bold text-gray-900">
//                     {summary.totalProducts}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="text-sm font-bold text-gray-900">
//                     {summary.totalVariants}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="text-sm font-bold text-gray-900">
//                     {summary.totalStock?.toLocaleString()}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="text-sm font-bold text-gray-900">
//                     ₦{summary.totalValue?.toLocaleString()}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="text-sm font-bold text-gray-900">100%</span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="text-sm font-bold text-gray-900">
//                     ₦
//                     {summary.averageValuePerItem?.toLocaleString(undefined, {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     })}
//                   </span>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Top Categories Summary */}
//       {displayValuation.length > 0 && (
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white rounded-xl shadow-sm border p-6">
//             <h4 className="text-sm font-medium text-gray-700 mb-4">
//               Top 3 Categories by Value
//             </h4>
//             <div className="space-y-3">
//               {displayValuation.slice(0, 3).map((category, index) => (
//                 <div key={index} className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <div
//                       className={`w-3 h-3 rounded-full ${
//                         index === 0
//                           ? "bg-yellow-500"
//                           : index === 1
//                           ? "bg-gray-400"
//                           : "bg-orange-500"
//                       }`}
//                     ></div>
//                     <span className="text-sm text-gray-600">
//                       {category.category}
//                     </span>
//                   </div>
//                   <span className="text-sm font-medium text-gray-900">
//                     {Math.round(
//                       (category.totalValue / summary.totalValue) * 100
//                     )}
//                     %
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="bg-white rounded-xl shadow-sm border p-6">
//             <h4 className="text-sm font-medium text-gray-700 mb-4">
//               Value Concentration
//             </h4>
//             <div className="text-sm text-gray-600">
//               <p className="mb-2">
//                 Top 3 categories hold{" "}
//                 <span className="font-semibold text-gray-900">
//                   {displayValuation
//                     .slice(0, 3)
//                     .reduce(
//                       (sum, c) =>
//                         sum +
//                         Math.round((c.totalValue / summary.totalValue) * 100),
//                       0
//                     )}
//                   %
//                 </span>{" "}
//                 of total value
//               </p>
//               <p className="text-xs text-gray-500">
//                 {displayValuation
//                   .slice(0, 3)
//                   .reduce(
//                     (sum, c) =>
//                       sum +
//                       Math.round((c.totalValue / summary.totalValue) * 100),
//                     0
//                   ) > 80
//                   ? "High concentration - consider diversifying"
//                   : "Good diversification"}
//               </p>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl shadow-sm border p-6">
//             <h4 className="text-sm font-medium text-gray-700 mb-4">
//               Highest Value per Unit
//             </h4>
//             <div className="space-y-2">
//               {displayValuation
//                 .map((category) => {
//                   const totalStock =
//                     category.totalStock ||
//                     category.products?.reduce(
//                       (sum, p) => sum + (p.totalStock || 0),
//                       0
//                     ) ||
//                     0;
//                   return {
//                     ...category,
//                     avgUnitValue:
//                       totalStock > 0 ? category.totalValue / totalStock : 0,
//                   };
//                 })
//                 .sort((a, b) => b.avgUnitValue - a.avgUnitValue)
//                 .slice(0, 3)
//                 .map((category, index) => (
//                   <div key={index} className="flex justify-between text-sm">
//                     <span className="text-gray-600">{category.category}</span>
//                     <span className="font-medium text-gray-900">
//                       ₦
//                       {category.avgUnitValue.toLocaleString(undefined, {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}
//                     </span>
//                   </div>
//                 ))}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };



// // Helper Components
// const StatCard = ({ title, value, icon: Icon, trend, color }) => {
//   const colorClasses = {
//     blue: "bg-blue-50 text-blue-600 border-blue-200",
//     yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
//     red: "bg-red-50 text-red-600 border-red-200",
//     green: "bg-green-50 text-green-600 border-green-200",
//   };

//   return (
//     <div className={`rounded-xl border p-6 ${colorClasses[color]}`}>
//       <div className="flex justify-between items-start">
//         <div>
//           <p className="text-sm font-medium opacity-80">{title}</p>
//           <p className="text-2xl font-bold mt-2">{value}</p>
//           <div className="flex items-center gap-1 mt-2">
//             {trend?.startsWith("+") ? (
//               <TrendingUp className="h-4 w-4" />
//             ) : (
//               <TrendingDown className="h-4 w-4" />
//             )}
//             <span className="text-sm">{trend}</span>
//           </div>
//         </div>
//         <div className="p-3 rounded-lg bg-white bg-opacity-50">
//           <Icon className="h-6 w-6" />
//         </div>
//       </div>
//     </div>
//   );
// };

// const StockStatusBadge = ({ status }) => {
//   const config = {
//     healthy: { label: "Healthy", color: "bg-green-100 text-green-800" },
//     low: { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" },
//     out: { label: "Out of Stock", color: "bg-red-100 text-red-800" },
//   };

//   const { label, color } = config[status] || config.healthy;

//   return (
//     <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
//       {label}
//     </span>
//   );
// };

// const UrgencyBadge = ({ urgency }) => {
//   const config = {
//     critical: { label: "Critical", color: "bg-red-100 text-red-800" },
//     high: { label: "High", color: "bg-orange-100 text-orange-800" },
//     medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800" },
//     low: { label: "Low", color: "bg-blue-100 text-blue-800" },
//   };

//   const { label, color } = config[urgency] || config.medium;

//   return (
//     <span className={`px-3 py-1 text-sm font-medium rounded-full ${color}`}>
//       {label}
//     </span>
//   );
// };

// const AdjustStockModal = ({ product, data, onChange, onSubmit, onClose }) => {
//   const [selectedVariant, setSelectedVariant] = useState("main");

//   // Only show variants - no main product option
//   const options = (product.variants || []).map((variant) => ({
//     id: variant._id,
//     label: `${variant.color || "Default"} - ${variant.size || "One Size"}`,
//     description: `Current stock: ${variant.countInStock || 0}`,
//     currentStock: variant.countInStock || 0,
//     variantInfo: variant,
//   }));

//   // Auto-select first variant if none selected
//   useEffect(() => {
//     if (options.length > 0 && !selectedVariant) {
//       setSelectedVariant(options[0].id);
//     }
//   }, [options, selectedVariant]);

//   const handleSubmit = () => {
//     if (!selectedVariant) {
//       toast.error("Please select a variant");
//       return;
//     }

//     const submitData = {
//       ...data,
//       variantId: selectedVariant,
//     };
//     onSubmit(submitData);
//   };

//   const selectedOption = options.find((opt) => opt.id === selectedVariant);

//   if (options.length === 0) {
//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
//         >
//           <div className="p-6">
//             <div className="text-center py-8">
//               <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
//               <h3 className="text-lg font-semibold text-gray-800 mb-2">
//                 No Variants Available
//               </h3>
//               <p className="text-gray-600">
//                 This product has no variants to adjust.
//               </p>
//             </div>
//             <div className="flex justify-end">
//               <button
//                 onClick={onClose}
//                 className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <motion.div
//         initial={{ opacity: 0, scale: 0.9 }}
//         animate={{ opacity: 1, scale: 1 }}
//         className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
//       >
//         <div className="p-6">
//           {/* Header */}
//           <div className="flex justify-between items-start mb-6">
//             <div>
//               <h3 className="text-lg font-semibold text-gray-800">
//                 Restock: {product.name}
//               </h3>
//               <p className="text-sm text-gray-500 mt-1">
//                 Select variant to restock
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600 p-1"
//             >
//               <XCircle className="h-5 w-5" />
//             </button>
//           </div>

//           <div className="space-y-6">
//             {/* Selection Options */}
//             <div className="space-y-3">
//               <label className="block text-sm font-medium text-gray-700">
//                 Select what to restock
//               </label>
//               <div className="space-y-2">
//                 {options.map((option) => (
//                   <div
//                     key={option.id}
//                     className={`p-4 border rounded-lg cursor-pointer transition-all ${
//                       selectedVariant === option.id
//                         ? "border-blue-500 bg-blue-50 shadow-sm"
//                         : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
//                     }`}
//                     onClick={() => setSelectedVariant(option.id)}
//                   >
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <div className="font-medium text-gray-900">
//                           {option.label}
//                         </div>
//                         <div className="text-sm text-gray-600 mt-1">
//                           {option.description}
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         {/* Stock indicator */}
//                         <div
//                           className={`px-2 py-1 text-xs font-medium rounded-full ${
//                             option.currentStock === 0
//                               ? "bg-red-100 text-red-800"
//                               : option.currentStock <= 5
//                               ? "bg-yellow-100 text-yellow-800"
//                               : "bg-green-100 text-green-800"
//                           }`}
//                         >
//                           {option.currentStock === 0
//                             ? "OUT"
//                             : option.currentStock <= 5
//                             ? "LOW"
//                             : "OK"}
//                         </div>
//                         {selectedVariant === option.id && (
//                           <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
//                             <CheckCircle className="h-3 w-3 text-white" />
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Adjustment Type */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-3">
//                 Adjustment Type
//               </label>
//               <div className="grid grid-cols-3 gap-3">
//                 {[
//                   {
//                     value: "add",
//                     label: "Add Stock",
//                     icon: Plus,
//                     color: "bg-green-50 border-green-200 text-green-700",
//                   },
//                   {
//                     value: "remove",
//                     label: "Remove",
//                     icon: Minus,
//                     color: "bg-red-50 border-red-200 text-red-700",
//                   },
//                   {
//                     value: "set",
//                     label: "Set Exact",
//                     icon: RefreshCw,
//                     color: "bg-blue-50 border-blue-200 text-blue-700",
//                   },
//                 ].map((type) => (
//                   <button
//                     key={type.value}
//                     type="button"
//                     onClick={() =>
//                       onChange({ ...data, adjustmentType: type.value })
//                     }
//                     className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
//                       data.adjustmentType === type.value
//                         ? `${type.color} ring-2 ring-offset-1 ring-opacity-30`
//                         : "border-gray-300 hover:bg-gray-50"
//                     }`}
//                   >
//                     <type.icon className="h-5 w-5" />
//                     <span className="text-sm font-medium">{type.label}</span>
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Quantity */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Quantity
//               </label>
//               <div className="flex items-center gap-3">
//                 <input
//                   type="number"
//                   min="1"
//                   value={data.quantity}
//                   onChange={(e) =>
//                     onChange({
//                       ...data,
//                       quantity: parseInt(e.target.value) || 1,
//                     })
//                   }
//                   className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 />
//                 <div className="text-sm text-gray-500 min-w-[120px]">
//                   Current: {selectedOption?.currentStock || 0}
//                 </div>
//               </div>
//             </div>

//             {/* Reason */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Reason
//               </label>
//               <select
//                 value={data.reason}
//                 onChange={(e) => onChange({ ...data, reason: e.target.value })}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="restock">Restock</option>
//                 <option value="sale">Sale</option>
//                 <option value="return">Return</option>
//                 <option value="damage">Damage/Loss</option>
//                 <option value="adjustment">Manual Adjustment</option>
//                 <option value="other">Other</option>
//               </select>
//             </div>

//             {/* Notes */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Notes (Optional)
//               </label>
//               <textarea
//                 value={data.notes}
//                 onChange={(e) => onChange({ ...data, notes: e.target.value })}
//                 rows="2"
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 placeholder="Add any notes about this adjustment..."
//               />
//             </div>

//             {/* Summary */}
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h4 className="text-sm font-medium text-gray-700 mb-2">
//                 Summary
//               </h4>
//               <div className="space-y-1 text-sm">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Selected:</span>
//                   <span className="font-medium">{selectedOption?.label}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Action:</span>
//                   <span className="font-medium capitalize">
//                     {data.adjustmentType} stock
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Quantity:</span>
//                   <span className="font-medium">{data.quantity} units</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">New stock will be:</span>
//                   <span className="font-medium text-blue-600">
//                     {data.adjustmentType === "add"
//                       ? (selectedOption?.currentStock || 0) + data.quantity
//                       : data.adjustmentType === "remove"
//                       ? (selectedOption?.currentStock || 0) - data.quantity
//                       : data.quantity}{" "}
//                     units
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
//             <button
//               onClick={onClose}
//               className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSubmit}
//               className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
//             >
//               Apply Restock
//             </button>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };


// export default InventoryTab;
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Layers,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  TrendingDown as SlashIcon,
  RefreshCw as UpdateIcon,
  Undo as ResetIcon,
  XCircle as CloseIcon,
  Warehouse,
  Undo,
  History,
  RefreshCw,
  BarChart,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Download,
  FileText,
  Upload,
  Tag,
  Filter,
  Search,
  ArrowUpDown,
  Calendar,
  PieChart,
  MapPin,
  Bell,
  Settings,
  Eye,
  Clock,
  MoreVertical,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore.js";
import { useInventoryStore } from "../stores/useInventoryStore.js";
import {
  exportInventoryPDF,
  exportSimpleInventoryPDF,
} from "../utils/exportInventoryPdf.js";
import axios from "../lib/axios.js";

const InventoryTab = () => {
  const {
    // State
    loading,
    dashboardData,
    stockLevels,
    lowStockAlerts,
    reorderSuggestions,
    inventoryValuation,
    stockHistory,
    inventoryByLocation,
    inventoryAging,
    fetchInventoryAging,

    // Actions
    fetchDashboard,
    fetchStockLevels,
    fetchLowStockAlerts,
    fetchReorderSuggestions,
    fetchInventoryValuation,
    fetchStockHistory,
    fetchInventoryByLocation,
    adjustStock,
    exportInventoryReport,
    updateFilters,
    clearFilters,
    getInventoryStats,
    setActiveTab,
    activeTab,
    updateProductPrice,

    // Computed
    pagination,
    filters,
  } = useInventoryStore();

  useEffect(() => {
    console.log("📊 Stock Levels Data:", stockLevels);
    console.log("📊 First Product:", stockLevels[0]);
    console.log("📊 First Product Variants:", stockLevels[0]?.variants);
  }, [stockLevels]);

  const { user } = useUserStore();
  const [expandedBuckets, setExpandedBuckets] = useState({});
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    adjustmentType: "add",
    quantity: 1,
    reason: "restock",
    notes: "",
  });
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProductForPrice, setSelectedProductForPrice] = useState(null);

  // History state
  const [historyType, setHistoryType] = useState("stock");
  const [priceHistory, setPriceHistory] = useState([]);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);
  const [priceHistoryFilters, setPriceHistoryFilters] = useState({
    productId: "",
    startDate: "",
    endDate: "",
    action: "ALL",
  });

  const handleRefresh = () => {
    toast.loading("Refreshing data...");
    switch (activeTab) {
      case "dashboard":
        fetchDashboard();
        break;
      case "stock-levels":
        fetchStockLevels(pagination.currentPage, filters);
        break;
      case "low-stock":
        fetchLowStockAlerts(10);
        break;
      case "price-management":
        fetchStockLevels(pagination.currentPage, {
          ...filters,
          sortBy: "price",
        });
        break;
      case "valuation":
        fetchInventoryValuation();
        break;
      case "history":
        fetchStockHistory();
        break;
      case "locations":
        fetchInventoryByLocation();
        break;
      default:
        fetchDashboard();
    }

    setTimeout(() => {
      toast.dismiss();
      toast.success("Data refreshed successfully!");
    }, 1000);
  };

  const handlePriceAction = (product) => {
    setSelectedProductForPrice(product);
    setShowPriceModal(true);
  };

  const handlePriceUpdate = (updatedProduct) => {
    setSelectedProductForPrice(updatedProduct);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    console.log("📊 Current pagination:", pagination);
    console.log("📦 Stock levels count:", stockLevels.length);
    console.log("🔍 Has next page?", pagination.hasNextPage);
    console.log("🔍 Has prev page?", pagination.hasPrevPage);
  }, [pagination, stockLevels]);

  useEffect(() => {
    if (activeTab === "stock-levels") {
      fetchStockLevels(1, filters);
    }
    if (activeTab === "low-stock") {
      fetchLowStockAlerts(10);
    }
    if (activeTab === "valuation") {
      fetchInventoryAging();
    }
    if (activeTab === "price-management") {
      fetchStockLevels(1, { ...filters, sortBy: "price" });
    }
    if (activeTab === "valuation") {
      fetchInventoryValuation();
    }
    if (activeTab === "history") {
      fetchStockHistory();
    }
    if (activeTab === "locations") {
      fetchInventoryByLocation();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "history" && historyType === "price") {
      fetchPriceHistory();
    }
  }, [activeTab, historyType, priceHistoryFilters]);

  const fetchPriceHistory = async () => {
    try {
      setLoadingPriceHistory(true);
      const params = new URLSearchParams({
        ...priceHistoryFilters,
        action:
          priceHistoryFilters.action === "ALL"
            ? ""
            : priceHistoryFilters.action,
      });

      const response = await axios.get(`/audit-logs/price-history?${params}`);
      setPriceHistory(response.data.priceHistory || []);
    } catch (error) {
      console.error("Error fetching price history:", error);
      toast.error("Failed to load price history");
    } finally {
      setLoadingPriceHistory(false);
    }
  };

  const fetchProductPriceHistory = async (productId) => {
    try {
      setLoadingPriceHistory(true);
      const response = await axios.get(
        `/audit-logs/price-history/${productId}`
      );

      if (response.data.success) {
        setPriceHistory(response.data.priceHistory);
        setHistoryType("price");
        setActiveTab("history");
      }
    } catch (error) {
      console.error("Error fetching product price history:", error);
      toast.error("Failed to load price history");
    } finally {
      setLoadingPriceHistory(false);
    }
  };

  const stats = getInventoryStats();

  const handleExportPDF = () => {
    try {
      const exportData = stockLevels.flatMap((product) => {
        if (!product.variants || product.variants.length === 0) {
          return [
            {
              name: product.name,
              product: product.name,
              category: product.category,
              countInStock: product.totalStock || 0,
              stock: product.totalStock || 0,
              price: product.price || 0,
              totalValue: product.totalValue || 0,
            },
          ];
        }

        return product.variants.map((variant) => ({
          name: product.name,
          product: product.name,
          category: product.category,
          color: variant.color,
          size: variant.size,
          countInStock: variant.countInStock || 0,
          stock: variant.countInStock || 0,
          price: variant.price || product.price || 0,
          sku: variant.sku,
          variantValue: variant.variantValue || 0,
        }));
      });

      exportSimpleInventoryPDF(exportData);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleAdjustStock = (product) => {
    console.log("🔄 Adjusting product:", product);
    setSelectedProduct({
      id: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      price: product.price,
      variants: product.variants || [],
    });

    setAdjustmentData({
      adjustmentType: "add",
      quantity: 1,
      reason: "restock",
      notes: "",
    });
    setShowAdjustModal(true);
  };

  const submitAdjustment = async (adjustmentDataWithVariant) => {
    if (!selectedProduct) return;

    try {
      await adjustStock(selectedProduct.id, adjustmentDataWithVariant);
      setShowAdjustModal(false);
      setSelectedProduct(null);

      if (activeTab === "stock-levels") {
        fetchStockLevels(pagination.currentPage, filters);
      }
      if (activeTab === "low-stock") {
        fetchLowStockAlerts(10);
      }
      if (activeTab === "dashboard") {
        fetchDashboard();
      }
    } catch (error) {
      console.error("Adjustment error:", error);
    }
  };

  const handleSearch = (e) => {
    const searchValue = e.target.value;
    updateFilters({ search: searchValue });
    if (activeTab === "stock-levels") {
      setTimeout(
        () => fetchStockLevels(1, { ...filters, search: searchValue }),
        500
      );
    }
  };

  const handleSyncOrders = async () => {
    try {
      toast.loading("Syncing orders with inventory...");
      const res = await axios.post("/inventory/sync-orders");
      toast.dismiss();
      toast.success(`Synced ${res.data.synced || 0} orders successfully!`);
      fetchDashboard();
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to sync orders");
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Inventory Management
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.firstname || "Admin"}! Manage your store's
                inventory.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <FileText className="h-4 w-4" />
                  Export PDF
                </button>
              </div>
              <button
                onClick={handleSyncOrders}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <RefreshCw className="h-4 w-4" />
                Sync Orders
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart },
              { id: "stock-levels", label: "Stock Levels", icon: Package },
              { id: "low-stock", label: "Low Stock", icon: AlertTriangle },
              { id: "price-management", label: "Price Management", icon: Tag },
              { id: "valuation", label: "Valuation", icon: DollarSign },
              { id: "history", label: "History", icon: History },
              { id: "locations", label: "Locations", icon: MapPin },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && dashboardData && (
          <DashboardView data={dashboardData} />
        )}
        {activeTab === "stock-levels" && (
          <StockLevelsView
            stockLevels={stockLevels}
            onAdjust={handleAdjustStock}
            loading={loading}
            onSearch={handleSearch}
            filters={filters}
            updateFilters={updateFilters}
            clearFilters={clearFilters}
            pagination={pagination}
            onPageChange={(page) => fetchStockLevels(page, filters)}
            onViewPriceHistory={fetchProductPriceHistory}
            onPriceAction={handlePriceAction}
          />
        )}
        {activeTab === "low-stock" && (
          <LowStockView alerts={lowStockAlerts} onAdjust={handleAdjustStock} />
        )}
        {activeTab === "price-management" && (
          <PriceManagementView
            products={stockLevels}
            loading={loading}
            onPriceAction={handlePriceAction}
            filters={filters}
            updateFilters={updateFilters}
            clearFilters={clearFilters}
            pagination={pagination}
            onPageChange={(page) =>
              fetchStockLevels(page, { ...filters, sortBy: "price" })
            }
            updateProductPrice={updateProductPrice}
          />
        )}
        {activeTab === "valuation" && <AgingReportView data={inventoryAging} />}
        {activeTab === "valuation" && inventoryValuation && (
          <ValuationView data={inventoryValuation} />
        )}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* History Type Toggle */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Inventory History
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Track all inventory and price changes
                  </p>
                </div>
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setHistoryType("stock")}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      historyType === "stock"
                        ? "bg-white text-gray-800 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Stock History
                  </button>
                  <button
                    onClick={() => setHistoryType("price")}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      historyType === "price"
                        ? "bg-white text-gray-800 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Price History
                  </button>
                </div>
              </div>
            </div>

            {/* History View */}
            <HistoryView
              history={historyType === "stock" ? stockHistory : priceHistory}
              loading={historyType === "stock" ? loading : loadingPriceHistory}
              type={historyType}
            />
          </div>
        )}
        {activeTab === "locations" && (
          <LocationsView locations={inventoryByLocation} />
        )}
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <AdjustStockModal
          product={selectedProduct}
          data={adjustmentData}
          onChange={setAdjustmentData}
          onSubmit={submitAdjustment}
          onClose={() => setShowAdjustModal(false)}
        />
      )}

      {/* Price Management Modal */}
      {showPriceModal && selectedProductForPrice && (
        <PriceManagementModal
          product={selectedProductForPrice}
          onClose={() => {
            setShowPriceModal(false);
            setSelectedProductForPrice(null);
          }}
          onUpdate={handlePriceUpdate}
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon: Icon, trend, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    red: "bg-red-50 text-red-600 border-red-200",
    green: "bg-green-50 text-green-600 border-green-200",
  };

  return (
    <div className={`rounded-xl border p-6 ${colorClasses[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            {trend?.startsWith("+") ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm">{trend}</span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white bg-opacity-50">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const StockStatusBadge = ({ status }) => {
  const config = {
    healthy: { label: "Healthy", color: "bg-green-100 text-green-800" },
    low: { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" },
    out: { label: "Out of Stock", color: "bg-red-100 text-red-800" },
  };

  const { label, color } = config[status] || config.healthy;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      {label}
    </span>
  );
};

const UrgencyBadge = ({ urgency }) => {
  const config = {
    critical: { label: "Critical", color: "bg-red-100 text-red-800" },
    high: { label: "High", color: "bg-orange-100 text-orange-800" },
    medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    low: { label: "Low", color: "bg-blue-100 text-blue-800" },
  };

  const { label, color } = config[urgency] || config.medium;

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${color}`}>
      {label}
    </span>
  );
};

// Price Display Component
const PriceDisplay = ({
  price,
  previousPrice,
  isPriceSlashed,
  discountPercentage,
}) => {
  if (isPriceSlashed && previousPrice) {
    const discount =
      discountPercentage ||
      (((previousPrice - price) / previousPrice) * 100).toFixed(1);

    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-green-700">
            ₦{price?.toLocaleString()}
          </span>
          <span className="text-gray-500 line-through text-sm">
            ₦{previousPrice?.toLocaleString()}
          </span>
          <span className="bg-red-100 text-red-800 text-xs font-medium px-1.5 py-0.5 rounded">
            {discount}% OFF
          </span>
        </div>
      </div>
    );
  }

  return (
    <span className="font-semibold text-gray-900">
      ₦{price?.toLocaleString()}
    </span>
  );
};

// History View Component
const HistoryView = ({ history, loading, type = "stock" }) => {
  const getPriceChangeInfo = (log) => {
    if (!log.changes) return { type: "update", old: "N/A", new: "N/A" };

    const oldPrice =
      log.changes.oldPrice || log.changes?.price?.before || "N/A";
    const newPrice = log.changes.newPrice || log.changes?.price?.after || "N/A";

    let changeType = "update";
    if (log.action === "PRICE_SLASH") changeType = "slash";
    if (log.action === "PRICE_RESET") changeType = "reset";

    return { type: changeType, old: oldPrice, new: newPrice };
  };

  const getPricePercentage = (log) => {
    if (!log.changes) return "N/A";

    const percentage =
      log.changes.priceChange?.percentage ||
      log.changes.priceChange?.discount ||
      log.changes.price?.discount ||
      "";

    if (percentage) return percentage;

    const oldPrice = parseFloat(
      log.changes.oldPrice || log.changes?.price?.before
    );
    const newPrice = parseFloat(
      log.changes.newPrice || log.changes?.price?.after
    );

    if (!isNaN(oldPrice) && !isNaN(newPrice) && oldPrice > 0) {
      const change = ((newPrice - oldPrice) / oldPrice) * 100;
      return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
    }

    return "N/A";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800">
          {type === "price"
            ? "Price Change History"
            : "Stock Adjustment History"}
        </h2>
        <p className="text-gray-600 mt-1">
          {type === "price"
            ? "Track all price changes and adjustments"
            : "Track all inventory adjustments"}
        </p>
      </div>
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {type === "price" ? "Product" : "Product ID"}
                </th>
                {type === "price" ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Change
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adjustment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  {/* Date & Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(
                        log.timestamp || log.createdAt
                      ).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(
                        log.timestamp || log.createdAt
                      ).toLocaleTimeString()}
                    </div>
                  </td>

                  {/* Product Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {type === "price" ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.entityName || "Unknown Product"}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID:{" "}
                          {log.entityId?.toString().slice(-6) ||
                            log.productId?.toString().slice(-6)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        Product ID: {log.productId?.toString().slice(-6)}
                      </div>
                    )}
                  </td>

                  {/* Change/Adjustment Info */}
                  {type === "price" ? (
                    <>
                      {/* Change Type */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.action === "PRICE_SLASH"
                              ? "bg-red-100 text-red-800"
                              : log.action === "PRICE_RESET"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {log.action === "PRICE_SLASH"
                            ? "SLASH"
                            : log.action === "PRICE_RESET"
                            ? "RESET"
                            : "UPDATE"}
                        </span>
                      </td>

                      {/* Price Change */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${parseFloat(getPriceChangeInfo(log).old).toFixed(2)}{" "}
                          → $
                          {parseFloat(getPriceChangeInfo(log).new).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getPriceChangeInfo(log).type === "slash"
                            ? "Price slashed"
                            : getPriceChangeInfo(log).type === "reset"
                            ? "Reset to original"
                            : "Price updated"}
                        </div>
                      </td>

                      {/* Percentage Change */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            log.action === "PRICE_SLASH"
                              ? "text-red-600"
                              : parseFloat(getPriceChangeInfo(log).new) >
                                parseFloat(getPriceChangeInfo(log).old)
                              ? "text-green-600"
                              : "text-gray-600"
                          }`}
                        >
                          {getPricePercentage(log)}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Adjustment Type */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.adjustmentType === "add"
                              ? "bg-green-100 text-green-800"
                              : log.adjustmentType === "remove"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {log.adjustmentType.toUpperCase()}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.quantity}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.oldStock} → {log.newStock}
                        </div>
                      </td>
                    </>
                  )}

                  {/* Reason */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 max-w-xs truncate block">
                      {log.additionalInfo || log.reason || "No reason provided"}
                    </span>
                  </td>

                  {/* User */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {log.adminName || log.adjustedBy?.firstname || "System"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {log.adminId?.email || log.adjustedBy?.email || ""}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Stock Levels View Component
const StockLevelsView = ({
  stockLevels,
  onAdjust,
  loading,
  onSearch,
  filters,
  updateFilters,
  clearFilters,
  pagination,
  onPageChange,
  onViewPriceHistory,
  onPriceAction,
}) => {
  const [expandedProducts, setExpandedProducts] = useState({});

  const toggleProductExpand = (productId) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Stock Levels</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.search || ""}
                onChange={onSearch}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.category || ""}
              onChange={(e) => updateFilters({ category: e.target.value })}
            >
              <option value="">All Categories</option>
            </select>
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              onClick={() => clearFilters()}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockLevels.map((product) => (
                <React.Fragment key={product.id}>
                  {/* Product Summary Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.variantsCount} variants
                          </div>
                          {product.variantsCount > 0 && (
                            <button
                              onClick={() => toggleProductExpand(product.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              {expandedProducts[product.id] ? "Hide" : "Show"}{" "}
                              variants
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriceDisplay
                        price={product.price}
                        previousPrice={product.previousPrice}
                        isPriceSlashed={product.isPriceSlashed}
                        discountPercentage={product.discountPercentage}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.totalStock || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StockStatusBadge status={product.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₦{product.totalValue?.toLocaleString() || "0"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onAdjust({
                              ...product,
                              variants: product.variants || [],
                            })
                          }
                          className="text-blue-600 hover:text-blue-900"
                          title="Adjust Stock"
                        >
                          Adjust
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => onPriceAction(product)}
                          className="text-green-600 hover:text-green-900"
                          title="Manage Price"
                        >
                          Price
                        </button>

                        
                      </div>
                    </td>
                  </tr>

                  {/* Variant Rows */}
                  {expandedProducts[product.id] &&
                    product.variants &&
                    product.variants.length > 0 && (
                      <>
                        {product.variants.map((variant) => (
                          <tr
                            key={variant._id}
                            className="bg-gray-50 hover:bg-gray-100"
                          >
                            <td className="px-6 py-3 pl-10">
                              <div className="flex items-center">
                                <div className="ml-2">
                                  <div className="text-sm text-gray-900 flex items-center gap-2">
                                    <span className="font-medium">
                                      {variant.color || "Default"}
                                    </span>
                                    <span className="text-gray-500">-</span>
                                    <span className="font-medium">
                                      {variant.size || "One Size"}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    SKU: {variant.sku || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-xs text-gray-500">
                                Variant
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-sm font-medium text-gray-900">
                                ₦{variant.price?.toLocaleString() || "0"}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <div className="text-sm font-medium text-gray-900">
                                {variant.countInStock}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <StockStatusBadge
                                status={
                                  variant.countInStock === 0
                                    ? "out"
                                    : variant.countInStock <= 5
                                    ? "low"
                                    : "healthy"
                                }
                              />
                            </td>
                            <td className="px-6 py-3">
                              <div className="text-sm text-gray-900">
                                ₦{variant.variantValue?.toLocaleString() || "0"}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-sm font-medium">
                              <button
                                onClick={() =>
                                  onAdjust({
                                    ...product,
                                    variantId: variant._id,
                                    variantName: `${
                                      variant.color || "Default"
                                    } - ${variant.size || "One Size"}`,
                                    currentStock: variant.countInStock,
                                  })
                                }
                                className="text-blue-600 hover:text-blue-900 text-xs"
                              >
                                Adjust Variant
                              </button>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-2 p-4 border-t">
        <button
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevPage}
          className={`px-3 py-1 rounded ${
            pagination.hasPrevPage
              ? "bg-gray-200 hover:bg-gray-300"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
          className={`px-3 py-1 rounded ${
            pagination.hasNextPage
              ? "bg-gray-200 hover:bg-gray-300"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

// Price Management View Component
const PriceManagementView = ({
  products,
  loading,
  onPriceAction,
  filters,
  updateFilters,
  clearFilters,
  pagination,
  onPageChange,
  updateProductPrice,
}) => {
  const [priceFilters, setPriceFilters] = useState({
    minPrice: "",
    maxPrice: "",
    showSlashedOnly: false,
    sortBy: "price",
    sortOrder: "asc",
  });

  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkPriceChange, setBulkPriceChange] = useState({
    action: "increase",
    type: "percentage",
    value: "",
    reason: "",
  });

  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        updateFilters({ search: searchInput });
        if (onPageChange) {
          setTimeout(() => onPageChange(1), 100);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, updateFilters, onPageChange]);

  useEffect(() => {
    if (filters.search !== searchInput) {
      setSearchInput(filters.search || "");
    }
  }, [filters.search]);

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setPriceFilters({
      minPrice: "",
      maxPrice: "",
      showSlashedOnly: false,
      sortBy: "price",
      sortOrder: "asc",
    });
    clearFilters();
  };

  const filteredProducts = products
    .filter((product) => {
      if (
        priceFilters.minPrice &&
        product.price < parseFloat(priceFilters.minPrice)
      )
        return false;
      if (
        priceFilters.maxPrice &&
        product.price > parseFloat(priceFilters.maxPrice)
      )
        return false;
      if (priceFilters.showSlashedOnly && !product.isPriceSlashed) return false;
      return true;
    })
    .sort((a, b) => {
      const sortKey = priceFilters.sortBy;
      const order = priceFilters.sortOrder === "asc" ? 1 : -1;

      if (sortKey === "price") {
        return (a.price - b.price) * order;
      } else if (sortKey === "name") {
        return a.name.localeCompare(b.name) * order;
      } else if (sortKey === "discount") {
        const discountA = productDiscount(a);
        const discountB = productDiscount(b);
        return (discountA - discountB) * order;
      }
      return 0;
    });

  const productDiscount = (product) => {
    if (!product.isPriceSlashed || !product.previousPrice) return 0;
    return (
      ((product.previousPrice - product.price) / product.previousPrice) * 100
    );
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const handleBulkPriceChange = async () => {
    if (!bulkPriceChange.value || selectedProducts.length === 0) {
      toast.error("Please select products and enter a value");
      return;
    }

    if (!updateProductPrice) {
      toast.error("Price update function not available");
      return;
    }

    try {
      toast.loading(
        `Updating prices for ${selectedProducts.length} products...`
      );

      const promises = selectedProducts.map((productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return Promise.resolve();

        let newPrice;
        const currentPrice = product.price;

        if (bulkPriceChange.type === "percentage") {
          const percentage = parseFloat(bulkPriceChange.value);
          if (bulkPriceChange.action === "increase") {
            newPrice = currentPrice * (1 + percentage / 100);
          } else {
            newPrice = currentPrice * (1 - percentage / 100);
          }
        } else {
          const amount = parseFloat(bulkPriceChange.value);
          if (bulkPriceChange.action === "increase") {
            newPrice = currentPrice + amount;
          } else {
            newPrice = currentPrice - amount;
          }
        }

        newPrice = Math.max(newPrice, 0.01);
        return updateProductPrice(productId, newPrice, bulkPriceChange.reason);
      });

      await Promise.all(promises);
      toast.dismiss();
      toast.success(
        `Updated ${selectedProducts.length} products successfully!`
      );

      setShowBulkModal(false);
      setSelectedProducts([]);
      setBulkPriceChange({
        action: "increase",
        type: "percentage",
        value: "",
        reason: "",
      });

      if (onPageChange && pagination) {
        onPageChange(pagination.currentPage);
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to update some prices");
      console.error("Bulk price update error:", error);
    }
  };

  const calculateSummary = () => {
    const totalProducts = filteredProducts.length;
    const slashedProducts = filteredProducts.filter(
      (p) => p.isPriceSlashed
    ).length;
    const avgPrice =
      totalProducts > 0
        ? filteredProducts.reduce((sum, p) => sum + p.price, 0) / totalProducts
        : 0;
    const totalValue = filteredProducts.reduce(
      (sum, p) => sum + p.totalValue,
      0
    );

    let maxDiscount = 0;
    let maxDiscountProduct = null;
    filteredProducts.forEach((p) => {
      if (p.isPriceSlashed && p.previousPrice) {
        const discount = ((p.previousPrice - p.price) / p.previousPrice) * 100;
        if (discount > maxDiscount) {
          maxDiscount = discount;
          maxDiscountProduct = p;
        }
      }
    });

    return {
      totalProducts,
      slashedProducts,
      avgPrice,
      totalValue,
      maxDiscount,
      maxDiscountProduct,
      discountRate:
        totalProducts > 0 ? (slashedProducts / totalProducts) * 100 : 0,
    };
  };

  const summary = calculateSummary();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-xl font-bold">{summary.totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-blue-400" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {summary.slashedProducts} with discounts
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Price</p>
              <p className="text-xl font-bold">
                ₦
                {summary.avgPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
          <div className="mt-2 text-xs text-gray-500">Across all products</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Discount Rate</p>
              <p className="text-xl font-bold">
                {summary.discountRate.toFixed(1)}%
              </p>
            </div>
            <Tag className="h-8 w-8 text-red-400" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {summary.slashedProducts} discounted products
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-xl font-bold">
                ₦{summary.totalValue.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-400" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Current inventory value
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedProducts.length === filteredProducts.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">
              {selectedProducts.length} of {filteredProducts.length} selected
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchInput}
                onChange={handleSearch}
              />
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min ₦"
                value={priceFilters.minPrice}
                onChange={(e) =>
                  setPriceFilters((prev) => ({
                    ...prev,
                    minPrice: e.target.value,
                  }))
                }
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="0"
                step="0.01"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max ₦"
                value={priceFilters.maxPrice}
                onChange={(e) =>
                  setPriceFilters((prev) => ({
                    ...prev,
                    maxPrice: e.target.value,
                  }))
                }
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="0"
                step="0.01"
              />
            </div>

            {/* Filters */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={priceFilters.sortBy}
              onChange={(e) =>
                setPriceFilters((prev) => ({ ...prev, sortBy: e.target.value }))
              }
            >
              <option value="price">Sort by Price</option>
              <option value="name">Sort by Name</option>
              <option value="discount">Sort by Discount</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={priceFilters.sortOrder}
              onChange={(e) =>
                setPriceFilters((prev) => ({
                  ...prev,
                  sortOrder: e.target.value,
                }))
              }
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>

            <button
              onClick={() =>
                setPriceFilters((prev) => ({
                  ...prev,
                  showSlashedOnly: !prev.showSlashedOnly,
                }))
              }
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                priceFilters.showSlashedOnly
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : "bg-gray-100 text-gray-700 border border-gray-300"
              }`}
            >
              {priceFilters.showSlashedOnly
                ? "Showing Discounted"
                : "Show Discounted"}
            </button>

            <button
              onClick={clearAllFilters}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              Clear All
            </button>

            {selectedProducts.length > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Bulk Update ({selectedProducts.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedProducts.length === filteredProducts.length &&
                      filteredProducts.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No products found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const discount = productDiscount(product);
                  const isSelected = selectedProducts.includes(product.id);

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(product.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-gray-900">
                          ₦
                          {product.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-xs text-gray-500">per unit</div>
                      </td>
                      <td className="px-6 py-4">
                        {product.isPriceSlashed && product.previousPrice ? (
                          <>
                            <div className="text-sm text-gray-500 line-through">
                              ₦
                              {product.previousPrice.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              Original
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {product.isPriceSlashed && discount > 0 ? (
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {discount.toFixed(1)}% OFF
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          ₦{(product.totalValue || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.totalStock || 0} units
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StockStatusBadge status={product.status} />
                        {product.isPriceSlashed && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                              <Tag className="h-3 w-3 mr-1" />
                              Discounted
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onPriceAction(product)}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                          >
                            Manage Price
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {filteredProducts.length} products
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className={`px-3 py-1 rounded text-sm ${
                  pagination.hasPrevPage
                    ? "bg-gray-200 hover:bg-gray-300"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className={`px-3 py-1 rounded text-sm ${
                  pagination.hasNextPage
                    ? "bg-gray-200 hover:bg-gray-300"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Bulk Price Update
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Update prices for {selectedProducts.length} selected
                    products
                  </p>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        setBulkPriceChange((prev) => ({
                          ...prev,
                          action: "increase",
                        }))
                      }
                      className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
                        bulkPriceChange.action === "increase"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <TrendingUp className="h-5 w-5" />
                      <span className="text-sm font-medium">Increase</span>
                    </button>
                    <button
                      onClick={() =>
                        setBulkPriceChange((prev) => ({
                          ...prev,
                          action: "decrease",
                        }))
                      }
                      className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
                        bulkPriceChange.action === "decrease"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <TrendingDown className="h-5 w-5" />
                      <span className="text-sm font-medium">Decrease</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        setBulkPriceChange((prev) => ({
                          ...prev,
                          type: "percentage",
                        }))
                      }
                      className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
                        bulkPriceChange.type === "percentage"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-lg">%</span>
                      <span className="text-sm font-medium">Percentage</span>
                    </button>
                    <button
                      onClick={() =>
                        setBulkPriceChange((prev) => ({
                          ...prev,
                          type: "amount",
                        }))
                      }
                      className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
                        bulkPriceChange.type === "amount"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <DollarSign className="h-5 w-5" />
                      <span className="text-sm font-medium">Fixed Amount</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <div className="relative">
                    {bulkPriceChange.type === "percentage" ? (
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={bulkPriceChange.value}
                          onChange={(e) =>
                            setBulkPriceChange((prev) => ({
                              ...prev,
                              value: e.target.value,
                            }))
                          }
                          className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          %
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="absolute left-3 text-gray-500">₦</span>
                        <input
                          type="number"
                          value={bulkPriceChange.value}
                          onChange={(e) =>
                            setBulkPriceChange((prev) => ({
                              ...prev,
                              value: e.target.value,
                            }))
                          }
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {bulkPriceChange.action === "increase"
                      ? "Increase"
                      : "Decrease"}{" "}
                    by {bulkPriceChange.value || "0"}{" "}
                    {bulkPriceChange.type === "percentage" ? "%" : "₦"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={bulkPriceChange.reason}
                    onChange={(e) =>
                      setBulkPriceChange((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Seasonal sale, Clearance"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Summary
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Products to update:</span>
                      <span className="font-medium">
                        {selectedProducts.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Action:</span>
                      <span className="font-medium capitalize">
                        {bulkPriceChange.action} {bulkPriceChange.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-medium">
                        {bulkPriceChange.value || "0"}{" "}
                        {bulkPriceChange.type === "percentage" ? "%" : "₦"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkPriceChange}
                  disabled={
                    !bulkPriceChange.value || selectedProducts.length === 0
                  }
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  Apply to {selectedProducts.length} Products
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Price Management Modal Component
const PriceManagementModal = ({ product, onClose, onUpdate }) => {
  const { slashProductPrice, resetProductPrice, updateProductPrice } =
    useInventoryStore();
  const [newPrice, setNewPrice] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState("update");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newPrice && action !== "reset") {
      toast.error("Please enter a price");
      return;
    }

    setLoading(true);
    try {
      let result;

      switch (action) {
        case "slash":
          result = await slashProductPrice(
            product.id,
            parseFloat(newPrice),
            reason
          );
          break;
        case "reset":
          result = await resetProductPrice(product.id, reason);
          break;
        case "update":
        default:
          result = await updateProductPrice(
            product.id,
            parseFloat(newPrice),
            reason
          );
          break;
      }

      toast.success(result.message || "Price updated successfully");
      if (onUpdate) {
        onUpdate(result.product);
      }
      onClose();
    } catch (error) {
      console.error("Price update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Manage Price
              </h3>
              <p className="text-sm text-gray-500 mt-1">{product.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Current Price Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Current Price:</span>
              <PriceDisplay
                price={product.price}
                previousPrice={product.previousPrice}
                isPriceSlashed={product.isPriceSlashed}
                discountPercentage={product.discountPercentage}
              />
            </div>
            {product.isPriceSlashed && product.previousPrice && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Original Price:</span>
                <span className="text-gray-500 line-through">
                  ₦{product.previousPrice?.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Action Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Action
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  value: "update",
                  label: "Update",
                  icon: UpdateIcon,
                  color: "bg-blue-50 border-blue-200 text-blue-700",
                },
                {
                  value: "slash",
                  label: "Slash",
                  icon: SlashIcon,
                  color: "bg-red-50 border-red-200 text-red-700",
                  disabled: product.isPriceSlashed,
                },
                {
                  value: "reset",
                  label: "Reset",
                  icon: ResetIcon,
                  color: "bg-gray-50 border-gray-200 text-gray-700",
                  disabled: !product.isPriceSlashed,
                },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setAction(type.value)}
                  disabled={type.disabled}
                  className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    action === type.value
                      ? `${type.color} ring-2 ring-offset-1 ring-opacity-30`
                      : "border-gray-300 hover:bg-gray-50"
                  } ${type.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <type.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Input (only for update and slash) */}
          {action !== "reset" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₦
                </span>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {action === "slash" &&
                newPrice &&
                parseFloat(newPrice) >= product.price && (
                  <p className="text-red-500 text-xs mt-1">
                    Slash price must be lower than current price
                  </p>
                )}
            </div>
          )}

          {/* Reason Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason {action !== "reset" && "(Optional)"}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Sale, Clearance, Promotion"
            />
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Action:</span>
                <span className="font-medium capitalize">{action}</span>
              </div>
              {action !== "reset" && newPrice && (
                <div className="flex justify-between">
                  <span className="text-gray-600">New Price:</span>
                  <span className="font-medium">
                    ₦{parseFloat(newPrice).toLocaleString()}
                  </span>
                </div>
              )}
              {action === "reset" && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Will reset to:</span>
                  <span className="font-medium text-blue-600">
                    ₦{product.previousPrice?.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                (action !== "reset" && !newPrice) ||
                (action === "slash" &&
                  newPrice &&
                  parseFloat(newPrice) >= product.price)
              }
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : action === "reset" ? (
                "Reset Price"
              ) : (
                "Apply Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Adjust Stock Modal Component
const AdjustStockModal = ({ product, data, onChange, onSubmit, onClose }) => {
  const [selectedVariant, setSelectedVariant] = useState("main");

  const options = (product.variants || []).map((variant) => ({
    id: variant._id,
    label: `${variant.color || "Default"} - ${variant.size || "One Size"}`,
    description: `Current stock: ${variant.countInStock || 0}`,
    currentStock: variant.countInStock || 0,
    variantInfo: variant,
  }));

  useEffect(() => {
    if (options.length > 0 && !selectedVariant) {
      setSelectedVariant(options[0].id);
    }
  }, [options, selectedVariant]);

  const handleSubmit = () => {
    if (!selectedVariant) {
      toast.error("Please select a variant");
      return;
    }

    const submitData = { ...data, variantId: selectedVariant };
    onSubmit(submitData);
  };

  const selectedOption = options.find((opt) => opt.id === selectedVariant);

  if (options.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Variants Available
              </h3>
              <p className="text-gray-600">
                This product has no variants to adjust.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Restock: {product.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Select variant to restock
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Selection Options */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select what to restock
              </label>
              <div className="space-y-2">
                {options.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedVariant === option.id
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedVariant(option.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {option.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            option.currentStock === 0
                              ? "bg-red-100 text-red-800"
                              : option.currentStock <= 5
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {option.currentStock === 0
                            ? "OUT"
                            : option.currentStock <= 5
                            ? "LOW"
                            : "OK"}
                        </div>
                        {selectedVariant === option.id && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Adjustment Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: "add",
                    label: "Add Stock",
                    icon: Plus,
                    color: "bg-green-50 border-green-200 text-green-700",
                  },
                  {
                    value: "remove",
                    label: "Remove",
                    icon: Minus,
                    color: "bg-red-50 border-red-200 text-red-700",
                  },
                  {
                    value: "set",
                    label: "Set Exact",
                    icon: RefreshCw,
                    color: "bg-blue-50 border-blue-200 text-blue-700",
                  },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      onChange({ ...data, adjustmentType: type.value })
                    }
                    className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                      data.adjustmentType === type.value
                        ? `${type.color} ring-2 ring-offset-1 ring-opacity-30`
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <type.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={data.quantity}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="text-sm text-gray-500 min-w-[120px]">
                  Current: {selectedOption?.currentStock || 0}
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <select
                value={data.reason}
                onChange={(e) => onChange({ ...data, reason: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="restock">Restock</option>
                <option value="sale">Sale</option>
                <option value="return">Return</option>
                <option value="damage">Damage/Loss</option>
                <option value="adjustment">Manual Adjustment</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={data.notes}
                onChange={(e) => onChange({ ...data, notes: e.target.value })}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any notes about this adjustment..."
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Summary
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Selected:</span>
                  <span className="font-medium">{selectedOption?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Action:</span>
                  <span className="font-medium capitalize">
                    {data.adjustmentType} stock
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{data.quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New stock will be:</span>
                  <span className="font-medium text-blue-600">
                    {data.adjustmentType === "add"
                      ? (selectedOption?.currentStock || 0) + data.quantity
                      : data.adjustmentType === "remove"
                      ? (selectedOption?.currentStock || 0) - data.quantity
                      : data.quantity}{" "}
                    units
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Apply Restock
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Dashboard View Component
const DashboardView = ({ data }) => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Total Stock Value"
        value={`₦${data.summary?.totalStockValue?.toLocaleString() || "0"}`}
        icon={DollarSign}
        trend="+12.5%"
        color="blue"
      />
      <StatCard
        title="Low Stock"
        value={data.summary?.lowStockCount || 0}
        icon={AlertTriangle}
        trend="+3"
        color="yellow"
      />
      <StatCard
        title="Total Products"
        value={data.summary?.totalProducts || 0}
        icon={Layers}
        trend="+5"
        color="green"
      />
    </div>

    {/* Fast Moving / Top Selling Products */}
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {data.summary?.hasOrderData
              ? "Top Selling Products (Last 30 Days)"
              : "Fast Moving Products"}
          </h3>
          <p className="text-gray-600 mt-1">
            {data.summary?.hasOrderData
              ? "Based on actual delivered orders"
              : "Based on current stock levels"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Last 30 days</span>
        </div>
      </div>

      {data.fastMovingProducts && data.fastMovingProducts.length > 0 ? (
        <div className="space-y-4">
          {data.fastMovingProducts.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0
                      ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                      : index === 1
                      ? "bg-gray-100 text-gray-800 border-2 border-gray-300"
                      : index === 2
                      ? "bg-orange-100 text-orange-800 border-2 border-orange-300"
                      : "bg-blue-100 text-blue-800 border-2 border-blue-300"
                  }`}
                >
                  <span className="font-bold text-sm">#{index + 1}</span>
                </div>

                <div className="relative">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100 border flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {product.category && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {product.category}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          {product.totalQuantitySold ||
                            product.currentStock ||
                            0}{" "}
                          {product.source === "orders" ? "sold" : "in stock"}
                        </span>
                      </div>
                      {product.orderCount > 0 && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {product.orderCount} orders
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg">
                  ₦{product.value?.toLocaleString() || "0"}
                </p>
                <p className="text-sm text-gray-500">
                  {product.source === "orders" ? "Revenue" : "Stock Value"}
                </p>

                {product.price > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    ₦{product.price?.toLocaleString()} each
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
            <ShoppingBag className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Sales Data Available
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Top selling products will appear here once orders are delivered and
            processed.
          </p>
        </div>
      )}
    </div>

    {/* Alerts Summary */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Low Stock Alerts
          </h3>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            {data.alerts?.lowStock?.length || 0} items
          </span>
        </div>
        <div className="space-y-3">
          {data.alerts?.lowStock?.slice(0, 5).map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-yellow-700">
                  {product.currentStock} left
                </p>
                <p className="text-xs text-gray-500">
                  Threshold: {product.threshold}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Out of Stock</h3>
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            {data.alerts?.outOfStock?.length || 0} items
          </span>
        </div>
        <div className="space-y-3">
          {data.alerts?.outOfStock?.slice(0, 5).map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  OUT OF STOCK
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Low Stock View Component
const LowStockView = ({ alerts, onAdjust }) => {
  const groupedAlerts = alerts.reduce((groups, alert) => {
    const productId = alert.productId || alert.id.split("-")[0];
    if (!groups[productId]) {
      groups[productId] = {
        productId,
        name: alert.name,
        image: alert.image,
        category: alert.category,
        price: alert.price,
        alerts: [],
      };
    }
    groups[productId].alerts.push(alert);
    return groups;
  }, {});

  const calculateProductUrgency = (alerts) => {
    if (alerts.some((a) => a.status === "out")) return "critical";
    if (alerts.some((a) => a.currentStock <= 2)) return "high";
    if (alerts.some((a) => a.status === "low")) return "medium";
    return "low";
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: "bg-gradient-to-r from-red-500 to-red-600",
      high: "bg-gradient-to-r from-orange-500 to-orange-600",
      medium: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      low: "bg-gradient-to-r from-blue-500 to-blue-600",
    };
    return colors[urgency] || colors.medium;
  };

  const sortedProducts = Object.values(groupedAlerts).sort((a, b) => {
    const urgencyA = calculateProductUrgency(a.alerts);
    const urgencyB = calculateProductUrgency(b.alerts);
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return urgencyOrder[urgencyA] - urgencyOrder[urgencyB];
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Stock Alert Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage inventory levels across {Object.keys(groupedAlerts).length}{" "}
              products
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Priority Items</p>
              <p className="text-2xl font-bold text-red-600">
                {
                  alerts.filter(
                    (a) => a.status === "out" || a.currentStock <= 2
                  ).length
                }
              </p>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {alerts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <button className="px-4 py-2 rounded-full bg-red-100 text-red-700 font-medium text-sm">
          Out of Stock ({alerts.filter((a) => a.status === "out").length})
        </button>
        <button className="px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-medium text-sm">
          Critical ({alerts.filter((a) => a.currentStock <= 2).length})
        </button>
        <button className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-medium text-sm">
          Low Stock (
          {
            alerts.filter((a) => a.status === "low" && a.currentStock > 2)
              .length
          }
          )
        </button>
        <button className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium text-sm">
          All Products ({Object.keys(groupedAlerts).length})
        </button>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProducts.map((group) => {
          const urgency = calculateProductUrgency(group.alerts);
          const outOfStockVariants = group.alerts.filter(
            (a) => a.status === "out"
          );
          const lowStockVariants = group.alerts.filter(
            (a) => a.status === "low" && a.currentStock > 0
          );

          return (
            <div
              key={group.productId}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col justify-between p-5"
            >
              {/* Urgency Indicator */}
              <div
                className={`h-2 rounded-b-full mb-2 ${getUrgencyColor(
                  urgency
                )}`}
              ></div>

              {/* Product Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    {group.image ? (
                      <img
                        src={group.image}
                        alt={group.name}
                        className="h-16 w-16 rounded-xl object-cover border"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    {urgency === "critical" && (
                      <div className="absolute -top-1 -right-1">
                        <AlertCircle className="h-5 w-5 text-red-500 fill-red-100" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {group.category}
                    </p>
                    <div className="flex items-center mt-2">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          urgency === "critical"
                            ? "bg-red-100 text-red-700"
                            : urgency === "high"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {urgency === "critical"
                          ? "Out of Stock"
                          : urgency === "high"
                          ? "Critical"
                          : "Low Stock"}
                      </div>
                      <span className="text-xs text-gray-400 mx-2">•</span>
                      <span className="text-xs text-gray-500">
                        {group.alerts.length} variant
                        {group.alerts.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Status Visualization */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Stock Levels
                  </span>
                  <span className="text-xs text-gray-500">
                    {outOfStockVariants.length} out, {lowStockVariants.length}{" "}
                    low
                  </span>
                </div>

                <div className="space-y-2">
                  {group.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            alert.status === "out"
                              ? "bg-red-500"
                              : alert.currentStock <= 2
                              ? "bg-orange-500"
                              : "bg-yellow-500"
                          }`}
                        ></div>
                        <span className="text-sm text-gray-700">
                          {alert.variantName ||
                            (alert.variantInfo
                              ? `${alert.variantInfo.color || ""} - ${
                                  alert.variantInfo.size || ""
                                }`
                              : "Variant")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {alert.status === "out" ? (
                          <span className="text-xs font-medium text-red-600">
                            OUT
                          </span>
                        ) : (
                          <div className="flex items-center">
                            <div className="relative w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`absolute h-full ${
                                  alert.currentStock <= 2
                                    ? "bg-orange-500"
                                    : "bg-yellow-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (alert.currentStock / 10) * 100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700 ml-2 min-w-[2rem]">
                              {alert.currentStock}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={() =>
                    onAdjust({
                      id: group.productId,
                      name: group.name,
                      image: group.image,
                      category: group.category,
                      price: group.price,
                      variants: group.alerts.map((a) => ({
                        _id: a.variantId,
                        color: a.variantInfo?.color,
                        size: a.variantInfo?.size,
                        countInStock: a.currentStock,
                        sku: a.variantInfo?.sku,
                      })),
                    })
                  }
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium transition-all duration-200 flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Restock Product
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedProducts.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            All Stock Levels Are Healthy!
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            No products are currently low on stock. You're doing great!
          </p>
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap justify-center gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {alerts.length}
            </div>
            <div className="text-sm text-gray-600">Total Alerts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {alerts.filter((a) => a.status === "out").length}
            </div>
            <div className="text-sm text-gray-600">Out of Stock</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.filter((a) => a.currentStock <= 2).length}
            </div>
            <div className="text-sm text-gray-600">Critical Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(groupedAlerts).length}
            </div>
            <div className="text-sm text-gray-600">Affected Products</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Aging Report View Component
const AgingReportView = ({ data }) => {
  const [expandedBuckets, setExpandedBuckets] = useState({});

  if (!data) return null;

  const getBucketColor = (bucketLabel) => {
    if (bucketLabel.includes("Fresh"))
      return "bg-gradient-to-r from-green-500 to-green-600";
    if (bucketLabel.includes("Aging"))
      return "bg-gradient-to-r from-yellow-500 to-yellow-600";
    if (bucketLabel.includes("Stale"))
      return "bg-gradient-to-r from-orange-500 to-orange-600";
    return "bg-gradient-to-r from-red-500 to-red-600";
  };

  const handleToggleExpand = (bucketId) => {
    setExpandedBuckets((prev) => ({
      ...prev,
      [bucketId]: !prev[bucketId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aging Score</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="text-2xl font-bold text-gray-900">
                  {data.summary?.agingScore || 0}/5
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    data.summary?.agingScore <= 2
                      ? "bg-green-500"
                      : data.summary?.agingScore <= 3
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                ></div>
              </div>
            </div>
            <TrendingDown className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {data.summary?.agingScore <= 2
              ? "Excellent turnover"
              : data.summary?.agingScore <= 3
              ? "Good turnover"
              : "Needs attention"}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fresh Stock</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {data.summary?.freshPercentage || 0}%
              </p>
            </div>
            <Package className="h-8 w-8 text-green-300" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stale Stock</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {data.summary?.stalePercentage || 0}%
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-300" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Over 90 days</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.summary?.totalItems?.toLocaleString() || 0}
              </p>
            </div>
            <Layers className="h-8 w-8 text-blue-300" />
          </div>
          <p className="text-xs text-gray-500 mt-2">All stock units</p>
        </div>
      </div>

      {/* Aging Buckets Visualization */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">
              Inventory Age Distribution
            </h3>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Visual breakdown of inventory based on how long items have been in
              stock
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              As of {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                  Fresh Stock
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.agingBuckets?.find((b) => b.label.includes("Fresh"))
                    ?.totalItems || 0}
                </p>
                <p className="text-sm text-blue-600 mt-1">Last 30 days</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">
                  Aging Stock
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.agingBuckets?.find((b) => b.label.includes("Aging"))
                    ?.totalItems || 0}
                </p>
                <p className="text-sm text-yellow-600 mt-1">31-90 days</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">
                  Stale Stock
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.agingBuckets?.find((b) => b.label.includes("Stale"))
                    ?.totalItems || 0}
                </p>
                <p className="text-sm text-orange-600 mt-1">91-180 days</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700 uppercase tracking-wide">
                  Old Stock
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.agingBuckets?.find((b) => b.label.includes("Old"))
                    ?.totalItems || 0}
                </p>
                <p className="text-sm text-red-600 mt-1">180+ days</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Visualization */}
        <div className="space-y-6 md:space-y-8">
          {data.agingBuckets?.map((bucket, index) => {
            const percentage = Math.round(
              (bucket.totalValue / data.summary.totalValue) * 100
            );
            const bucketColor = getBucketColor(bucket.label);
            const bucketId = `bucket-${index}`;
            const isExpanded = expandedBuckets[bucketId];

            return (
              <div
                key={index}
                className="group hover:bg-gray-50 transition-all duration-200 p-4 rounded-xl border border-gray-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl ${
                        bucketColor.includes("gradient")
                          ? "bg-gradient-to-br from-green-500/20 to-green-600/20"
                          : `${bucketColor} bg-opacity-20`
                      } flex items-center justify-center`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${bucketColor}`}
                      ></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        {bucket.label}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1">
                        {bucket.totalItems} units • ₦
                        {bucket.totalValue?.toLocaleString()} value
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                      <div className="text-2xl font-bold text-gray-900">
                        {percentage}%
                      </div>
                      <div className="text-sm text-gray-600">
                        of total value
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>0%</span>
                    <span className="font-medium">{percentage}%</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${bucketColor}`}
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Sample Items with Expand/Collapse */}
                {bucket.products.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-medium text-gray-700 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        {isExpanded ? "All Items" : "Top Items"} in this
                        Category
                      </h5>
                      <span className="text-xs text-gray-500">
                        {isExpanded
                          ? `${bucket.products.length} items`
                          : `Showing ${Math.min(
                              bucket.products.length,
                              3
                            )} of ${bucket.products.length}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(isExpanded
                        ? bucket.products
                        : bucket.products.slice(0, 3)
                      ).map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {item.variantName}
                              </p>
                              <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs font-medium text-gray-700">
                                    {item.ageInDays}d old
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs font-medium text-gray-700">
                                    {item.stock} units
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                ₦{Math.round(item.totalValue).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {bucket.products.length > 3 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => handleToggleExpand(bucketId)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 mx-auto"
                        >
                          <span>
                            {isExpanded
                              ? "Show less"
                              : `View all ${bucket.products.length} items`}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h5 className="font-medium text-gray-700 mb-4">Color Legend</h5>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Fresh (0-30 days)", color: "bg-green-500" },
              { label: "Aging (31-90 days)", color: "bg-yellow-500" },
              { label: "Stale (91-180 days)", color: "bg-orange-500" },
              { label: "Old (180+ days)", color: "bg-red-500" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* Slow Movers */}
      {data.slowMovers && data.slowMovers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Slow Moving Items
              </h3>
              <p className="text-gray-600 text-sm">
                Highest value items aging in inventory
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>

          <div className="space-y-3">
            {data.slowMovers.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.variantName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ₦{item.totalValue?.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{item.ageInDays} days old</span>
                    <span>•</span>
                    <span>{item.stock} units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Recommendations
          </h3>

          <div className="space-y-4">
            {data.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                  rec.type === "urgent"
                    ? "bg-red-50 border-red-200 hover:bg-red-100"
                    : rec.type === "warning"
                    ? "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                    : rec.type === "success"
                    ? "bg-green-50 border-green-200 hover:bg-green-100"
                    : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  {rec.type === "urgent" && (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  {rec.type === "warning" && (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  {rec.type === "success" && (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{rec.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{rec.message}</p>
                    <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      {rec.action}
                      <span className="transition-transform duration-200 group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Valuation View Component
const ValuationView = ({ data }) => {
  const valuationArray = data.valuation || [];

  const calculateSummary = () => {
    if (data.valuation?.summary) {
      return data.valuation.summary;
    }

    const totalValue = valuationArray.reduce(
      (sum, cat) => sum + (cat.totalValue || 0),
      0
    );
    const totalProducts = valuationArray.reduce(
      (sum, cat) => sum + (cat.totalProducts || 0),
      0
    );
    const totalVariants = valuationArray.reduce(
      (sum, cat) => sum + (cat.totalVariants || 0),
      0
    );
    const totalStock = valuationArray.reduce((sum, cat) => {
      if (cat.totalStock) return sum + cat.totalStock;
      return (
        sum +
        (cat.products?.reduce((pSum, p) => pSum + (p.totalStock || 0), 0) || 0)
      );
    }, 0);

    return {
      totalValue,
      totalProducts,
      totalVariants,
      totalStock,
      averageValuePerItem: totalStock > 0 ? totalValue / totalStock : 0,
    };
  };

  const summary = calculateSummary();
  const displayValuation = data.valuation?.summary
    ? data.valuation.categories || []
    : valuationArray;

  return (
    <div className="space-y-6 mt-10">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₦{summary.totalValue?.toLocaleString() || "0"}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalProducts || "0"}
              </p>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Variants</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalVariants || "0"}
              </p>
            </div>
            <Layers className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Value per Unit</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₦
                {summary.averageValuePerItem
                  ? summary.averageValuePerItem.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "0"}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Category Valuation Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Inventory Value by Category
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Distribution of inventory value across product categories
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % of Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Unit Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayValuation.map((category, index) => {
                const totalStock =
                  category.totalStock ||
                  category.products?.reduce(
                    (sum, p) => sum + (p.totalStock || 0),
                    0
                  ) ||
                  0;
                const avgUnitValue =
                  totalStock > 0 ? category.totalValue / totalStock : 0;
                const percentage =
                  summary.totalValue > 0
                    ? (
                        (category.totalValue / summary.totalValue) *
                        100
                      ).toFixed(1)
                    : "0.0";

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {category.category || "Uncategorized"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {category.totalProducts}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {category.totalVariants}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {totalStock.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        ₦{category.totalValue?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                parseFloat(percentage)
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        ₦
                        {avgUnitValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">TOTAL</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">
                    {summary.totalProducts}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">
                    {summary.totalVariants}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">
                    {summary.totalStock?.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">
                    ₦{summary.totalValue?.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">100%</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">
                    ₦
                    {summary.averageValuePerItem?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Categories Summary */}
      {displayValuation.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Top 3 Categories by Value
            </h4>
            <div className="space-y-3">
              {displayValuation.slice(0, 3).map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                          ? "bg-gray-400"
                          : "bg-orange-500"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {category.category}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(
                      (category.totalValue / summary.totalValue) * 100
                    )}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Value Concentration
            </h4>
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                Top 3 categories hold{" "}
                <span className="font-semibold text-gray-900">
                  {displayValuation
                    .slice(0, 3)
                    .reduce(
                      (sum, c) =>
                        sum +
                        Math.round((c.totalValue / summary.totalValue) * 100),
                      0
                    )}
                  %
                </span>{" "}
                of total value
              </p>
              <p className="text-xs text-gray-500">
                {displayValuation
                  .slice(0, 3)
                  .reduce(
                    (sum, c) =>
                      sum +
                      Math.round((c.totalValue / summary.totalValue) * 100),
                    0
                  ) > 80
                  ? "High concentration - consider diversifying"
                  : "Good diversification"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Highest Value per Unit
            </h4>
            <div className="space-y-2">
              {displayValuation
                .map((category) => {
                  const totalStock =
                    category.totalStock ||
                    category.products?.reduce(
                      (sum, p) => sum + (p.totalStock || 0),
                      0
                    ) ||
                    0;
                  return {
                    ...category,
                    avgUnitValue:
                      totalStock > 0 ? category.totalValue / totalStock : 0,
                  };
                })
                .sort((a, b) => b.avgUnitValue - a.avgUnitValue)
                .slice(0, 3)
                .map((category, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{category.category}</span>
                    <span className="font-medium text-gray-900">
                      ₦
                      {category.avgUnitValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Locations View Component
const LocationsView = ({ locations }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {locations.map((location) => (
        <div
          key={location.id}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {location.name}
            </h3>
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-gray-600 text-sm mb-4">{location.address}</p>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-semibold">{location.totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Value:</span>
              <span className="font-semibold">
                ₦{location.totalValue?.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Top Products
            </h4>
            <div className="space-y-2">
              {location.products?.map((product) => (
                <div
                  key={product.productId}
                  className="flex justify-between text-sm"
                >
                  <span className="truncate">{product.productName}</span>
                  <span className="font-medium">{product.stock} units</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default InventoryTab;