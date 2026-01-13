import axios from "axios";
const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "/api" : "/api",
  withCredentials: true,
});

console.log(
  "Axios Instance configured with baseURL:",
  axiosInstance.defaults.baseURL
);
console.log("NODE_ENV:", process.env.NODE_ENV);

axiosInstance.defaults.timeout = 35000;

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

    if (
      error.code === "NETWORK_ERROR" ||
      error.code === "ECONNABORTED" ||
      !error.response
    ) {
      console.warn("Network error detected:", error.message);

      return Promise.reject(error);
    }

    if (error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest.url.includes("/auth/refresh-token")) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    const hasRefreshCookie = document.cookie.includes("refreshToken");
    if (!hasRefreshCookie) {
      console.warn("No refresh token cookie found — user likely logged out.");
      return Promise.reject(error);
    }

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
      const { data } = await axiosInstance.post(
        "/auth/refresh-token",
        {},
        {
          timeout: 10000,
        }
      );
      processQueue(null);

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
