import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GoBackButton() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/"); // fallback to homepage
    }
  };

  return (
    <button
      onClick={handleGoBack} //  go back to previous page
      className="flex items-center text-gray-700 hover:text-gray-900 cursor-pointer"
    >
      <ArrowLeft size={25} className="mr-2" />

    </button>
  );
}






// import React from "react";
// import { Link } from "react-router-dom";
// import { Heart, ShoppingBag } from "lucide-react";

// const ProductCard = ({ product }) => {
//   if (!product) return null;

//   // Calculate discount if slashed
//   const discountPercentage =
//     product.isPriceSlashed && product.previousPrice
//       ? (
//           ((product.previousPrice - product.price) / product.previousPrice) *
//           100
//         ).toFixed(0)
//       : null;

//   return (
//     <div className="group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
//       {/* Sale Badge */}
//       {product.isPriceSlashed && (
//         <div className="absolute top-2 left-2 z-10">
//           <span className="bg-red-600 text-white px-2 py-1 text-xs font-bold rounded">
//             SALE
//           </span>
//         </div>
//       )}

//       {/* Product Image */}
//       <Link to={`/product/${product._id}`}>
//         <div className="relative h-48 overflow-hidden">
//           <img
//             src={product.images?.[0] || "/placeholder.jpg"}
//             alt={product.name}
//             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//           />
//         </div>
//       </Link>

//       {/* Product Info */}
//       <div className="p-4">
//         <Link to={`/product/${product._id}`}>
//           <h3 className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-blue-600">
//             {product.name}
//           </h3>
//         </Link>

//         <div className="mt-2">
//           {/* Price Display */}
//           {product.isPriceSlashed && product.previousPrice ? (
//             <div className="flex flex-col">
//               <div className="flex items-center gap-2">
//                 <span className="text-lg font-bold text-green-700">
//                   ₦{product.price.toLocaleString()}
//                 </span>
//                 <span className="text-sm text-gray-500 line-through">
//                   ₦{product.previousPrice.toLocaleString()}
//                 </span>
//                 <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
//                   {discountPercentage}% OFF
//                 </span>
//               </div>
//               <p className="text-xs text-green-600 mt-1">
//                 Save ₦{(product.previousPrice - product.price).toLocaleString()}
//               </p>
//             </div>
//           ) : (
//             <span className="text-lg font-bold text-gray-900">
//               ₦{product.price.toLocaleString()}
//             </span>
//           )}
//         </div>

//         {/* Category & Stock */}
//         <div className="flex justify-between items-center mt-3">
//           <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
//             {product.category}
//           </span>
//           <span
//             className={`text-xs px-2 py-1 rounded ${
//               product.countInStock > 0
//                 ? "bg-green-100 text-green-800"
//                 : "bg-red-100 text-red-800"
//             }`}
//           >
//             {product.countInStock > 0 ? "In Stock" : "Out of Stock"}
//           </span>
//         </div>

//         {/* Action Buttons */}
//         <div className="mt-4 flex gap-2">
//           <button className="flex-1 bg-black text-white py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors">
//             <ShoppingBag size={16} className="inline mr-1" />
//             Add to Cart
//           </button>
//           <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
//             <Heart size={16} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductCard;
