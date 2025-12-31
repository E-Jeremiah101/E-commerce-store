import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

// Define permissions locally instead of importing from backend
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

// Helper function to calculate permissions
const calculatePermissions = (userData) => {
  let permissions = [];
  if (userData?.role === "admin" && userData?.adminType) {
    if (userData.adminType === "super_admin") {
      permissions = Object.values(LOCAL_PERMISSIONS);
    } else {
      permissions = LOCAL_ADMIN_ROLE_PERMISSIONS[userData.adminType] || [];
    }
  }
  return permissions;
};

let refreshTimeoutId = null;

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  setUser: (userData) => set({ user: userData }),

  signup: async ({ firstname, lastname, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.post("/auth/signup", {
        firstname,
        lastname,
        email,
        password,
      });
      set({ user: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      return { error: error.response?.data?.message || "An error occurred" };
    }
  },

  login: async (email, password) => {
    set({ loading: true });

    try {
      const res = await axios.post("/auth/login", { email, password });

      // Ensure permissions exist
      const userData = res.data;
      if (!userData.permissions || userData.permissions.length === 0) {
        userData.permissions = calculatePermissions(userData);
      }

      set({ user: userData, loading: false });

      // after successful login, attempt to merge any guest cart into the user's server cart
      try {
        const { useCartStore } = await import("./useCartStore");
        await useCartStore.getState().syncGuestCart();
      } catch (e) {
        // non-fatal: log and continue
        console.debug("No guest cart to sync or sync failed:", e);
      }
      console.log("user is here", userData);
      return { success: true, data: userData };
    } catch (error) {
      set({ loading: false });

      return {
        error: error.response?.data?.message || "An error occured, try again",
      };
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      set({ user: null });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred during logout"
      );
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/auth/profile");
      const userData = response.data;

      // Ensure permissions exist
      if (!userData.permissions || userData.permissions.length === 0) {
        userData.permissions = calculatePermissions(userData);
      }

      set({ user: userData, checkingAuth: false });
    } catch (error) {
      // If access token expired, try refreshing
      if (error.response?.status === 401) {
        try {
          await axios.post("/auth/refresh-token");
          const response = await axios.get("/auth/profile");
          const userData = response.data;

          // Ensure permissions exist
          if (!userData.permissions || userData.permissions.length === 0) {
            userData.permissions = calculatePermissions(userData);
          }

          set({ user: userData, checkingAuth: false });
          return;
        } catch (refreshError) {
          console.error("Auto refresh failed:", refreshError);
          // Refresh failed with an auth error -> clear user
          if (refreshError.response?.status === 401) {
            set({ checkingAuth: false, user: null });
            return;
          }
          // If refresh failed due to network or server error, don't log the user out here
          set({ checkingAuth: false });
          return;
        }
      }

      // For network errors or 5xx server errors we keep the current user in memory
      // and only stop the checking state. This avoids logging out users on transient failures.
      console.debug(
        "checkAuth: non-auth error, keeping user in state:",
        error?.message || error
      );
      set({ checkingAuth: false });
    }
  },

  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {
      // Only clear user if refresh token is invalid/unauthorized (401).
      if (error.response?.status === 401) {
        set({ user: null, checkingAuth: false });
      } else {
        // Network or server error: keep user in memory but stop checking
        set({ checkingAuth: false });
      }
      throw error;
    }
  },

  startTokenRefreshTimer: async () => {
    // Clear any previous timer
    if (refreshTimeoutId) clearTimeout(refreshTimeoutId);

    const refreshEveryMs = 4 * 60 * 1000; // 14 minutes

    const scheduleRefresh = async () => {
      try {
        await axios.post("/auth/refresh-token");
        console.log(
          " Access token refreshed automatically at",
          new Date().toLocaleTimeString()
        );

        // Schedule the next refresh AFTER this one succeeds
        refreshTimeoutId = setTimeout(scheduleRefresh, refreshEveryMs);
      } catch (error) {
        console.error("Auto token refresh failed:", error.message);
        clearTimeout(refreshTimeoutId);
      }
    };

    // Start the first scheduled refresh
    refreshTimeoutId = setTimeout(scheduleRefresh, refreshEveryMs);
  },

  // Stop the refresh timer (on logout or when user is null)
  stopTokenRefreshTimer: () => {
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
      console.log("Token refresh timer stopped");
    }
  },
}));