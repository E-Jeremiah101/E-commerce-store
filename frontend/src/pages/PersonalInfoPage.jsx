import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";
import { Check, User, Phone, Mail, Lock, Loader, Home } from "lucide-react";
import GoBackButton from "../components/GoBackButton";

const PersonalInfoPage = () => {
    const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(true);

  // Fetch profile on mount
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
                { label: "Home", address: "", isDefault: true },
                { label: "Work", address: "", isDefault: false },
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

  // Handle save
  const handleSave = async () => {
    if (!user) return;

    const defaultPhone = user.phones?.find((p) => p.isDefault);
    const defaultAddress = user.addresses?.find((a) => a.isDefault);

    if (!defaultPhone?.number?.trim() || !defaultAddress?.address?.trim()) {
      alert("⚠️ Please provide a default phone and address before saving.");
      return;
    }

    try {
      await axios.put("/api/users/me", {
        phones: user.phones,
        addresses: user.addresses,
      });
      alert("Profile updated ✅");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("❌ Failed to update profile.");
    }
  };

  // Ensure safe defaults for rendering
  const phones = user.phones || [
    { number: "", isDefault: true },
    { number: "", isDefault: false },
  ];
  const addresses = user.addresses || [
    { label: "Home", address: "", isDefault: true },
    { label: "Work", address: "", isDefault: false },
  ];
if(loading   || !user) return (
  <div className="flex justify-center items-center h-screen">
    <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
  </div>
);
 
  return (
    <>
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <motion.div
          className="sm:mx-auto sm:w-full sm:max-w-md fixed top-0 left-0 right-0  flex items-center justify-center bg-white  z-40 py-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute left-4 text-black">
            <GoBackButton  />
          </div>
          <span className=" text-center text-xl  text-gray-900 tracking-widest">
            Personal Info
          </span>
        </motion.div>

        <motion.div
          className=" w-full mt-8 md:mx-auto md:w-full md:max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className=" py-8 px-4 md:shadow  sm:rounded-lg sm:px-10">
            <form className="space-y-6">
              {/* name */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-4">
                  Full name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    readOnly
                    value={user.name}
                    className="block w-full px-4 py-4  pl-10 rounded-md shadow-lg focus:outline-none text-gray-800 "
                  />
                  <div className="absolute inset-y-0 right-3 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                </div>
              </div>
              {/* email */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-4">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                  <input
                    value={user.email}
                    readOnly
                    className="block w-full px-4 py-4  pl-10  rounded-md shadow-lg focus:outline-none text-gray-800"
                  />
                  <div className="absolute inset-y-0 right-3 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                </div>
              </div>
              {/* Password */}
              {phones.map((p, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-800 mb-4">
                    Phone Number
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your Phone Number "
                      value={p.number}
                      onChange={(e) => {
                        const updated = [...phones];
                        updated[i].number = e.target.value;
                        setUser({ ...user, phones: updated });
                      }}
                      className="block w-full px-4 py-4  pl-10 bg-gray-100 rounded-md shadow-sm focus:outline-none text-gray-800 "
                    />

                    <div></div>
                  </div>

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
                    <span className="ml-2 text-xs w-4 h-4 rounded-full border-2 border-gray-400 peer-checked:border-black peer-checked:bg-black"></span>
                    <span className="ml-2 text-xs">Default</span>
                  </label>
                </div>
              ))}

              {addresses.map((a, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-800 mb-4">
                    Delivery Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Home
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <input
                      value={a.address}
                      onChange={(e) => {
                        const updated = [...addresses];
                        updated[i].address = e.target.value;
                        setUser({ ...user, addresses: updated });
                      }}
                      className="block w-full px-4 py-4 pl-10 bg-gray-100 rounded-md shadow-sm focus:outline-none text-gray-800 placeholder-gray-400  "
                      placeholder="Enter your Address "
                    />
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
                    <span className="ml-2 text-xs w-4 h-4 rounded-full border-2 border-gray-400 peer-checked:border-black peer-checked:bg-black"></span>
                    <span className="ml-2 text-xs">Default</span>
                  </label>
                </div>
              ))}

              <button
                onClick={handleSave}
                className="w-full flex mt-10 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 duration-150 ease-in-out disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader
                      className="mr-2 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    Loading...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 w-5 " aria-hidden="true" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default PersonalInfoPage;