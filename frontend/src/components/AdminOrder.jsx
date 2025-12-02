import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false); // for search/filter updates
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setIsFetching(true);
      const { data } = await axios.get("/admin/orders", {
        params: { search: searchQuery, sortBy, sortOrder },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOrders(data.orders);
      console.log("Orders data:", data.orders);
      console.log(
        "Orders with isProcessed flag:",
        data.orders.map((order) => ({
          id: order._id,
          orderNumber: order.orderNumber,
          isProcessed: order.isProcessed,
          status: order.status,
        }))
      );
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, sortBy, sortOrder]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") setSearchQuery(search);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(
        `/admin/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination logic
  const totalOrders = orders.length;
  const totalPages = Math.ceil(totalOrders / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedOrders = orders.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (pageNum) => setCurrentPage(pageNum);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  return (
    <motion.div
      className="px-4 lg:px-28"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* <div className="text-2xl font-bold flex justify-center mb-6">
        All Orders
      </div> */}

      {/* Search & Sort */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
        <input
          type="text"
          placeholder="Search by ORD/EC0STORE/Id"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="px-3 py-2 rounded-lg bg-gray-700 text-white w-full md:w-1/3"
        />
        <div className="flex gap-2 flex-wrap">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 text-white"
          >
            <option value="date">Sort by Date</option>
            <option value="totalAmount">Sort by Total Amount</option>
            <option value="status">Sort by Status</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 text-white"
          >
            {sortBy === "date" ? (
              <>
                <option value="desc">Most Recent → Least Recent</option>
                <option value="asc">Least Recent → Most Recent</option>
              </>
            ) : sortBy === "totalAmount" ? (
              <>
                <option value="asc">Lowest → Highest</option>
                <option value="desc">Highest → Lowest</option>
              </>
            ) : (
              <>
                <option value="asc">Pending → Cancelled</option>
                <option value="desc">Cancelled → Pending</option>
              </>
            )}
          </select>
        </div>
      </div>

      {totalOrders === 0 ? (
        <p className="flex justify-center mt-7 tracking-widest">
          No orders found.
        </p>
      ) : (
        <div className="space-y-6">
          {displayedOrders.map((order) => (
            <div
              key={order._id}
              className={`border rounded-lg p-4 bg-gray-800 text-gray-100 relative ${
                !order.isProcessed ? "border-red-500" : ""
              }`}
            >
              {/* NEW badge */}
              {!order.isProcessed && (
                <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded font-bold">
                  NEW
                </span>
              )}

              {/* Header */}
              <div className="flex justify-between mb-2">
                <span className="text-yellow-600 font-semibold">
                  {order.orderNumber}
                </span>
                <span>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    className="bg-gray-700 text-white px-2 py-1 rounded"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    {order.status === "Partially Refunded" && (
                      <option value="Partially Refunded">
                        Partially Refunded
                      </option>
                    )}

                    {order.status === "Refunded" && (
                      <option value="Refunded">Refunded</option>
                    )}

                    <option value="Cancelled">Cancelled</option>
                  </select>
                </span>
              </div>
              {/* Refund Status
              {order.refundStatus && order.refundStatus !== "No Refund" && (
                <p className="text-sm font-semibold mt-1">
                  Refund Status:{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      order.refundStatus === "Fully Refunded"
                        ? "bg-green-700 text-white"
                        : "bg-yellow-700 text-white"
                    }`}
                  >
                    {order.refundStatus}
                  </span>
                </p>
              )} */}

              {/* Order details */}
              <div className="grid md:grid-cols-3 grid-cols-2 gap-3 md:gap-5 py-4 pr-7 pl-3 bg-gray-700 rounded-lg shadow mb-2">
                <div className="text-gray-200 mb-2">
                  Created:{" "}
                  <p className="text-sm font-semibold">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-gray-200 mb-2">
                  <span
                    className={`px-1 py-1 rounded text-xs font-medium ${
                      order.status === "Delivered"
                        ? "bg-green-600 text-white"
                        : order.status === "Cancelled"
                        ? "bg-red-600 text-white"
                        : order.status === "Refunded" && "Partially Refunded"
                        ? "bg-purple-600 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {order.status}
                  </span>
                  <p className="text-sm font-semibold">
                    {new Date(order.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Product list */}
              <ul className="space-y-4 mb-4">
                {order.products.map((item) => (
                  <li
                    key={item._id}
                    className="flex gap-4 p-4 bg-gray-700 rounded-lg shadow"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-white font-medium tracking-widest">
                          {item.name}
                        </h3>
                        <p className="text-yellow-100 font-semibold tracking-widest">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-200">
                        {item.size && (
                          <span className="bg-gray-600 px-2 py-1 rounded tracking-widest">
                            Size: {item.size || "N/A"}
                          </span>
                        )}
                        {item.color && (
                          <span className="bg-gray-600 px-2 py-1 rounded tracking-widest">
                            Color: {item.color || "N/A"}
                          </span>
                        )}

                        <span className="bg-gray-600 px-2 py-1 rounded tracking-widest">
                          Category: {item.selectedCategory || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Qty: {item.quantity}</span>
                        {item.quantity > 1 && (
                          <span>₦{item.price.toLocaleString()} each</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="bg-gray-700 rounded-lg p-2 text-sm font-bold">
                <p>Subtotal: ₦{order.subtotal.toLocaleString()}</p>
                {order.discount > 0 && (
                  <>
                    <p>
                      Coupon Applied:{" "}
                      <span className="text-green-500">{order.couponCode}</span>
                    </p>
                    <p className="text-sm my-1 font-bold">
                      Discount:{" "}
                      <span className="text-red-500">
                        -₦{order.discount.toLocaleString()}
                      </span>
                    </p>
                  </>
                )}
                <p className="font-bold text-yellow-100 text-lg">
                  Total: ₦{order.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => navigate(`/admin/orders/${order._id}`)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm tracking-widest"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
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
  );
};

export default AdminOrdersPage;
