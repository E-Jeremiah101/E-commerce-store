
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
  Archive,
  Trash2,
  RefreshCw,
  FileText,
  Database,
  HardDrive,
  Zap,
  RotateCcw,
  FileDown,
  Calendar as CalendarIcon,
  PieChart,
  Layers,
  Shield,
} from "lucide-react";
import { format } from "date-fns";

const ArchiveLogsTab = () => {
  const [archives, setArchives] = useState([]);
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
    status: "ALL",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [archiveStats, setArchiveStats] = useState(null);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  // Status types
  const statusTypes = [
    { value: "ALL", label: "All Statuses" },
    {
      value: "completed",
      label: "Completed",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
    },
    { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
    {
      value: "partial",
      label: "Partial",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "restored",
      label: "Restored",
      color: "bg-blue-100 text-blue-800",
    },
  ];

  const fetchArchives = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...filters,
      });

      const response = await axios.get(`/audit-logs/archives/list?${params}`);
      setArchives(response.data.archives);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching archives:", error);
      showMessage("error", "Failed to fetch archives");
    } finally {
      setLoading(false);
    }
  };

  const fetchArchiveStats = async () => {
    try {
      const response = await axios.get("/audit-logs/archives/status");
      setArchiveStats(response.data);
    } catch (error) {
      console.error("Error fetching archive stats:", error);
    }
  };

  useEffect(() => {
    fetchArchives();
    fetchArchiveStats();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchArchives(page);
    }
  };

  const showMessage = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage({ type: "", text: "" }), 5000);
  };

  const handleViewDetails = (archive) => {
    setSelectedArchive(archive);
    setShowDetailsModal(true);
  };

  const handleDownloadArchive = async (archiveId) => {
    try {
      setActionLoading(true);
      const response = await axios.get(
        `/audit-logs/archives/download/${archiveId}`,
        {
          responseType: "blob",
        }
      );

      const filename =
        response.headers["content-disposition"]
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || `archive_${archiveId}.json.gz`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showMessage("success", "Archive downloaded successfully");
    } catch (error) {
      console.error("Error downloading archive:", error);
      showMessage("error", "Failed to download archive");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerArchive = async () => {
    if (
      !window.confirm(
        "Are you sure you want to trigger manual archiving? This will archive logs older than 2 months."
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await axios.post("/audit-logs/archives/trigger");

      if (response.data.success) {
        showMessage(
          "success",
          response.data.message || "Archive triggered successfully"
        );
        fetchArchives();
        fetchArchiveStats();
      } else {
        showMessage("info", response.data.message || "No logs need archiving");
      }
    } catch (error) {
      console.error("Error triggering archive:", error);
      showMessage("error", "Failed to trigger archive");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreArchive = async () => {
    if (!selectedArchive) return;

    try {
      setActionLoading(true);
      const response = await axios.post(
        `/audit-logs/archives/restore/${selectedArchive._id}`
      );

      if (response.data.success) {
        showMessage(
          "success",
          response.data.message || "Archive restored successfully"
        );
        setShowRestoreModal(false);
        fetchArchives();
        fetchArchiveStats();
      }
    } catch (error) {
      console.error("Error restoring archive:", error);
      showMessage("error", "Failed to restore archive");
    } finally {
      setActionLoading(false);
      setSelectedArchive(null);
    }
  };

  const handleDeleteArchive = async () => {
    if (!selectedArchive) return;

    try {
      setActionLoading(true);
      const response = await axios.delete(
        `/audit-logs/archives/${selectedArchive._id}`
      );

      if (response.data.success) {
        showMessage(
          "success",
          response.data.message || "Archive deleted successfully"
        );
        setShowDeleteModal(false);
        fetchArchives();
        fetchArchiveStats();
      }
    } catch (error) {
      console.error("Error deleting archive:", error);
      showMessage("error", "Failed to delete archive");
    } finally {
      setActionLoading(false);
      setSelectedArchive(null);
    }
  };

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

  const formatDate = (date) => {
    try {
      return format(new Date(date), "MMM dd, yyyy HH:mm:ss");
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatPeriod = (start, end) => {
    return `${format(new Date(start), "MMM yyyy")} - ${format(
      new Date(end),
      "MMM yyyy"
    )}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "partial":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "restored":
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
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

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Archive Logs
            </h1>
            <p className="text-gray-600">
              Manage archived audit logs 
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerArchive}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4" />
              {actionLoading ? "Processing..." : "Trigger Archive"}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {archiveStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Archives</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {archiveStats.totalArchives || 0}
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Archival</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {archiveStats.logCount || 0}
                  </p>
                  {archiveStats.needed && (
                    <p className="text-xs text-red-600 mt-1">
                      {archiveStats.message}
                    </p>
                  )}
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Archived Logs</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {archiveStats.totalArchivedLogs || 0}
                  </p>
                </div>
                <Layers className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {archiveStats.totalStorageUsed || "0 MB"}
                  </p>
                </div>
                <HardDrive className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search archives..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-100"
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
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  {statusTypes.map((type) => (
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
            {archives.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Archive className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No archives found
                </h3>
                <p className="text-gray-500">
                  Archives will appear here after automatic or manual archiving
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Archive Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Archived At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stats
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Storage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {archives.map((archive) => (
                        <tr
                          key={archive._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPeriod(
                                archive.periodStart,
                                archive.periodEnd
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(
                                new Date(archive.periodStart),
                                "MMM dd, yyyy"
                              )}{" "}
                              -{" "}
                              {format(
                                new Date(archive.periodEnd),
                                "MMM dd, yyyy"
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(archive.archivedAt)}
                            </div>
                            {archive.archivedBy && (
                              <div className="text-xs text-gray-500">
                                By: {archive.archivedBy?.firstname}{" "}
                                {archive.archivedBy?.lastname}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(archive.status)}
                              <span
                                className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                                  statusTypes.find(
                                    (s) => s.value === archive.status
                                  )?.color || "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {archive.status.charAt(0).toUpperCase() +
                                  archive.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {archive.totalLogs?.toLocaleString()} logs
                            </div>
                            <div className="text-xs text-gray-500">
                              Compression: {archive.compressionRatio}%
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatFileSize(archive.fileSize)}
                            </div>
                            <div className="text-xs text-gray-500">
                              File:{" "}
                              {archive.archiveFileUrl?.split("/").pop() ||
                                "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewDetails(archive)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDownloadArchive(archive._id)
                                }
                                className="text-green-600 hover:text-green-900"
                                title="Download Archive"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              {archive.status === "completed" && (
                                <button
                                  onClick={() => {
                                    setSelectedArchive(archive);
                                    setShowRestoreModal(true);
                                  }}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="Restore Archive"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedArchive(archive);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Archive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
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

      {/* Archive Details Modal */}
      {showDetailsModal && selectedArchive && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Archive Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600">
                      Archive ID
                    </label>
                    <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                      {selectedArchive._id}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">
                      Period
                    </label>
                    <p className="text-sm">
                      {formatPeriod(
                        selectedArchive.periodStart,
                        selectedArchive.periodEnd
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">
                      Archived At
                    </label>
                    <p className="text-sm">
                      {formatDate(selectedArchive.archivedAt)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">
                      Archived By
                    </label>
                    <p className="text-sm">
                      {selectedArchive.archivedBy
                        ? `${selectedArchive.archivedBy.firstname} ${selectedArchive.archivedBy.lastname}`
                        : "System (Auto Archive)"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Statistics
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600">
                      Total Logs
                    </label>
                    <p className="text-sm font-semibold">
                      {selectedArchive.totalLogs?.toLocaleString()} records
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">
                      File Size
                    </label>
                    <p className="text-sm">
                      {formatFileSize(selectedArchive.fileSize)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">
                      Compression
                    </label>
                    <p className="text-sm">
                      {selectedArchive.compressionRatio}% savings
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">
                      Status
                    </label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedArchive.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : selectedArchive.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {selectedArchive.status.charAt(0).toUpperCase() +
                        selectedArchive.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedArchive.metadata && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Metadata
                  </h4>
                  <div className="bg-gray-50 p-4 rounded">
                    <pre className="text-xs whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {JSON.stringify(selectedArchive.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedArchive.errorLog && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-red-500 mb-2">
                    Error Log
                  </h4>
                  <div className="bg-red-50 p-4 rounded">
                    <pre className="text-xs text-red-700 whitespace-pre-wrap">
                      {selectedArchive.errorLog}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => handleDownloadArchive(selectedArchive._id)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Archive
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && selectedArchive && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">
                Restore Archive
              </h3>
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Are you sure you want to restore this archive? This will add{" "}
                <span className="font-semibold">
                  {selectedArchive.totalLogs?.toLocaleString()}
                </span>{" "}
                logs back to the main audit logs collection.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Period:{" "}
                {formatPeriod(
                  selectedArchive.periodStart,
                  selectedArchive.periodEnd
                )}
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRestoreModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreArchive}
                disabled={actionLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Restore Archive
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedArchive && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">
                Delete Archive
              </h3>
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this archive? This action cannot
                be undone. The archive file will be permanently removed from
                storage.
              </p>
              <div className="mt-3 p-3 bg-red-50 rounded">
                <p className="text-sm font-medium text-red-800">
                  Archive Details:
                </p>
                <p className="text-sm text-red-600">
                  • {selectedArchive.totalLogs?.toLocaleString()} logs
                </p>
                <p className="text-sm text-red-600">
                  • Period:{" "}
                  {formatPeriod(
                    selectedArchive.periodStart,
                    selectedArchive.periodEnd
                  )}
                </p>
                <p className="text-sm text-red-600">
                  • Size: {formatFileSize(selectedArchive.fileSize)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteArchive}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveLogsTab;
