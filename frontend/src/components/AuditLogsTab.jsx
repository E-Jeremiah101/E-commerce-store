// components/AuditLogsTab.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../lib/axios.js";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  RefreshCw,
  LogIn,
  LogOut,
  Key,
  TrendingDown,
  DollarSign,
  Archive,
  Database,
  Shield,
  Zap,
  Layers,
  AlertTriangle,
  Info
} from "lucide-react";
import { format } from "date-fns";

  const AuditLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    action: "ALL",
    entityType: "ALL",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [archiveStats, setArchiveStats] = useState(null);
  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [showArchiveStats, setShowArchiveStats] = useState(false);

  // Action types for dropdown
  const actionTypes = [
    { value: "ALL", label: "All Actions" },
    // Product actions
    { value: "CREATE_PRODUCT", label: "Create Product" },
    { value: "UPDATE_PRODUCT", label: "Update Product" },
    { value: "DELETE_PRODUCT", label: "Delete Product" },
    { value: "RESTORE_PRODUCT", label: "Restore Product" },
    { value: "PERMANENT_DELETE_PRODUCT", label: "Permanent Delete" },
    { value: "UPDATE_INVENTORY", label: "Update Inventory" },
    { value: "TOGGLE_FEATURED", label: "Toggle Featured" },
    { value: "PRICE_SLASH", label: "Price Slash" },
    { value: "PRICE_UPDATE", label: "Price Update" },
    { value: "PRICE_RESET", label: "Price Reset" },

    // Order actions
    { value: "UPDATE_ORDER_STATUS", label: "Update Order Status" },
    { value: "ORDER_RECOVERY_SUCCESS", label: "Order Recovery" },
    { value: "ORDER_RECOVERY_FAILED", label: "Order Recovery Failed" },
    { value: "CREATE_ORDER", label: "Create Order" },
    { value: "ORDER_RECOVERY_EMAIL_SENT", label: "Order recovery email sent" },
    { value: "AUTO_ORDER_ARCHIVE", label: "Auto Order Archive" },

    // Auth actions
    { value: "LOGIN", label: "Login" },
    { value: "LOGOUT", label: "Logout" },
    { value: "LOGIN_FAILED", label: "Login Failed" },
    { value: "SIGNUP_SUCCESS", label: "Signup Success" },
    { value: "FORGOT_PASSWORD_REQUEST", label: "Forgot Password" },
    { value: "RESET_PASSWORD", label: "Reset Password" },

    // Inventory actions
    { value: "BULK_INVENTORY_UPDATE", label: "Bulk Inventory Update" },
    { value: "INVENTORY_SYNC", label: "Inventory Sync" },

    // Refund actions
    { value: "VIEW_REFUND_REQUESTS", label: "View Refund Requests" },
    { value: "REFUND_REQUESTED", label: "Refund Request Submitted" },
    { value: "REFUND_APPROVED", label: "Refund Approved" },
    { value: "REFUND_REJECTED", label: "Refund Rejected" },
    { value: "REFUND_PROCESSING_STARTED", label: "Refund Processing Started" },
    { value: "REFUND_APPROVAL_FAILED", label: "Refund Approval Failed" },
    { value: "REFUND_APPROVAL_ERROR", label: "Refund Approval Error" },
    { value: "REFUND_REJECTION_ERROR", label: "Refund Rejection Error" },
    { value: "REFUND_ADMIN_REJECTED", label: "Admin Rejected Refund" },
    {
      value: "FLUTTERWAVE_REFUND_INITIATED",
      label: "Flutterwave Refund Initiated",
    },
    {
      value: "REFUND_APPROVAL_INITIATED",
      label: "Refund Approval Initiated",
    },
    {
      value: "FLUTTERWAVE_INITIATION_ERROR",
      label: "Flutterwave Initiation Error",
    },
    { value: "FLUTTERWAVE_NETWORK_ERROR", label: "Flutterwave Network Error" },
    { value: "REFUND_WEBHOOK_APPROVED", label: "Webhook: Refund Approved" },
    { value: "REFUND_WEBHOOK_REJECTED", label: "Webhook: Refund Rejected" },

    // Coupon actions
    { value: "CREATE_COUPON", label: "Create Coupon" },
    { value: "DELETE_COUPON", label: "Delete Coupon" },
    { value: "UPDATE_COUPON", label: "Update Coupon" },
    { value: "TOGGLE_COUPON", label: "Toggle Coupon Status" },
    { value: "COUPON_USED", label: "Coupon Used" },

    // Category actions
    { value: "CREATE_CATEGORY", label: "Create Category" },
    { value: "UPDATE_CATEGORY", label: "Update Category" },
    { value: "DELETE_CATEGORY", label: "Delete Category" },

    // User actions
    { value: "UPDATE_USER_ROLE", label: "Update User Role" },
  ];

  // Entity types for dropdown
  const entityTypes = [
    { value: "ALL", label: "All Entities" },
    { value: "PRODUCT", label: "Products" },
    { value: "ORDER", label: "Orders" },
    { value: "USER", label: "Users" },
    { value: "COUPON", label: "Coupons" },
    { value: "CATEGORY", label: "Categories" },
    { value: "SYSTEM", label: "System" },
    { value: "OTHER", label: "Other" },
  ];

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...filters,
      });

      const response = await axios.get(`/audit-logs?${params}`);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      showMessage("error", "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchArchiveStats = async () => {
    try {
      const response = await axios.get("/audit-logs/archives/status");
      setArchiveStats(response.data);
      
      // Show prompt if archiving is needed and threshold is met
      if (response.data.needed && response.data.logCount > 500) {
        setShowArchivePrompt(true);
      }
    } catch (error) {
      console.error("Error fetching archive stats:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchArchiveStats();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchLogs(page);
    }
  };

  const showMessage = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage({ type: "", text: "" }), 5000);
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`/audit-logs/export?${params}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit_logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showMessage("success", "Logs exported successfully");
    } catch (error) {
      console.error("Error exporting logs:", error);
      showMessage("error", "Failed to export logs");
    }
  };

  const triggerManualArchive = async () => {
    if (!window.confirm(
      "Are you sure you want to trigger manual archiving?\n\n" +
      "This will archive logs older than 2 months. Archived logs will be:\n" +
      "• Removed from the main database\n" +
      "• Compressed and stored as files\n" +
      "• Still accessible in the Archives section\n\n" +
      "This operation cannot be undone, but you can restore archives if needed."
    )) {
      return;
    }

    try {
      setArchiveLoading(true);
      const response = await axios.post("/audit-logs/archives/trigger");
      
      if (response.data.success) {
        showMessage("success", response.data.message || "Archive completed successfully");
        fetchLogs(); // Refresh logs list
        fetchArchiveStats(); // Refresh stats
        setShowArchivePrompt(false);
      } else {
        showMessage("info", response.data.message || "No logs need archiving");
      }
    } catch (error) {
      console.error("Error triggering archive:", error);
      showMessage("error", "Failed to trigger archive");
    } finally {
      setArchiveLoading(false);
    }
  };

  const checkArchiveStatus = async () => {
    try {
      const response = await axios.get("/audit-logs/archives/status");
      setArchiveStats(response.data);
      setShowArchiveStats(true);
    } catch (error) {
      console.error("Error checking archive status:", error);
      showMessage("error", "Failed to check archive status");
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      // Product actions
      case "CREATE_PRODUCT":
      case "CREATE_CATEGORY":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "DELETE_CATEGORY":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "DELETE_PRODUCT":
      case "PERMANENT_DELETE_PRODUCT":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "UPDATE_PRODUCT":
      case "UPDATE_INVENTORY":
      case "UPDATE_CATEGORY":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "RESTORE_PRODUCT":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "TOGGLE_FEATURED":
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
      case "PRICE_SLASH":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "PRICE_UPDATE":
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case "PRICE_RESET":
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      // Auth actions
      case "LOGIN":
      case "SIGNUP_SUCCESS":
        return <LogIn className="h-4 w-4 text-green-500" />;
      case "LOGOUT":
        return <LogOut className="h-4 w-4 text-gray-500" />;
      case "LOGIN_FAILED":
      case "SIGNUP_FAILED":
      case "RESET_PASSWORD_FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "FORGOT_PASSWORD_REQUEST":
      case "RESET_PASSWORD":
        return <Key className="h-4 w-4 text-blue-500" />;

      // Error cases
      case "LOGIN_ERROR":
      case "LOGOUT_ERROR":
      case "SIGNUP_ERROR":
      case "FORGOT_PASSWORD_ERROR":
      case "RESET_PASSWORD_ERROR":
        return <XCircle className="h-4 w-4 text-red-500" />;

      // Inventory actions
      case "UPDATE_INVENTORY":
      case "BULK_INVENTORY_UPDATE":
      case "INVENTORY_SYNC":
        return <Package className="h-4 w-4 text-teal-500" />;

      // Refund actions
      case "REFUND_REQUESTED":
      case "REFUND_APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REFUND_REJECTED":
      case "REFUND_ADMIN_REJECTED":
      case "REFUND_WEBHOOK_REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "REFUND_PROCESSING_STARTED":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "REFUND_APPROVAL_FAILED":
      case "REFUND_APPROVAL_ERROR":
      case "REFUND_REJECTION_ERROR":
      case "FLUTTERWAVE_INITIATION_ERROR":
      case "FLUTTERWAVE_NETWORK_ERROR":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "VIEW_REFUND_REQUESTS":
        return <Eye className="h-4 w-4 text-gray-500" />;
      case "FLUTTERWAVE_REFUND_INITIATED":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "REFUND_APPROVAL_INITIATED":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "REFUND_WEBHOOK_APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "USER_REFUND_REQUEST":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;

      case "BULK_INVENTORY_UPDATE_FAILED":
      case "INVENTORY_SYNC_FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "AUTO_INVENTORY_ADJUSTMENT":
        return <RefreshCw className="h-4 w-4 text-gray-500" />;

      // Order actions
      case "UPDATE_ORDER_STATUS":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "ORDER_RECOVERY_SUCCESS":
      case "CREATE_ORDER":
      case "ORDER_RECOVERY_EMAIL_SENT":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "ORDER_RECOVERY_FAILED":
      case "ORDER_RECOVERY_DUPLICATE":
      case "CREATE_ORDER_FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "VIEW_ORDERS_SEARCH":
      case "VIEW_ORDER_DETAILS":
      case "VIEW_USER_ORDERS":
        return <Eye className="h-4 w-4 text-gray-500" />;
      case "AUTO_ORDER_ARCHIVE":
        return <Archive className="h-4 w-4 text-gray-500" />;

      // Coupon actions
      case "CREATE_COUPON":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "DELETE_COUPON":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "UPDATE_COUPON":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "TOGGLE_COUPON":
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      case "COUPON_USED":
        return <DollarSign className="h-4 w-4 text-purple-500" />;

      // User actions
      case "UPDATE_USER_ROLE":
        return <AlertCircle className="h-4 w-4 text-indigo-500" />;

      // Auth actions
      case "LOGIN":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "LOGOUT":
        return <XCircle className="h-4 w-4 text-gray-500" />;

      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid Date";
    }
  };

  // Helper to format action text for display
  const formatActionText = (action) => {
    // Convert "CREATE_PRODUCT" to "Create Product"
    return action
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format file size
  const formatFileSize = (size) => {
    if (!size) return "0 Bytes";
    const units = ["Bytes", "KB", "MB", "GB"];
    let index = 0;
    let formattedSize = parseFloat(size);
    
    while (formattedSize >= 1024 && index < units.length - 1) {
      formattedSize /= 1024;
      index++;
    }
    
    return `${formattedSize.toFixed(2)} ${units[index]}`;
  };

  // Get oldest log date
  const getOldestLogDate = () => {
    if (logs.length === 0) return null;
    const dates = logs.map(log => new Date(log.timestamp));
    return format(new Date(Math.min(...dates)), "MMM dd, yyyy");
  };

  // Get newest log date
  const getNewestLogDate = () => {
    if (logs.length === 0) return null;
    const dates = logs.map(log => new Date(log.timestamp));
    return format(new Date(Math.max(...dates)), "MMM dd, yyyy");
  };

  return (
    <div className="p-4 md:p-6">
      {/* Action Message */}
      {actionMessage.text && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-4 rounded-lg ${
            actionMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : actionMessage.type === "error"
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          <div className="flex items-center">
            {actionMessage.type === "success" ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : actionMessage.type === "error" ? (
              <XCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        </motion.div>
      )}

      {/* Archive Prompt */}
      {showArchivePrompt && archiveStats && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-blue-800">
                    Archive Recommendation
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    You have{" "}
                    <span className="font-bold">
                      {archiveStats.logCount?.toLocaleString()}
                    </span>{" "}
                    logs older than 2 months that can be archived.
                  </p>
                  {archiveStats.periodStart && archiveStats.periodEnd && (
                    <p className="text-xs text-blue-600 mt-1">
                      Period:{" "}
                      {format(new Date(archiveStats.periodStart), "MMM yyyy")} -{" "}
                      {format(new Date(archiveStats.periodEnd), "MMM yyyy")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <button
                    onClick={triggerManualArchive}
                    disabled={archiveLoading}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {archiveLoading ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Archive className="h-3 w-3" />
                        Archive Now
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowArchivePrompt(false)}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Audit Logs
                </h1>
                <p className="text-gray-600">
                  Track all admin activities and system changes
                </p>
              </div>
            </div>

            {/* Date Range Info */}
            {logs.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Range:</span>
                  <span className="font-medium">
                    {getOldestLogDate()} - {getNewestLogDate()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>Total:</span>
                  <span className="font-medium">
                    {pagination.totalItems.toLocaleString()} records
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Archive Stats Card */}
          {archiveStats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow  p-3 min-w-[250px] cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setShowArchiveStats(true)}
              title="Click to view archive details"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Archives
                  </span>
                </div>
                <Info className="h-3 w-3 text-gray-400" />
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Archived Logs:</span>
                  <span className="font-semibold text-purple-600">
                    {archiveStats.totalArchivedLogs?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-500">Total Archives:</span>
                  <span className="font-semibold text-blue-600">
                    {archiveStats.totalArchives?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-500">Pending:</span>
                  <span
                    className={`font-semibold ${
                      archiveStats.logCount > 0
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {archiveStats.logCount?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Current Logs
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {pagination.totalItems.toLocaleString()}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Showing{" "}
                  {(
                    (pagination.currentPage - 1) * pagination.itemsPerPage +
                    1
                  ).toLocaleString()}
                  -
                  {Math.min(
                    pagination.currentPage * pagination.itemsPerPage,
                    pagination.totalItems
                  ).toLocaleString()}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Total (Incl. Archived)
                </p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {(
                    (pagination.totalItems || 0) +
                    (archiveStats?.totalArchivedLogs || 0)
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Combined count with archives
                </p>
              </div>
              <Layers className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Performance
                </p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {logs.length > 0
                    ? Math.round((logs.length / pagination.itemsPerPage) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Page load efficiency
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 no-scroll">
        {/* Top Row: Search + Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          {/* Search Input - Full width on mobile */}
          <div className="w-full md:flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by admin name, entity, or details..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons - Horizontal scroll on mobile */}
          <div className="w-full md:w-auto overflow-x-auto pb-2">
            <div className="flex space-x-2 min-w-max">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <button
                onClick={exportLogs}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={triggerManualArchive}
                disabled={archiveLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                title="Archive logs older than 2 months"
              >
                {archiveLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                {archiveLoading ? "Archiving..." : "Archive"}
              </button>
              <Link
                to="/admin/audit/archived-audit-logs"
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap"
                title="Check archive status"
              >
                <RefreshCw className="h-4 w-4" />
                Archived Logs
              </Link>
            </div>
          </div>
        </div>

        {/* Filters Section - Horizontal scroll when open on mobile */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            {/* Filter Grid - Horizontal scroll on mobile */}
            <div className="overflow-x-auto pb-4">
              <div className="flex space-x-4 min-w-max md:min-w-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 md:space-x-0">
                {/* Start Date */}
                <div className="min-w-[200px] md:min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                      value={filters.startDate}
                      onChange={(e) =>
                        handleFilterChange("startDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="min-w-[200px] md:min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                      value={filters.endDate}
                      onChange={(e) =>
                        handleFilterChange("endDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Action Type */}
                <div className="min-w-[200px] md:min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={filters.action}
                    onChange={(e) =>
                      handleFilterChange("action", e.target.value)
                    }
                  >
                    {actionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Entity Type */}
                <div className="min-w-[200px] md:min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={filters.entityType}
                    onChange={(e) =>
                      handleFilterChange("entityType", e.target.value)
                    }
                  >
                    {entityTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Date Presets - Horizontal scroll on mobile */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Quick presets:</p>
                <button
                  onClick={() => {
                    handleFilterChange("startDate", "");
                    handleFilterChange("endDate", "");
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear dates
                </button>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="flex space-x-2 min-w-max">
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - 7);
                      handleFilterChange(
                        "startDate",
                        start.toISOString().split("T")[0]
                      );
                      handleFilterChange(
                        "endDate",
                        end.toISOString().split("T")[0]
                      );
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
                  >
                    Last 7 days
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - 30);
                      handleFilterChange(
                        "startDate",
                        start.toISOString().split("T")[0]
                      );
                      handleFilterChange(
                        "endDate",
                        end.toISOString().split("T")[0]
                      );
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
                  >
                    Last 30 days
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setMonth(start.getMonth() - 2);
                      handleFilterChange(
                        "startDate",
                        start.toISOString().split("T")[0]
                      );
                      handleFilterChange(
                        "endDate",
                        end.toISOString().split("T")[0]
                      );
                    }}
                    className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 whitespace-nowrap"
                  >
                    Last 2 months
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setFullYear(start.getFullYear() - 1);
                      handleFilterChange(
                        "startDate",
                        start.toISOString().split("T")[0]
                      );
                      handleFilterChange(
                        "endDate",
                        end.toISOString().split("T")[0]
                      );
                    }}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 whitespace-nowrap"
                  >
                    Last year
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      handleFilterChange(
                        "startDate",
                        today.toISOString().split("T")[0]
                      );
                      handleFilterChange(
                        "endDate",
                        today.toISOString().split("T")[0]
                      );
                    }}
                    className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 whitespace-nowrap"
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display - Always visible when filters active */}
            {(filters.startDate ||
              filters.endDate ||
              filters.action !== "ALL" ||
              filters.entityType !== "ALL") && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Active filters:
                  </p>
                  <button
                    onClick={() => {
                      handleFilterChange("startDate", "");
                      handleFilterChange("endDate", "");
                      handleFilterChange("action", "ALL");
                      handleFilterChange("entityType", "ALL");
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear all
                  </button>
                </div>
                <div className="mt-2 overflow-x-auto">
                  <div className="flex space-x-2 min-w-max">
                    {filters.startDate && (
                      <span className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full whitespace-nowrap">
                        From: {filters.startDate}
                      </span>
                    )}
                    {filters.endDate && (
                      <span className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full whitespace-nowrap">
                        To: {filters.endDate}
                      </span>
                    )}
                    {filters.action !== "ALL" && (
                      <span className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full whitespace-nowrap">
                        Action:{" "}
                        {actionTypes.find((a) => a.value === filters.action)
                          ?.label || filters.action}
                      </span>
                    )}
                    {filters.entityType !== "ALL" && (
                      <span className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full whitespace-nowrap">
                        Entity:{" "}
                        {entityTypes.find((e) => e.value === filters.entityType)
                          ?.label || filters.entityType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading audit logs...</p>
            <p className="text-sm text-gray-500 mt-1">
              Total records: {pagination.totalItems.toLocaleString()}
            </p>
          </div>
        ) : (
          <>
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No audit logs found
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your filters or create some activity
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleFilterChange("startDate", "");
                      handleFilterChange("endDate", "");
                      handleFilterChange("action", "ALL");
                      handleFilterChange("entityType", "ALL");
                      handleFilterChange("search", "");
                    }}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    Clear all filters
                  </button>
                  <button
                    onClick={() => fetchLogs()}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Admin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => {
                        // Check if log is older than 60 days (eligible for archive)
                        const logDate = new Date(log.timestamp);
                        const sixtyDaysAgo = new Date();
                        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
                        const isArchiveEligible = logDate < sixtyDaysAgo;

                        return (
                          <tr
                            key={log._id}
                            className={`hover:bg-gray-50 transition-colors ${
                              isArchiveEligible
                                ? "bg-orange-50 hover:bg-orange-100"
                                : ""
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {getActionIcon(log.action)}
                                <div className="ml-2">
                                  <div className="text-sm text-gray-900">
                                    {formatTimestamp(log.timestamp)}
                                  </div>
                                  {isArchiveEligible && (
                                    <div className="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                                      <Clock className="h-3 w-3" />
                                      Eligible for archive
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {log.adminName}
                              </div>
                              {log.adminId?.email && (
                                <div className="text-xs text-gray-500">
                                  {log.adminId.email}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {formatActionText(log.action)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {log.entityName || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.entityTypeLabel || log.entityType}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {log.additionalInfo ||
                                  (log.changes &&
                                  Object.keys(log.changes).length > 0
                                    ? "View changes"
                                    : "No details")}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.ipAddress || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {isArchiveEligible ? (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 flex items-center gap-1">
                                    <Archive className="h-3 w-3" />
                                    Archive Eligible
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Active
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                          {(pagination.currentPage - 1) *
                            pagination.itemsPerPage +
                            1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(
                            pagination.currentPage * pagination.itemsPerPage,
                            pagination.totalItems
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {pagination.totalItems.toLocaleString()}
                        </span>{" "}
                        results
                        <span className="text-gray-500 ml-2">
                          (
                          {Math.round(
                            (pagination.currentPage / pagination.totalPages) *
                              100
                          )}
                          % of total)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handlePageChange(pagination.currentPage - 1)
                          }
                          disabled={pagination.currentPage === 1}
                          className={`px-3 py-1 rounded-md ${
                            pagination.currentPage === 1
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {[...Array(Math.min(pagination.totalPages, 5))].map(
                          (_, i) => {
                            // Show limited page numbers
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (
                              pagination.currentPage >=
                              pagination.totalPages - 2
                            ) {
                              pageNum = pagination.totalPages - 4 + i;
                            } else {
                              pageNum = pagination.currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 rounded-md ${
                                  pagination.currentPage === pageNum
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                        <button
                          onClick={() =>
                            handlePageChange(pagination.currentPage + 1)
                          }
                          disabled={
                            pagination.currentPage === pagination.totalPages
                          }
                          className={`px-3 py-1 rounded-md ${
                            pagination.currentPage === pagination.totalPages
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Page Size Selector */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {
                          logs.filter((log) => {
                            const logDate = new Date(log.timestamp);
                            const sixtyDaysAgo = new Date();
                            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
                            return logDate < sixtyDaysAgo;
                          }).length
                        }{" "}
                        logs on this page are archive eligible
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Items per page:
                        </span>
                        <select
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                          value={pagination.itemsPerPage}
                          onChange={(e) => {
                            const newItemsPerPage = parseInt(e.target.value);
                            setPagination((prev) => ({
                              ...prev,
                              itemsPerPage: newItemsPerPage,
                              currentPage: 1,
                            }));
                            setTimeout(() => fetchLogs(1), 100);
                          }}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Archive Stats Modal */}
      {showArchiveStats && archiveStats && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Archive className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Archive Statistics
                  </h3>
                  <p className="text-sm text-gray-600">
                    Overview of audit log archiving system
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArchiveStats(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Archive Status Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5">
                <h4 className="text-lg font-medium text-blue-800 mb-4">
                  Archive Status
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Current Logs</span>
                    <span className="text-lg font-bold text-blue-900">
                      {pagination.totalItems.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Pending Archive</span>
                    <span
                      className={`text-lg font-bold ${
                        archiveStats.logCount > 0
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {archiveStats.logCount?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Total Archived</span>
                    <span className="text-lg font-bold text-purple-600">
                      {archiveStats.totalArchivedLogs?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Archive Files</span>
                    <span className="text-lg font-bold text-indigo-600">
                      {archiveStats.totalArchives?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Archive Performance Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5">
                <h4 className="text-lg font-medium text-green-800 mb-4">
                  Performance
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Storage Saved</span>
                    <span className="text-lg font-bold text-green-900">
                      {archiveStats.totalStorageUsed || "0 MB"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Compression Ratio</span>
                    <span className="text-lg font-bold text-green-900">
                      {archiveStats.avgCompressionRatio || "0"}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Last Archive</span>
                    <span className="text-lg font-bold text-green-900">
                      {archiveStats.lastArchiveDate
                        ? format(
                            new Date(archiveStats.lastArchiveDate),
                            "MMM dd, yyyy"
                          )
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Next Auto Archive</span>
                    <span className="text-lg font-bold text-green-900">
                      {(() => {
                        const now = new Date();
                        const nextMonth = new Date(
                          now.getFullYear(),
                          now.getMonth() + 1,
                          1
                        );
                        nextMonth.setHours(2, 0, 0, 0);
                        return format(nextMonth, "MMM dd, yyyy HH:mm");
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Archive Eligibility */}
              {archiveStats.periodStart && archiveStats.periodEnd && (
                <div className="md:col-span-2 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5">
                  <h4 className="text-lg font-medium text-orange-800 mb-4">
                    Archive Eligibility
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-orange-700">Archive Period</span>
                      <span className="text-lg font-bold text-orange-900">
                        {format(new Date(archiveStats.periodStart), "MMM yyyy")}{" "}
                        - {format(new Date(archiveStats.periodEnd), "MMM yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-700">Logs to Archive</span>
                      <span className="text-lg font-bold text-orange-900">
                        {archiveStats.logCount?.toLocaleString() || 0} logs
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-700">Estimated Size</span>
                      <span className="text-lg font-bold text-orange-900">
                        {archiveStats.estimatedSize || "Calculating..."}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-orange-700">
                          Archive Progress
                        </span>
                        <span className="font-medium text-orange-800">
                          {Math.round(
                            ((archiveStats.totalArchivedLogs || 0) /
                              ((archiveStats.totalArchivedLogs || 0) +
                                (archiveStats.logCount || 0) +
                                (pagination.totalItems || 0))) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{
                            width: `${Math.round(
                              ((archiveStats.totalArchivedLogs || 0) /
                                ((archiveStats.totalArchivedLogs || 0) +
                                  (archiveStats.logCount || 0) +
                                  (pagination.totalItems || 0))) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="md:col-span-2 flex justify-center gap-4 pt-4 border-t">
                <button
                  onClick={triggerManualArchive}
                  disabled={archiveLoading || !archiveStats.needed}
                  className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                    archiveStats.needed
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {archiveLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Archiving in progress...
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      Archive Now (
                      {archiveStats.logCount?.toLocaleString() || 0} logs)
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    // Navigate to archives page
                    window.location.hash = "#archives";
                    setShowArchiveStats(false);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  View All Archives
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Active (less than 60 days)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Archive Eligible (older than 60 days)</span>
            </div>
          </div>
          <div className="mt-2 md:mt-0 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Auto-archive runs monthly • Retention: 24 months
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsTab;