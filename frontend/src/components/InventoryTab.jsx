import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";
import { useInventoryStore } from "../stores/useInventoryStore.js";
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
  MoreVertical,
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
      fetchInventoryValuation();
    }
    if (activeTab === "history") {
      fetchStockHistory();
    }
    if (activeTab === "locations") {
      fetchInventoryByLocation();
    }
    // Add similar calls for adjustments when you implement it
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
    setSelectedProduct(product);
    setAdjustmentData({
      adjustmentType: "add",
      quantity: 1,
      reason: "restock",
      notes: "",
    });
    setShowAdjustModal(true);
  };

  const submitAdjustment = async () => {
    if (!selectedProduct) return;

    try {
      await adjustStock(selectedProduct.id, adjustmentData);
      toast.success("Stock adjusted successfully");
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
                onClick={fetchDashboard}
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
          />
        )}

        {activeTab === "low-stock" && (
          <LowStockView alerts={lowStockAlerts} onAdjust={handleAdjustStock} />
        )}

        {activeTab === "reorder" && (
          <ReorderView suggestions={reorderSuggestions} />
        )}

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
}) => (
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
          {/* ... existing table code ... */}
        </table>
      </div>
    )}
  </div>
);

// Sub-components
const DashboardView = ({ data }) => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Stock Value"
        value={`₦${data.summary?.totalStockValue?.toLocaleString() || "0"}`}
        icon={DollarSign}
        trend="+12.5%"
        color="blue"
      />
      <StatCard
        title="Low Stock Items"
        value={data.summary?.lowStockCount || 0}
        icon={AlertTriangle}
        trend="+3"
        color="yellow"
      />
      <StatCard
        title="Out of Stock"
        value={data.summary?.outOfStockCount || 0}
        icon={Package}
        trend="-2"
        color="red"
      />
      <StatCard
        title="Turnover Rate"
        value={`${data.summary?.inventoryTurnover || 0}x`}
        icon={TrendingUp}
        trend="+0.3x"
        color="green"
      />
    </div>

    {/* Fast Moving Products */}
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Fast Moving Products
      </h3>
      <div className="space-y-3">
        {data.fastMovingProducts?.map((product, index) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-500 font-medium">{index + 1}.</span>
              <div>
                <p className="font-medium text-gray-800">{product.name}</p>
                <p className="text-sm text-gray-500">
                  {product.currentStock} in stock
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                ₦{product.value?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Value</p>
            </div>
          </div>
        ))}
      </div>
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


const LowStockView = ({ alerts, onAdjust }) => (
  <div className="space-y-6">
    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Total Low Stock
            </p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">
              {alerts.length}
            </p>
          </div>
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
        </div>
        <p className="text-sm text-yellow-700 mt-2">
          Items need immediate attention
        </p>
      </div>
    </div>

    {/* Alerts List */}
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800">
          Low Stock Alerts
        </h2>
        <p className="text-gray-600 mt-1">
          Products with stock below threshold
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Threshold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Urgency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value at Risk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {alert.image && (
                      <img
                        src={alert.image}
                        alt={alert.name}
                        className="h-10 w-10 rounded object-cover mr-3"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {alert.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {alert.category}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-lg font-bold text-red-600">
                    {alert.currentStock}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{alert.threshold}</div>
                </td>
                <td className="px-6 py-4">
                  <UrgencyBadge
                    urgency={alert.status === "out" ? "critical" : "high"}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    ₦{alert.valueAtRisk?.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onAdjust(alert)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Restock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const ReorderView = ({ suggestions }) => (
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
                Product
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
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.category}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">
                    {item.currentStock}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-blue-600">
                    {item.suggestedOrder}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-900">
                    ₦{item.unitPrice?.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">
                    ₦{item.estimatedCost?.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <UrgencyBadge urgency={item.urgency} />
                </td>
                <td className="px-6 py-4">
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
    </div>
  </div>
);

const ValuationView = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
        {data.valuation?.summary ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Inventory Value</p>
              <p className="text-3xl font-bold text-gray-900">
                ₦{data.valuation.summary.totalValue?.toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-xl font-semibold text-gray-900">
                  {data.valuation.summary.totalItems}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Value per Item</p>
                <p className="text-xl font-semibold text-gray-900">
                  ₦{data.valuation.summary.averageValuePerItem?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {data.valuation?.map((group) => (
              <div
                key={group.category || group.label}
                className="p-3 border rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {group.category || group.label}
                  </span>
                  <span className="font-bold">
                    ₦{group.totalValue?.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {group.totalItems} items
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Most Valuable Items
        </h3>
        <div className="space-y-3">
          {data.valuation?.mostValuable?.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-medium">{index + 1}.</span>
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.stock} in stock</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  ₦{item.totalValue?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  ₦{item.unitValue?.toLocaleString()} each
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

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

const AdjustStockModal = ({ product, data, onChange, onSubmit, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-xl max-w-md w-full"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Adjust Stock: {product.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Adjustment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "add", label: "Add Stock", icon: Plus },
                { value: "remove", label: "Remove", icon: Minus },
                { value: "set", label: "Set Stock", icon: RefreshCw },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    onChange({ ...data, adjustmentType: type.value })
                  }
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
                    data.adjustmentType === type.value
                      ? "border-blue-500 bg-blue-50"
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
            <input
              type="number"
              min="1"
              value={data.quantity}
              onChange={(e) =>
                onChange({ ...data, quantity: parseInt(e.target.value) || 1 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <select
              value={data.reason}
              onChange={(e) => onChange({ ...data, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any additional notes..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply Adjustment
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

export default InventoryTab;
