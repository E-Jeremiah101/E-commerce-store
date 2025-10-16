import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { motion } from "framer-motion";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false); // for search / filter updates
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  //  Pagination logic
  const totalOrders = orders?.length || 0;
  const totalPages = Math.ceil(totalOrders / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedOrders = orders?.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (pageNum) => setCurrentPage(pageNum);

  // ✅ Debounce search (waits 500ms after typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ✅ Fetch all orders (with filters)
  const fetchOrders = async () => {
    try {
      setIsFetching(true);
      const { data } = await axios.get("/admin/orders", {
        params: { search: searchQuery, sortBy, sortOrder },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearchQuery(search);
    }
  };

  // ✅ Update order status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(
        `/admin/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      fetchOrders(); // Refresh after update
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Trigger fetching when filters change
  useEffect(() => {
    fetchOrders();
  }, [searchQuery, sortBy, sortOrder]);

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
      <div className="text-2xl font-bold flex justify-center mb-6">
        <h1>All Orders</h1>
      </div>

      {/* 🔍 Search & Sort Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by order number or customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="px-3 py-2 rounded-lg bg-gray-700 text-white w-full md:w-1/3"
        />

        {/* Sort Options */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 text-white"
          >
            <option className="text-sm" value="date">
              Sort by Date
            </option>
            <option className="text-sm" value="totalAmount">
              Sort by Total Amount
            </option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 text-white"
          >
            {sortBy === "date" ? (
              <>
                <option className="text-sm" value="desc">
                  Most Recent → Least Recent
                </option>
                <option className="text-sm" value="asc">
                  Least Recent → Most Recent
                </option>
              </>
            ) : (
              <>
                <option value="asc">Lowest → Highest</option>
                <option value="desc">Highest → Lowest</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 🧾 Orders List */}
      {totalOrders.length === 0 ? (
        <p className="flex justify-center mt-7 tracking-widest">
          No orders found.
        </p>
      ) : (
        <div className="space-y-6">
          {displayedOrders.map((order) => (
            <div
              key={order._id}
              className="border rounded-lg p-4 bg-gray-800 text-gray-100"
            >
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
                    <option className="text-yellow-600" value="Pending">
                      Pending
                    </option>
                    <option className="text-yellow-600" value="Processing">
                      Processing
                    </option>
                    <option className="text-yellow-600" value="Shipped">
                      Shipped
                    </option>
                    <option className="text-green-600" value="Delivered">
                      Delivered
                    </option>
                    <option className="text-red-600" value="Cancelled">
                      Cancelled
                    </option>
                  </select>
                </span>
              </div>

              {/* Order Details */}
              <div className="grid md:grid-cols-3 grid-cols-2 gap-3 md:gap-5 py-4 pr-7 pl-3 bg-gray-700 rounded-lg shadow mb-2 font-bold">
                <div className="text-gray-200 mb-2">
                  Customer Name:
                  <p>{order.user.name}</p>
                </div>
                <div className="text-gray-200 mb-2">
                  Customer Email:
                  <p>{order.user.email}</p>
                </div>
                <div className="text-gray-200 mb-2">
                  Customer Phone:
                  <p>{order.phone || "Not provided"}</p>
                </div>
                <div className="text-gray-200 mb-2">
                  Order date:
                  <p>{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-gray-200 mb-2">
                  Updated to{" "}
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      order.status === "Delivered"
                        ? "bg-green-600 text-white"
                        : order.status === "Cancelled"
                        ? "bg-red-600 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {order.status}
                  </span>
                  <p>{new Date(order.updatedAt).toLocaleString()}</p>
                </div>
                {order.status === "Delivered" && (
                  <p className="text-gray-200 mb-2">
                    Package delivered:{" "}
                    {new Date(order.deliveredAt).toLocaleString() ||
                      "Not provided"}
                  </p>
                )}
              </div>

              {/* Product List */}
              <ul className="space-y-4 mb-4">
                {order.products.map((item) => (
                  <li
                    key={item._id}
                    className="flex gap-4 p-4 bg-gray-700 rounded-lg shadow"
                  >
                    <img
                      src={item.image || item.product.image}
                      alt={item.name || item.product.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-white font-medium tracking-widest">
                          {item.name || item.product.name}
                        </h3>
                        <p className="text-yellow-100 font-semibold tracking-widest">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-200">
                        <span className="bg-gray-600 px-2 py-1 rounded tracking-widest">
                          Size: {item.size || "N/A"}
                        </span>
                        <span className="bg-gray-600 px-2 py-1 rounded tracking-widest">
                          Color: {item.color || "N/A"}
                        </span>
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
                      <span className="text-green-500">
                        {order.coupon.code}
                      </span>
                    </p>
                    <p className="text-sm my-1 font-bold">
                      Discount: -₦{order.discount.toLocaleString()}
                    </p>
                  </>
                )}
                <p className="font-bold text-yellow-100 text-lg">
                  Total: ₦{order.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-10">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-800 text-white rounded disabled:opacity-40"
          >
            Prev
          </button>

          {[...Array(totalPages).keys()].map((num) => {
            const page = num + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`px-3 py-1 text-sm rounded ${
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
            className="px-3 py-1 text-sm bg-gray-800 text-white rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default AdminOrdersPage;












// import { useEffect, useState } from "react";
// import axios from "../lib/axios";
// import { motion } from "framer-motion";

// const AdminOrdersPage = () => {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [sortBy, setSortBy] = useState("date");
//   const [sortOrder, setSortOrder] = useState("desc");
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);

//   const limit = 7; // 👈 show 7 orders per page

//   // ✅ Fetch Orders
//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const { data } = await axios.get("/admin/orders", {
//         params: { search: searchQuery, sortBy, sortOrder, page, limit },
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });
//       setOrders(data.orders);
//       setTotalPages(data.totalPages);
//     } catch (error) {
//       console.error("Error fetching orders:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   //  Handle Enter Key for Search
//   const handleSearchKeyDown = (e) => {
//     if (e.key === "Enter") {
//       setPage(1); // reset to first page when new search
//       setSearchQuery(search);
//     }
//   };

//   // ✅ Handle Status Update
//   const handleStatusChange = async (orderId, newStatus) => {
//     try {
//       await axios.put(
//         `/admin/orders/${orderId}/status`,
//         { status: newStatus },
//         {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         }
//       );
//       fetchOrders();
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // ✅ Fetch orders on filters or pagination
//   useEffect(() => {
//     fetchOrders();
//   }, [searchQuery, sortBy, sortOrder, page]);

//   if (loading)
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
//       </div>
//     );

//   return (
//     <motion.div
//       className="px-4 lg:px-28"
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.8 }}
//     >
//       <div className="text-2xl font-bold flex justify-center mb-6">
//         <h1>All Orders</h1>
//       </div>

//       {/* 🔍 Search & Sort Controls */}
//       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
//         {/* Search */}
//         <input
//           type="text"
//           placeholder="Press Enter to search..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           onKeyDown={handleSearchKeyDown}
//           className="px-3 py-2 rounded-lg bg-gray-700 text-white w-full md:w-1/3 outline-none"
//         />

//         {/* Sort */}
//         <div className="flex gap-2">
//           <select
//             value={sortBy}
//             onChange={(e) => setSortBy(e.target.value)}
//             className="px-3 py-2 rounded-lg bg-gray-700 text-white"
//           >
//             <option value="date">Sort by Date</option>
//             <option value="totalAmount">Sort by Total Amount</option>
//           </select>

//           <select
//             value={sortOrder}
//             onChange={(e) => setSortOrder(e.target.value)}
//             className="px-3 py-2 rounded-lg bg-gray-700 text-white"
//           >
//             <option value="desc">Descending</option>
//             <option value="asc">Ascending</option>
//           </select>
//         </div>
//       </div>

//       {/* 🧾 Orders */}
//       {orders.length === 0 ? (
//         <p className="flex justify-center mt-7 tracking-widest">
//           No orders found.
//         </p>
//       ) : (
//         <div className="space-y-6">
//           {orders.map((order) => (
//              <div
//               key={order._id}
//               className="border rounded-lg p-4 bg-gray-800 text-gray-100"
//             >
//               <div className="flex justify-between mb-2">
//                 <span className="text-yellow-600">{order.orderNumber}</span>
//                 <span>
//                   <select
//                     value={order.status}
//                     onChange={(e) =>
//                       handleStatusChange(order._id, e.target.value)
//                     }
//                     className="bg-gray-700 text-white px-2 py-1 rounded"
//                   >
//                     <option className="text-yellow-600" value="Pending">
//                       Pending
//                     </option>
//                     <option className="text-yellow-600" value="Processing">
//                       Processing
//                     </option>
//                     <option className="text-yellow-600" value="Shipped">
//                       Shipped
//                     </option>
//                     <option className="text-green-600" value="Delivered">
//                       Delivered
//                     </option>
//                     <option className="text-red-600" value="Cancelled">
//                       Cancelled
//                     </option>
//                   </select>
//                 </span>
//               </div>

//               <div className="grid md:grid-cols-3 grid-cols-2 gap-3 md:gap-5 py-4 pr-7 pl-3 bg-gray-700 rounded-lg shadow overflow-x-scroll scrollbar-hide md:overflow-x-hidden mb-2 font-bold">
//                 <div className=" text-gray-200 mb-2">
//                   Customer Name:
//                   <p> {order.user.name}</p>
//                 </div>
//                 <div className=" text-gray-200 mb-2">
//                   Customer Email:
//                   <p> {order.user.email}</p>
//                 </div>
//                 <div className=" text-gray-200 mb-2">
//                   Customer Phone:
//                   <p>{order.phone || "Not provided"}</p>
//                 </div>
//                 <div className=" text-gray-200 mb-2">
//                   Order date:
//                   <p>
//                     {" "}
//                     {new Date(order.createdAt).toLocaleString() ||
//                       "Not provided"}
//                   </p>
//                 </div>
//                 <div className=" text-gray-200 mb-2">
//                   Updated to{" "}
//                   <span
//                     className={`px-2 py-1 rounded text-sm font-medium ${
//                       order.status === "Delivered"
//                         ? "bg-green-600 text-white"
//                         : order.status === "Cancelled"
//                         ? "bg-red-600 text-white"
//                         : "bg-yellow-500 text-white"
//                     }`}
//                   >
//                     {order.status}
//                   </span>
//                   <p>
//                     {new Date(order.updatedAt).toLocaleString() ||
//                       "Not provided"}
//                   </p>
//                 </div>
//                 {order.status === "Delivered" && (
//                   <p className=" text-gray-200 mb-2">
//                     Package delivered:{" "}
//                     {new Date(order.deliveredAt).toLocaleString() ||
//                       "Not provided"}
//                   </p>
//                 )}
//               </div>

//               <ul className="space-y-4 mb-4">
//                 {order.products.map((item) => (
//                   <li
//                     key={item._id}
//                     className="flex gap-4 p-4 bg-gray-700 rounded-lg shadow"
//                   >
//                     {/* Product Image */}
//                     <img
//                       src={item.image || item.product.image}
//                       alt={item.name || item.product.name}
//                       className="w-20 h-20 object-cover rounded"
//                     />

//                     {/* Product Info */}
//                     <div className="flex-1 space-y-3">
//                       {/* Product Name & Total Price */}
//                       <div className="flex justify-between items-center">
//                         <h3 className="text-white font-medium tracking-widest">
//                           {item.name || item.product.name}
//                         </h3>
//                         <p className="text-yellow-100 font-semibold tracking-widest">
//                           ₦
//                           {(item.price * item.quantity).toLocaleString(
//                             undefined,
//                             {
//                               minimumFractionDigits: 0,
//                             }
//                           )}
//                         </p>
//                       </div>

//                       {/* Extra Details (size, color, category) */}
//                       <div className="flex flex-wrap gap-2 text-xs text-gray-200">
//                         <span className="bg-gray-600 px-2 py-1 rounded tracking-widest">
//                           Size: {item.size || "N/A"}
//                         </span>
//                         <span className="bg-gray-600 px-2 py-1 rounded tracking-widest">
//                           Color: {item.color || "N/A"}
//                         </span>
//                         <span className="bg-gray-600 px-2 py-1 rounded tracking-widest">
//                           Category: {item.selectedCategory || "N/A"}
//                         </span>
//                       </div>

//                       {/* Quantity & Unit Price */}
//                       <div className="flex justify-between text-sm text-gray-300">
//                         <span>Qty: {item.quantity}</span>
//                         {item.quantity > 1 && (
//                           <span className="">
//                             ₦
//                             {item.price.toLocaleString(undefined, {
//                               minimumFractionDigits: 0,
//                             })}{" "}
//                             each
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </li>
//                 ))}
//               </ul>

//               <div className="bg-gray-700 rounded-lg p-2 text-sm font-bold">
//                 <p className="">Subtotal: ₦{order.subtotal.toLocaleString()}</p>
//                 {order.discount > 0 && (
//                   <>
//                     <p>
//                       Coupon Applied: <span className="text-red-500">-10%</span>{" "}
//                       <span className="text-green-500">
//                         {order.coupon.code}
//                       </span>
//                     </p>{" "}
//                     <p className="text-sm my-1 font-bold">
//                       {" "}
//                       Discount: -₦
//                       {order.discount.toLocaleString()}{" "}
//                     </p>
//                   </>
//                 )}

//                 <p className="font-bold text-yellow-100 text-lg ">
//                   Total: ₦ {""}
//                   {order.totalAmount.toLocaleString(undefined, {
//                     minimumFractionDigits: 0,
//                   })}
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* 📄 Pagination Controls */}
//       <div className="flex justify-center items-center mt-8 gap-4">
//         <button
//           disabled={page === 1}
//           onClick={() => setPage((prev) => prev - 1)}
//           className={`px-4 py-2 rounded-lg ${
//             page === 1
//               ? "bg-gray-600 text-gray-400 cursor-not-allowed"
//               : "bg-yellow-600 hover:bg-yellow-500 text-white"
//           }`}
//         >
//           Previous
//         </button>

//         <span className="text-white font-semibold">
//           Page {page} of {totalPages}
//         </span>

//         <button
//           disabled={page === totalPages}
//           onClick={() => setPage((prev) => prev + 1)}
//           className={`px-4 py-2 rounded-lg ${
//             page === totalPages
//               ? "bg-gray-600 text-gray-400 cursor-not-allowed"
//               : "bg-yellow-600 hover:bg-yellow-500 text-white"
//           }`}
//         >
//           Next
//         </button>
//       </div>
//     </motion.div>
//   );
// };

// export default AdminOrdersPage;
