// hooks/useApi.js
import { useState } from "react";
import axiosInstance from "../lib/axios";

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const callApi = async (method, url, data = null) => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance({
        method,
        url,
        data,
      });
      return response.data;
    } catch (error) {
      if (error.code === "NETWORK_ERROR" || !error.response) {
        setError("Network error - please check your connection");
        throw new Error("NETWORK_ERROR");
      } else if (error.response?.status === 401) {
        window.location.href = "/login";
        throw new Error("AUTH_ERROR");
      } else {
        setError(error.response?.data?.message || "Something went wrong");
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  return { callApi, loading, error, setError };
}
