import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useProductStore } from "../stores/useProductStore.jsx";
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

  return (
    <>
      <motion.div
        className=" fixed top-0 left-0 right-0 flex z-40 items-center justify-center bg-gradient-to-br from-white via-gray-100 to-gray-300 py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute left-4 text-black">
          <GoBackButton />
        </div>
        <h2 className="text-2xl font-semibold  text-center">My Orders</h2>
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
          </div >
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

