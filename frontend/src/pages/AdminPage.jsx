// import {
//   BarChart,
//   PlusCircle,
//   ShoppingBasket,
//   Package,
//   Headset,
//   RotateCcw,
//   CreditCard,
//   User,
//   FileText,
//   Warehouse,
//   Settings,
// } from "lucide-react";
// import React, { useEffect, useState } from "react";
// import AnalyticsTab from "../components/AnalyticsTab.jsx";
// import ProductsList from "../components/ProductsList.jsx";
// import CreateProductForm from "../components/CreateProductForm.jsx";
// import axios from "../lib/axios.js";
// import AdminOrdersPage from "../components/AdminOrder.jsx";
// import AllUsers from "../components/AllUsers.jsx";
// import { useProductStore } from "../stores/useProductStore.js";
// import { useUserStore } from "../stores/useUserStore.js";
// import AdminRefundsTab from "../components/AdminRefundsTab.jsx";
// import InventoryTab from "../components/InventoryTab.jsx";
// import Recovery from "../components/Recovery.jsx";
// import AuditLogsTab from "../components/AuditLogsTab.jsx";
// import Transactions from "../components/Transactions.jsx";
// import toast from "react-hot-toast";
// import StoreSettings from "../components/StoreSettings.jsx";
// import { useStoreSettings } from "../components/StoreSettingsContext.jsx";

// // Define constants at the top
// const STORAGE_KEY = "admin_active_tab";

// const tabs = [
//   { id: "create", label: "Create Product", icon: PlusCircle },
//   { id: "products", label: "Product List", icon: ShoppingBasket },
//   { id: "inventory", label: "Manage Inventory", icon: Warehouse },
//   { id: "analytics", label: "Analytics Report", icon: BarChart },
//   { id: "AdminOrder", label: "Orders", icon: Package },
//   { id: "AdminRefunds", label: "Refund", icon: RotateCcw },
//   { id: "AllUsers", label: "User Management", icon: User },
//   { id: "OrderRecovery", label: "Recovery", icon: Headset },
//   { id: "Transactions", label: "Transactions", icon: CreditCard },
//   { id: "audit", label: "Audit Logs", icon: FileText },
//   { id: "Settings", label: "Settings", icon: Settings },
// ];

// const clearCache = async () => {
//   try {
//     const response = await axios.delete("/products/cache/featured");
//     console.log(response.data.message);
//     toast.success("Cache cleared successfully!");
//   } catch (error) {
//     console.error("Error clearing cache:", error);
//     toast.error("Failed to clear cache");
//   }
// };


// const TAB_PERMISSIONS = {
//   PRODUCT_READ: "product:read",
//   PRODUCT_WRITE: "product:write",
//   ORDER_READ: "order:read",
//   ORDER_WRITE: "order:write",
//   REFUND_READ: "refund:read",
//   REFUND_WRITE: "refund:write",
//   RECOVERY_READ: "recovery:read",
//   RECOVERY_WRITE: "recovery:write",
//   USER_READ: "user:read",
//   USER_WRITE: "user:write",
//   AUDIT_READ: "audit:read",
//   SETTINGS_WRITE: "settings:write",
// };

// const LOCAL_ADMIN_ROLE_PERMISSIONS = {
//   product_manager: [
//     LOCAL_PERMISSIONS.PRODUCT_READ,
//     LOCAL_PERMISSIONS.PRODUCT_WRITE,
//   ],
//   order_manager: [
//     LOCAL_PERMISSIONS.ORDER_READ,
//     LOCAL_PERMISSIONS.ORDER_WRITE,
//     LOCAL_PERMISSIONS.RECOVERY_READ,
//     LOCAL_PERMISSIONS.RECOVERY_WRITE,
//   ],
//   customer_support: [LOCAL_PERMISSIONS.REFUND_READ],
//   supervisor: [
//     LOCAL_PERMISSIONS.PRODUCT_READ,
//     LOCAL_PERMISSIONS.ORDER_READ,
//     LOCAL_PERMISSIONS.REFUND_READ,
//     LOCAL_PERMISSIONS.AUDIT_READ,
//   ],
//   super_admin: Object.values(LOCAL_PERMISSIONS),
// };

// const AdminPage = () => {

//   const { settings } = useStoreSettings();
//   if (!settings) return null;
//     const { user } = useUserStore();

//   const permissions = user?.permissions || [];

//   const hasPermission = (perm) => permissions.includes(perm);
//   console.log("USER:", user);
//   console.log("PERMISSIONS:", permissions);

//   // Load active tab from localStorage on initial render
// //  const [activeTab, setActiveTab] = useState(() => {
// //    try {
// //      const savedTab = localStorage.getItem(STORAGE_KEY);
// //      const allowedTabIds = tabs
// //        .filter((tab) => hasPermission(TAB_PERMISSIONS[tab.id]))
// //        .map((tab) => tab.id);

// //      if (savedTab && allowedTabIds.includes(savedTab)) {
// //        return savedTab;
// //      }

// //      return allowedTabIds[0] || null;
// //    } catch {
// //      return null;
// //    }
// //  });

// const [activeTab, setActiveTab] = useState(null);

// useEffect(() => {
//   if (!activeTab && permissions.length > 0) {
//     const firstAllowedTab = tabs.find((tab) =>
//       hasPermission(TAB_PERMISSIONS[tab.id])
//     );
//     if (firstAllowedTab) {
//       setActiveTab(firstAllowedTab.id);
//     }
//   }
// }, [permissions, activeTab]);

//   const { fetchAllProducts } = useProductStore();


//   // Save active tab to localStorage whenever it changes
//   useEffect(() => {
//     try {
//       localStorage.setItem(STORAGE_KEY, activeTab);
//     } catch (error) {
//       console.error("Error saving to localStorage:", error);
//     }
//   }, [activeTab]);

//  useEffect(() => {
//    if (hasPermission("product:read")) {
//      fetchAllProducts();
//    }
//  }, [fetchAllProducts, permissions]);

//   const handleTabChange = (tabId) => {
//     setActiveTab(tabId);
//   };

//   const visibleTabs = tabs.filter((tab) => {
//     const permission = TAB_PERMISSIONS[tab.id];
//     return permission && hasPermission(permission);
//   });


//   return (
//     <div className="bg-gradient-to-br from-white via-gray-100 to-gray-300 flex-2 md:flex md:h-[100vh] md:w-full p md:mx-auto md:overflow-hidden -10 min-h-screen">
//       {/* Desktop sidebar */}
//       <div className="hidden md:flex w-1/6 bg-gray-700 pb-7 flex-shrink-0 overflow-auto no-scroll flex-col">
//         <div className="p-4 text-white">
//           <h2 className="text-lg font-semibold mb-4">Admin Dashboard</h2>
//           <p className="text-sm text-gray-300">
//             Welcome back, {user?.firstname || "Admin"}
//           </p>
//         </div>
//         <ul className="space-y-2 px-2">
//           {visibleTabs.map((tab) => (
//             <li
//               key={tab.id}
//               onClick={() => handleTabChange(tab.id)}
//               className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
//                 activeTab === tab.id
//                   ? "bg-yellow-600 text-white shadow-md"
//                   : "text-gray-200 hover:bg-gray-600 hover:text-white"
//               }`}
//             >
//               <tab.icon className="mr-3 h-5 w-5" />
//               <span className="text-sm font-medium">{tab.label}</span>
//             </li>
//           ))}
//         </ul>

//         {/* Clear Cache Button in Sidebar */}
//         <div className="mt-auto px-3 py-4">
//           <button
//             onClick={clearCache}
//             className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
//           >
//             Clear Featured Cache
//           </button>
//         </div>
//       </div>

//       {/* Mobile tabs */}
//       <div className="md:hidden bg-gray-800 py-3 px-2">
//         <div className="flex justify-between items-center px-2 mb-3">
//           <h2 className="text-white text-lg font-semibold">Admin Dashboard</h2>

//           <button
//             onClick={clearCache}
//             className="px-3 py-1 bg-blue-500 text-white text-xs rounded"
//           >
//             Clear Cache
//           </button>
//         </div>
//         <div className="flex overflow-x-auto no-scroll space-x-1">
//           {visibleTabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => handleTabChange(tab.id)}
//               className={`flex-shrink-0 flex items-center px-3 py-2 rounded-md transition-colors ${
//                 activeTab === tab.id
//                   ? "bg-yellow-600 text-white"
//                   : "bg-gray-700 text-gray-200 hover:bg-gray-600"
//               }`}
//             >
//               <tab.icon className="h-4 w-4 mr-1" />
//               <span className="text-xs font-medium whitespace-nowrap">
//                 {tab.label}
//               </span>
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Content area */}
//       <div className="flex-1 overflow-y-auto no-scroll">
//         {activeTab === "create" && hasPermission("product:write") && (
//           <CreateProductForm />
//         )}
//         {activeTab === "products" && hasPermission("product:read") && (
//           <ProductsList />
//         )}
//         {activeTab === "inventory" && hasPermission("product:write") && (
//           <InventoryTab />
//         )}

//         {activeTab === "analytics" && hasPermission("audit:read") && (
//           <AnalyticsTab />
//         )}

//         {activeTab === "AdminOrder" && hasPermission("order:read") && (
//           <AdminOrdersPage />
//         )}
//         {activeTab === "AdminRefunds" && hasPermission("refund:read") && (
//           <AdminRefundsTab />
//         )}
//         {activeTab === "OrderRecovery" && hasPermission("recovery:read") && (
//           <Recovery />
//         )}

//         {activeTab === "Transactions" && hasPermission("audit:read") && (
//           <Transactions />
//         )}
//         {activeTab === "audit" && hasPermission("audit:read") && (
//           <AuditLogsTab />
//         )}

//         {activeTab === "AllUsers" && hasPermission("user:read") && <AllUsers />}

//         {activeTab === "Settings" && hasPermission("settings:write") && (
//           <StoreSettings />
//         )}
//       </div>
//     </div>
//   );
// };

// export default AdminPage;
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
  Ticket,
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
import StoreSettings from "../components/StoreSettings.jsx";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import AdminCoupons from "../components/AdminCoupons.jsx";

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
  { id: "coupon", label: "Coupons", icon: Ticket },
  { id: "Settings", label: "Settings", icon: Settings },
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

// Define permissions locally
const LOCAL_PERMISSIONS = {
  PRODUCT_READ: "product:read",
  PRODUCT_WRITE: "product:write",
  ORDER_READ: "order:read",
  ORDER_WRITE: "order:write",
  REFUND_READ: "refund:read",
  REFUND_WRITE: "refund:write",
  RECOVERY_READ: "recovery:read",
  RECOVERY_WRITE: "recovery:write",
  COUPON_READ: "coupon_read",
  COUPON_WRITE: "coupon_write",
  USER_READ: "user:read",
  USER_WRITE: "user:write",
  AUDIT_READ: "audit:read",
  SETTINGS_WRITE: "settings:write",
};

const LOCAL_ADMIN_ROLE_PERMISSIONS = {
  product_manager: [
    LOCAL_PERMISSIONS.PRODUCT_READ,
    LOCAL_PERMISSIONS.PRODUCT_WRITE,
  ],
  order_manager: [
    LOCAL_PERMISSIONS.ORDER_READ,
    LOCAL_PERMISSIONS.ORDER_WRITE,
    LOCAL_PERMISSIONS.RECOVERY_READ,
    LOCAL_PERMISSIONS.RECOVERY_WRITE,
  ],
  customer_support: [
    LOCAL_PERMISSIONS.REFUND_READ,
    LOCAL_PERMISSIONS.RECOVERY_READ,
    LOCAL_PERMISSIONS.RECOVERY_WRITE,
  ],
  supervisor: [
    LOCAL_PERMISSIONS.PRODUCT_READ,
    LOCAL_PERMISSIONS.ORDER_READ,
    LOCAL_PERMISSIONS.REFUND_READ,
    LOCAL_PERMISSIONS.AUDIT_READ,
    LOCAL_PERMISSIONS.COUPON_READ,
  ],
  super_admin: Object.values(LOCAL_PERMISSIONS),
};

// Map tab IDs to required permissions
const TAB_PERMISSIONS = {
  create: LOCAL_PERMISSIONS.PRODUCT_WRITE,
  products: LOCAL_PERMISSIONS.PRODUCT_READ,
  inventory: LOCAL_PERMISSIONS.PRODUCT_WRITE,
  analytics: LOCAL_PERMISSIONS.AUDIT_READ,
  AdminOrder: LOCAL_PERMISSIONS.ORDER_READ,
  AdminRefunds: LOCAL_PERMISSIONS.REFUND_READ,
  OrderRecovery: LOCAL_PERMISSIONS.RECOVERY_READ,
  coupon: LOCAL_PERMISSIONS.COUPON_READ,
  Transactions: LOCAL_PERMISSIONS.AUDIT_READ,
  audit: LOCAL_PERMISSIONS.AUDIT_READ,
  AllUsers: LOCAL_PERMISSIONS.USER_READ,
  Settings: LOCAL_PERMISSIONS.SETTINGS_WRITE,
};

const AdminPage = () => {
  const { settings } = useStoreSettings();
  const { user } = useUserStore();

  // Calculate permissions if missing from user object
  const permissions = React.useMemo(() => {
    if (user?.permissions && user.permissions.length > 0) {
      return user.permissions;
    }

    // Fallback calculation using local definitions
    if (user?.role === "admin" && user.adminType) {
      if (user.adminType === "super_admin") {
        return Object.values(LOCAL_PERMISSIONS);
      } else {
        return LOCAL_ADMIN_ROLE_PERMISSIONS[user.adminType] || [];
      }
    }

    return [];
  }, [user]);

  const hasPermission = (perm) => permissions.includes(perm);

  console.log("USER:", user);
  console.log("PERMISSIONS:", permissions);

  const [activeTab, setActiveTab] = useState(() => {
    // Try to get saved tab from localStorage on initial render
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch (error) {
      return null;
    }
  });

  useEffect(() => {
    if (!activeTab && permissions.length > 0) {
      const firstAllowedTab = tabs.find((tab) =>
        hasPermission(TAB_PERMISSIONS[tab.id])
      );
      if (firstAllowedTab) {
        setActiveTab(firstAllowedTab.id);
      }
    }
  }, [permissions, activeTab]);

  const { fetchAllProducts } = useProductStore();

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (activeTab) {
      try {
        localStorage.setItem(STORAGE_KEY, activeTab);
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (hasPermission(LOCAL_PERMISSIONS.PRODUCT_READ)) {
      fetchAllProducts();
    }
  }, [fetchAllProducts, permissions]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const visibleTabs = tabs.filter((tab) => {
    const permission = TAB_PERMISSIONS[tab.id];
    return permission && hasPermission(permission);
  });

  if (!settings) return null;

  return (
    <div className="bg-gradient-to-br from-white via-gray-100 to-gray-300 flex-2 md:flex md:h-[100vh] md:w-full p md:mx-auto md:overflow-hidden -10 min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-1/6 bg-gray-700 pb-7 flex-shrink-0 overflow-auto no-scroll flex-col">
        <div className="p-4 text-white">
          <h2 className="text-lg font-semibold mb-4">
            {user.adminType.toUpperCase()}
          </h2>
          <p className="text-sm text-gray-300">
            Welcome back, {user?.firstname || "Admin"}
          </p>
        </div>
        <ul className="space-y-2 px-2">
          {visibleTabs.map((tab) => (
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
          <button
            onClick={clearCache}
            className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Clear Featured Cache
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden bg-gray-800 py-3 px-2">
        <div className="flex justify-between items-center px-2 mb-3">
          <h2 className="text-white text-lg font-semibold">
            {user.adminType.toUpperCase()}
          </h2>

          <button
            onClick={clearCache}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded"
          >
            Clear Cache
          </button>
        </div>
        <div className="flex overflow-x-auto no-scroll space-x-1">
          {visibleTabs.map((tab) => (
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
        {activeTab === "create" &&
          hasPermission(LOCAL_PERMISSIONS.PRODUCT_WRITE) && (
            <CreateProductForm />
          )}
        {activeTab === "products" &&
          hasPermission(LOCAL_PERMISSIONS.PRODUCT_READ) && <ProductsList />}
        {activeTab === "inventory" &&
          hasPermission(LOCAL_PERMISSIONS.PRODUCT_WRITE) && <InventoryTab />}
        {activeTab === "analytics" &&
          hasPermission(LOCAL_PERMISSIONS.AUDIT_READ) && <AnalyticsTab />}
        {activeTab === "AdminOrder" &&
          hasPermission(LOCAL_PERMISSIONS.ORDER_READ) && <AdminOrdersPage />}
        {activeTab === "AdminRefunds" &&
          hasPermission(LOCAL_PERMISSIONS.REFUND_READ) && <AdminRefundsTab />}
        {activeTab === "OrderRecovery" &&
          hasPermission(LOCAL_PERMISSIONS.RECOVERY_READ) && <Recovery />}
        {activeTab === "Transactions" &&
          hasPermission(LOCAL_PERMISSIONS.AUDIT_READ) && <Transactions />}
        {activeTab === "audit" &&
          hasPermission(LOCAL_PERMISSIONS.AUDIT_READ) && <AuditLogsTab />}
        {activeTab === "AllUsers" &&
          hasPermission(LOCAL_PERMISSIONS.USER_READ) && <AllUsers />}
        {activeTab === "coupon" &&
          hasPermission(LOCAL_PERMISSIONS.COUPON_READ) && <AdminCoupons />}
        {activeTab === "Settings" &&
          hasPermission(LOCAL_PERMISSIONS.SETTINGS_WRITE) && <StoreSettings />}
      </div>
    </div>
  );
};

export default AdminPage;