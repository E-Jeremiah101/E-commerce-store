import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";
import { nigeriaLocations } from "../utils/nigeriaLocation";
import { Check, User, Phone, Mail, Lock, Loader, Home } from "lucide-react";
import GoBackButton from "../components/GoBackButton";
import { toast, ToastContainer } from "react-toastify";

const PersonalInfoPage = () => {
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get("/api/users/me");
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
                  landmark: "",
                  isDefault: true,
                },
                {
                  label: "Work",
                  state: "",
                  city: "",
                  lga: "",
                  landmark: "",
                  isDefault: false,
                },
              ],
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setUser]);

  const handleSave = async () => {

   
    if (!user) return;

     

    const defaultPhone = user.phones?.find((p) => p.isDefault);
    const defaultAddress = user.addresses?.find((a) => a.isDefault);
    

    if (
      !defaultPhone?.number?.trim() ||
      !defaultAddress?.state ||
      !defaultAddress?.city ||
      !defaultAddress?.lga
    ) {
      toast.error("Please add a valid phone and full address.");

      return;
    }

    try {
      setSaving(true);
      await axios.put("/api/users/me", {
        phones: user.phones,
        addresses: user.addresses,
      });
      
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
    }finally{
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
        className=" fixed top-0 left-0 right-0 flex z-40 items-center justify-center bg-gradient-to-br from-white via-gray-100 to-gray-300 py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute left-4 text-black">
          <GoBackButton />
        </div>
        <h2 className="text-2xl font-semibold text-center">
          Personal Information
        </h2>
      </motion.div>

      <motion.div
        className="w-full mt-8 md:mx-auto md:w-full md:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <ToastContainer position="top-center" autoClose={3000} />
        <div className="py-8 px-4 md:shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-4">
                First name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  readOnly
                  value={user.firstname}
                  className="block w-full px-4 py-4 pl-10 rounded-md shadow-lg focus:outline-none text-gray-800"
                />
                <div className="absolute inset-y-0 right-3 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Email */}
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-4">
                Last name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  readOnly
                  value={user.lastname}
                  className="block w-full px-4 py-4 pl-10 rounded-md shadow-lg focus:outline-none text-gray-800"
                />
                <div className="absolute inset-y-0 right-3 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-4">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  readOnly
                  value={user.email}
                  className="block w-full px-4 py-4 pl-10 rounded-md shadow-lg focus:outline-none text-gray-800"
                />
                <div className="absolute inset-y-0 right-3 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Phones */}
            {phones.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between align-middle mb-4">
                  <label className="block text-sm font-medium text-gray-800">
                    Phone Number
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
                    type="text"
                    placeholder="Enter your Phone Number"
                    value={p.number}
                    onChange={(e) => {
                      const updated = [...phones];
                      updated[i].number = e.target.value;
                      setUser({ ...user, phones: updated });
                    }}
                    className="block w-full px-4 py-4 pl-10 bg-gray-100 rounded-md shadow-sm focus:outline-none text-gray-800"
                  />
                </div>
              </div>
            ))}

            {/* Addresses */}
            {addresses.map((a, i) => (
              <div key={i}>
                <div className="flex justify-between align-middle mb-4">
                  <label className="block text-sm font-medium text-gray-800">
                    Delivery Address
                  </label>
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

                {/* STATE */}
                <select
                  value={a.state || ""}
                  onChange={(e) => {
                    const state = e.target.value;
                    const updated = [...addresses];
                    updated[i].state = state;
                    updated[i].city = "";
                    updated[i].lga = "";
                    setUser({ ...user, addresses: updated });
                  }}
                  className="w-full px-3 py-3 rounded-md bg-gray-100 border border-gray-300 focus:outline-none mb-2"
                >
                  <option value="">Select State</option>
                  {Object.keys(nigeriaLocations).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>

                {/* CITY */}
                <select
                  value={a.city || ""}
                  onChange={(e) => {
                    const city = e.target.value;
                    const updated = [...addresses];
                    updated[i].city = city;
                    updated[i].lga = "";
                    setUser({ ...user, addresses: updated });
                  }}
                  disabled={!a.state}
                  className="w-full px-3 py-3 rounded-md bg-gray-100 border border-gray-300 focus:outline-none mb-2"
                >
                  <option value="">Select City</option>
                  {a.state &&
                    Object.keys(nigeriaLocations[a.state].cities).map(
                      (city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      )
                    )}
                </select>

                {/* LGA */}
                <select
                  value={a.lga || ""}
                  onChange={(e) => {
                    const lga = e.target.value;
                    const updated = [...addresses];
                    updated[i].lga = lga;
                    setUser({ ...user, addresses: updated });
                  }}
                  disabled={!a.city}
                  className="w-full px-3 py-3 rounded-md bg-gray-100 border border-gray-300 focus:outline-none mb-2"
                >
                  <option value="">Select LGA</option>
                  {a.state &&
                    a.city &&
                    nigeriaLocations[a.state].cities[a.city].map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                </select>

                {/* LANDMARK */}
                <input
                  type="text"
                  placeholder="Enter Landmark (e.g., Near Shoprite, Ikeja)"
                  value={a.landmark || ""}
                  onChange={(e) => {
                    const updated = [...addresses];
                    updated[i].landmark = e.target.value;
                    setUser({ ...user, addresses: updated });
                  }}
                  className="w-full mt-2 px-3 py-3 rounded-md bg-gray-100 border border-gray-300 focus:outline-none"
                />
              </div>
            ))}

            {/* Save */}
            <button
              onClick={handleSave}
              type="button"
              className="w-full flex mt-10 justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 transition disabled:opacity-50"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader
                    className="mr-2 w-5 animate-spin"
                    aria-hidden="true"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 w-5" aria-hidden="true" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default PersonalInfoPage;
