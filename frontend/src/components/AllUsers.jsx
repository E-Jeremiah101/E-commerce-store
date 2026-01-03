import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  X,
  ChevronDown,
  Search,
  Filter,
  ShoppingCart,
  User,
  Shield,
  AlertCircle,
  Edit2,
  Key,
  Users,
  Package,
  Headphones,
  Eye,
  CheckCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useUserStore } from "../stores/useUserStore.js";
import { motion } from "framer-motion";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";
import toast from "react-hot-toast";
import { ADMIN_ROLE_PERMISSIONS } from "../../../backend/constants/adminRoles.js";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showChangeAdminTypeModal, setShowChangeAdminTypeModal] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [adminTypes, setAdminTypes] = useState([]);
  const [selectedAdminType, setSelectedAdminType] = useState("");
  const [newAdminType, setNewAdminType] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    admins: 0,
    totalOrders: 0,
    completedOrders: 0,
    completionRate: 0,
    totalCartValue: 0,
  });
  const { user: currentUser } = useUserStore();
  const { settings } = useStoreSettings();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/admin/users?search=${search}&role=${roleFilter}`,
        { withCredentials: true }
      );
      setUsers(res.data);
      setFilteredUsers(res.data); // Initialize filtered users

      // Calculate comprehensive stats
      const total = res.data.length;
      const customers = res.data.filter((u) => u.role === "customer").length;
      const admins = res.data.filter((u) => u.role === "admin").length;

      // Calculate order statistics
      let totalOrders = 0;
      let completedOrders = 0;
      let totalCartValue = 0;
      let CancelledOrders = 0;

      res.data.forEach((user) => {
        totalOrders += user.orderStats?.total || 0;
        completedOrders += user.orderStats?.completed || 0;
        CancelledOrders += user.orderStats?.cancelled || 0;

        // Calculate cart value
        if (user.cartItems?.length > 0) {
          const cartTotal = user.cartItems.reduce((sum, item) => {
            return sum + (item.product?.price || 0) * (item.quantity || 1);
          }, 0);
          totalCartValue += cartTotal;
        }
      });

      const validOrders = totalOrders - CancelledOrders;
      const completionRate =
        validOrders > 0 ? Math.round((completedOrders / validOrders) * 100) : 0;

        const cancellationRate =
          totalOrders > 0
            ? Math.round((CancelledOrders / totalOrders) * 100)
            : 0;


      setStats({
        total,
        customers,
        admins,
        totalOrders,
        completedOrders,
        CancelledOrders,
        cancellationRate,
        completionRate,
        totalCartValue,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminTypes = async () => {
    try {
      const res = await axios.get("/api/admin/users/admin-types", {
        withCredentials: true,
      });
      setAdminTypes(res.data);
    } catch (error) {
      console.error("Error fetching admin types:", error);
      toast.error("Failed to load admin types");
    }
  };

  const updateUserRole = async (userId, role, adminType = null) => {
    try {
      const payload = { role };
      if (role === "admin" && adminType) {
        payload.adminType = adminType;
      }

      const response = await axios.put(
        `/api/admin/users/${userId}/role`,
        payload,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "User role updated successfully"
        );
        fetchUsers();
      } else {
        toast.error(response.data.message || "Failed to update user");
      }

      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedAdminType("");
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error(
        error.response?.data?.message || "Failed to update user role"
      );
    }
  };

  const changeAdminType = async (userId, newAdminType) => {
    try {
      const response = await axios.put(
        `/api/admin/users/${userId}/role`,
        { role: "admin", adminType: newAdminType },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(
          `Admin type changed to ${getAdminTypeLabel(newAdminType)}`
        );
        fetchUsers();
      } else {
        toast.error(response.data.message || "Failed to change admin type");
      }

      setShowChangeAdminTypeModal(false);
      setSelectedUser(null);
      setNewAdminType("");
    } catch (error) {
      console.error("Error changing admin type:", error);
      toast.error(
        error.response?.data?.message || "Failed to change admin type"
      );
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedAdminType(user.adminType || "");
    setShowRoleModal(true);
  };

  const openChangeAdminTypeModal = (user) => {
    setSelectedUser(user);
    setNewAdminType(user.adminType || "");
    setShowChangeAdminTypeModal(true);
  };

  // Filter users based on search and role filter
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.firstname?.toLowerCase().includes(searchLower) ||
          user.lastname?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user._id?.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [search, roleFilter, users]);

  useEffect(() => {
    fetchUsers();
    fetchAdminTypes();
  }, []);

  // ================= PAGINATION LOGIC =================
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of table
      window.scrollTo({ top: 600, behavior: "smooth" });
    }
  };

  const getPaginationRange = () => {
    const totalNumbers = 5; // Number of page buttons to show
    const totalBlocks = totalNumbers + 2; // Including first, last, and ellipsis

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    let pages = [1];

    if (startPage > 2) {
      pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push("...");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  // Helper function to get admin type label
  const getAdminTypeLabel = (value) => {
    const adminType = adminTypes.find((type) => type.value === value);
    return adminType ? adminType.label : value || "Not Set";
  };

  // Get admin type icon
  const getAdminTypeIcon = (type) => {
    switch (type) {
      case "super_admin":
        return <Key className="h-4 w-4" />;
      case "supervisor":
        return <Eye className="h-4 w-4" />;
      case "product_manager":
        return <Package className="h-4 w-4" />;
      case "order_manager":
        return <ShoppingCart className="h-4 w-4" />;
      case "customer_support":
        return <Headphones className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  // Get admin type color
  const getAdminTypeColor = (type) => {
    switch (type) {
      case "super_admin":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "supervisor":
        return "bg-green-100 text-green-800 border border-green-200";
      case "product_manager":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "order_manager":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "customer_support":
        return "bg-pink-100 text-pink-800 border border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // Get admin type description
  const getAdminTypeDescription = (type) => {
    switch (type) {
      case "super_admin":
        return "Full access to all system features and user management";
      case "supervisor":
        return "View-only access to all system modules for monitoring";
      case "product_manager":
        return "Manage products, inventory, and product listings";
      case "order_manager":
        return "Process orders, manage shipments, and handle order-related tasks";
      case "customer_support":
        return "Handle refunds, customer issues, and order recovery";
      default:
        return "No specific admin permissions assigned";
    }
  };

  // Check if current user can edit target user
  const canEditUser = (targetUser) => {
    if (!currentUser) return false;

    // Super admin can edit anyone
    if (currentUser.adminType === "super_admin") return true;

    // Don't allow editing super admin unless you are super admin
    if (targetUser.adminType === "super_admin") return false;

    // Don't allow editing yourself unless you're super admin
    if (
      targetUser._id === currentUser._id &&
      currentUser.adminType !== "super_admin"
    ) {
      return false;
    }

    return true;
  };

  const canChangeAdminType = (targetUser) => {
    if (!canEditUser(targetUser)) return false;
    return (
      targetUser.role === "admin" && targetUser.adminType !== "super_admin"
    );
  };

  const getCartTotal = (cartItems) => {
    return (
      cartItems?.reduce((total, item) => {
        return total + (item.product?.price || 0) * (item.quantity || 0);
      }, 0) || 0
    );
  };

  // Helper function to get order completion rate
  const getOrderCompletionRate = (user) => {
    const completed = user.orderStats?.completed || 0;
    const total = user.orderStats?.total || 0;

    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };
const getOrderCancelledRate = (user) => {
  const cancelled = user.orderStats?.cancelled || 0;
  const total = user.orderStats?.total || 0;

  if (total === 0) return 0;
  return Math.round((cancelled / total) * 100);
};
  // Format order completion for display
  const formatOrderCompletion = (user) => {
    const completed = user.orderStats?.completed || 0;
    const total = user.orderStats?.total || 0;
    const rate = getOrderCompletionRate(user);

    if (total === 0) return "No orders";
    return `${completed}/${total} (${rate}%)`;
  };

 if (loading)
     return (
       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8">
         <div className="flex flex-col items-center justify-center h-96">
           <div className="relative">
             <div className="h-24 w-24 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
               <User className="h-10 w-10 text-gray-400 animate-pulse" />
             </div>
           </div>
           <p className="mt-6 text-lg font-medium text-gray-600">
             Loading Users...
           </p>
           <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
         </div>
       </div>
     );

  return (
    <>
      <motion.div
        className="py-6 px-4 md:px-6 bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage user accounts, roles, and order statistics
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            {currentUser?.adminType && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getAdminTypeColor(
                  currentUser.adminType
                )}`}
              >
                {getAdminTypeLabel(currentUser.adminType)}
              </span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
                <div className="flex text-xs text-gray-500 mt-1">
                  <span className="mr-3">{stats.customers} customers</span>
                  <span>{stats.admins} admins</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Completed Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedOrders || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {stats.totalOrders || 0} total •{" "}
                  {stats.completionRate || 0}% rate
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Cart Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats.totalCartValue || 0, settings?.currency)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Across all user carts
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.cartItems?.length > 0).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">With items in cart</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-500 mr-2" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="">All Users</option>
                  <option value="customer">Customers Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>

              <button
                onClick={fetchUsers}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center"
              >
                <Search className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Role & Permissions
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Coupons
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Cart
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {getCurrentPageData().length > 0 ? (
                  getCurrentPageData().map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                            <span className="text-blue-800 font-bold text-lg">
                              {user.firstname?.charAt(0)}
                              {user.lastname?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-bold text-gray-900">
                              {user.firstname} {user.lastname}
                            </p>
                            <p className="text-xs text-gray-600">{user._id}</p>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                            <div className="flex items-center mt-1 space-x-2">
                              {user.phones?.[0]?.number && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  📱 {user.phones[0].number}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                Joined{" "}
                                {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">
                                {user.orderStats?.completed || 0}
                              </div>
                              <div className="text-xs text-gray-500">
                                Completed
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-600">
                                {user.orderStats?.cancelled || 0}
                              </div>
                              <div className="text-xs text-gray-500">
                                Cancelled
                              </div>
                            </div>
                            <div className="h-8 w-px bg-gray-300"></div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {user.orderStats?.total || 0}
                              </div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                          </div>

                          {user.orderStats?.total > 0 && (
                            <>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${getOrderCompletionRate(user)}%`,
                                  }}
                                ></div>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-700">
                                  Completion Rate
                                </span>
                                <span className="text-xs font-bold text-green-600">
                                  {getOrderCompletionRate(user)}%
                                </span>
                              </div>

                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-red-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${getOrderCancelledRate(user)}%`,
                                  }}
                                ></div>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-700">
                                  Cancelled Rate
                                </span>
                                <span className="text-xs font-bold text-red-600">
                                  {getOrderCancelledRate(user)}%
                                </span>
                              </div>
                            </>
                          )}

                          {user.orderStats?.total === 0 && (
                            <div className="text-center py-2">
                              <span className="text-xs text-gray-400 italic">
                                No orders yet
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center ${
                                user.role === "admin"
                                  ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800"
                                  : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800"
                              }`}
                            >
                              {user.role === "admin"
                                ? "👑 ADMIN"
                                : "👤 CUSTOMER"}
                            </span>
                          </div>

                          {user.role === "admin" && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center ${getAdminTypeColor(
                                    user.adminType
                                  )}`}
                                >
                                  {getAdminTypeIcon(user.adminType)}
                                  <span className="ml-1.5">
                                    {getAdminTypeLabel(user.adminType)}
                                  </span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div
                                className={`text-lg font-bold ${
                                  user.couponStats?.active > 0
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {user.couponStats?.active || 0}
                              </div>
                              <div className="text-xs text-gray-500">
                                Active
                              </div>
                            </div>

                            <div className="h-8 w-px bg-gray-300"></div>

                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {user.couponStats?.used || 0}
                              </div>
                              <div className="text-xs text-gray-500">Used</div>
                            </div>

                            <div className="h-8 w-px bg-gray-300"></div>

                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-700">
                                {user.couponStats?.total || 0}
                              </div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                          </div>

                          {user.couponStats?.active > 0 && (
                            <div className="mt-2">
                              <button
                                onClick={() => {
                                  toast.success(
                                    ` ${user.couponStats.coupons[0]?.code}`
                                  );
                                  // You can implement a modal here to show coupon details
                                }}
                                className="w-full text-xs text-green-600 hover:text-green-800 font-medium py-1 border border-green-100 rounded hover:bg-green-50 transition"
                              >
                                View Active Coupons
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowCartModal(true);
                            }}
                            className="flex items-center justify-between w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                          >
                            <div className="flex items-center">
                              <ShoppingCart className="h-5 w-5 text-gray-500 mr-2" />
                              <div className="text-left">
                                <p className="text-sm font-medium text-gray-900">
                                  {user.cartItems?.length || 0} items
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatPrice(
                                    getCartTotal(user.cartItems),
                                    settings?.currency
                                  )}
                                </p>
                              </div>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          {/* Promote/Demote Button */}
                          {canEditUser(user) ? (
                            <button
                              onClick={() => openRoleModal(user)}
                              className={`px-4 py-2 text-sm rounded-lg font-medium transition flex items-center justify-center ${
                                user.role === "admin"
                                  ? "bg-gradient-to-r from-red-50 to-red-100 text-red-700 hover:from-red-100 hover:to-red-200 border border-red-200"
                                  : "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 border border-blue-200"
                              }`}
                            >
                              {user.role === "admin" ? (
                                <>
                                  <User className="h-4 w-4 mr-2" />
                                  Demote to Customer
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Promote to Admin
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-400 bg-gray-50 rounded-lg flex items-center justify-center">
                              {user._id === currentUser?._id
                                ? "This is you"
                                : "Restricted"}
                            </div>
                          )}

                          {/* Change Admin Type Button - Only for existing admins */}
                          {canChangeAdminType(user) && (
                            <button
                              onClick={() => openChangeAdminTypeModal(user)}
                              className="px-4 py-2 text-sm rounded-lg font-medium transition flex items-center justify-center bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 hover:from-purple-100 hover:to-purple-200 border border-purple-200"
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Change Admin Type
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <User className="h-16 w-16 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-lg">No users found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {search || roleFilter
                            ? "Try adjusting your search or filters"
                            : "No users in the system yet"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredUsers.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-sm text-gray-600">
              Showing{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                filteredUsers.length
              )}{" "}
              to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
            </div>

            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${
                  currentPage === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${
                  currentPage === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page Numbers */}
              {getPaginationRange().map((page, index) => (
                <React.Fragment key={index}>
                  {page === "..." ? (
                    <span className="px-3 py-1 text-gray-400">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg ${
                        currentPage === page
                          ? "bg-black text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${
                  currentPage === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${
                  currentPage === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {/* Summary Footer */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Summary</p>
                <p className="text-xs text-blue-600 mt-1">
                  Showing {filteredUsers.length} of {stats.total} users • Page{" "}
                  {currentPage} of {totalPages}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 mt-3 md:mt-0">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Total Orders</p>
                  <p className="text-lg font-bold text-blue-700">
                    {stats.totalOrders}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-lg font-bold text-green-700">
                    {stats.completedOrders}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-600">Completion Rate</p>
                  <p className="text-lg font-bold text-orange-700">
                    {stats.completionRate}%
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-600">Active Carts</p>
                  <p className="text-lg font-bold text-purple-700">
                    {users.filter((u) => u.cartItems?.length > 0).length}
                  </p>
                </div>
              </div>

              <div className="mt-3 md:mt-0 text-right">
                <p className="text-xs text-gray-500">
                  Last updated:{" "}
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Cart Modal */}
      {showCartModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedUser.firstname}'s Shopping Cart
                </h2>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm text-gray-500">
                    {selectedUser.cartItems?.length || 0} items • Total:{" "}
                    {formatPrice(
                      getCartTotal(selectedUser.cartItems),
                      settings?.currency
                    )}
                  </p>

                  {selectedUser.orderStats?.total > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {selectedUser.orderStats.completed} completed orders
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedUser.cartItems?.length > 0 ? (
                <div className="space-y-4">
                  {selectedUser.cartItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                    >
                      {item.product?.images?.[0] && (
                        <img
                          src={item.product.images[0]}
                          alt={item.product?.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}

                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-gray-900">
                            {item.product?.name || "Unknown Product"}
                          </h3>
                          <span className="font-bold text-blue-600">
                            {formatPrice(
                              (item.product?.price || 0) * (item.quantity || 1),
                              settings?.currency
                            )}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Quantity:</span>
                            <span className="ml-2 font-medium">
                              {item.quantity || 1}
                            </span>
                          </div>

                          <div>
                            <span className="text-gray-500">Unit Price:</span>
                            <span className="ml-2 font-medium">
                              {formatPrice(
                                item.product?.price || 0,
                                settings?.currency
                              )}
                            </span>
                          </div>

                          {item.size && (
                            <div>
                              <span className="text-gray-500">Size:</span>
                              <span className="ml-2 font-medium">
                                {item.size}
                              </span>
                            </div>
                          )}

                          {item.color && (
                            <div>
                              <span className="text-gray-500">Color:</span>
                              <span className="ml-2 font-medium">
                                {item.color}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Stock: {item.product?.stock || "N/A"}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                            ID: {item.product?._id?.slice(-6) || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Cart is empty</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {selectedUser.firstname} hasn't added any items to their
                    cart yet
                  </p>
                  {selectedUser.orderStats?.total > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        This user has {selectedUser.orderStats.completed}{" "}
                        completed orders
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-lg font-bold">
                    {selectedUser.cartItems?.length || 0}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">User's Order Stats</p>
                  <p className="text-sm font-medium">
                    {selectedUser.orderStats?.completed || 0} completed •{" "}
                    {selectedUser.orderStats?.total || 0} total
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">Cart Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPrice(
                      getCartTotal(selectedUser.cartItems),
                      settings?.currency
                    )}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Role/AdminType Modal (Promote/Demote) */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedUser.role === "admin"
                  ? "Demote User"
                  : "Promote to Admin"}
              </h2>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setSelectedAdminType("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {selectedUser.role === "admin" ? (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                      <div>
                        <p className="font-medium text-red-800">Demote Admin</p>
                        <p className="text-sm text-red-600 mt-1">
                          This will remove admin privileges from{" "}
                          {selectedUser.firstname}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-900">Current Role:</p>
                      <div className="mt-2">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center ${getAdminTypeColor(
                            selectedUser.adminType
                          )}`}
                        >
                          {getAdminTypeIcon(selectedUser.adminType)}
                          <span className="ml-1.5">
                            {getAdminTypeLabel(selectedUser.adminType)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        Permissions to be removed:
                      </p>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          {selectedUser.permissions?.length || 0} admin
                          permissions
                        </p>
                        <div className="mt-2 space-y-1">
                          {selectedUser.permissions
                            ?.slice(0, 3)
                            .map((perm, index) => (
                              <p key={index} className="text-xs text-gray-500">
                                • {perm}
                              </p>
                            ))}
                          {selectedUser.permissions?.length > 3 && (
                            <p className="text-xs text-gray-500">
                              • ...and {selectedUser.permissions.length - 3}{" "}
                              more
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => setShowRoleModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        updateUserRole(selectedUser._id, "customer")
                      }
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition"
                    >
                      Demote to Customer
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <Shield className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-blue-800">
                          Promote to Admin
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          Assign admin role to {selectedUser.firstname}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Admin Role Type
                    </label>
                    <div className="space-y-3">
                      {adminTypes.map((type) => (
                        <div
                          key={type.value}
                          className={`p-3 border rounded-lg cursor-pointer transition ${
                            selectedAdminType === type.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedAdminType(type.value)}
                        >
                          <div className="flex items-center">
                            <div
                              className={`p-2 rounded-lg ${
                                selectedAdminType === type.value
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              {getAdminTypeIcon(type.value)}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">
                                {type.label}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {getAdminTypeDescription(type.value)}
                              </p>
                            </div>
                            {selectedAdminType === type.value && (
                              <div className="ml-auto">
                                <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <div className="h-2 w-2 bg-white rounded-full"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRoleModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        updateUserRole(
                          selectedUser._id,
                          "admin",
                          selectedAdminType
                        )
                      }
                      disabled={!selectedAdminType}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition ${
                        selectedAdminType
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Promote to Admin
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Change Admin Type Modal */}
      {showChangeAdminTypeModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header - Fixed */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                Change Admin Type
              </h2>
              <button
                onClick={() => {
                  setShowChangeAdminTypeModal(false);
                  setSelectedUser(null);
                  setNewAdminType("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <div className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <Edit2 className="h-6 w-6 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-purple-800">
                      Update Admin Permissions
                    </p>
                    <p className="text-sm text-purple-600 mt-1">
                      Change admin type for {selectedUser.firstname}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Current Admin Type:
                  </p>
                  <div
                    className={`px-3 py-2 rounded-lg ${getAdminTypeColor(
                      selectedUser.adminType
                    )}`}
                  >
                    <div className="flex items-center">
                      {getAdminTypeIcon(selectedUser.adminType)}
                      <span className="ml-2 font-medium">
                        {getAdminTypeLabel(selectedUser.adminType)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {getAdminTypeDescription(selectedUser.adminType)}
                    </p>
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select New Admin Type
                </label>
                <div className="space-y-3">
                  {adminTypes
                    .filter(
                      (type) =>
                        type.value !== "super_admin" ||
                        currentUser?.adminType === "super_admin"
                    )
                    .map((type) => (
                      <div
                        key={type.value}
                        className={`p-3 border rounded-lg cursor-pointer transition ${
                          newAdminType === type.value
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => setNewAdminType(type.value)}
                      >
                        <div className="flex items-center">
                          <div
                            className={`p-2 rounded-lg ${
                              newAdminType === type.value
                                ? "bg-purple-100"
                                : "bg-gray-100"
                            }`}
                          >
                            {getAdminTypeIcon(type.value)}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {type.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {getAdminTypeDescription(type.value)}
                            </p>
                            <div className="mt-2">
                              <p className="text-xs text-gray-600">
                                Permissions:{" "}
                                {ADMIN_ROLE_PERMISSIONS?.[type.value]?.length ||
                                  0}{" "}
                                access rights
                              </p>
                            </div>
                          </div>
                          {newAdminType === type.value && (
                            <div className="ml-2 shrink-0">
                              <div className="h-5 w-5 bg-purple-500 rounded-full flex items-center justify-center">
                                <div className="h-2 w-2 bg-white rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {newAdminType && newAdminType !== selectedUser.adminType && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Changes Summary:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Current:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${getAdminTypeColor(
                          selectedUser.adminType
                        )}`}
                      >
                        {getAdminTypeLabel(selectedUser.adminType)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">New:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${getAdminTypeColor(
                          newAdminType
                        )}`}
                      >
                        {getAdminTypeLabel(newAdminType)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowChangeAdminTypeModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    changeAdminType(selectedUser._id, newAdminType)
                  }
                  disabled={
                    !newAdminType || newAdminType === selectedUser.adminType
                  }
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition ${
                    newAdminType && newAdminType !== selectedUser.adminType
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Update Admin Type
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default AllUsers;
