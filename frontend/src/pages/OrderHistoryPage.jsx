import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useProductStore } from "../stores/useProductStore.js";
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import Ongoing from "../components/Ongoing.jsx";
import Delivered from "../components/Delivered.jsx";
import RefundTab from "../components/RefundTab.jsx";
import CanceledTab from "../components/CanceledTab.jsx";
import GoBackButton from "../components/GoBackButton";
const tabs = [
  { id: "ongoing", label: "Ongoing" },
  { id: "delivered", label: "Delivered" },
  { id: "refunded", label: "Refunded" },
  { id: "canceled", label: "Canceled" },
];

const OrderHistoryPage = () => {
  const [activeTab, setActiveTab] = useState("ongoing");
  const { settings } = useStoreSettings();

  return (
    <>
      <SEO
        title={`Order History | ${settings?.storeName || "Store"}`}
        description={`View and track all your orders at ${settings?.storeName}. Check order status, delivery details, and manage returns easily.`}
        image={settings?.logo}
        canonicalUrl={window.location.href}
      />
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
            <div className="flex items-center">
              <motion.div
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <GoBackButton />
              </motion.div>
            </div>

            {/* Page Title - Centered with subtle styling */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="flex flex-col items-center">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
                  My Orders
                </h2>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="min-h-screen relative overflow-hidden ">
        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="flex justify-center cursor-pointer  mt-6">
            {tabs.map((tab) => (
              <span
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 mx-2  transition-colors duration-200 ${
                  activeTab === tab.id
                    ? " text-black border-b-2"
                    : " text-black "
                }`}
              >
                {tab.label}
              </span>
            ))}
          </div>
          {activeTab === "ongoing" && <Ongoing />}
          {activeTab === "delivered" && <Delivered />}
          {activeTab === "refunded" && <RefundTab />}
          {activeTab === "canceled" && <CanceledTab />}
        </div>
      </div>
    </>
  );
};

export default OrderHistoryPage;
