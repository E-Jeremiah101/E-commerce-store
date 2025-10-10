import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard.jsx";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const PeopleAlsoBought = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await axios.get("/products/recommendations");
        setRecommendations(res.data);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "An error occured while fetching recommendations"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecommendations();
  }, []);
  if (isLoading) return (
    <div className="flex justify-center items-center h-40">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
    </div>
  );
  return (
    <div className="mt-20">
      <h3 className="text-1xl font-semibold text-black tracking-wider">
        You may also like
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default PeopleAlsoBought