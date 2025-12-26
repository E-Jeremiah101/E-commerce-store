import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [form, setForm] = useState({
    discountPercentage: 10,
    expirationDate: "",
    couponReason: "special_reward",
    userId: "",
  });

  // ================= FETCH COUPONS =================
  const fetchCoupons = async () => {
    try {
      const { data } = await axios.get("/admin/coupons");
      setCoupons(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (err) {
      toast.error("Failed to load coupons");
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
      };

      await axios.post("/admin/coupons", payload);

      toast.success("Coupon created successfully");
      setShowModal(false);

      setForm({
        discountPercentage: 10,
        expirationDate: "",
        couponReason: "special_reward",
        userId: "",
      });

      fetchCoupons();
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
      fetchCoupons();
    } catch {
      toast.error("Failed to update coupon");
    }
  };

  // ================= PAGINATION LOGIC =================
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return coupons.slice(startIndex, endIndex);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];

    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-lg ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        ←
      </button>
    );

    // Page buttons
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // First page
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-2">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-lg ${
            currentPage === i
              ? "bg-black text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="px-2">
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-lg ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        →
      </button>
    );

    return buttons;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Coupons</h1>
          <p className="text-sm text-gray-500">
            Manage discount codes and promotions
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} • {coupons.length} total coupons
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            New Coupon
          </button>
        </div>
      </div>

      {/* Coupon Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {getCurrentPageData().map((c) => (
              <tr key={c._id} className="border-t">
                <td className="px-4 py-3 font-medium">{c.code}</td>
                <td className="px-4 py-3 text-center">
                  {c.discountPercentage}%
                </td>
                <td className="px-4 py-3 text-center capitalize">
                  {c.couponReason.replace("_", " ")}
                </td>
                <td className="px-4 py-3 text-center">
                  {new Date(c.expirationDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      c.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {c.usedAt ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleCoupon(c._id)}
                    className="text-xs underline"
                  >
                    {c.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}

            {coupons.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-400">
                  No coupons created yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {coupons.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, coupons.length)} of{" "}
            {coupons.length} coupons
          </div>

          <div className="flex items-center gap-2">
            {renderPaginationButtons()}
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Create Coupon</h2>

            {/* Coupon Code */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Coupon Code
              </label>
              <input
                value="Auto-generated"
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
              />
            </div>

            <Input
              label="Discount Percentage"
              type="number"
              min="1"
              max="100"
              value={form.discountPercentage}
              onChange={(e) =>
                setForm({ ...form, discountPercentage: e.target.value })
              }
            />

            <Input
              label="Expiration Date"
              type="date"
              value={form.expirationDate}
              onChange={(e) =>
                setForm({ ...form, expirationDate: e.target.value })
              }
            />

            <Select
              label="Coupon Type"
              value={form.couponReason}
              onChange={(e) =>
                setForm({ ...form, couponReason: e.target.value })
              }
              options={[
                { value: "special_reward", label: "Special Reward" },
                { value: "loyalty_bonus", label: "Loyalty Bonus" },
              ]}
            />

            <Input
              label="User ID (optional)"
              placeholder="Leave empty for global coupon"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= REUSABLE INPUT =================
function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input {...props} className="w-full border rounded-lg px-3 py-2" />
    </div>
  );
}

// ================= REUSABLE SELECT =================
function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select {...props} className="w-full border rounded-lg px-3 py-2">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
