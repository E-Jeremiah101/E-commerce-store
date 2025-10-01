import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.mode === "development" ? "http://localhost:5000/api" : "/api",
    withCredentials: true, //send cookies to server
});

// Intercept 401 errors
axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        await axiosInstance.post("/auth/refresh-token");
        return api(err.config); // retry original request
      } catch (refreshError) {
        console.error("Refresh failed, logging out");
        // optional: redirect to login
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;