import axios from "axios"

const axiosInstance = axios.create({
  baseURL:
    import.meta.mode === "development" ? "http://localhost:5000/api" : "/api",
  withCredentials: true, // send cookies
});

// Default request timeout to avoid hanging requests in production
axiosInstance.defaults.timeout = 35000; // 30 seconds

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors separately
    if (
      error.code === "NETWORK_ERROR" ||
      error.code === "ECONNABORTED" ||
      !error.response
    ) {
      console.warn("Network error detected:", error.message);
      // For network errors, don't attempt token refresh - just reject
      return Promise.reject(error);
    }

    // Only handle 401 errors for token refresh
    if (error.response.status !== 401) {
      return Promise.reject(error);
    }

    //  Don't retry the refresh endpoint itself
    if (originalRequest.url.includes("/auth/refresh-token")) {
      return Promise.reject(error);
    }

    // Prevent infinite loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Check for refresh cookie
    const hasRefreshCookie = document.cookie.includes("refreshToken");
    if (!hasRefreshCookie) {
      console.warn("No refresh token cookie found — user likely logged out.");
      return Promise.reject(error);
    }

    // Handle refresh queue (so multiple requests wait for one refresh)
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return axiosInstance(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      
      // Add timeout and better error handling for refresh
      const { data } = await axiosInstance.post("/auth/refresh-token", {}, {
        timeout: 10000 // 10 second timeout for refresh
      });
      processQueue(null);

      // Try the original request again
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      
      if (
        refreshError.code === "NETWORK_ERROR" ||
        refreshError.code === "ECONNABORTED"
      ) {
        console.warn(
          "Network error during token refresh - preserving auth state"
        );
        // For network errors, don't treat as auth failure
        // Let the original request fail naturally
      } else {
        console.error(
          "Token refresh failed:",
          refreshError?.message || refreshError
        );
      }
      return Promise.reject(refreshError);
      
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
