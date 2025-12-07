// components/AuditLogsTab.jsx
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { format } from "date-fns"; // ADD THIS IMPORT

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

    // Order actions
    { value: "UPDATE_ORDER_STATUS", label: "Update Order Status" },
    { value: "ORDER_RECOVERY_SUCCESS", label: "Order Recovery" },
    { value: "ORDER_RECOVERY_FAILED", label: "Order Recovery Failed" },
    { value: "CREATE_ORDER", label: "Create Order" },
    { value: "VIEW_ORDER_DETAILS", label: "View Order Details" },

    // Inventory actions
    { value: "BULK_INVENTORY_UPDATE", label: "Bulk Inventory Update" },
    { value: "INVENTORY_SYNC", label: "Inventory Sync" },

    // Refund actions
    { value: "REFUND_APPROVED", label: "Refund Approved" },
    { value: "REFUND_REJECTED", label: "Refund Rejected" },
    { value: "VIEW_REFUND_REQUESTS", label: "View Refund Requests" },

    // Category actions
    { value: "CREATE_CATEGORY", label: "Create Category" },
    { value: "UPDATE_CATEGORY", label: "Update Category" },

    // User actions
    { value: "UPDATE_USER_ROLE", label: "Update User Role" },

    // Auth actions
    { value: "LOGIN", label: "Login" },
    { value: "LOGOUT", label: "Logout" },
    { value: "OTHER", label: "Other" },
  ];

  // Entity types for dropdown
  const entityTypes = [
    { value: "ALL", label: "All Entities" },
    { value: "PRODUCT", label: "Products" },
    { value: "ORDER", label: "Orders" },
    { value: "USER", label: "Users" },
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
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
    } catch (error) {
      console.error("Error exporting logs:", error);
    }
  };

  
  const getActionIcon = (action) => {
    switch (action) {
      // Product actions
      case "CREATE_PRODUCT":
      case "CREATE_CATEGORY":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
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

      // Inventory actions
      case "UPDATE_INVENTORY":
      case "BULK_INVENTORY_UPDATE":
      case "INVENTORY_SYNC":
        return <Package className="h-4 w-4 text-teal-500" />;

      // Refund actions
      case "REFUND_APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REFUND_REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "REFUND_APPROVAL_FAILED":
      case "REFUND_APPROVAL_ERROR":
      case "REFUND_REJECTION_ERROR":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "VIEW_REFUND_REQUESTS":
        return <Eye className="h-4 w-4 text-gray-500" />;
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "ORDER_RECOVERY_FAILED":
      case "ORDER_RECOVERY_DUPLICATE":
      case "CREATE_ORDER_FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "VIEW_ORDERS_SEARCH":
      case "VIEW_ORDER_DETAILS":
      case "VIEW_USER_ORDERS":
        return <Eye className="h-4 w-4 text-gray-500" />;

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

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Audit Logs
        </h1>
        <p className="text-gray-600">
          Track all admin activities and changes made to the system
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
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

              <div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.action}
                  onChange={(e) => handleFilterChange("action", e.target.value)}
                >
                  {actionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
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
          </motion.div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No audit logs found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your filters or create some activity
                </p>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr
                          key={log._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getActionIcon(log.action)}
                              <span className="ml-2 text-sm text-gray-900">
                                {formatTimestamp(log.timestamp)}
                              </span>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
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
                          {pagination.totalItems}
                        </span>{" "}
                        results
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
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogsTab;
