import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Tag,
  User,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Sparkles,
  Clock,
  Percent,
  Users,
  Globe,
  BarChart3,
  RefreshCw,
} from "lucide-react";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    used: 0,
    totalDiscountValue: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [form, setForm] = useState({
    discountPercentage: 15,
    expirationDate: "",
    couponReason: "special_reward",
    userId: "",
    note: "",
  });

  // ================= FETCH COUPONS =================
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/admin/coupons");
      setCoupons(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));

      // Calculate statistics
      const now = new Date();
      const active = data.filter(
        (c) => c.isActive && new Date(c.expirationDate) > now
      ).length;
      const expired = data.filter(
        (c) => new Date(c.expirationDate) <= now
      ).length;
      const used = data.filter((c) => c.usedAt).length;
      const totalDiscountValue = data.reduce(
        (sum, c) => sum + c.discountPercentage,
        0
      );

      setStats({
        total: data.length,
        active,
        expired,
        used,
        totalDiscountValue,
      });
    } catch (err) {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // ================= CREATE COUPON =================
  const handleCreate = async () => {
    if (!form.expirationDate) {
      toast.error("Expiration date is required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        discountPercentage: Number(form.discountPercentage),
        expirationDate: form.expirationDate,
        couponReason: form.couponReason,
        userId: form.userId || null,
        note: form.note,
        sendToAllUsers: form.sendToAllUsers, // Add this
      };

      const response = await axios.post("/admin/coupons", payload);

      if (response.data.success) {
        toast.success(response.data.message);
        setShowModal(false);

        // Show email stats if available
        if (response.data.emailStats) {
          const stats = response.data.emailStats;
          toast.success(
            <div>
              <p>Coupon created successfully!</p>
              <p className="text-sm mt-1">
                Emails sent: {stats.sentCount} users
                {stats.failedCount > 0 && ` (${stats.failedCount} failed)`}
              </p>
            </div>,
            { duration: 5000 }
          );
        }

        // Reset form
        setForm({
          discountPercentage: 15,
          expirationDate: "",
          couponReason: "special_reward",
          userId: "",
          note: "",
          sendToAllUsers: false,
        });

        fetchCoupons();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  // ================= TOGGLE COUPON =================
  const toggleCoupon = async (id) => {
    try {
      await axios.patch(`/admin/coupons/${id}/toggle`);
      toast.success("Coupon status updated");
      fetchCoupons();
    } catch {
      toast.error("Failed to update coupon");
    }
  };

  // ================= DELETE COUPON =================
  const deleteCoupon = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await axios.delete(`/admin/coupons/${id}`);
        toast.success("Coupon deleted");
        fetchCoupons();
      } catch {
        toast.error("Failed to delete coupon");
      }
    }
  };

  // ================= FILTER COUPONS =================
  const filteredCoupons = coupons.filter((coupon) => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        coupon.code.toLowerCase().includes(searchLower) ||
        coupon.userId?.email?.toLowerCase().includes(searchLower) ||
        coupon.couponReason.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (statusFilter !== "all") {
      const now = new Date();
      const isActive = coupon.isActive && new Date(coupon.expirationDate) > now;
      const isExpired = new Date(coupon.expirationDate) <= now;

      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "expired" && !isExpired) return false;
      if (statusFilter === "used" && !coupon.usedAt) return false;
    }

    if (typeFilter !== "all" && coupon.couponReason !== typeFilter) {
      return false;
    }

    return true;
  });

  // ================= PAGINATION LOGIC =================
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCoupons.slice(startIndex, endIndex);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (coupon) => {
    const now = new Date();
    const isExpired = new Date(coupon.expirationDate) <= now;

    if (coupon.usedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Used
        </span>
      );
    }

    if (!coupon.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Disabled
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  const getReasonIcon = (reason) => {
    switch (reason) {
      case "special_reward":
        return <Sparkles className="w-4 h-4 text-yellow-500" />;
      case "loyalty_bonus":
        return <Users className="w-4 h-4 text-blue-500" />;
      case "first_order":
        return <Tag className="w-4 h-4 text-green-500" />;
      default:
        return <Tag className="w-4 h-4 text-gray-500" />;
    }
  };

  const getReasonLabel = (reason) => {
    return reason
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Coupon Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create, manage, and track discount coupons for your customers
            </p>
          </div>

          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={fetchCoupons}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Coupon
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-blue-50">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Coupons</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-green-50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-purple-50">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Used</p>
                <p className="text-2xl font-bold text-gray-900">{stats.used}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-red-50">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Expired</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.expired}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-yellow-50">
                <Percent className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Avg. Discount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total > 0
                    ? Math.round(stats.totalDiscountValue / stats.total)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by code, user email, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="used">Used</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="all">All Types</option>
                <option value="special_reward">Special Reward</option>
                <option value="loyalty_bonus">Loyalty Bonus</option>
                <option value="first_order">First Order</option>
                <option value="high_value_order">High Value Order</option>
                <option value="customer_support">Customer Support</option>
              </select>

              <button className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Coupon Code
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type & Reason
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Validity
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {getCurrentPageData().map((coupon) => (
                  <tr
                    key={coupon._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <Tag className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="font-mono font-bold text-gray-900">
                            {coupon.code}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Created: {formatDate(coupon.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200">
                          <Percent className="w-3 h-3 mr-1" />
                          {coupon.discountPercentage}% OFF
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {coupon.userId ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {coupon.userId.email ||
                                `User ${coupon.userId._id?.slice(-6)}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {coupon.userId._id}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500">
                          <Globe className="w-4 h-4 mr-2" />
                          <span className="text-sm">Global Coupon</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getReasonIcon(coupon.couponReason)}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {getReasonLabel(coupon.couponReason)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div>Until {formatDate(coupon.expirationDate)}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(coupon.expirationDate) > new Date()
                              ? `${Math.ceil(
                                  (new Date(coupon.expirationDate) -
                                    new Date()) /
                                    (1000 * 60 * 60 * 24)
                                )} days left`
                              : "Expired"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(coupon)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleCoupon(coupon._id)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            coupon.isActive
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {coupon.isActive ? "Disable" : "Enable"}
                        </button>

                        <button
                          onClick={() => deleteCoupon(coupon._id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </button>

                        <button className="inline-flex items-center p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {getCurrentPageData().length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Tag className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">
                          No coupons found
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          {searchQuery ||
                          statusFilter !== "all" ||
                          typeFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "Get started by creating your first coupon"}
                        </p>
                        {!searchQuery &&
                          statusFilter === "all" &&
                          typeFilter === "all" && (
                            <button
                              onClick={() => setShowModal(true)}
                              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Create First Coupon
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredCoupons.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-sm text-gray-600">
              Showing{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                filteredCoupons.length
              )}{" "}
              to {Math.min(currentPage * itemsPerPage, filteredCoupons.length)}{" "}
              of {filteredCoupons.length} coupons
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-lg transition ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Create New Coupon
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      Generate a discount code for your customers
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white/80 hover:text-white transition"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 h-100 overflow-y-auto">
                {/* Auto-generated code preview */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 ">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Coupon Code
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Will be auto-generated
                      </p>
                    </div>
                    <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-300">
                      <code className="text-sm font-mono text-gray-600">
                        AUTO-GEN
                      </code>
                    </div>
                  </div>
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <Percent className="w-4 h-4 mr-2  text-gray-400" />
                      Discount Percentage
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={form.discountPercentage}
                      onChange={(e) =>
                        setForm({ ...form, discountPercentage: e.target.value })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="absolute -bottom-6 left-0 right-0 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-bold">
                        {form.discountPercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      Expiration Date
                    </div>
                  </label>
                  <input
                    type="date"
                    value={form.expirationDate}
                    onChange={(e) =>
                      setForm({ ...form, expirationDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {/* Coupon Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-gray-400" />
                      Coupon Type
                    </div>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        value: "special_reward",
                        label: "Special Reward",
                        icon: Sparkles,
                        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
                      },
                      {
                        value: "loyalty_bonus",
                        label: "Loyalty Bonus",
                        icon: Users,
                        color: "bg-blue-50 text-blue-700 border-blue-200",
                      },
                      {
                        value: "first_order",
                        label: "First Order",
                        icon: Tag,
                        color: "bg-green-50 text-green-700 border-green-200",
                      },
                      {
                        value: "high_value_order",
                        label: "High Value",
                        icon: BarChart3,
                        color: "bg-purple-50 text-purple-700 border-purple-200",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, couponReason: option.value })
                        }
                        className={`p-3 border rounded-xl text-sm font-medium transition-all ${
                          form.couponReason === option.value
                            ? `${option.color} ring-2 ring-offset-2 ring-opacity-50`
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <option.icon className="w-4 h-4 mr-2" />
                          {option.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* User ID (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      Assign to User (Optional)
                    </div>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter user ID or leave empty for global coupon"
                    value={form.userId}
                    onChange={(e) =>
                      setForm({ ...form, userId: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                {/* Note (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Note (Optional)
                  </label>
                  <textarea
                    placeholder="Add a note about this coupon..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                {!form.userId && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="sendToAllUsers"
                      checked={form.sendToAllUsers}
                      onChange={(e) =>
                        setForm({ ...form, sendToAllUsers: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <label
                      htmlFor="sendToAllUsers"
                      className="ml-3 text-sm text-gray-700"
                    >
                      Notify all users about this coupon via email
                    </label>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={loading || !form.expirationDate}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Coupon
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add some custom animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
