import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Layers} from "lucide-react";
import { useUserStore } from "../stores/useUserStore.js";
import { useInventoryStore } from "../stores/useInventoryStore.js";
import axios from "../lib/axios.js";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Warehouse,
  History,
  RefreshCw,
  BarChart,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Download,
  Upload,
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

    // Computed
    pagination,
    filters,
  } = useInventoryStore();
  useEffect(() => {
    console.log(" Stock Levels Data:", stockLevels);
    console.log(" First Product:", stockLevels[0]);
    console.log(" First Product Variants:", stockLevels[0]?.variants);
  }, [stockLevels]);
  const [expandedBuckets, setExpandedBuckets] = useState({});

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
      case "reorder":
        fetchReorderSuggestions(10);
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

    // Dismiss loading toast after 1 second
    setTimeout(() => {
      toast.dismiss();
      toast.success("Data refreshed successfully!");
    }, 1000);
  };

  

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    adjustmentType: "add",
    quantity: 1,
    reason: "restock",
    notes: "",
  });

  const { user } = useUserStore();

  // Fetch dashboard on mount
  useEffect(() => {
    fetchDashboard();
  }, []);
  useEffect(() => {
    console.log("📊 Current pagination:", pagination);
    console.log("📦 Stock levels count:", stockLevels.length);
    console.log("🔍 Has next page?", pagination.hasNextPage);
    console.log("🔍 Has prev page?", pagination.hasPrevPage);
  }, [pagination, stockLevels]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "stock-levels") {
      fetchStockLevels(1, filters);
    }
    if (activeTab === "low-stock") {
      fetchLowStockAlerts(10);
    }
    if (activeTab === "reorder") {
      fetchReorderSuggestions(10);
    }
     if (activeTab === "valuation") {
       fetchInventoryAging();
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

  // Get stats for display
  const stats = getInventoryStats();

  const handleExportReport = async () => {
    try {
      await exportInventoryReport("csv");
    } catch (error) {
      toast.error("Failed to export report");
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



 // Update the submitAdjustment function to pass variantId
 const submitAdjustment = async (adjustmentDataWithVariant) => {
   if (!selectedProduct) return;

   try {
     await adjustStock(selectedProduct.id, adjustmentDataWithVariant);
     setShowAdjustModal(false);
     setSelectedProduct(null);

     // Refresh current view
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
     // Error is handled in store
   }
 };

 

  const handleSearch = (e) => {
    const searchValue = e.target.value;
    updateFilters({ search: searchValue });
    // Debounce or call fetch after search
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

      // Refresh dashboard data
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
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Download className="h-4 w-4" />
                Export Report
              </button>
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
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-xl font-bold">
                ₦{stats.totalStockValue?.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-xl font-bold text-red-600">
                {stats.outOfStockCount}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-xl font-bold text-yellow-600">
                {stats.lowStockCount}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Urgent Alerts</p>
              <p className="text-xl font-bold text-orange-600">
                {stats.urgentAlerts}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart },
              { id: "stock-levels", label: "Stock Levels", icon: Package },
              { id: "low-stock", label: "Low Stock", icon: AlertTriangle },
              { id: "history", label: "History", icon: History },
              { id: "locations", label: "Locations", icon: MapPin },
              { id: "reorder", label: "Reorder", icon: ShoppingCart },
              { id: "valuation", label: "Valuation", icon: DollarSign },
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
            updateFilters={updateFilters} // Add this
            clearFilters={clearFilters} // Add this
            pagination={pagination} // Add this
            onPageChange={(page) => fetchStockLevels(page, filters)}
          />
        )}

        {activeTab === "low-stock" && (
          <LowStockView alerts={lowStockAlerts} onAdjust={handleAdjustStock} />
        )}

        {activeTab === "reorder" && (
          <ReorderView suggestions={reorderSuggestions} />
        )}
        {activeTab === "valuation" && <AgingReportView data={inventoryAging} />}

        {activeTab === "valuation" && inventoryValuation && (
          <ValuationView data={inventoryValuation} />
        )}

        {activeTab === "history" && (
          <HistoryView history={stockHistory} loading={loading} />
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
    </div>
  );
};

// Add these missing components
const HistoryView = ({ history, loading }) => (
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <div className="p-6 border-b">
      <h2 className="text-xl font-semibold text-gray-800">Stock History</h2>
      <p className="text-gray-600 mt-1">Track all inventory adjustments</p>
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
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adjustment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    Product ID: {log.productId?.toString().slice(-6)}
                  </div>
                </td>
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{log.quantity}</div>
                  <div className="text-xs text-gray-500">
                    {log.oldStock} → {log.newStock}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{log.reason}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {log.adjustedBy?.firstname || "System"}
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

// Update StockLevelsView to include search functionality
const StockLevelsView = ({
  stockLevels,
  onAdjust,
  loading,
  onSearch,
  filters,
  updateFilters,
  clearFilters,
  pagination = {
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  onPageChange,
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
              <option value="electronics">Electronics</option>
              <option value="fashion">Fashion</option>
              <option value="home">Home</option>
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
                      <button
                        onClick={() =>
                          onAdjust({
                            ...product,
                            variants: product.variants || [],
                          })
                        }
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Adjust
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Variant Rows (if expanded) */}
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

// Sub-components
// In your InventoryTab.js - Update the DashboardView component:

const DashboardView = ({ data }) => (
  <div className="space-y-6">
    {/* Stats Cards - SHOW ALL METRICS */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Total Stock Value"
        value={`₦${data.summary?.totalStockValue?.toLocaleString() || "0"}`}
        icon={DollarSign}
        trend="+12.5%"
        color="blue"
      />

      {/* Second Row of Stats */}

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
                {/* Rank Badge */}
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

                {/* Product Image */}
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

                {/* Product Info */}
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

              {/* Revenue/Value */}
              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg">
                  ₦{product.value?.toLocaleString() || "0"}
                </p>
                <p className="text-sm text-gray-500">
                  {product.source === "orders" ? "Revenue" : "Stock Value"}
                </p>

                {/* Unit price */}
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
        /* Empty State */
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

const LowStockView = ({ alerts, onAdjust }) => {
  // Group alerts by product for better organization
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

  // Calculate urgency level for each product
  const calculateProductUrgency = (alerts) => {
    if (alerts.some((a) => a.status === "out")) return "critical";
    if (alerts.some((a) => a.currentStock <= 2)) return "high";
    if (alerts.some((a) => a.status === "low")) return "medium";
    return "low";
  };

  // Get urgency color
  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: "bg-gradient-to-r from-red-500 to-red-600",
      high: "bg-gradient-to-r from-orange-500 to-orange-600",
      medium: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      low: "bg-gradient-to-r from-blue-500 to-blue-600",
    };
    return colors[urgency] || colors.medium;
  };

  // Sort products by urgency
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


const AgingReportView = ({ data }) => {
  const [expandedBuckets, setExpandedBuckets] = useState({});

  if (!data) return null;

  const getBucketColor = (bucketLabel) => {
    if (bucketLabel.includes("Fresh")) return "bg-gradient-to-r from-green-500 to-green-600";
    if (bucketLabel.includes("Aging")) return "bg-gradient-to-r from-yellow-500 to-yellow-600";
    if (bucketLabel.includes("Stale")) return "bg-gradient-to-r from-orange-500 to-orange-600";
    return "bg-gradient-to-r from-red-500 to-red-600";
  };

  const handleExportReport = () => {
    // Add your export logic here
    console.log("Exporting aging report...");
  };

  const handleCreateActionPlan = () => {
    // Add your action plan logic here
    console.log("Creating action plan...");
  };

  const handleRefreshData = () => {
    // Add your refresh logic here
    console.log("Refreshing data...");
  };

  const handleToggleExpand = (bucketId) => {
    setExpandedBuckets(prev => ({
      ...prev,
      [bucketId]: !prev[bucketId]
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
                        bucketColor.includes('gradient') 
                          ? 'bg-gradient-to-br from-green-500/20 to-green-600/20' 
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
                        {isExpanded ? "All Items" : "Top Items"} in this Category
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
                                ₦
                                {Math.round(
                                  item.totalValue
                                ).toLocaleString()}
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

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleExportReport}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Aging Report
          </button>
          <button 
            onClick={handleCreateActionPlan}
            className="px-5 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-xl font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Create Action Plan
          </button>
          <button 
            onClick={handleRefreshData}
            className="px-5 py-3 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-xl font-medium hover:from-green-200 hover:to-green-300 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
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
                      <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
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





const ReorderView = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              All Stock Levels Are Healthy!
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No reorder suggestions at this time. Your inventory is
              well-stocked.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Reorder Suggestions
            </h2>
            <p className="text-gray-600 mt-1">
              Smart suggestions to optimize your inventory
            </p>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Create Purchase Order
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product & Variant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suggested Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Urgency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suggestions.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-10 w-10 rounded object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.category}
                        </div>
                        {item.variantName && (
                          <div className="text-xs text-gray-400 mt-1">
                            {item.variantName}
                          </div>
                        )}
                        {item.sku && (
                          <div className="text-xs text-gray-400">
                            SKU: {item.sku}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.currentStock}
                    </div>
                    {item.currentStock === 0 && (
                      <div className="text-xs text-red-600">Out of stock</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-blue-600">
                      {item.suggestedOrder}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₦{item.unitPrice?.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ₦{item.estimatedCost?.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UrgencyBadge urgency={item.urgency} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        Order
                      </button>
                      <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                        Skip
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {suggestions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  Total estimated cost:{" "}
                  <span className="font-bold text-gray-900">
                    ₦
                    {suggestions
                      .reduce((sum, s) => sum + s.estimatedCost, 0)
                      .toLocaleString()}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {suggestions.filter((s) => s.urgency === "critical").length}{" "}
                  critical items •{" "}
                  {suggestions.filter((s) => s.urgency === "high").length} high
                  priority
                </p>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Generate Purchase Order (PDF)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

  // Updated ValuationView to work with your current backend structure:
const ValuationView = ({ data }) => {
  // Calculate summary from the array if summary doesn't exist
  const valuationArray = data.valuation || [];
  
  const calculateSummary = () => {
    if (data.valuation?.summary) {
      return data.valuation.summary;
    }
    
    // Calculate from array
    const totalValue = valuationArray.reduce((sum, cat) => sum + (cat.totalValue || 0), 0);
    const totalProducts = valuationArray.reduce((sum, cat) => sum + (cat.totalProducts || 0), 0);
    const totalVariants = valuationArray.reduce((sum, cat) => sum + (cat.totalVariants || 0), 0);
    const totalStock = valuationArray.reduce((sum, cat) => {
      if (cat.totalStock) return sum + cat.totalStock;
      // Calculate from products array
      return sum + (cat.products?.reduce((pSum, p) => pSum + (p.totalStock || 0), 0) || 0);
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
  const displayValuation = data.valuation?.summary ? data.valuation.categories || [] : valuationArray;

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

// Add this to your InventoryTab.js


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

const AdjustStockModal = ({ product, data, onChange, onSubmit, onClose }) => {
  const [selectedVariant, setSelectedVariant] = useState("main");

  // Only show variants - no main product option
  const options = (product.variants || []).map((variant) => ({
    id: variant._id,
    label: `${variant.color || "Default"} - ${variant.size || "One Size"}`,
    description: `Current stock: ${variant.countInStock || 0}`,
    currentStock: variant.countInStock || 0,
    variantInfo: variant,
  }));

  // Auto-select first variant if none selected
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

    const submitData = {
      ...data,
      variantId: selectedVariant,
    };
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
                        {/* Stock indicator */}
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


export default InventoryTab;
