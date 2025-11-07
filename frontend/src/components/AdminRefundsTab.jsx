import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../lib/axios";
import { Eye, Search } from "lucide-react";
import { Loader } from "lucide-react";

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

  // Approve refund
  const handleApprove = async (orderId, refundId, action) => {
    try {
      setLoadingStates((prev) => ({ ...prev, [refundId]: "approving" }));
      await axios.put(`/refunds/${orderId}/${refundId}/approve`);
      toast.success("Refund approved successfully");
      const processedAt = new Date().toISOString();
      setRefunds((prev) =>
        prev.map((r) =>
          r.refundId === refundId ? { ...r, status: "Approved" } : r
        )
      );
    } catch (err) {
      console.error("Approve refund failed:", err);
      toast.error(err.response?.data?.message || "Failed to approve refund");
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
  const handleReject = async (orderId, refundId) => {
    try {
      setLoadingStates((prev) => ({ ...prev, [refundId]: "rejecting" }));
      await axios.put(`/refunds/${orderId}/${refundId}/reject`);
      toast.success("Refund rejected ");
      const processedAt = new Date().toISOString();
      setRefunds((prev) =>
        prev.map((r) =>
          r.refundId === refundId
            ? { ...r, status: "Rejected", processedAt }
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

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  return (
    <div className="p bg-white shadow rounded-xl">
      {/* <ToastContainer position="top-center" autoClose={3000} /> */}
      <h2 className="text-lg font-semibold mb-4">Refund Requests</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, order or refund ID"
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
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border p-2 rounded text-sm"
        />
      </div>

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
                    <p className="font-medium">{r.orderNumber || r.orderId}</p>
                    <p className="text-xs text-gray-500">{r.user.firstname + " "+ r.user.lastname || "NA"}</p>
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
                        onError={(e) => (e.target.src = "/images/deleted.png")}
                      />

                      <p className="text-xs ">{r.productName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2 border">
                    ₦{r.amount?.toLocaleString() || 0}
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

                  <td
                    className={`px-4 py-2 border font-medium ${
                      r.status === "Approved"
                        ? "text-green-600"
                        : r.status === "Rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {r.status}
                  </td>

                  <td className="px-4 py-2 border text-center space-x-2">
                    {r.status === "Pending" && (
                      <>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(r.orderId, r.refundId)}
                            className="px-2 py-1  bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            disabled={
                              loadingStates[r.refundId] === "approving" ||
                              loadingStates[r.refundId] === "rejecting"
                            }
                          >
                            {loadingStates[r.refundId] === "approving"
                              ? "Approving..."
                              : "Approve"}
                          </button>
                          <button
                            onClick={() => handleReject(r.orderId, r.refundId)}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                            disabled={
                              loadingStates[r.refundId] === "rejecting" ||
                              loadingStates[r.refundId] === "approving"
                            }
                          >
                            {loadingStates[r.refundId] === "rejecting"
                              ? "Rejecting..."
                              : "Reject"}
                          </button>
                        </div>
                      </>
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
              Price: ₦{selectedProduct.productPrice?.toLocaleString() || 0}
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
    </div>
  );
};

export default AdminRefundsTab;
