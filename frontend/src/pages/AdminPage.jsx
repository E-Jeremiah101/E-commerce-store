import {
  BarChart,
  PlusCircle,
  ShoppingBasket,
  Package,
  Headset,
  RotateCcw,
  CreditCard,
  User,
  FileText,
  Warehouse,
  Settings,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import AnalyticsTab from "../components/AnalyticsTab.jsx";
import ProductsList from "../components/ProductsList.jsx";
import CreateProductForm from "../components/CreateProductForm.jsx";
import axios from "../lib/axios.js";
import AdminOrdersPage from "../components/AdminOrder.jsx";
import AllUsers from "../components/AllUsers.jsx";
import { useProductStore } from "../stores/useProductStore.js";
import { useUserStore } from "../stores/useUserStore.js";
import AdminRefundsTab from "../components/AdminRefundsTab.jsx";
import InventoryTab from "../components/InventoryTab.jsx";
import Recovery from "../components/Recovery.jsx";
import AuditLogsTab from "../components/AuditLogsTab.jsx";
import Transactions from "../components/Transactions.jsx";
import toast from "react-hot-toast";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import { Link } from "react-router-dom";

// Define constants at the top
const STORAGE_KEY = "admin_active_tab";

const tabs = [
  { id: "create", label: "Create Product", icon: PlusCircle },
  { id: "products", label: "Product List", icon: ShoppingBasket },
  { id: "inventory", label: "Manage Inventory", icon: Warehouse },
  { id: "analytics", label: "Analytics Report", icon: BarChart },
  { id: "AdminOrder", label: "Orders", icon: Package },
  { id: "AdminRefunds", label: "Refund", icon: RotateCcw },
  { id: "AllUsers", label: "User Management", icon: User },
  { id: "OrderRecovery", label: "Recovery", icon: Headset },
  { id: "Transactions", label: "Transactions", icon: CreditCard },
  { id: "audit", label: "Audit Logs", icon: FileText },
];

const clearCache = async () => {
  try {
    const response = await axios.delete("/products/cache/featured");
    console.log(response.data.message);
    toast.success("Cache cleared successfully!");
  } catch (error) {
    console.error("Error clearing cache:", error);
    toast.error("Failed to clear cache");
  }
};

const AdminPage = () => {

  const { settings } = useStoreSettings();
  if (!settings) return null;
  // Load active tab from localStorage on initial render
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = localStorage.getItem(STORAGE_KEY);
      // Validate that the saved tab exists in our tabs array
      const isValidTab = tabs.some((tab) => tab.id === savedTab);
      return isValidTab ? savedTab : "products"; // default to "products"
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return "products"; // fallback default
    }
  });

  const { fetchAllProducts } = useProductStore();
  const { user } = useUserStore();

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activeTab);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="bg-gradient-to-br from-white via-gray-100 to-gray-300 flex-2 md:flex md:h-[100vh] md:w-full p md:mx-auto md:overflow-hidden -10 min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-1/6 bg-gray-700 pb-7 flex-shrink-0 overflow-auto no-scroll flex-col">
        <div className="p-4 text-white">
          <h2 className="text-lg font-semibold mb-4">Admin Dashboard</h2>
          <p className="text-sm text-gray-300">
            Welcome back, {user?.firstname || "Admin"}
          </p>
        </div>
        <ul className="space-y-2 px-2">
          {tabs.map((tab) => (
            <li
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-yellow-600 text-white shadow-md"
                  : "text-gray-200 hover:bg-gray-600 hover:text-white"
              }`}
            >
              <tab.icon className="mr-3 h-5 w-5" />
              <span className="text-sm font-medium">{tab.label}</span>
            </li>
          ))}
        </ul>

        {/* Clear Cache Button in Sidebar */}
        <div className="mt-auto px-3 py-4">
          <Link to={"/store-settings"}>
            <Settings />
          </Link>

          <button
            onClick={clearCache}
            className="w-full flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Clear Featured Cache
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden bg-gray-800 py-3 px-2">
        <div className="flex justify-between items-center px-2 mb-3">
          <h2 className="text-white text-lg font-semibold">Admin Dashboard</h2>

          <Link to={"/store-settings"}>
            <Settings />
          </Link>

          <button
            onClick={clearCache}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded"
          >
            Clear Cache
          </button>
        </div>
        <div className="flex overflow-x-auto no-scroll space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-shrink-0 flex items-center px-3 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              <tab.icon className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto no-scroll">
        {activeTab === "create" && <CreateProductForm />}
        {activeTab === "products" && <ProductsList />}
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "AdminOrder" && <AdminOrdersPage />}
        {activeTab === "AdminRefunds" && <AdminRefundsTab />}
        {activeTab === "AllUsers" && <AllUsers />}
        {activeTab === "OrderRecovery" && <Recovery />}
        {activeTab === "Transactions" && <Transactions />}
        {activeTab === "audit" && <AuditLogsTab />}
      </div>
    </div>
  );
};

export default AdminPage;
