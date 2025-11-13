import React, { useEffect, useState } from "react";
import "../components/Otherfeatures.css";
import axios from "../lib/axios";

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

  // Use product images if available, otherwise use fallbacks
  const imagesToUse =
    recommendations.length >= 8
      ? recommendations.slice(0, 8).map((product) => product.images?.[0])
      : fallbackImages;

  return (
    <div className="box-head my-20 look">
      <div className="box">
        {imagesToUse.map((imageSrc, index) => (
          <span key={index} style={{ "--i": index + 1 }}>
            <img
              src={imageSrc}
              alt={`feature-${index + 1}`}
              onError={(e) => {
                // If image fails to load, use fallback
                e.target.src = fallbackImages[index] || "/placeholder.jpg";
              }}
            />
          </span>
        ))}
      </div>
    </div>
  );
};

export default OtherFeatures;
