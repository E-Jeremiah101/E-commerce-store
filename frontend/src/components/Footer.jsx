// import React, { useState } from "react";
// import toast from "react-hot-toast";
// import { ShoppingCart } from "lucide-react";
// import { useUserStore } from "../stores/useUserStore";
// import { useCartStore } from "../stores/useCartStore";
// import {Link} from "react-router-dom"

// const ProductCard = ({ product }) => {
//   const { user } = useUserStore();
//   const { addToCart } = useCartStore();

//   const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
//   const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");

//   const handleAddToCart = () => {
//     if (!user) {
//       toast.error("Please login to add products to cart", { id: "login" });
//       return;
//     }
//     if (product.sizes?.length > 0 && !selectedSize) {
//       toast.error("Please select a size");
//       return;
//     }
//     if (product.colors?.length > 0 && !selectedColor) {
//       toast.error("Please select a color");
//       return;
//     }

//     addToCart(
//       product, selectedSize || null, selectedColor || null
//     );
   
//   };

//   return (
//     <div className="flex-w-full relative flex-col overflow-hidden rounded-lg  border-gray-700 shadow-lg">
//       {/* Product Image */}
//       <Link to={`/product/${product._id}`}>
//         <div className="relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl">
//           <img
//             className="object-cover w-full"
//             src={product.images?.[0]}
//             alt={product.name}
//           />

//           <div className="absolute inset-0 bg-black opacity-10" />
//         </div>

//         {/* Product Info */}
//         <div className="mt-4 px-5 pb-5 space-y-3">
//           <h5 className="text-xl font-semibold  tracking-widest text-black h-15">
//             {product.name}
//           </h5>

//           <p className="text-3xl  text-black">
//             ₦{" "}
//             {product.price.toLocaleString(undefined, {
//               minimumFractionDigits: 0,
//             })}
//           </p>

//           {/* Size Selection */}
//           {/* {product.sizes?.length > 0 && (
//           <div>
//             <label className="text-sm text-gray-900 mr-2">Size:</label>
//             <select
//               value={selectedSize}
//               onChange={(e) => setSelectedSize(e.target.value)}
//               className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
//             >
//               {product.sizes.map((size) => (
//                 <option key={size} value={size}>
//                   {size}
//                 </option>
//               ))}
//             </select>
//           </div>
//         )} */}

//           {/* Color Selection */}
//           {/* {product.colors?.length > 0 && (
//           <div>
//             <label className="text-sm text-gray-800 mr-2">Color:</label>
//             <select
//               value={selectedColor}
//               onChange={(e) => setSelectedColor(e.target.value)}
//               className="bg-gray-700 text-white px-2 py-1 rounded"
//             >
//               {product.colors.map((color) => (
//                 <option key={color} value={color}>
//                   {color}
//                 </option>
//               ))}
//             </select>
//           </div>
//         )} */}

//           {/* Add to Cart Button */}
//           <button
//             className="w-full mt-3 flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-900 tracking-widest"
//             onClick={handleAddToCart}
//           >
//             {/* <ShoppingCart size={22} className="mr-2" /> */}
//             Add to Cart
//           </button>
//         </div>
//       </Link>
//     </div>
//   );
// };

// export default ProductCard;
// ........
// import { Link } from "react-router-dom";
// import { useState } from "react";

// const CategoryItem = ({ category }) => {
//   const [selectedSize, setSelectedSize] = useState("");
//   const [selectedColor, setSelectedColor] = useState("");

//   return (
//     <div className="relative overflow-hidden h-94 w-full rounded-lg group ">
//       <Link
//         to={{
//           pathname: "/category" + category.href,
//           state: { size: selectedSize, color: selectedColor },
//         }}
//       >
//         <div className="w-full h-full cursor-pointer">
//           <div className="md:absolute block inset-0 bg-gradient-to-b from-transparent to-gray-500 z-10">
//             <img
//               src={category.imageUrl}
//               alt={category.name}
//               className="w-full h-59 md:h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
//               loading="lazy"
//             />

//             <div className="md:absolute block md:bottom-0 md:left-0 md:right-0 p-2 md:p-4 z-20">
//               <h3 className="text-orange-200/80 md:text-black text-base md:text-2xl md:font-bold mb-2 tracking-widest h-15 md:h-fit">
//                Explore {category.name}
//               </h3>
//               <p className="text-white hidden md:block text-sm mb-1 md:mb-2 md:bg-black w-fit tracking-widest rounded-md">
//                 Explore {category.name}
//               </p>

//               {/* Sizes */}
//               {category.sizes && category.sizes.length > 0 && (
//                 <div className="flex flex-wrap gap-2 mb-2">
//                   {category.sizes.map((size) => (
//                     <span
//                       key={size}
//                       className={`px-2 py-1 rounded text-xs border cursor-pointer ${
//                         selectedSize === size
//                           ? "bg-emerald-500 text-white"
//                           : "bg-gray-700 text-gray-200"
//                       }`}
//                       onClick={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         setSelectedSize(size);
//                       }}
//                     >
//                       {size}
//                     </span>
//                   ))}
//                 </div>
//               )}

//               {/* Colors */}
//               {category.colors && category.colors.length > 0 && (
//                 <div className="flex flex-wrap gap-2">
//                   {category.colors.map((color) => (
//                     <span
//                       key={color}
//                       className={`w-5 h-5 rounded-full border cursor-pointer ${
//                         selectedColor === color ? "ring-2 ring-emerald-400" : ""
//                       }`}
//                       style={{ backgroundColor: color }}
//                       onClick={(e) => {
//                         e.preventDefault();
//                         e.stopPropagation();
//                         setSelectedColor(color);
//                       }}
//                     />
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </Link>
//     </div>
//   );
// };

// export default CategoryItem;
// ........
// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { motion } from "framer-motion";
// import { useProductStore } from "../stores/useProductStore";
// import { useCartStore } from "../stores/useCartStore";
// import GoBackButton from "../components/GoBackButton";

// const ViewProductPage = () => {
//   const { id } = useParams();
//   const { fetchProductById } = useProductStore();
//   const { addToCart } = useCartStore();

//   const [product, setProduct] = useState(null);
//   const [selectedImage, setSelectedImage] = useState("");
//   const [selectedColor, setSelectedColor] = useState("");
//   const [selectedSize, setSelectedSize] = useState("");

//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadProduct = async () => {
//       setLoading(true);
//       const data = await fetchProductById(id);
//       setProduct(data);
//       setSelectedImage(data?.images?.[0]);
//       setLoading(false);
//     };
//     loadProduct();
//   }, [id, fetchProductById]);

//   const handleAddToCart = () => {
//     if (!selectedColor || !selectedSize) {
//       alert("Please select a color and size");
//       return;
//     }
//     addToCart({
//       ...product,
//       selectedColor,
//       selectedSize,
//       quantity: 1,
//     });
//     alert("Added to cart!");
//   };

//   if (loading)
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
//       </div>
//     );

//   if (!product) return <p className="text-center mt-10">Product not found.</p>;

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Header */}
//       <motion.div
//         className="flex items-center justify-center bg-white py-5 fixed top-0 left-0 right-0 z-40 shadow-sm"
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         <div className="absolute left-4">
//           <GoBackButton />
//         </div>
//         <span className="text-lg font-semibold tracking-wider text-gray-900">
//           {product.name}
//         </span>
//       </motion.div>

//       {/* Content */}
//       <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-10">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
//           {/* Image Gallery */}
//           <div>
//             <img
//               src={selectedImage}
//               alt={product.name}
//               className="w-full h-96 object-cover rounded-lg shadow-md"
//             />

//             <div className="flex mt-4 gap-2 overflow-x-auto">
//               {product.images.map((img, index) => (
//                 <img
//                   key={index}
//                   src={img}
//                   alt={`thumb-${index}`}
//                   className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${
//                     selectedImage === img
//                       ? "border-yellow-600"
//                       : "border-gray-300"
//                   }`}
//                   onClick={() => setSelectedImage(img)}
//                 />
//               ))}
//             </div>
//           </div>

//           {/* Details */}
//           <div className="flex flex-col space-y-5">
//             <h2 className="text-2xl font-semibold text-gray-900">
//               {product.name}
//             </h2>
//             <p className="text-gray-700">{product.description}</p>
//             <p className="text-xl font-bold text-yellow-700">
//               ${product.price}
//             </p>

//             {/* Color Options */}
//             {product.colors?.length > 0 && (
//               <div>
//                 <h3 className="text-gray-800 font-medium mb-2">Colors:</h3>
//                 <div className="flex gap-2 flex-wrap">
//                   {product.colors.map((color, i) => (
//                     <button
//                       key={i}
//                       onClick={() => setSelectedColor(color)}
//                       className={`px-3 py-1 rounded-full border ${
//                         selectedColor === color
//                           ? "border-yellow-700 bg-yellow-100"
//                           : "border-gray-300"
//                       }`}
//                     >
//                       {color}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Size Options */}
//             {product.sizes?.length > 0 && (
//               <div>
//                 <h3 className="text-gray-800 font-medium mb-2">Sizes:</h3>
//                 <div className="flex gap-2 flex-wrap">
//                   {product.sizes.map((size, i) => (
//                     <button
//                       key={i}
//                       onClick={() => setSelectedSize(size)}
//                       className={`px-3 py-1 rounded-full border ${
//                         selectedSize === size
//                           ? "border-yellow-700 bg-yellow-100"
//                           : "border-gray-300"
//                       }`}
//                     >
//                       {size}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Add to Cart Button */}
//             <button
//               onClick={handleAddToCart}
//               className="w-full bg-yellow-700 text-white py-3 rounded-lg hover:bg-yellow-800 transition"
//             >
//               Add to Cart
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ViewProductPage;
// ..........
// import { create } from "zustand";
// import toast from "react-hot-toast";
// import axios from "../lib/axios";

// export const useProductStore = create((set) => ({
//   products: [],
//   loading: false,

//   setProducts: (products) => set({ products }),
//   createProduct: async (productData) => {
//     set({ loading: true });
//     try {
//       const res = await axios.post("/products", productData);
//       set((prevState) => ({
//         products: [...prevState.products, res.data],
//         loading: false,
//       }));
//     } catch (error) {
//       console.error(
//         "Error creating product:",
//         error.response?.data || error.message
//       );
//       toast.error(error.response?.data?.message || "Failed to create product");
//       set({ loading: false });
//     }
//   },
//   fetchAllProducts: async () => {
//     set({ loading: true });
//     try {
//       const response = await axios.get("/products");
//       set({ products: response.data.products, loading: false });
//     } catch (error) {
//       set({ error: "Failed to fetch products", loading: false });
//       toast.error(error.response.data.error || "Failed to fetch products");
//     }
//   },
//   fetchProductsByCategory: async (category) => {
//     set({ loading: true });
//     try {
//       const response = await axios.get(`/products/category/${category}`);
//       set({ products: response.data.products, loading: false });
//     } catch (error) {
//       set({ error: "Failed to fetch products", loading: false });
//       toast.error(error.response.data.error || "Failed to fetch products");
//     }
//   },
//   deleteProduct: async (productId) => {
//     set({ loading: true });
//     try {
//       await axios.delete(`/products/${productId}`);
//       set((prevProducts) => ({
//         products: prevProducts.products.filter(
//           (product) => product._id !== productId
//         ),
//         loading: false,
//       }));
//     } catch (error) {
//       set({ loading: false });
//       toast.error(error.response.data.error || "Failed to delete product");
//     }
//   },
//   toggleFeaturedProduct: async (productId) => {
//     set({ loading: true });
//     try {
//       const response = await axios.patch(`/products/${productId}`);
//       // this will update the isFeatured prop of the product
//       set((prevProducts) => ({
//         products: prevProducts.products.map((product) =>
//           product._id === productId
//             ? { ...product, isFeatured: response.data.isFeatured }
//             : product
//         ),
//         loading: false,
//       }));
//     } catch (error) {
//       set({ loading: false });
//       toast.error(error.response.data.error || "Failed to update product");
//     }
//   },
//   fetchFeaturedProducts: async () => {
//     set({ loading: true });
//     try {
//       let url = "/products/featured";
//       const response = await axios.get("/products/featured");
//       set({ products: response.data, loading: false });
//     } catch (error) {
//       set({ error: "Failed to fetch products", loading: false });
//       console.log("Error fetching featured products:", error);
//     }
//   },
//   fetchProductById: async (id) => {
//     // ✅ ADD THIS FUNCTION
//     try {
//       const res = await axios.get(`/products/${id}`);
//       set({ product: res.data });
//     } catch (error) {
//       console.error("Error fetching product:", error);
//       throw error;
//     }
//   },
// }));
