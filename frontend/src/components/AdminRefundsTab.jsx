// import React, { useEffect, useState } from "react";
// import { toast } from "react-toastify";
// import axios from "../lib/axios";
// import { Eye, Search } from "lucide-react";

// const AdminRefundsTab = () => {
//   const [refunds, setRefunds] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState({});
//   const [selectedReason, setSelectedReason] = useState(null); // modal reason
//   const [filters, setFilters] = useState({
//     search: "",
//     status: "",
//     startDate: "",
//     endDate: "",
//   });

//   // Pagination state
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);

//   // Pagination logic
//   const totalRequest = refunds.length;
//   const totalPages = Math.ceil(totalRequest / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const displayeRequest = refunds.slice(startIndex, startIndex + itemsPerPage);

//   const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
//   const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
//   const handlePageClick = (pageNum) => setCurrentPage(pageNum);


//   const fetchRefunds = async (customFilters = filters) => {
//     try {
//       setLoading(true);
//       const query = new URLSearchParams(customFilters).toString();
//       console.log("Sending filters:", query);

//       const { data } = await axios.get(`/refunds?${query}`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });
//       setRefunds(data.refundRequests || []);
//       setCurrentPage(1);
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to fetch refund requests");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchRefunds();
//   }, []);

//   const handleFilter = () => {
//     fetchRefunds(filters);
//   };

//   const handleAction = async (orderId, refundId, action) => {
//     try {
//       setProcessing((prev) => ({ ...prev, [refundId]: true }));
//       await axios.put(`/refunds/${orderId}/${refundId}/${action}`, null, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });
//       toast.success(`Refund ${action}ed successfully`);
//       fetchRefunds();
//     } catch (err) {
//       console.error(err);
//       toast.error(`Failed to ${action} refund`);
//     } finally {
//       setProcessing((prev) => ({ ...prev, [refundId]: false }));
//     }
//   };

//   if (loading)
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
//       </div>
//     );

//   if (refunds.length === 0)
//     return (
//       <div className="flex justify-center items-center h-screen text-gray-500">
//         No refund requests yet.
//       </div>
//     );

//   return (
//     <div className="bg-gradient-to-br from-white via-gray-100 to-gray-300  text-black overflow-x-hidden">
//       {/* Filter Controls */}
//       <div className="flex flex-wrap gap-3 mb-4 bg-gradient-to-br from-white via-gray-100 to-gray-300  p-4 rounded-lg">
//         <input
//           type="text"
//           placeholder="ORD / ID"
//           value={filters.search}
//           onChange={(e) => setFilters({ ...filters, search: e.target.value })}
//           className="px-2 py-2 w-30 rounded text-black bg-white placeholder-gray-600 border border-gray-600"
//         />

//         <select
//           value={filters.status}
//           onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//           className="px-2 py-2 rounded bg-white text-gray-700 border border-gray-600"
//         >
//           <option value="">All Status</option>
//           <option value="Pending">Pending</option>
//           <option value="Approved">Approved</option>
//           <option value="Rejected">Rejected</option>
//         </select>

//         <input
//           type="date"
//           value={filters.startDate}
//           onChange={(e) =>
//             setFilters({ ...filters, startDate: e.target.value })
//           }
//           className="px-3 py-2 w-30 rounded  text-gray-700 border border-gray-600"
//         />

//         <input
//           type="date"
//           value={filters.endDate}
//           onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          
//           className="px-3 py-2 w-30 rounded  text-gray-700 border border-gray-600"
//         />

//         <button
//           onClick={handleFilter}
//           className=" text-gray-700  "
//         >
//           <Search size={20} />
//         </button>
//       </div>

//       <div className="overflow-x-auto bg-white rounded-lg shadow no-scroll">
//         <table className="min-w-full border border-gray-600 text-left text-sm">
//           <thead className="bg-gradient-to-br from-white via-gray-100 to-gray-300 ">
//             <tr>
//               <th className="px-4 py-2 border-b border-gray-600">Order-Num</th>
//               <th className="px-4 py-2 border-b border-gray-600">Name</th>
//               <th className="px-4 py-2 border-b border-gray-600">Product</th>
//               <th className="px-4 py-2 border-b border-gray-600">Amount</th>
//               <th className="px-4 py-2 border-b border-gray-600">Reason</th>
//               <th className="px-4 py-2 border-b border-gray-600">Requested</th>
//               <th className="px-4 py-2 border-b border-gray-600">Processed</th>
//               <th className="px-4 py-2 border-b border-gray-600">Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {displayeRequest.map((r) => (
//               <tr
//                 key={r.refundId}
//                 className="even:bg-white  odd:bg-gray-200 hover:bg-gray-300 transition"
//               >
//                 <td className="px-4 py-2 border-b border-gray-700">
//                   {r.orderNumber || r.orderId}
//                   {r.status === "Pending" && (
//                     <div className="flex gap-2 mt-2">
//                       <button
//                         onClick={() =>
//                           handleAction(r.orderId, r.refundId, "approve")
//                         }
//                         disabled={processing[r.refundId]}
//                         className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
//                       >
//                         {processing[r.refundId] ? "..." : "Approve"}
//                       </button>
//                       <button
//                         onClick={() =>
//                           handleAction(r.orderId, r.refundId, "reject")
//                         }
//                         disabled={processing[r.refundId]}
//                         className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
//                       >
//                         {processing[r.refundId] ? "..." : "Reject"}
//                       </button>
//                     </div>
//                   )}
//                 </td>
//                 <td className="px-4 py-2 border-b border-gray-700">
//                   {r.user?.name}
//                 </td>
//                 <td className="px-4 py-2 border-b border-gray-700">
//                   {r.product?.name}
//                 </td>
//                 <td className="px-4 py-2 border-b border-gray-700">
//                   ₦{r.amount.toLocaleString()}
//                 </td>
//                 <td className="px-4 py-2 border-b border-gray-700">
//                   <button
//                     onClick={() => setSelectedReason(r.reason)}
//                     className="text-gray-600  hover:text-blue-800 px-1 "
//                   >
//                     <Eye size={20} />
//                   </button>
//                 </td>
//                 <td className="px-4 py-2 border-b border-gray-700">
//                   {new Date(r.requestedAt).toLocaleString()}
//                 </td>
//                 <td className="px-4 py-2 border-b border-gray-700">
//                   {r.processedAt
//                     ? new Date(r.processedAt).toLocaleString()
//                     : "—"}
//                 </td>
//                 <td className="px-4 py-2 border-b border-gray-700">
//                   <span
//                     className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                       r.status === "Pending"
//                         ? "bg-yellow-100 text-yellow-700"
//                         : r.status === "Approved"
//                         ? "bg-green-100 text-green-700"
//                         : "bg-red-100 text-red-700"
//                     }`}
//                   >
//                     {r.status}
//                   </span>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* View Reason Modal */}
//       {selectedReason && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
//           <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
//             <button
//               onClick={() => setSelectedReason(null)}
//               className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
//             >
//               ✕
//             </button>
//             <h2 className="text-lg font-semibold mb-3 text-gray-800">
//               Refund Reason
//             </h2>

//             <div className="max-h-90 overflow-y-auto border border-gray-200 p-3 rounded-md text-gray-700 whitespace-pre-wrap">
//               {selectedReason}
//             </div>

//             <div className="mt-4 flex justify-end">
//               <button
//                 onClick={() => setSelectedReason(null)}
//                 className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {totalPages > 1 && (
//         <div className="flex justify-center items-center space-x-3 py-8">
//           <button
//             onClick={handlePrev}
//             disabled={currentPage === 1}
//             className="px-4 py-2 text-sm bg-gray-700 text-white rounded disabled:opacity-40 hover:bg-gray-600"
//           >
//             Prev
//           </button>

//           {[...Array(totalPages).keys()].map((num) => {
//             const page = num + 1;
//             return (
//               <button
//                 key={page}
//                 onClick={() => handlePageClick(page)}
//                 className={`px-4 py-2 text-sm rounded ${
//                   currentPage === page
//                     ? "bg-yellow-700 text-white"
//                     : "bg-gray-700 text-white hover:bg-gray-600"
//                 }`}
//               >
//                 {page}
//               </button>
//             );
//           })}

//           <button
//             onClick={handleNext}
//             disabled={currentPage === totalPages}
//             className="px-4 py-2 text-sm bg-gray-700 text-white rounded disabled:opacity-40 hover:bg-gray-600"
//           >
//             Next
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminRefundsTab;




















import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { Eye, Search } from "lucide-react";

const AdminRefundsTab = () => {
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
   const [selectedReason, setSelectedReason] = useState(null);

   // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

 

  // Fetch all refund requests
  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/refunds", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setRefunds(res.data);
        setFilteredRefunds(res.data);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching refunds:", err);
      }finally {
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
          r.user?.name?.toLowerCase().includes(term) ||
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
  const handleApprove = async (orderId, refundId) => {
    try {
      await axios.put(
        `/api/refund/${orderId}/${refundId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("Refund approved ✅");
      setRefunds((prev) =>
        prev.map((r) =>
          r.refundId === refundId ? { ...r, status: "Approved" } : r
        )
      );
    } catch (err) {
      console.error("Approve refund failed:", err);
      alert("Failed to approve refund");
    }
  };

   // Pagination logic
  const totalRequest = filteredRefunds.length;
  const totalPages = Math.ceil(totalRequest / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayeRequest = filteredRefunds.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (pageNum) => setCurrentPage(pageNum);

  // Reject refund
  const handleReject = async (orderId, refundId) => {
    try {
      await axios.put(
        `/api/refund/${orderId}/${refundId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("Refund rejected ❌");
      setRefunds((prev) =>
        prev.map((r) =>
          r.refundId === refundId ? { ...r, status: "Rejected" } : r
        )
      );
    } catch (err) {
      console.error("Reject refund failed:", err);
      alert("Failed to reject refund");
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
      <h2 className="text-lg font-semibold mb-4">Refund Requests</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, order or refund ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full sm:w-64 text-sm"
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
      <div className="overflow-x-auto">
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
                  <td className="px-4 py-2 border">
                    <p className="font-medium">{r.orderNumber || r.orderId}</p>
                    <p className="text-xs text-gray-500">{r.user.name}</p>
                  </td>

                  {/* Product */}
                  <td className="px-4 py-2 border">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setSelectedProduct(r)}
                    >
                      <img
                        src={r.productImage || "/images/deleted.png"}
                        alt={r.productName}
                        className="w-10 h-10 object-cover rounded-md border border-gray-300 hover:scale-105 transition-transform"
                        onError={(e) => (e.target.src = "/images/deleted.png")}
                      />
                      <div>
                        <p className="font-medium overflow-hidden">
                          {r.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₦{r.productPrice?.toLocaleString() || 0}
                        </p>
                      </div>
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
                            className="px-2 py-1  bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(r.orderId, r.refundId)}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Reject
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
            <p className="text-sm text-gray-600 mb-1">
              <strong>Reason:</strong> {selectedProduct.reason || "—"}
            </p>
            <p className="text-xs text-gray-400 mb-2">
              Requested on:{" "}
              {selectedProduct.requestedAt
                ? new Date(selectedProduct.requestedAt).toLocaleString()
                : "N/A"}
            </p>
            <p className="text-xs text-gray-400">
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
