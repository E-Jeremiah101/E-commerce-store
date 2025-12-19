import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx"

const STATUS_WORKFLOW = {
  Pending: ["Processing", "Shipped", "Delivered", "Cancelled"],
  Processing: ["Shipped", "Delivered", "Cancelled"],
  Shipped: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [], 
  Refunded: [],
  "Partially Refunded": [],
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

const getValidNextStatuses = (currentStatus) => {
  return STATUS_WORKFLOW[currentStatus] || [];
};

const hasRefunds = (order) => {
  return order.refunds && order.refunds.length > 0;
};

  // Helper function to convert Date to string (YYYY-MM-DD)
  const dateToString = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  // Helper function to get Date object from string or Date
  const getDateObject = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    return new Date(dateInput);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setIsFetching(true);
      const params = {
        search: searchQuery,
        sortBy,
        sortOrder,
      };

      if (dateRange.startDate && dateRange.startDate.trim() !== "") {
        params.startDate = dateRange.startDate;
      }
      if (dateRange.endDate && dateRange.endDate.trim() !== "") {
        params.endDate = dateRange.endDate;
      }

      console.log("Fetching orders with params:", params);

      const { data } = await axios.get("/admin/orders", {
        params,
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
  }, [searchQuery, sortBy, sortOrder, dateRange]);

  // Handle search key down
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearchQuery(search);
      setCurrentPage(1);
    }
  };

  // Date Functions
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = getDateObject(dateString);
    if (!date || isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDateChange = (type, value) => {
    setDateRange((prev) => ({
      ...prev,
      [type]: value,
    }));
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setDateRange({ startDate: "", endDate: "" });
    setCurrentPage(1);
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDatePicker && !event.target.closest(".date-picker-container")) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showDatePicker]);

  // Quick date presets
  const applyDatePreset = (preset) => {
    const today = new Date();

    switch (preset) {
      case "today":
        const todayStr = dateToString(today);
        setDateRange({ startDate: todayStr, endDate: todayStr });
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = dateToString(yesterday);
        setDateRange({ startDate: yesterdayStr, endDate: yesterdayStr });
        break;
      case "last7days":
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        setDateRange({
          startDate: dateToString(last7),
          endDate: dateToString(today),
        });
        break;
      case "thisMonth":
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDateRange({
          startDate: dateToString(firstDay),
          endDate: dateToString(lastDay),
        });
        break;
      case "lastMonth":
        const firstDayLast = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastDayLast = new Date(today.getFullYear(), today.getMonth(), 0);
        setDateRange({
          startDate: dateToString(firstDayLast),
          endDate: dateToString(lastDayLast),
        });
        break;
      case "last30days":
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        setDateRange({
          startDate: dateToString(last30),
          endDate: dateToString(today),
        });
        break;
      case "thisYear":
        const firstDayYear = new Date(today.getFullYear(), 0, 1);
        setDateRange({
          startDate: dateToString(firstDayYear),
          endDate: dateToString(today),
        });
        break;
      default:
        break;
    }
    setShowDatePicker(false);
  };

  // Calendar navigation
  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const selectDate = (date) => {
    const dateStr = dateToString(date);

    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      // Start new selection
      setDateRange({ startDate: dateStr, endDate: "" });
    } else if (dateRange.startDate && !dateRange.endDate) {
      // Complete the range
      const start = getDateObject(dateRange.startDate);
      const end = date;

      if (end < start) {
        // If selected date is before start date, swap them
        setDateRange({ startDate: dateStr, endDate: dateRange.startDate });
      } else {
        setDateRange({ ...dateRange, endDate: dateStr });
      }
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        dateStr: dateToString(date),
      });
    }

    // Current month's days
    const today = dateToString(new Date());
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = dateToString(date);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: dateStr === today,
        dateStr,
      });
    }

    // Next month's days (to fill the grid)
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        dateStr: dateToString(date),
      });
    }

    return days;
  };

  // Check if a date is in the selected range
  const isDateInRange = (dateStr) => {
    if (!dateRange.startDate) return false;

    const date = getDateObject(dateStr);
    const start = getDateObject(dateRange.startDate);
    const end = getDateObject(dateRange.endDate);

    if (!date || isNaN(date.getTime())) return false;
    if (!start || isNaN(start.getTime())) return false;

    if (end && !isNaN(end.getTime())) {
      return date >= start && date <= end;
    } else if (start && !end) {
      return dateStr === dateRange.startDate;
    }
    return false;
  };

  // Check if a date is the start or end of the range
  const isRangeEdge = (dateStr) => {
    return dateStr === dateRange.startDate || dateStr === dateRange.endDate;
  };

  // Day names for calendar header
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

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
        return "bg-purple-600 text-white";
      case "Partially Refunded":
        return "bg-pink-600 text-white";
      default:
        return "bg-yellow-500 text-white";
    }
  };
  const { settings } = useStoreSettings();

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
        {/* Search & Filter Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3 mt-5 bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-3 w-full">
            {/* Text Search */}
            <input
              type="text"
              placeholder="Search by ORD/EC0STORE/Id"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="px-3 py-2 rounded-lg border border-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 w-full md:w-1/3"
            />

            {/* Enhanced Date Range Filter - DROPDOWN STYLE */}
            <div className="relative date-picker-container">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={toggleDatePicker}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <Calendar size={18} />
                    {dateRange.startDate || dateRange.endDate ? (
                      <span className="text-sm font-medium">
                        {formatDateForDisplay(dateRange.startDate)} -{" "}
                        {formatDateForDisplay(dateRange.endDate)}
                      </span>
                    ) : (
                      <span className="text-sm">Select Date Range</span>
                    )}
                  </button>

                  {(dateRange.startDate || dateRange.endDate) && (
                    <button
                      onClick={clearDateFilter}
                      className="absolute -right-2 -top-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                      title="Clear date filter"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Date Picker Dropdown (not modal) */}
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-[500px]">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800">
                        Select Date Range
                      </h3>
                      <button
                        onClick={toggleDatePicker}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Calendar Section */}
                      <div>
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <h4 className="font-semibold text-gray-800 text-sm">
                            {monthNames[currentMonth.getMonth()]}{" "}
                            {currentMonth.getFullYear()}
                          </h4>
                          <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="mb-4">
                          {/* Day Names */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayNames.map((day) => (
                              <div
                                key={day}
                                className="text-center text-xs font-medium text-gray-500 py-1"
                              >
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Calendar Days */}
                          <div className="grid grid-cols-7 gap-1">
                            {generateCalendarDays().map((day, index) => {
                              const isSelected = isDateInRange(day.dateStr);
                              const isEdge = isRangeEdge(day.dateStr);

                              return (
                                <button
                                  key={index}
                                  onClick={() => selectDate(day.date)}
                                  className={`
                                    h-7 text-xs rounded transition-colors
                                    ${
                                      !day.isCurrentMonth
                                        ? "text-gray-400"
                                        : "text-gray-800"
                                    }
                                    ${day.isToday ? "font-bold" : ""}
                                    ${
                                      isSelected
                                        ? "bg-blue-50 text-blue-600"
                                        : ""
                                    }
                                    ${
                                      isEdge
                                        ? "bg-blue-600 text-white font-medium"
                                        : ""
                                    }
                                    ${
                                      !isEdge && isSelected
                                        ? "hover:bg-blue-100"
                                        : ""
                                    }
                                    ${
                                      day.isCurrentMonth && !isSelected
                                        ? "hover:bg-gray-100"
                                        : ""
                                    }
                                  `}
                                  title={day.date.toLocaleDateString()}
                                >
                                  {day.date.getDate()}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Quick Presets & Inputs Section */}
                      <div className="flex flex-col">
                        {/* Date Inputs */}
                        <div className="mb-4">
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              From Date
                            </label>
                            <input
                              type="date"
                              value={dateRange.startDate}
                              onChange={(e) =>
                                handleDateChange("startDate", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              max={dateRange.endDate || undefined}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              To Date
                            </label>
                            <input
                              type="date"
                              value={dateRange.endDate}
                              onChange={(e) =>
                                handleDateChange("endDate", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min={dateRange.startDate || undefined}
                            />
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-gray-700 mb-2">
                            Quick Select
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "Today", value: "today" },
                              { label: "Yesterday", value: "yesterday" },
                              { label: "Last 7 Days", value: "last7days" },
                              { label: "Last 30 Days", value: "last30days" },
                              { label: "This Month", value: "thisMonth" },
                              { label: "Last Month", value: "lastMonth" },
                              { label: "This Year", value: "thisYear" },
                              {
                                label: "Clear All",
                                value: "clear",
                                className:
                                  "col-span-2 bg-red-50 text-red-600 hover:bg-red-100",
                              },
                            ].map((preset) => (
                              <button
                                key={preset.value}
                                onClick={() =>
                                  preset.value === "clear"
                                    ? clearDateFilter()
                                    : applyDatePreset(preset.value)
                                }
                                className={`
                                  px-3 py-2 text-xs rounded-lg transition-colors
                                  ${
                                    preset.className ||
                                    "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                  }
                                `}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Apply Button */}
                        <div className="mt-4 pt-4 border-t">
                          <button
                            onClick={() => {
                              toggleDatePicker();
                              fetchOrders();
                            }}
                            className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Apply Filter
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 flex-wrap mt-3 md:mt-0">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="totalAmount">Sort by Total Amount</option>
              <option value="status">Sort by Status</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Date filter summary */}
        {(dateRange.startDate || dateRange.endDate) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-sm text-blue-700">
                  Showing orders from{" "}
                  <strong>
                    {formatDateForDisplay(dateRange.startDate) ||
                      "any start date"}
                  </strong>
                  {" to "}
                  <strong>
                    {formatDateForDisplay(dateRange.endDate) || "any end date"}
                  </strong>
                </span>
              </div>
              <button
                onClick={clearDateFilter}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X size={14} />
                Clear filter
              </button>
            </div>
          </div>
        )}

        {totalOrders === 0 ? (
          <p className="flex justify-center mt-7 tracking-widest">
            No orders found.
          </p>
        ) : (
          <>
            {/* Orders Table */}
            <div className="overflow-x-auto rounded-lg shadow-lg">
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
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1 relative">
                            <span className="text-gray-900 font-semibold pt-1">
                              {order.orderNumber}
                            </span>
                            {order.status === "Pending" && (
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
                        <div className="flex align-middle flex-row gap-3">
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
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <MoreVertical
                                className="text-gray-700"
                                size={23}
                              />
                            </button>
                            {/* Dropdown menu */}
                            {/* {openDropdownId === order._id && (
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
                            )} */}
                            {openDropdownId === order._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                                <div className="py-1">
                                  <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
                                    Change Status
                                  </div>

                                  {getValidNextStatuses(order.status).map(
                                    (statusOption) => {
                                      // Special handling for refund statuses
                                      if (
                                        statusOption === "Refunded" ||
                                        statusOption === "Partially Refunded"
                                      ) {
                                        // Only show refund options if order is delivered AND has refunds
                                        if (
                                          order.status !== "Delivered" &&
                                          !hasRefunds(order)
                                        ) {
                                          return null;
                                        }
                                      }

                                      return (
                                        <button
                                          key={statusOption}
                                          onClick={() =>
                                            handleStatusChange(
                                              order._id,
                                              statusOption
                                            )
                                          }
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                        >
                                          {statusOption}
                                        </button>
                                      );
                                    }
                                  )}

                                  {/* Show message if no valid next statuses */}
                                  {getValidNextStatuses(order.status).length ===
                                    0 && (
                                    <div className="px-4 py-2 text-xs text-gray-400">
                                      No further status changes available
                                    </div>
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
