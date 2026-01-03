import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../lib/axios";
import { Eye, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";

const AdminRefundsTab = () => {
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedReason, setSelectedReason] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [showRejectModal, setShowRejectModal] = useState(null); // { orderId, refundId }
  const [rejectionReason, setRejectionReason] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  // Fetch all refund requests
  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        setLoading(true);
        // Use shared axios instance (baseURL already set to /api in production)
        const res = await axios.get("/refunds");
        setRefunds(res.data || []);
        setFilteredRefunds(res.data || []);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching refunds:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRefunds();
  }, []);

  // Filter refunds
  useEffect(() => {
    let filtered = [...refunds];

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.orderNumber?.toLowerCase().includes(term) ||
          r.user?.firstname?.toLowerCase().includes(term) ||
          r.user?.email?.toLowerCase().includes(term) ||
          r.user?._id?.toLowerCase().includes(term) ||
          r.orderId?.toLowerCase().includes(term) ||
          r.refundId?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter((r) => r.requestedAt?.startsWith(dateFilter));
    }

    setFilteredRefunds(filtered);
  }, [searchTerm, statusFilter, dateFilter, refunds]);

  // Add after your existing useEffect
  useEffect(() => {
    // Real-time refresh every 30 seconds for Processing refunds
    const interval = setInterval(() => {
      const hasProcessing = refunds.some((r) => r.status === "Processing");
      if (hasProcessing) {
        fetchRefundsSilently();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refunds]);

  // Silent refresh function
  const fetchRefundsSilently = async () => {
    try {
      const res = await axios.get("/refunds");
      setRefunds(res.data || []);
      setFilteredRefunds(res.data || []);
    } catch (err) {
      console.error("Silent refresh failed:", err);
    }
  };

  const handleApprove = async (orderId, refundId) => {
    try {
      setLoadingStates((prev) => ({ ...prev, [refundId]: "approving" }));

      const response = await axios.put(
        `/refunds/${orderId}/${refundId}/approve`
      );

      // Show success toast
      toast.success(response.data.message || "Refund initiated successfully");

      // Update UI immediately
      setRefunds((prev) =>
        prev.map((r) =>
          r.refundId === refundId
            ? {
                ...r,
                status: response.data.currentStatus, // Use the status from response
                processedAt: new Date().toISOString(),
                flutterwaveRefundId: response.data.flutterwaveRefundId,
              }
            : r
        )
      );

      // If status is still Processing, start polling
      if (response.data.currentStatus === "Processing") {
        // Poll for status updates
        const pollInterval = setInterval(async () => {
          try {
            const pollResponse = await axios.get(
              `/refunds/${orderId}/${refundId}/poll`
            );

            if (pollResponse.data.updated) {
              // Status was updated, refresh the list
              fetchRefundsSilently();
              clearInterval(pollInterval);

              // Show success message if now Approved
              if (pollResponse.data.currentStatus === "Approved") {
                toast.success("Refund completed successfully!");
              }
            }
          } catch (pollError) {
            console.error("Polling failed:", pollError);
            clearInterval(pollInterval);
          }
        }, 10000); // Poll every 10 seconds

        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 300000);
      }
    } catch (err) {
      console.error("Initiate refund failed:", err);
      toast.error(err.response?.data?.message || "Failed to initiate refund");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [refundId]: null }));
    }
  };

  // Pagination logic
  const totalRequest = filteredRefunds.length;
  const totalPages = Math.ceil(totalRequest / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayeRequest = filteredRefunds.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (pageNum) => setCurrentPage(pageNum);

  // Reject refund
  const handleReject = async (
    orderId,
    refundId,
    reason = "Rejected by admin"
  ) => {
    try {
      setLoadingStates((prev) => ({ ...prev, [refundId]: "rejecting" }));
      await axios.put(`/refunds/${orderId}/${refundId}/reject`, {
        reason: reason.trim() || "Rejected by admin",
      });
      toast.success("Refund rejected successfully ");
      const processedAt = new Date().toISOString();
      setRefunds((prev) =>
        prev.map((r) =>
          r.refundId === refundId
            ? { ...r, status: "Rejected", processedAt, rejectionReason: reason }
            : r
        )
      );
    } catch (err) {
      console.error("Reject refund failed:", err);
      toast.error(err.response?.data?.message || "Failed to reject refund");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [refundId]: null }));
    }
  };

  // Add to AdminRefundsTab component
  const handleSyncRefund = async (orderId, refundId) => {
    try {
      setLoadingStates((prev) => ({ ...prev, [refundId]: "syncing" }));

      const response = await axios.get(`/refunds/${orderId}/${refundId}/poll`);

      if (response.data.updated) {
        toast.success("Status updated!");
        // Refresh the list
        const res = await axios.get("/refunds");
        setRefunds(res.data || []);
        setFilteredRefunds(res.data || []);
      } else {
        toast.info(`Status is still ${response.data.currentStatus}`);
      }
    } catch (err) {
      console.error("Sync failed:", err);
      toast.error("Failed to sync status");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [refundId]: null }));
    }
  };
  const { settings } = useStoreSettings();

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <RotateCcw className="h-10 w-10 text-gray-400 animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-600">
            Loading Refunds...
          </p>
          <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
        </div>
      </div>
    );

  return (
    <>
      <motion.div
        className="bg-white shadow rounded-xl  px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* <ToastContainer position="top-center" autoClose={3000} /> */}
        <h2 className="text-lg font-semibold mb-4">Refund Requests</h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by ID/email/ORD "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded   text-sm"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-2 rounded text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <div className="block w-fit">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border p-2 rounded text-sm"
            />
          </div>
        </div>
        {/* Processing Status Banner */}
        {refunds.some((r) => r.status === "Processing") && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">⏳</span>
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">
                    Active Refund Processing
                  </h3>
                  <p className="text-sm text-blue-700">
                    Some refunds are being processed. Status will update
                    automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchRefundsSilently}
                className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium transition-colors"
              >
                Refresh Now
              </button>
            </div>
          </div>
        )}

        {/* Refunds Table */}
        <div className="overflow-x-auto no-scroll">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">User</th>
                <th className="px-4 py-2 border">Product</th>
                <th className="px-4 py-2 border">Amount</th>
                <th className="px-4 py-2 border">Reason</th>
                <th className="px-4 py-2 border">Requested</th>
                <th className="px-4 py-2 border">Processed</th>
                <th className="px-4 py-2 border">Status</th>

                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRefunds.length > 0 ? (
                displayeRequest.map((r) => (
                  <tr key={r.refundId} className="border-b hover:bg-gray-50">
                    {/* User */}
                    <td className="px-2 py-2 border">
                      <p className="font-medium">
                        {r.orderNumber || r.orderId}
                      </p>
                      <p className="text-xs text-gray-500">
                        {r.user.firstname + " " + r.user.lastname || "NA"}
                      </p>
                    </td>

                    {/* Product */}
                    <td className="px-1 py-2 border">
                      <div
                        className="flex items-center gap-2 cursor-pointer flex-col"
                        onClick={() => setSelectedProduct(r)}
                      >
                        <img
                          src={r.productImage || "/images/deleted.png"}
                          alt={r.productName}
                          className="w-10 h-10 object-cover rounded-md border border-gray-300 hover:scale-105 transition-transform"
                          onError={(e) =>
                            (e.target.src = "/images/deleted.png")
                          }
                        />

                        <p className="text-xs ">{r.productName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2 border">
                      {formatPrice(r.amount, settings?.currency) || 0}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-700">
                      <button
                        onClick={() => setSelectedReason(r.reason)}
                        className="text-gray-600  hover:text-blue-800 px-1 "
                      >
                        <Eye size={20} />
                      </button>
                    </td>
                    <td className="px-4 py-2 border">
                      {new Date(r.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 border">
                      {r.processedAt
                        ? new Date(r.processedAt).toLocaleString()
                        : "—"}
                    </td>

                    {/* <td
                      className={`px-4 py-2 border font-medium ${
                        r.status === "Approved"
                          ? "text-green-600"
                          : r.status === "Rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {r.status}
                    </td> */}
                    <td className="px-4 py-2 border">
                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          r.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : r.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : r.status === "Processing"
                            ? "bg-blue-100 text-blue-800 animate-pulse" // New state
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {r.status}
                        {r.status === "Processing"}
                      </span>
                      {r.status === "Rejected" && r.rejectionReason && (
                        <div className="mt-1 text-xs text-gray-600 max-w-xs">
                          <span className="font-medium">Reason:</span>{" "}
                          {r.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-2 border text-center space-x-2">
                      {/* Only show buttons for Pending refunds */}
                      {r.status === "Pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(r.orderId, r.refundId)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
                            disabled={loadingStates[r.refundId]}
                          >
                            {loadingStates[r.refundId] === "approving" ? (
                              <>
                                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                Initiating...
                              </>
                            ) : (
                              "Approve"
                            )}
                          </button>
                          <button
                            onClick={() =>
                              setShowRejectModal({
                                orderId: r.orderId,
                                refundId: r.refundId,
                                productName: r.productName,
                              })
                            }
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
                            disabled={loadingStates[r.refundId]}
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Show info message for Processing refunds */}
                      {r.status === "Processing" && (
                        <div className="text-blue-600 text-sm bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                            Refund is being processed...
                          </div>
                        </div>
                      )}

                      {r.status === "Processing" && (
                        <div className="flex gap-2">
                          <div className="text-blue-600 text-sm bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                              Processing...
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleSyncRefund(r.orderId, r.refundId)
                            }
                            className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                            title="Check refund status"
                          >
                            Check Status
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-500">
                    No refunds found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rejection Reason Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Reject Refund: {showRejectModal.productName}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Explain why this refund is being rejected (this will be sent to the customer)..."
                  required
                />
                {/* Optional: Common reasons quick-select */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">Common Reasons:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Item not in original condition",
                      "Missing original packaging/accessories",
                      "Return outside 48-hour policy window",
                      "Signs of wear or damage",
                      "Product has been used/altered",
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setRejectionReason(reason)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Minimum 5 characters. This reason will be emailed to the
                  customer.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (
                      !rejectionReason.trim() ||
                      rejectionReason.trim().length < 5
                    ) {
                      toast.error(
                        "Please enter a reason (at least 5 characters)"
                      );
                      return;
                    }

                    handleReject(
                      showRejectModal.orderId,
                      showRejectModal.refundId,
                      rejectionReason
                    );
                    setShowRejectModal(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={
                    !rejectionReason.trim() || rejectionReason.trim().length < 5
                  }
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Product Preview Modal */}
        {selectedProduct && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-md text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>

              <img
                src={selectedProduct.productImage || "/images/deleted.png"}
                alt={selectedProduct.productName}
                className="w-48 h-48 object-cover mx-auto rounded-lg border mb-4"
                onError={(e) => (e.target.src = "/images/deleted.png")}
              />
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {selectedProduct.productName || "Deleted Product"}
              </h2>
              <p className="text-gray-500 text-sm mb-2">
                Price:{" "}
                {formatPrice(
                  selectedProduct?.productPrice,
                  settings?.currency
                ) || 0}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Quantity:</strong> {selectedProduct.quantity}
              </p>

              <p className="text-xs text-gray-500 mb-2">
                Requested on:{" "}
                {selectedProduct.requestedAt
                  ? new Date(selectedProduct.requestedAt).toLocaleString()
                  : "N/A"}
              </p>
              <p className="text-xs text-gray-500">
                Refund ID: {selectedProduct.refundId}
              </p>
            </div>
          </div>
        )}

        {/* View Reason Modal */}
        {selectedReason && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
              <button
                onClick={() => setSelectedReason(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
              <h2 className="text-lg font-semibold mb-3 text-gray-800">
                Refund Reason
              </h2>

              <div className="max-h-90 overflow-y-auto border border-gray-200 p-3 rounded-md text-gray-700 whitespace-pre-wrap">
                {selectedReason}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedReason(null)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-3 py-8">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm bg-gray-700 text-white rounded disabled:opacity-40 hover:bg-gray-600"
            >
              Prev
            </button>

            {[...Array(totalPages).keys()].map((num) => {
              const page = num + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageClick(page)}
                  className={`px-4 py-2 text-sm rounded ${
                    currentPage === page
                      ? "bg-yellow-700 text-white"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm bg-gray-700 text-white rounded disabled:opacity-40 hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default AdminRefundsTab;

