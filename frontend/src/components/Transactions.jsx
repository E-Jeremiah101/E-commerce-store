import { useEffect, useState } from "react";
import axios from "../lib/axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";
import ExportTransactionPdf from "../utils/exportTransactionPdf.jsx";
const Transactions = () => {
  const [transactions, setTransaction] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
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
        sortBy: "date",
        sortOrder,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
      };
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const { data } = await axios.get("/admin/transactions", {
        params: { search: searchQuery, sortBy, sortOrder },
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
      console.error("Error fetching orders:", err);
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
;


  // Pagination logic
  const totalTransactions = transactions.length;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const transactionsList = transactions.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (pageNum) => setCurrentPage(pageNum);

  // Get status badge color

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
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
            placeholder="Search by Transaction ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg border placeholder-gray-400 focus:ring-1 text-gray-500 w-50 md:w-1/4"
          />

          <div className="flex gap-2 flex-wrap items-center ">
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
              className="px-3 py-2 rounded-lg text-gray-500 "
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>

            {/* Add Export PDF Button */}
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
            No Transaction found.
          </p>
        ) : (
          <>
            {/* Orders Table */}
            <div className="overflow-x-auto  rounded-lg shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600 ">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600 ">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-300">
                  {transactionsList.map((tx) => (
                    <tr key={tx.transactionId} className="hover:bg-gray-750">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-900 font-semibold">
                              {tx.transactionId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-semibold">
                          {tx.customer?.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {tx.customer?.email}
                        </div>
                      </td>

                      <td className="px-6 py-4 capitalize">
                        {tx.type === "refund" ? "-" : ""}₦
                        {(tx.amount ?? 0).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 capitalize">
                        {tx.paymentMethod.replace("_", " ")}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full
                    ${
                      tx.type === "payment"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                        >
                          {tx.type}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium
                    ${
                      tx.status === "success" ||
                      tx.status === "processed" ||
                      tx.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : tx.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {new Date(tx.date).toLocaleDateString()}
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
                          : "bg-gray-100 text-yellow-700 hover:bg-gray-200"
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
          </>
        )}
      </motion.div>
    </>
  );
};

export default Transactions;
