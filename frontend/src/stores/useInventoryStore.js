import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useInventoryStore = create((set, get) => ({
  // State
  activeTab: "dashboard",
  loading: false,
  dashboardData: null,
  stockLevels: [],
  lowStockAlerts: [],
  reorderSuggestions: [],
  inventoryValuation: null,
  stockHistory: [],
  inventoryAging: [],
  inventoryByLocation: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    search: "",
    category: "",
    lowStock: false,
    status: "",
    sortBy: "name",
    sortOrder: "asc",
  },

  // Actions

  // 📊 Get Dashboard Data
  fetchDashboard: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/inventory/dashboard");
      set({ dashboardData: res.data, loading: false });
      return res.data;
    } catch (error) {
      console.error("Error fetching inventory dashboard:", error);
      toast.error("Failed to load inventory dashboard");
      set({ loading: false });
      throw error;
    }
  },

  // 📦 Get Stock Levels
  fetchStockLevels: async (page = 1, filters = {}) => {
    set({ loading: true });
    try {
      const params = {
        page,
        limit: 20,
        includeVariants: "true",
        ...filters,
        ...get().filters,
      };

      console.log("📡 Fetching stock levels with params:", params);

      const res = await axios.get("/inventory/stock-levels", { params });

      console.log("✅ Stock levels response:", res.data);
      console.log("📦 First product in response:", res.data.stockLevels[0]);

      set({
        stockLevels: res.data.stockLevels,
        pagination: res.data.pagination,
        loading: false,
      });

      return res.data;
    } catch (error) {
      console.error("❌ Error fetching stock levels:", error);
      toast.error("Failed to load stock levels");
      set({ loading: false });
      throw error;
    }
  },

  
  // In your store, rename fetchLowStockAlerts to fetchAllAlerts

  // 🚨 Get Low Stock Alerts
  fetchLowStockAlerts: async (threshold = 10) => {
    set({ loading: true });
    try {
      const res = await axios.get("/inventory/low-stock", {
        params: { threshold },
      });

      set({
        lowStockAlerts: res.data.alerts,
        loading: false,
      });

      return res.data;
    } catch (error) {
      console.error("Error fetching low stock alerts:", error);
      toast.error("Failed to load low stock alerts");
      set({ loading: false });
      throw error;
    }
  },

  fetchInventoryAging: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/inventory/aging-report");
      set({
        inventoryAging: res.data,
        loading: false,
      });
      return res.data;
    } catch (error) {
      console.error("Error fetching inventory aging:", error);
      toast.error("Failed to load aging report");
      set({ loading: false });
      throw error;
    }
  },

  // 🔄 Adjust Stock
  adjustStock: async (productId, adjustmentData) => {
    set({ loading: true });
    try {
      const res = await axios.post(
        `/inventory/adjust/${productId}`,
        adjustmentData
      );

      toast.success("Stock adjusted successfully");

      // Refresh relevant data
      const { activeTab } = get();
      if (activeTab === "stock-levels") {
        get().fetchStockLevels(get().pagination.currentPage);
      }
      if (activeTab === "low-stock") {
        get().fetchLowStockAlerts();
      }

      set({ loading: false });
      return res.data;
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error(error.response?.data?.message || "Failed to adjust stock");
      set({ loading: false });
      throw error;
    }
  },

  // 📈 Get Stock History
  fetchStockHistory: async (productId = null, page = 1) => {
    set({ loading: true });
    try {
      const params = {
        page,
        limit: 20,
        ...(productId && { productId }),
      };

      const res = await axios.get("/inventory/history", { params });

      set({
        stockHistory: res.data.history,
        pagination: res.data.pagination,
        loading: false,
      });

      return res.data;
    } catch (error) {
      console.error("Error fetching stock history:", error);
      toast.error("Failed to load stock history");
      set({ loading: false });
      throw error;
    }
  },

  // 📍 Get Inventory by Location
  fetchInventoryByLocation: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/inventory/locations");

      set({
        inventoryByLocation: res.data.locations,
        loading: false,
      });

      return res.data;
    } catch (error) {
      console.error("Error fetching inventory by location:", error);
      toast.error("Failed to load location data");
      set({ loading: false });
      throw error;
    }
  },

  // 📋 Get Reorder Suggestions
  fetchReorderSuggestions: async (threshold = 15) => {
    set({ loading: true });
    try {
      const res = await axios.get("/inventory/reorder-suggestions", {
        params: { threshold },
      });

      set({
        reorderSuggestions: res.data.suggestions,
        loading: false,
      });

      return res.data;
    } catch (error) {
      console.error("Error fetching reorder suggestions:", error);
      toast.error("Failed to load reorder suggestions");
      set({ loading: false });
      throw error;
    }
  },

  // 💰 Get Inventory Valuation
  fetchInventoryValuation: async (groupBy = "category") => {
    set({ loading: true });
    try {
      const res = await axios.get("/inventory/valuation", {
        params: { groupBy },
      });

      set({
        inventoryValuation: res.data,
        loading: false,
      });

      return res.data;
    } catch (error) {
      console.error("Error fetching inventory valuation:", error);
      toast.error("Failed to load inventory valuation");
      set({ loading: false });
      throw error;
    }
  },

  // 📤 Bulk Update Stock
  bulkUpdateStock: async (updates) => {
    set({ loading: true });
    try {
      const res = await axios.post("/inventory/bulk-adjust", { updates });

      if (res.data.errorCount > 0) {
        toast.error(`Completed with ${res.data.errorCount} errors`);
      } else {
        toast.success(`Updated ${res.data.successCount} products successfully`);
      }

      // Refresh data
      get().fetchStockLevels(get().pagination.currentPage);
      get().fetchDashboard();

      set({ loading: false });
      return res.data;
    } catch (error) {
      console.error("Error in bulk update:", error);
      toast.error("Failed to perform bulk update");
      set({ loading: false });
      throw error;
    }
  },

  // 🎛️ Update Filters
  updateFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  // 🗑️ Clear Filters
  clearFilters: () => {
    set({
      filters: {
        search: "",
        category: "",
        lowStock: false,
        status: "",
        sortBy: "name",
        sortOrder: "asc",
      },
    });
  },

  getInventoryStats: () => {
    const { stockLevels, lowStockAlerts } = get();

    const totalStockValue = stockLevels.reduce((sum, product) => {
      return sum + product.price * product.totalStock;
    }, 0);

    // Count products where status === "out"
    const outOfStockProductsCount = stockLevels.filter(
      (p) => p.status === "out"
    ).length;

    // Count all out of stock items (including variants) from alerts
    const outOfStockAlertsCount = lowStockAlerts.filter(
      (a) => a.status === "out"
    ).length;

    const lowStockCount = stockLevels.filter((p) => p.status === "low").length;
    const healthyStockCount = stockLevels.filter(
      (p) => p.status === "healthy"
    ).length;

    const urgentAlerts = lowStockAlerts.filter(
      (a) => a.status === "out" || (a.status === "low" && a.currentStock <= 5)
    ).length;

    return {
      totalStockValue,
      outOfStockCount: outOfStockAlertsCount, // Use alerts count for consistency
      outOfStockProductsCount, // Keep original count if needed elsewhere
      lowStockCount,
      healthyStockCount,
      urgentAlerts,
      totalProducts: stockLevels.length,
    };
  },

  // 🔍 Search Products
  searchInventory: async (query) => {
    set({ loading: true });
    try {
      const res = await axios.get("/inventory/search", {
        params: { q: query },
      });

      set({
        searchResults: res.data.results,
        loading: false,
      });

      return res.data;
    } catch (error) {
      console.error("Error searching inventory:", error);
      toast.error("Failed to search inventory");
      set({ loading: false });
      throw error;
    }
  },

  // 🎯 Set Active Tab (for UI state)
  setActiveTab: (tab) => set({ activeTab: tab }),

  // 🔄 Reset State
  resetInventoryState: () => {
    set({
      dashboardData: null,
      stockLevels: [],
      lowStockAlerts: [],
      reorderSuggestions: [],
      inventoryValuation: null,
      stockHistory: [],
      inventoryByLocation: [],
      loading: false,
    });
  },
  // Add these to your store actions
  slashProductPrice: async (productId, newPrice, reason = "") => {
    set({ loading: true });
    try {
      console.log("🔄 [STORE] Slashing price for product:", productId);
      console.log(
        "🔄 [STORE] Request URL:",
        `/products/${productId}/price/slash`
      );

      const res = await axios.patch(`/products/${productId}/price/slash`, {
        newPrice: parseFloat(newPrice),
        reason,
      });

      console.log("✅ [STORE] Price slash response:", res.data);
      toast.success("Price slashed successfully!");

      // Update the product in stockLevels
      set((state) => ({
        stockLevels: state.stockLevels.map((product) =>
          product.id === productId
            ? {
                ...product,
                price: res.data.product.price,
                previousPrice: res.data.product.previousPrice,
                isPriceSlashed: res.data.product.isPriceSlashed,
                discountPercentage: res.data.product.discountPercentage,
              }
            : product
        ),
      }));

      set({ loading: false });
      return res.data;
    } catch (error) {
      console.error("❌ [STORE] Error slashing price:", error);
      console.error("❌ [STORE] Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to slash price");
      set({ loading: false });
      throw error;
    }
  },

  resetProductPrice: async (productId, reason = "") => {
    set({ loading: true });
    try {
      console.log("🔄 [STORE] Resetting price for product:", productId);

      const res = await axios.patch(`/products/${productId}/price/reset`, {
        reason,
      });

      toast.success("Price reset successfully!");

      // Update the product in stockLevels
      set((state) => ({
        stockLevels: state.stockLevels.map((product) =>
          product.id === productId
            ? {
                ...product,
                price: res.data.product.price,
                previousPrice: null,
                isPriceSlashed: false,
                discountPercentage: null,
              }
            : product
        ),
      }));

      set({ loading: false });
      return res.data;
    } catch (error) {
      console.error("❌ [STORE] Error resetting price:", error);
      toast.error(error.response?.data?.message || "Failed to reset price");
      set({ loading: false });
      throw error;
    }
  },

  updateProductPrice: async (productId, newPrice, reason = "") => {
    set({ loading: true });
    try {
      console.log("🔄 [STORE] Updating price for product:", productId);

      const res = await axios.patch(`/products/${productId}/price`, {
        newPrice: parseFloat(newPrice),
        reason,
      });

      toast.success("Price updated successfully!");

      // Update the product in stockLevels
      set((state) => ({
        stockLevels: state.stockLevels.map((product) =>
          product.id === productId
            ? {
                ...product,
                price: res.data.product.price,
                previousPrice: res.data.product.previousPrice,
                isPriceSlashed: res.data.product.isPriceSlashed,
                discountPercentage: res.data.product.discountPercentage,
              }
            : product
        ),
      }));

      set({ loading: false });
      return res.data;
    } catch (error) {
      console.error("❌ [STORE] Error updating price:", error);
      toast.error(error.response?.data?.message || "Failed to update price");
      set({ loading: false });
      throw error;
    }
  },
}));
