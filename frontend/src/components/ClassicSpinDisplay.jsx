import React, { useEffect, useState } from "react";
import "../css/ClassicSpinDisplay.css";
import axios from "../lib/axios.js";
import ScrollReveal from "./ScrollReveal.jsx";
const ClassicSpinDisplay = () => {
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

  const fallbackImages = [
    "/hat-fashion.jpg",
    "/pack-bag.jpg",
    "/jacket-nice.jpg",
    "/order-now.jpg",
    "/shoe-brown.jpg",
    "/glassess.jpg",
    "/brown-jack.jpg",
    "/shoe-brown.jpg",
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
      <div className="mb-30 my-10">
        <div className="text-center px-4 mb-30">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center space-x-3 mb-8">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300"></div>
              <span className="text-xs font-semibold tracking-[0.3em] text-gray-500 uppercase">
                Premium Collection
              </span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300"></div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-gray-900 mb-6">
              Classic{" "}
              <span className="font-medium italic text-gray-800">Wears</span>
            </h1>

            <div className="h-0.5 w-20 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 mx-auto mb-8"></div>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Where timeless elegance meets modern comfort. Redefine your style
              with
              <span className="font-medium text-gray-800">
                {" "}
                perfectly fitted classics
              </span>
              that move with you.
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

export default ClassicSpinDisplay;
