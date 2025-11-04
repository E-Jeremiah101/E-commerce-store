import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    import.meta.mode === "development" ? "http://localhost:5000/api" : "/api",
  withCredentials: true, // send cookies
});

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

    //  Ignore if no response or not a 401
    if (!error.response || error.response.status !== 401) {
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
      }).then((token) => {
        originalRequest.headers["Authorization"] = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
    } 

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axiosInstance.post("/auth/refresh-token");
      processQueue(null);

      // Try the original request again
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Optionally log out user if refresh fails
      console.error("Token refresh failed. Logging out user.");
      const { logout } = useUserStore.getState();
      await logout();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);


export default axiosInstance;
