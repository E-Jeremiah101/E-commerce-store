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

    // 🚫 If no response or not a 401, just reject
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // 🚫 If the failed request was /auth/refresh-token itself, don't retry
    if (originalRequest.url.includes("/auth/refresh-token")) {
      return Promise.reject(error);
    }

    // 🚫 Prevent retrying more than once
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // 🚫 If no cookies exist, user is logged out — don't refresh
    const hasRefreshCookie = document.cookie.includes("refreshToken");
    if (!hasRefreshCookie) {
      console.warn("No refresh token cookie — user logged out.");
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => axiosInstance(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // attempt refresh
      await axiosInstance.post("/auth/refresh-token");
      processQueue(null);
      return axiosInstance(originalRequest); // retry original
    } catch (refreshError) {
      processQueue(refreshError, null);
      console.error("Refresh failed, clearing session.");
      // Optional: you can dispatch a logout action here
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
