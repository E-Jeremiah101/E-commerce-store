import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export default function StoreSettings() {
  const [form, setForm] = useState({
    storeName: "",
    logo: "",
    supportEmail: "",
    phoneNumber: "",
    currency: "NGN",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* Fetch store settings */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get("/store-settings");
        setForm(data);
      } catch (err) {
        toast.error("Failed to load store settings");
      }
    };

    fetchSettings();
  }, []);

  /* Handle input change */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* Upload logo to Cloudinary */
 const handleLogoUpload = async (e) => {
   const file = e.target.files[0];
   if (!file) return;

   setUploading(true);

   try {
     const formData = new FormData();
     formData.append("image", file);

     const { data } = await axios.post(
       "/store-settings/logo",
       formData
     );

     setForm((prev) => ({ ...prev, logo: data.url }));
     toast.success("Logo uploaded");
   } catch (err) {
     toast.error("Logo upload failed");
   } finally {
     setUploading(false);
   }
 };


  /* Save store settings */
const handleSave = async () => {
  setLoading(true);
  try {
    await axios.put("/store-settings", form);
    toast.success("Store settings updated");
  } catch (err) {
    toast.error("Failed to save settings");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Store Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your store branding and business details
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-xl border border-gray-200
                              flex items-center justify-center overflow-hidden bg-gray-100"
              >
                {form.logo ? (
                  <img
                    src={form.logo}
                    alt="Store Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">Logo</span>
                )}
              </div>

              <label
                className="absolute -bottom-2 left-1/2 -translate-x-1/2
                                bg-black text-white text-xs px-3 py-1 rounded-full
                                cursor-pointer hover:bg-gray-800 transition"
              >
                {uploading ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleLogoUpload}
                />
              </label>
            </div>

            <div>
              <h2 className="font-medium text-gray-900">Store Branding</h2>
              <p className="text-sm text-gray-500">
                Upload your brand logo and customize your store identity
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Store Name"
              name="storeName"
              value={form.storeName}
              onChange={handleChange}
            />

            <Select
              label="Currency"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              options={[
                { value: "NGN", label: "NGN (₦)" },
                { value: "USD", label: "USD ($)" },
                { value: "EUR", label: "EUR (€)" },
                { value: "GBP", label: "GBP (£)" },
              ]}
            />

            <Input
              label="Support Email"
              name="supportEmail"
              value={form.supportEmail}
              onChange={handleChange}
            />

            <Input
              label="Phone Number"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows="3"
              className="w-full rounded-lg border border-gray-300 px-4 py-2
                         focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium transition
                ${
                  loading
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Reusable Inputs */
function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-300 px-4 py-2
                   focus:ring-2 focus:ring-black focus:outline-none"
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        {...props}
        className="w-full rounded-lg border border-gray-300 px-4 py-2
                   focus:ring-2 focus:ring-black focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
