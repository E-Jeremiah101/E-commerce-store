import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

let refreshTimeoutId = null;

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  setUser: (userData) => set({ user: userData }),

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.post("/auth/signup", { name, email, password });
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
      // set user first so guest-cart sync sees an authenticated user
      set({ user: res.data, loading: false });
      // after successful login, attempt to merge any guest cart into the user's server cart
      try {
        const { useCartStore } = await import("./useCartStore");
        await useCartStore.getState().syncGuestCart();
      } catch (e) {
        // non-fatal: log and continue
        console.debug("No guest cart to sync or sync failed:", e);
      }
      console.log("user is here", res.data);
      return { success: true, data: res.data };
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
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      // If access token expired, try refreshing
      if (error.response?.status === 401) {
        try {
          await axios.post("/auth/refresh-token");
          const response = await axios.get("/auth/profile");
          set({ user: response.data, checkingAuth: false });
          return;
        } catch (refreshError) {
          console.error("Auto refresh failed:", refreshError);
        }
      }

      // fallback: logout or clear user
      set({ checkingAuth: false, user: null });
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
      set({ user: null, checkingAuth: false });
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
