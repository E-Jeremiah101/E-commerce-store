
import { motion } from "framer-motion";
import { useState } from "react";
import { SEO } from "../components/SEO";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import Ongoing from "../components/Ongoing.jsx";
import Delivered from "../components/Delivered.jsx";
import RefundTab from "../components/RefundTab.jsx";
import CanceledTab from "../components/CanceledTab.jsx";
import GoBackButton from "../components/GoBackButton";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

const TABS = [
  { id: "ongoing", label: "Ongoing" },
  { id: "delivered", label: "Delivered" },
  { id: "refunded", label: "Refunded" },
  { id: "canceled", label: "Canceled" },
];

const OrderHistoryPageContent = () => {
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

      <div className="min-h-screen bg-neutral-50">
        {/* Sticky header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="sticky top-0 z-30 bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200/60"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex items-center h-16">
              <GoBackButton fallback="/" />

              <h1 className="absolute left-1/2 -translate-x-1/2 text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
                My Orders
              </h1>
            </div>
          </div>
        </motion.header>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        >
          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Order status"
            className="flex gap-1 p-1 bg-white border border-neutral-200 rounded-lg shadow-sm overflow-x-auto"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 whitespace-nowrap px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10 ${
                    isActive
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="mt-6">
            {activeTab === "ongoing" && <Ongoing />}
            {activeTab === "delivered" && <Delivered />}
            {activeTab === "refunded" && <RefundTab />}
            {activeTab === "canceled" && <CanceledTab />}
          </div>
        </motion.main>
      </div>
    </>
  );
};

export default function OrderHistoryPage() {
  return (
    <ErrorBoundary>
      <OrderHistoryPageContent />
    </ErrorBoundary>
  );
}