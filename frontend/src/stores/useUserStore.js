import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
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
  AUDIT_WRITE: "audit:write",
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
      const userData = res.data;
      if (!userData.permissions || userData.permissions.length === 0) {
        userData.permissions = calculatePermissions(userData);
      }

      set({ user: userData, loading: false });
      try {
        const { useCartStore } = await import("./useCartStore");
        await useCartStore.getState().syncGuestCart();
      } catch (e) {
   
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

       try {
         const { useCartStore } = await import("./useCartStore");
         useCartStore.getState().clearCart();
       } catch (e) {
         console.debug("Error clearing cart on logout:", e);
       }
       
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

      if (!userData.permissions || userData.permissions.length === 0) {
        userData.permissions = calculatePermissions(userData);
      }

      set({ user: userData, checkingAuth: false });
    } catch (error) {

      if (error.response?.status === 401) {
        try {
          await axios.post("/auth/refresh-token");
          const response = await axios.get("/auth/profile");
          const userData = response.data;

          if (!userData.permissions || userData.permissions.length === 0) {
            userData.permissions = calculatePermissions(userData);
          }

          set({ user: userData, checkingAuth: false });
          return;
        } catch (refreshError) {
          console.error("Auto refresh failed:", refreshError);
          if (refreshError.response?.status === 401) {
            set({ checkingAuth: false, user: null });
            return;
          }

          set({ checkingAuth: false });
          return;
        }
      }

      console.debug(
        "checkAuth: non-auth error, keeping user in state:",
        error?.message || error
      );
      set({ checkingAuth: false });
    }
  },

  refreshToken: async () => {

    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {

      if (error.response?.status === 401) {
        set({ user: null, checkingAuth: false });
      } else {

        set({ checkingAuth: false });
      }
      throw error;
    }
  },

  startTokenRefreshTimer: async () => {

    if (refreshTimeoutId) clearTimeout(refreshTimeoutId);

    const refreshEveryMs = 4 * 60 * 1000; 

    const scheduleRefresh = async () => {
      try {
        await axios.post("/auth/refresh-token");
        console.log(
          " Access token refreshed automatically at",
          new Date().toLocaleTimeString()
        );

        refreshTimeoutId = setTimeout(scheduleRefresh, refreshEveryMs);
      } catch (error) {
        console.error("Auto token refresh failed:", error.message);
        clearTimeout(refreshTimeoutId);
      }
    };

    refreshTimeoutId = setTimeout(scheduleRefresh, refreshEveryMs);
  },

  stopTokenRefreshTimer: () => {
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
      console.log("Token refresh timer stopped");
    }
  },
}));