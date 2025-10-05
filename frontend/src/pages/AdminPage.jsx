import { BarChart, PlusCircle, ShoppingBasket, Package } from "lucide-react";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import AnalyticsTab from "../components/AnalyticsTab.jsx";
import ProductsList from "../components/ProductsList.jsx";
import CreateProductForm from "../components/CreateProductForm.jsx";
import AdminOrdersPage from "../components/AdminOrder.jsx"
import { useProductStore } from "../stores/useProductStore.jsx";
import GoBackButton from "../components/GoBackButton";
const tabs = [
  { id: "create", label: "Create Product", icon: PlusCircle },
  { id: "products", label: "Products", icon: ShoppingBasket },
  { id: "analytics", label: "Analytics", icon: BarChart },
  { id: "AdminOrder", label: "Orders", icon: Package },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("create");
  const { fetchAllProducts } = useProductStore();

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);
  return (
    <>
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
                  Admin Dashboard
                </span>
              </motion.div>
      <div className="min-h-screen relative  mt-2">
        <div className="relative z-10 container mx-auto px-4 py-16">

          <div className="flex justify-center mb-8 ">
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

          {activeTab === "create" && <CreateProductForm />}
          {activeTab === "products" && <ProductsList />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "AdminOrder" && <AdminOrdersPage />}
        </div>
      </div>
    </>
  );
};

export default AdminPage;
