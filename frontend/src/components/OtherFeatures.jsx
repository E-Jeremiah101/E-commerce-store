import React, { useEffect, useState } from "react";
import "../components/Otherfeatures.css";
import axios from "../lib/axios";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal.jsx";
const OtherFeatures = () => {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await axios.get("/products/recommendations");
        setRecommendations(res.data);
      } catch (error) {
        console.log(
          error.response?.data?.message ||
            "An error occured while fetching recommendations"
        );
      }
    };
    fetchRecommendations();
  }, []);

  // Fallback images in case we don't have enough recommendations
  const fallbackImages = [
    "/hat-fashion.jpg",
    "/pack-bag.jpg",
    "/jacket-nice.jpg",
    "/order-now.jpg",
    "/sport2.jpg",
    "/glassess.jpg",
    "/brown-jack.jpg",
    "/white-snick.jpg",
  ];

  // Combine recommendations with fallbacks
  const displayItems =
    recommendations.length >= 8
      ? recommendations.slice(0, 8)
      : Array.from({ length: 8 }).map((_, index) => ({
          _id: `fallback-${index}`,
          images: [fallbackImages[index] || "/placeholder.jpg"],
          name: `Product ${index + 1}`,
        }));

  return (
    <ScrollReveal direction="up" delay={0.5} duration={1}>
      <div className="my-30">
        <div className="text-black flex justify-center items-center my-14 lg:mt-25 look">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-medium tracking-normal mb-5 text-gray-900">
              CLASSIC WEARS
            </h1>
            <div className="h-px w-16 bg-gray-300 mx-auto mb-6"></div>
            <p className="text-sm md:text-base text-gray-500 tracking-widest uppercase max-w-sm mx-auto">
              Stay Relaxed, Stay Stylish: Redefine Comfort with the Perfect
              Style Fit!
            </p>
          </div>
        </div>
        <div className="box-head my-20 look">
          <div className="box">
            {displayItems.map((item, index) => (
              <span key={item._id} style={{ "--i": index + 1 }}>
                <img
                  src={item.images?.[0]}
                  alt={item.name || `feature-${index + 1}`}
                  onError={(e) => {
                    // If image fails to load, use fallback
                    e.target.src = fallbackImages[index] || "/placeholder.jpg";
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
};

export default OtherFeatures;
