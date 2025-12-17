import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";
import {
  getAllStates,
  getLGAsByState,
} from "../../../backend/lib/nigerianLocations.js";

export default function StoreSettings() {
  const [form, setForm] = useState({
    storeName: "",
    logo: "",
    supportEmail: "",
    phoneNumber: "",
    currency: "NGN",
    warehouseLocation: {
      state: "EDO",
      city: "Benin City",
      lga: "Oredo",
      address: "",
      coordinates: { lat: null, lng: null },
    },
    shippingFees: {
      sameCity: 0,
      sameLGA: 0,
      sameState: 0,
      sameRegion: 0,
      southern: 0,
      northern: 0,
    },
  });

  const { settings } = useStoreSettings();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nigerianStates, setNigerianStates] = useState([]);
  const [lgaOptions, setLgaOptions] = useState([]);

  // ADD THIS FUNCTION - Logo Upload Handler
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await axios.post("/store-settings/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setForm((prev) => ({ ...prev, logo: data.url }));
      toast.success("Logo uploaded successfully");
    } catch (err) {
      console.error("Logo upload error:", err);
      toast.error("Logo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Fetch store settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get("/store-settings");
        setForm((prev) => ({
          ...prev,
          ...data,
          storeName: data.storeName || "",
          logo: data.logo || "",
          supportEmail: data.supportEmail || "",
          phoneNumber: data.phoneNumber || "",
          currency: data.currency || "NGN",
          warehouseLocation: {
            ...prev.warehouseLocation,
            ...(data.warehouseLocation || {}),
          },
          shippingFees: {
            ...prev.shippingFees,
            ...(data.shippingFees || {}),
          },
        }));

        const states = getAllStates();
        setNigerianStates(states);

        // Update LGA options based on selected state
        if (data.warehouseLocation?.state) {
          const lgas = getLGAsByState(data.warehouseLocation.state);
          setLgaOptions(lgas);
        } else {
          // Default to Edo LGAs
          const lgas = getLGAsByState("EDO");
          setLgaOptions(lgas);
        }
      } catch (err) {
        toast.error("Failed to load store settings");
      }
    };

    fetchSettings();
  }, []);

  // Fetch states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const { data } = await axios.get("/locations/states");
        setNigerianStates(data);
      } catch (err) {
        console.error("Failed to fetch states:", err);
      }
    };
    fetchStates();
  }, []);

  // Handle warehouse location state change
 const handleWarehouseStateChange = async (e) => {
   const newState = e.target.value;
   const lgas = getLGAsByState(newState);

   try {
     const { data } = await axios.get(`/locations/lgas/${newState}`);
     setLgaOptions(data);

     setForm((prev) => ({
       ...prev,
       warehouseLocation: {
         ...prev.warehouseLocation,
         state: newState,
         lga: lgas.length > 0 ? lgas[0] : "",
       },
     }));

     setLgaOptions(lgas);
   } catch (err) {
     console.error("Failed to fetch LGAs:", err);
   }
 };

  // Handle nested changes
  const handleNestedChange = (e) => {
    const [parent, child, subChild] = e.target.name.split(".");

    if (subChild) {
      // For nested objects like warehouseLocation.coordinates.lat
      setForm({
        ...form,
        [parent]: {
          ...form[parent],
          [child]: {
            ...form[parent][child],
            [subChild]:
              e.target.type === "number"
                ? parseFloat(e.target.value)
                : e.target.value,
          },
        },
      });
    } else if (child) {
      // For one-level nested objects
      setForm({
        ...form,
        [parent]: {
          ...form[parent],
          [child]:
            e.target.type === "number"
              ? Number(e.target.value)
              : e.target.value,
        },
      });
    } else {
      // For top-level fields
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  // Handle save
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
            Manage your store branding, warehouse location, and shipping fees
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
          {/* Logo Section - Keep existing */}

          {/* Basic Info Section - Keep existing */}
          {/* Logo Section */}
          {/* Logo Section */}
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
                  <span className="text-gray-400 text-sm">
                    {uploading ? "Uploading..." : "Logo"}
                  </span>
                )}
              </div>

              <label
                className={`absolute -bottom-2 left-1/2 -translate-x-1/2
                text-xs px-3 py-1 rounded-full cursor-pointer transition
                ${
                  uploading
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {uploading ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            <div>
              <h2 className="font-medium text-gray-900">Store Branding</h2>
              <p className="text-sm text-gray-500">
                Upload your brand logo and customize your store identity
              </p>
              {uploading && (
                <p className="text-xs text-blue-500 mt-1">Uploading logo...</p>
              )}
            </div>
          </div>

          {/* Basic Store Info Section */}
          <div className="border-t pt-8">
            <h3 className="font-medium text-lg mb-4">Store Information</h3>
            <p className="text-sm text-gray-500 mb-6">
              Basic store details and contact information
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Store Name"
                name="storeName"
                value={form.storeName}
                onChange={handleNestedChange}
                placeholder="e.g., My Awesome Store"
                required
              />

              <Select
                label="Currency"
                name="currency"
                value={form.currency}
                onChange={handleNestedChange}
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
                onChange={handleNestedChange}
                type="email"
                placeholder="support@example.com"
              />

              <Input
                label="Phone Number"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleNestedChange}
                type="tel"
                placeholder="+234 800 000 0000"
              />
            </div>
          </div>

          {/* Warehouse Location Section */}
          <div className="border-t pt-8">
            <h3 className="font-medium text-lg mb-4">Warehouse Location</h3>
            <p className="text-sm text-gray-500 mb-6">
              Set your warehouse location for dynamic shipping calculations
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  name="warehouseLocation.state"
                  value={form.warehouseLocation?.state || "EDO"}
                  onChange={handleWarehouseStateChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
                >
                  {nigerianStates.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LGA
                </label>
                <select
                  name="warehouseLocation.lga"
                  value={form.warehouseLocation?.lga || ""}
                  onChange={handleNestedChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
                >
                  {lgaOptions.map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="warehouseLocation.city"
                  value={form.warehouseLocation?.city || ""}
                  onChange={handleNestedChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="e.g., Benin City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="warehouseLocation.address"
                  value={form.warehouseLocation?.address || ""}
                  onChange={handleNestedChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="Detailed address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="warehouseLocation.coordinates.lat"
                  value={form.warehouseLocation?.coordinates?.lat || ""}
                  onChange={handleNestedChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="6.335"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="warehouseLocation.coordinates.lng"
                  value={form.warehouseLocation?.coordinates?.lng || ""}
                  onChange={handleNestedChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="5.6037"
                />
              </div>
            </div>
          </div>

          {/* Shipping Fees Section */}
          {/* Shipping Fees Section */}
          <div className="border-t pt-8">
            <h3 className="font-medium text-lg mb-4">
              Shipping Fees {formatPrice("", settings?.currency)}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Fees are dynamically calculated based on warehouse location
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Same City"
                name="shippingFees.sameCity"
                value={form.shippingFees?.sameCity || 0}
                onChange={handleNestedChange}
                type="number"
              />

              <Input
                label="Same LGA"
                name="shippingFees.sameLGA"
                value={form.shippingFees?.sameLGA || 0}
                onChange={handleNestedChange}
                type="number"
              />

              <Input
                label="Same State"
                name="shippingFees.sameState"
                value={form.shippingFees?.sameState || 0}
                onChange={handleNestedChange}
                type="number"
              />

              <Input
                label="Same Region"
                name="shippingFees.sameRegion"
                value={form.shippingFees?.sameRegion || 0}
                onChange={handleNestedChange}
                type="number"
              />

              <Input
                label="Southern States"
                name="shippingFees.southern"
                value={form.shippingFees?.southern || 0}
                onChange={handleNestedChange}
                type="number"
              />

              <Input
                label="Northern States"
                name="shippingFees.northern"
                value={form.shippingFees?.northern || 0}
                onChange={handleNestedChange}
                type="number"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6">
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
