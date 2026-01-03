import { useEffect, useState } from "react";
import axios from "../lib/axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";
import { CreditCard } from "lucide-react";
import ExportTransactionPdf from "../utils/exportTransactionPdf.jsx";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";

const Transactions = () => {
  const [transactions, setTransaction] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [exportData, setExportData] = useState([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { user } = useUserStore();

  const fetchTransaction = async () => {
    try {
      setIsFetching(true);
      const params = {
        search: searchQuery,
        sortOrder,
      };

      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const { data } = await axios.get("/admin/transactions", {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      let sortedTransactions = [...data.transactions];

      if (startDate || endDate) {
        sortedTransactions = sortedTransactions.filter((tx) => {
          const txDate = new Date(tx.date);
          if (startDate && txDate < startDate) return false;
          if (endDate && txDate > endDate) return false;
          return true;
        });
      }

      setTransaction(sortedTransactions);
      setExportData(sortedTransactions);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [searchQuery, sortOrder, startDate, endDate]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") setSearchQuery(search);
  };

  // Pagination logic
  const totalTransactions = transactions.length;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const transactionsList = transactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (pageNum) => setCurrentPage(pageNum);

  const { settings } = useStoreSettings();

  // Get status badge color based on your schema
  const getStatusColor = (status, type) => {
    if (type === "refund") {
      if (status === "refunded") return "bg-green-100 text-green-700";
      if (status === "processing") return "bg-yellow-100 text-yellow-700";
      return "bg-red-100 text-red-700";
    } else {
      // Payment statuses from your schema
      if (status === "success") return "bg-green-100 text-green-700";
      if (status === "fully refunded") return "bg-gray-100 text-gray-700";
      if (status === "partially refunded") return "bg-blue-100 text-blue-700";
      if (status === "refunded") return "bg-gray-100 text-gray-700";
      if (status === "pending") return "bg-yellow-100 text-yellow-700";
      return "bg-red-100 text-red-700";
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading)
       return (
         <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8">
           <div className="flex flex-col items-center justify-center h-96">
             <div className="relative">
               <div className="h-24 w-24 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <CreditCard className="h-10 w-10 text-gray-400 animate-pulse" />
               </div>
             </div>
             <p className="mt-6 text-lg font-medium text-gray-600">
               Loading Transactions...
             </p>
             <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
           </div>
         </div>
       );
  return (
    <>
      <motion.div
        className="px-4 lg:px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="my-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Transactions
          </h1>
          <p className="text-gray-600">
            Review payment history, refunds, and transaction statuses.
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3 mt-15 bg-white rounded-lg shadow-md p-4">
          <input
            type="text"
            placeholder="Search by Transaction ID or Order Number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="px-3 py-2 rounded-lg border placeholder-gray-400 focus:ring-1 text-gray-500 w-50 md:w-1/3"
          />

          <div className="flex gap-2 flex-wrap items-center">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Start Date"
              className="px-3 py-2 rounded-lg border md:w-40"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="End Date"
              className="px-3 py-2 rounded-lg border md:w-40"
            />

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 rounded-lg text-gray-500 border"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div>
            <ExportTransactionPdf
              data={exportData}
              filters={{
                startDate,
                endDate,
                searchQuery,
                sortOrder,
              }}
              total={totalTransactions}
            />
          </div>
        </div>

        {totalTransactions === 0 ? (
          <p className="flex justify-center mt-7 tracking-widest">
            No transactions found.
          </p>
        ) : (
          <>
            {/* Transactions Table */}
            <div className="overflow-x-auto rounded-lg shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-300">
                  {transactionsList.map((tx) => (
                    <tr
                      key={`${tx.type}-${tx.transactionId}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900 font-medium">
                            {tx.transactionId}
                          </div>
                          {tx.type === "refund" && tx.originalTransactionId && (
                            <div className="text-xs text-gray-500">
                              Refund for:{" "}
                              {tx.originalTransactionId.substring(0, 15)}...
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            Order: {tx.orderNumber}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {tx.customer?.name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {tx.customer?.email || "N/A"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div
                          className={`text-sm font-medium ${
                            tx.type === "refund"
                              ? "text-red-600"
                              : "text-gray-900"
                          }`}
                        >
                          {tx.type === "refund" ? "-" : ""}
                          {formatPrice(tx.amount ?? 0, settings?.currency)}
                        </div>
                        {tx.type === "payment" && tx.totalRefunded > 0 && (
                          <>
                            <div className="text-xs text-gray-500 mt-1">
                              Net:{" "}
                              {formatPrice(
                                (tx.amount || 0) - (tx.totalRefunded || 0),
                                settings?.currency
                              )}
                            </div>
                            <span className="text-xs text-red-600">
                              (-{" "}
                              {formatPrice(
                                tx.totalRefunded || 0,
                                settings?.currency
                              )}
                              )
                            </span>
                          </>
                        )}
                       
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-900 font-medium capitalize">
                        {tx.paymentMethod?.replace("_", " ") || "flutterwave"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full
                            ${
                              tx.type === "payment"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                        >
                          {tx.type === "payment" ? "Payment" : "Refund"}
                          
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(
                            tx.status,
                            tx.type
                          )}`}
                        >
                          {formatStatus(tx.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {new Date(tx.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(tx.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {transactionsList.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-8 text-gray-500"
                      >
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-3 py-8">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-40 hover:bg-gray-200"
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
                          ? "bg-gray-700 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded disabled:opacity-40 hover:bg-gray-200"
                >
                  Next
                </button>
              </div>
            )}

            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">
                  Payment Summary
                </h3>
                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Total Payments:</span>
                    <span className="font-medium">
                      {formatPrice(
                        transactions
                          .filter((tx) => tx.type === "payment")
                          .reduce((sum, tx) => sum + (tx.amount || 0), 0),
                        settings?.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>Total Refunds:</span>
                    <span className="font-medium text-red-600">
                      {formatPrice(
                        transactions
                          .filter((tx) => tx.type === "refund")
                          .reduce((sum, tx) => sum + (tx.amount || 0), 0),
                        settings?.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2 border-t pt-2">
                    <span>Net Amount:</span>
                    <span className="font-medium text-green-600">
                      {formatPrice(
                        transactions
                          .filter((tx) => tx.type === "payment")
                          .reduce((sum, tx) => sum + (tx.amount || 0), 0) -
                          transactions
                            .filter((tx) => tx.type === "refund")
                            .reduce((sum, tx) => sum + (tx.amount || 0), 0),
                        settings?.currency
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">
                  Transaction Count
                </h3>
                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Payment Transactions:</span>
                    <span className="font-medium">
                      {
                        transactions.filter((tx) => tx.type === "payment")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>Refund Transactions:</span>
                    <span className="font-medium">
                      {transactions.filter((tx) => tx.type === "refund").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>Refund Requests:</span>
                    <span className="font-medium">
                      {
                        transactions.filter(
                          (tx) =>
                            tx.type === "payment" &&
                            (tx.refundStatus === "Partial Refund Requested" ||
                              tx.refundStatus === "Full Refund Requested")
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700">
                  Refund Status
                </h3>
                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Fully Refunded:</span>
                    <span className="font-medium">
                      {
                        transactions.filter(
                          (tx) =>
                            tx.type === "payment" &&
                            (tx.status === "fully refunded" ||
                              tx.refundStatus === "Fully Refunded")
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>Partially Refunded:</span>
                    <span className="font-medium">
                      {
                        transactions.filter(
                          (tx) =>
                            tx.type === "payment" &&
                            (tx.status === "partially refunded" ||
                              tx.refundStatus === "Partially Refunded")
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>Pending Refunds:</span>
                    <span className="font-medium text-yellow-600">
                      {
                        transactions.filter(
                          (tx) =>
                            tx.type === "refund" && tx.status === "processing"
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
};

export default Transactions;
