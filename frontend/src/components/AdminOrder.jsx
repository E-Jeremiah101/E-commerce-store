import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { MoreVertical } from "lucide-react";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const navigate = useNavigate();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { user } = useUserStore();

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setIsFetching(true);
      const { data } = await axios.get("/admin/orders", {
        params: { search: searchQuery, sortBy, sortOrder },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOrders(data.orders);
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
      setOpenDropdownId(null);
    } catch (err) {
      console.error(err);
    }
  };

    const toggleDropdown = (orderId) => {
      setOpenDropdownId(openDropdownId === orderId ? null : orderId);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (!event.target.closest(".dropdown-container")) {
          setOpenDropdownId(null);
        }
      };

      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }, []);


  // Pagination logic
  const totalOrders = orders.length;
  const totalPages = Math.ceil(totalOrders / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedOrders = orders.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (pageNum) => setCurrentPage(pageNum);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-600 text-white";
      case "Cancelled":
        return "bg-red-600 text-white";
      case "Refunded":
      case "Partially Refunded":
        return "bg-purple-600 text-white";
      default:
        return "bg-yellow-500 text-white";
    }
  };
  const {settings} = useStoreSettings();

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="flex space-x-2 mb-6">
          <div
            className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
        <p className="text-gray-600 font-medium animate-pulse">
          Please wait, Loading data...
        </p>
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
        {/* Search & Sort */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3 mt-5 bg-white rounded-lg shadow-md p-4 ">
          <input
            type="text"
            placeholder="Search by ORD/EC0STORE/Id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="px-3 py-2 rounded-lg border placeholder-gray-400 focus:ring-1  text-gray-500 w-full md:w-1/3"
          />
          <div className="flex gap-2 flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg text-gray-500"
            >
              <option value="date">Sort by Date</option>
              <option value="totalAmount">Sort by Total Amount</option>
              <option value="status">Sort by Status</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 rounded-lg  text-gray-500"
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
          <>
            {/* Orders Table */}
            <div className="overflow-x-auto  rounded-lg shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600 ">
                      Order Info
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600 ">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-300">
                  {displayedOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-750">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1 relative">
                            <span className="text-gray-900 font-semibold pt-1">
                              {order.orderNumber}
                            </span>
                            {!order.isProcessed && (
                              <span className="bg-red-500 text-white px-1 py-0.5 text-[0.44rem] rounded absolute top-0 left-0 tracking-wider z-50">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="text-[0.80rem] text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                            <span className="mx-1">•</span>
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-semibold">
                          {order.user?.firstname} {order.user?.lastname}
                        </div>
                        <div className="text-xs text-gray-400">
                          {order.user?.email}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {order.products.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                              <div className="text-[0.86rem]">
                                <div className="text-gray-900 font-semibold truncate max-w-[150px]">
                                  {item.name}
                                </div>
                                <div className="text-gray-400">
                                  Qty: {item.quantity}
                                </div>
                              </div>
                            </div>
                          ))}
                          {order.products.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{order.products.length - 2} more items
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-semibold">
                          {formatPrice(order?.totalAmount, settings?.currency)}
                        </div>
                        {order.discount > 0 && (
                          <div className="text-xs text-green-400">
                            -₦{order.discount.toLocaleString()} off
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <span
                            className={` py-1 px-2 rounded text-xs font-medium text-center ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex  align-middle flex-row gap-3">
                          <div>
                            <button
                              onClick={() =>
                                navigate(`/admin/orders/${order._id}`)
                              }
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm tracking-widest"
                            >
                              Details
                            </button>
                          </div>

                          <div className="relative dropdown-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(order._id);
                              }}
                              className="p-1 hover:bg-gray-500 rounded transition-colors"
                            >
                              <MoreVertical className=" text-gray-700" size={23} />
                            </button>

                            {/* Dropdown menu */}
                            {openDropdownId === order._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                                <div className="py-1">
                                  <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
                                    Change Status
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleStatusChange(order._id, "Pending")
                                    }
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                  >
                                    Pending
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusChange(
                                        order._id,
                                        "Processing"
                                      )
                                    }
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                  >
                                    Processing
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusChange(order._id, "Shipped")
                                    }
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                  >
                                    Shipped
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusChange(order._id, "Delivered")
                                    }
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                  >
                                    Delivered
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusChange(order._id, "Cancelled")
                                    }
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                  >
                                    Cancelled
                                  </button>
                                  {order.status === "Partially Refunded" && (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(
                                          order._id,
                                          "Partially Refunded"
                                        )
                                      }
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                    >
                                      Partially Refunded
                                    </button>
                                  )}
                                  {order.status === "Refunded" && (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(
                                          order._id,
                                          "Refunded"
                                        )
                                      }
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                    >
                                      Refunded
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
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

export default AdminOrdersPage;
