import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    code: "",
    discountPercentage: 10,
    expirationDate: "",
    couponReason: "first_order",
    userId: "",
    isActive: true,
  });

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      const { data } = await axios.get("/admin/coupons");
      setCoupons(data);
    } catch (err) {
      toast.error("Failed to load coupons");
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Create coupon
  const handleCreate = async () => {
    setLoading(true);
    try {
      await axios.post("/admin/coupons", form);
      toast.success("Coupon created");
      setShowModal(false);
      setForm({
        code: "",
        discountPercentage: 10,
        expirationDate: "",
        couponReason: "first_order",
        userId: "",
        isActive: true,
      });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  // Toggle coupon
  const toggleCoupon = async (id) => {
    try {
      await axios.patch(`/admin/coupons/${id}/toggle`);
      fetchCoupons();
    } catch {
      toast.error("Failed to update coupon");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Coupons</h1>
          <p className="text-sm text-gray-500">
            Manage discount codes and promotions
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          New Coupon
        </button>
      </div>

      {/* Coupon Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
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
            {coupons.map((c) => (
              <tr key={c._id} className="border-t">
                <td className="px-4 py-3 font-medium">{c.code}</td>
                <td className="px-4 py-3 text-center">
                  {c.discountPercentage}%
                </td>
                <td className="px-4 py-3 text-center">
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

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Create Coupon</h2>

            <Input
              label="Coupon Code"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
            />

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
              label="Coupon Reason"
              value={form.couponReason}
              onChange={(e) =>
                setForm({ ...form, couponReason: e.target.value })
              }
              options={[
                { value: "first_order", label: "First Order" },
                { value: "high_value_order", label: "High Value Order" },
              ]}
            />

            <Input
              label="User ID (optional)"
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

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input {...props} className="w-full border rounded-lg px-3 py-2" />
    </div>
  );
}

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
