import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";
import {
  getAllStates,
  getCitiesByState,
  getLGAsByCity,
  getAreasByCity,
} from "../utils/nigerianLocations"; 
import { Check, User, Phone, Mail, Lock, Loader, MapPin } from "lucide-react";
import GoBackButton from "../components/GoBackButton";
import { toast, ToastContainer } from "react-toastify";

const PersonalInfoPage = () => {
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nigerianStates, setNigerianStates] = useState([]);

  // Load states on component mount
  useEffect(() => {
    const states = getAllStates();
    setNigerianStates(states);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get("/api/users/profile");
        setUser({
          ...data,
          phones: data.phones?.length
            ? data.phones
            : [
                { number: "", isDefault: true },
                { number: "", isDefault: false },
              ],
          addresses: data.addresses?.length
            ? data.addresses
            : [
                {
                  label: "Home",
                  state: "",
                  city: "",
                  lga: "",
                  area: "", // Added area field
                  landmark: "",
                  address: "", // Added detailed address field
                  isDefault: true,
                },
                {
                  label: "Work",
                  state: "",
                  city: "",
                  lga: "",
                  area: "",
                  landmark: "",
                  address: "",
                  isDefault: false,
                },
              ],
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setUser]);

  // Get cities for a selected state
  const getCityOptions = (state) => {
    if (!state) return [];
    return getCitiesByState(state);
  };

  // Get LGAs for a selected city
  const getLGAOptions = (state, city) => {
    if (!state || !city) return [];
    return getLGAsByCity(state, city);
  };

  // Get areas for a selected city
  const getAreaOptions = (state, city) => {
    if (!state || !city) return [];
    return getAreasByCity(state, city);
  };

  const handleSave = async () => {
    if (!user) return;

    const defaultPhone = user.phones?.find((p) => p.isDefault);
    const defaultAddress = user.addresses?.find((a) => a.isDefault);

    // Validate phone
    if (!defaultPhone?.number?.trim()) {
      toast.error("Please add a valid phone number.");
      return;
    }

    // Validate address
    if (
      !defaultAddress?.state ||
      !defaultAddress?.city ||
      !defaultAddress?.lga ||
      !defaultAddress?.address
    ) {
      toast.error("Please provide a complete delivery address.");
      return;
    }

    // Validate phone format (basic Nigerian format)
    const phoneRegex = /^(?:\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(defaultPhone.number.trim())) {
      toast.error(
        "Please enter a valid Nigerian phone number (e.g., 08012345678)"
      );
      return;
    }

    try {
      setSaving(true);

      const validateAddress = (address) => {
        const { state, city, lga } = address;

        // Check if state exists
        if (!nigerianStates.some((s) => s.value === state.toUpperCase())) {
          throw new Error(`Invalid state: ${state}`);
        }

        // Check if city exists in state
        const cities = getCityOptions(state.toUpperCase());
        if (!cities.includes(city)) {
          throw new Error(`Invalid city: ${city} for state: ${state}`);
        }

        // Check if LGA exists in city
        const lgas = getLGAOptions(state.toUpperCase(), city);
        if (!lgas.includes(lga)) {
          throw new Error(`Invalid LGA: ${lga} for city: ${city}`);
        }

        return true;
      };

      // Validate all addresses
      user.addresses.forEach(validateAddress);

      // Prepare data for API
      const updateData = {
        phones: user.phones.map((phone) => ({
          ...phone,
          number: phone.number.trim(),
        })),
        addresses: user.addresses.map((address) => ({
          ...address,
          // Ensure state is in correct format (capitalized)
          state: address.state.charAt(0).toUpperCase() + address.state.slice(1),
          city: address.city,
          lga: address.lga,
          landmark: address.landmark || "",
          address: address.address,
        })),
      };

      await axios.put("/api/users/update-profile", updateData);

      toast.success("Profile updated successfully!");

      // Refresh user data
      const { data } = await axios.get("/api/users/profile");
      setUser(data);
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  const phones = user.phones || [];
  const addresses = user.addresses || [];

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        className="fixed top-0 left-0 right-0 z-40 bg-white backdrop-blur-md"
        style={{ borderBottom: "none", boxShadow: "none" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Back Button - Left aligned */}
            <motion.div className="flex items-center">
              <motion.div
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <GoBackButton />
              </motion.div>
            </motion.div>

            {/* Page Title - Centered with subtle styling */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="flex flex-col items-center">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
                 Personal Information
                </h2>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="w-full mt-8 md:mx-auto md:w-full md:max-w-2xl" 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="py-8 px-4 md:shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                First name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  readOnly
                  value={user.firstname || ""}
                  className="block w-full px-4 py-4 pl-10 rounded-md shadow-lg focus:outline-none text-gray-800 bg-gray-50"
                />
                <div className="absolute inset-y-0 right-3 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Last name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  readOnly
                  value={user.lastname || ""}
                  className="block w-full px-4 py-4 pl-10 rounded-md shadow-lg focus:outline-none text-gray-800 bg-gray-50"
                />
                <div className="absolute inset-y-0 right-3 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  readOnly
                  value={user.email || ""}
                  className="block w-full px-4 py-4 pl-10 rounded-md shadow-lg focus:outline-none text-gray-800 bg-gray-50"
                />
                <div className="absolute inset-y-0 right-3 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Phones */}
            {phones.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between align-middle mb-2">
                  <label className="block text-sm font-medium text-gray-800">
                    Phone Number {i === 0 ? "(Primary)" : ""}
                  </label>
                  <label className="flex items-center mt-1">
                    <input
                      type="radio"
                      className="hidden peer"
                      checked={p.isDefault}
                      onChange={() => {
                        const updated = phones.map((ph, idx) => ({
                          ...ph,
                          isDefault: idx === i,
                        }));
                        setUser({ ...user, phones: updated });
                      }}
                    />
                    <span className="ml-2 text-xs w-3 h-3 rounded-full border-2 border-gray-400 peer-checked:border-black peer-checked:bg-black"></span>
                    <span className="ml-2 text-xs text-gray-700">Default</span>
                  </label>
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    type="tel"
                    placeholder="e.g., 08012345678 or +2348012345678"
                    value={p.number}
                    onChange={(e) => {
                      const updated = [...phones];
                      updated[i].number = e.target.value;
                      setUser({ ...user, phones: updated });
                    }}
                    className="block w-full px-4 py-4 pl-10 rounded-md border border-gray-300 focus:outline-none text-gray-800 focus:ring-2 focus:ring-black"
                  />
                </div>
  
              </div>
            ))}

            {/* Addresses */}
            {addresses.map((a, i) => (
              <div key={i} className="border-t pt-6">
                <div className="flex justify-between align-middle mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800">
                      {a.label || "Delivery"} Address{" "}
                      {i === 0 ? "(Primary)" : ""}
                    </label>
  
                  </div>
                  <label className="flex items-center mt-1">
                    <input
                      type="radio"
                      className="hidden peer"
                      checked={a.isDefault}
                      onChange={() => {
                        const updated = addresses.map((ad, idx) => ({
                          ...ad,
                          isDefault: idx === i,
                        }));
                        setUser({ ...user, addresses: updated });
                      }}
                    />
                    <span className="ml-2 text-xs w-3 h-3 rounded-full border-2 border-gray-400 peer-checked:border-black peer-checked:bg-black"></span>
                    <span className="ml-2 text-xs text-gray-700">Default</span>
                  </label>
                </div>

                {/* Address Type Label */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Label
                  </label>
                  <input
                    type="text"
                    value={a.label || (i === 0 ? "Home" : "Work")}
                    onChange={(e) => {
                      const updated = [...addresses];
                      updated[i].label = e.target.value;
                      setUser({ ...user, addresses: updated });
                    }}
                    className="w-full px-3 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    placeholder="e.g., Home, Work, Office"
                  />
                </div>

                {/* STATE */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <select
                    value={a.state || ""}
                    onChange={(e) => {
                      const state = e.target.value;
                      const updated = [...addresses];
                      updated[i].state = state;
                      updated[i].city = "";
                      updated[i].lga = "";
                      updated[i].area = "";
                      setUser({ ...user, addresses: updated });
                    }}
                    className="w-full px-3 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    required
                  >
                    <option value="">Select State</option>
                    {nigerianStates.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CITY */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <select
                    value={a.city || ""}
                    onChange={(e) => {
                      const city = e.target.value;
                      const updated = [...addresses];
                      updated[i].city = city;
                      // Auto-set first LGA when city is selected
                      const lgAs = getLGAsByCity(a.state, city);
                      updated[i].lga = lgAs.length > 0 ? lgAs[0] : "";
                      updated[i].area = "";
                      setUser({ ...user, addresses: updated });
                    }}
                    disabled={!a.state}
                    className="w-full px-3 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-50"
                    required
                  >
                    <option value="">Select City</option>
                    {a.state &&
                      getCityOptions(a.state).map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                  </select>
                </div>

                {/* LGA */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LGA  *
                  </label>
                  <select
                    value={a.lga || ""}
                    onChange={(e) => {
                      const updated = [...addresses];
                      updated[i].lga = e.target.value;
                      setUser({ ...user, addresses: updated });
                    }}
                    disabled={!a.city}
                    className="w-full px-3 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-50"
                    required
                  >
                    <option value="">Select LGA</option>
                    {a.state &&
                      a.city &&
                      getLGAOptions(a.state, a.city).map((lga) => (
                        <option key={lga} value={lga}>
                          {lga}
                        </option>
                      ))}
                  </select>
                </div>

                {/* AREA (Optional) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area/Neighborhood (Optional)
                  </label>
                  <select
                    value={a.area || ""}
                    onChange={(e) => {
                      const updated = [...addresses];
                      updated[i].area = e.target.value;
                      setUser({ ...user, addresses: updated });
                    }}
                    disabled={!a.city}
                    className="w-full px-3 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50"
                  >
                    <option value="">Select Area</option>
                    {a.state &&
                      a.city &&
                      getAreaOptions(a.state, a.city).map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    <option value="other">Other (specify in landmark)</option>
                  </select>
                </div>

                {/* LANDMARK */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Near Shoprite, Opposite GTBank, Close to Main Market"
                    value={a.landmark || ""}
                    onChange={(e) => {
                      const updated = [...addresses];
                      updated[i].landmark = e.target.value;
                      setUser({ ...user, addresses: updated });
                    }}
                    className="w-full px-3 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                {/* DETAILED ADDRESS */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-13 top-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      placeholder="House number, street name, building name, floor, etc."
                      value={a.address || ""}
                      onChange={(e) => {
                        const updated = [...addresses];
                        updated[i].address = e.target.value;
                        setUser({ ...user, addresses: updated });
                      }}
                      rows="3"
                      className="w-full px-3 py-3 pl-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This is where your delivery will be sent
                  </p>
                </div>
              </div>
            ))}

            {/* Save Button */}
            <div className="pt-6 border-t">
              <button
                onClick={handleSave}
                type="button"
                className="w-full flex justify-center items-center py-4 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader
                      className="mr-2 w-5 h-5 animate-spin"
                      aria-hidden="true"
                    />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 w-5 h-5" aria-hidden="true" />
                    Save All Changes
                  </>
                )}
              </button>
              <p className="text-xs text-center text-gray-500 mt-3">
                Your address determines delivery fees. Ensure it's accurate.
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default PersonalInfoPage;
