
import { BarChart, PlusCircle, ShoppingBasket, Package } from "lucide-react";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import AnalyticsTab from "../components/AnalyticsTab.jsx";
import ProductsList from "../components/ProductsList.jsx";
import CreateProductForm from "../components/CreateProductForm.jsx";
import AdminOrdersPage from "../components/AdminOrder.jsx";
import AllUsers from "../components/AllUsers.jsx";
import { useProductStore } from "../stores/useProductStore.jsx";
import AdminRefundsTab from "../components/AdminRefundsTab.jsx";
import GoBackButton from "../components/GoBackButton";
const tabs = [
  { id: "create", label: "Create Product", icon: PlusCircle },
  { id: "products", label: "Products", icon: ShoppingBasket },
  { id: "analytics", label: "Analytics", icon: BarChart },
  { id: "AdminOrder", label: "Orders", icon: Package },
  { id: "AdminRefunds", label: "Refund Request", icon: Package },
  { id: "AllUsers", label: "Users", icon: Package },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("products");
  const { fetchAllProducts } = useProductStore();

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);
  return (
    <>
      <motion.div
        className="sm:mx-auto  fixed top-0 left-0 right-0   z-90  "
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className=" flex justify-center align-middle text-black py-5 bg-gradient-to-br from-white via-gray-100 to-gray-300 ">
          <div className="absolute left-5">
            <GoBackButton />
          </div>
          <span className=" flex  text-center text-xl  text-gray-900 tracking-widest">
          Admin Dashboard
        </span>
        </div>
        
      </motion.div>
      <div className="  bg-gradient-to-br from-white via-gray-100 to-gray-300  flex-2 md:flex md:h-[100vh] md:w-full px-2 md:mx-auto   md:overflow-hidden -10          min-h-screen  mt-19">
        
        <div className="hidden md:flex  w-1/6 bg-gray-100  flex-shrink-0 ">
          <ul className="hidden space-y-5 md:flex flex-col">
            {tabs.map((tab) => (
              <li
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-2 py-2 mx-2 rounded-md transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "bg-yellow-700 text-white"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile view */}
        <div className=" md:hidden relative z-10 container mx-auto px-4 py-16">
          <div className="md:hidden flex justify-center mb-8 overflow-auto no-scroll">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 mx-2 rounded-md transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "bg-yellow-700 text-white"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scroll">
          {activeTab === "create" && <CreateProductForm />}
          {activeTab === "products" && <ProductsList />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "AdminOrder" && <AdminOrdersPage />}
          {activeTab === "AdminRefunds" && <AdminRefundsTab />}
          {activeTab === "AllUsers" && <AllUsers />}
        </div>
      </div>
    </>
  );
};

export default AdminPage;
