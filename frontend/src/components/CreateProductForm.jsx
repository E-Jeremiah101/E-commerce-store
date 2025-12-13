import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader, Plus, Trash2 } from "lucide-react";
import { useProductStore } from "../stores/useProductStore.js";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import toast from "react-hot-toast";
import axios from "../lib/axios.js";

const fallbackCategories = [
  "bottoms",
  "t-shirts",
  "footwears",
  "accessories&essentials",
  "jackets&Outerwear",
  "sets&cords",
  "underwear&socks",
  "suits&blazers",
];

const CreateProductForm = () => {
  const [categories, setCategories] = useState(fallbackCategories);
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    images: [],
    sizes: [],
    colors: [],
    countInStock: 0,
    variants: [],
  });

  const { createProduct, loading } = useProductStore();

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/categories");
        if (res.data?.length > 0) {
          setCategories(res.data.map((c) => c.name));
        }
      } catch (error) {
        console.warn("Using fallback categories (failed to fetch):", error);
      }
    };
    fetchCategories();
  }, []);

  // Helper function to format variant display names
  const getVariantDisplayName = (variant) => {
    const hasSize = variant.size && variant.size.trim() !== "";
    const hasColor = variant.color && variant.color.trim() !== "";

    if (!hasSize && !hasColor) {
      return "Standard";
    }

    if (hasSize && !hasColor) {
      return variant.size;
    }

    if (!hasSize && hasColor) {
      return variant.color;
    }

    return `${variant.size} / ${variant.color}`;
  };

  // Handle product creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure variants are properly set for products without sizes/colors
      const productData = { ...newProduct };

      // If no variants were generated but we have a product without sizes/colors,
      // create a default variant
      if (
        (!productData.sizes || productData.sizes.length === 0) &&
        (!productData.colors || productData.colors.length === 0) &&
        (!productData.variants || productData.variants.length === 0)
      ) {
        productData.variants = [
          {
            size: "",
            color: "",
            countInStock: productData.countInStock || 0,
            sku: `${productData.name.replace(/\s+/g, "-").toUpperCase()}-STD`,
          },
        ];
      }

      const success = await createProduct(productData);
      if (success) {
        setNewProduct({
          name: "",
          description: "",
          price: "",
          category: "",
          images: [],
          sizes: [],
          colors: [],
          countInStock: 0,
          variants: [],
        });
      }
    } catch (error) {
      toast.error("Error creating product, try again");
    }
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory.trim())
      return toast.error("Category name cannot be empty.");
    setAddingCategory(true);
    try {
      const res = await axios.post("/categories", { name: newCategory.trim() });
      setCategories((prev) => [...prev, res.data.name]);
      setNewProduct((prev) => ({ ...prev, category: res.data.name }));
      setNewCategory("");
      toast.success(`Category "${res.data.name}" added!`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add category.");
    } finally {
      setAddingCategory(false);
    }
  };

  // Handle variant generation
  const generateVariants = () => {
    // If no sizes and no colors, create a simple product with one variant
    if (newProduct.sizes.length === 0 && newProduct.colors.length === 0) {
      const variants = [
        {
          size: "",
          color: "",
          countInStock: newProduct.countInStock || 0,
          sku: `${newProduct.name.replace(/\s+/g, "-").toUpperCase()}-STD`,
        },
      ];

      setNewProduct((prev) => ({
        ...prev,
        variants,
        countInStock: newProduct.countInStock || 0,
      }));
      toast.success("Created product without variants");
      return;
    }

    // If we have sizes or colors, generate combinations
    const variants = [];
    const sizes = newProduct.sizes.length > 0 ? newProduct.sizes : [""];
    const colors = newProduct.colors.length > 0 ? newProduct.colors : [""];

    sizes.forEach((size) => {
      colors.forEach((color) => {
        // Cleaner SKU generation
        const sizePart = size ? `-${size.replace(/\s+/g, "")}` : "";
        const colorPart = color ? `-${color.replace(/\s+/g, "")}` : "";

        variants.push({
          size,
          color,
          countInStock: 0,
          sku: `${newProduct.name
            .replace(/\s+/g, "-")
            .toUpperCase()}${sizePart}${colorPart}`,
        });
      });
    });

    const totalStock = variants.reduce(
      (sum, variant) => sum + variant.countInStock,
      0
    );

    setNewProduct((prev) => ({
      ...prev,
      variants,
      countInStock: totalStock,
    }));
    toast.success(`Generated ${variants.length} variants`);
  };

  // Update variant stock
  const updateVariantStock = (index, stock) => {
    const updatedVariants = [...newProduct.variants];
    updatedVariants[index].countInStock = parseInt(stock) || 0;

    // Calculate total stock
    const totalStock = updatedVariants.reduce(
      (sum, variant) => sum + variant.countInStock,
      0
    );

    setNewProduct((prev) => ({
      ...prev,
      variants: updatedVariants,
      countInStock: totalStock,
    }));
  };

  // Handle Quill input
  const handleDescriptionChange = (content) => {
    setNewProduct((prev) => ({ ...prev, description: content }));
  };

  // Handle image uploads
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((images) => {
      setNewProduct((prev) => ({ ...prev, images }));
    });
  };

  // Quill setup
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
    ],
  };
  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "link",
  ];

 return (
   <div className="bg-gray-900 min-h-screen">
     <div className="container mx-auto px-4 py-8 max-w-4xl">
       <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
         <div className="p-6">
           <h2 className="text-2xl font-bold text-white mb-6">
             Create a New Product
           </h2>

           <form onSubmit={handleSubmit} className="space-y-6">
             {/* PRODUCT NAME */}
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-2">
                 Product Name
               </label>
               <input
                 type="text"
                 value={newProduct.name}
                 onChange={(e) =>
                   setNewProduct({ ...newProduct, name: e.target.value })
                 }
                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                 required
               />
             </div>

             {/* DESCRIPTION - Fixed Height */}
             <div className="h-64">
               <label className="block text-sm font-medium text-gray-300 mb-2">
                 Description
               </label>
               <div className="h-48 bg-gray-700 rounded-lg overflow-hidden">
                 <ReactQuill
                   theme="snow"
                   value={newProduct.description}
                   onChange={handleDescriptionChange}
                   modules={modules}
                   formats={formats}
                   className="h-full [&_.ql-container]:!min-h-[120px] [&_.ql-editor]:!min-h-[120px]"
                 />
               </div>
             </div>

             {/* PRICE */}
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-2">
                 Price
               </label>
               <input
                 type="number"
                 step="0.01"
                 value={newProduct.price}
                 onChange={(e) =>
                   setNewProduct({ ...newProduct, price: e.target.value })
                 }
                 className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                 required
               />
             </div>

             {/* SIZES & COLORS */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-2">
                   Sizes (comma separated)
                 </label>
                 <input
                   type="text"
                   value={newProduct.sizes.join(", ")}
                   onChange={(e) =>
                     setNewProduct({
                       ...newProduct,
                       sizes: e.target.value.split(",").map((s) => s.trim()),
                     })
                   }
                   placeholder="e.g. S, M, L, XL"
                   className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-2">
                   Colors (comma separated)
                 </label>
                 <input
                   type="text"
                   value={newProduct.colors.join(", ")}
                   onChange={(e) =>
                     setNewProduct({
                       ...newProduct,
                       colors: e.target.value.split(",").map((c) => c.trim()),
                     })
                   }
                   placeholder="e.g. Red, Blue, Green"
                   className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                 />
               </div>
             </div>

             {/* VARIANT MANAGEMENT */}
             <div className="border border-gray-700 rounded-lg p-4">
               <div className="flex justify-between items-center mb-4">
                 <label className="block text-sm font-medium text-gray-300">
                   Product Variants & Inventory
                 </label>
                 <button
                   type="button"
                   onClick={generateVariants}
                   className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
                 >
                   Generate Variants
                 </button>
               </div>

               {newProduct.variants.length > 0 ? (
                 <div className="space-y-3 max-h-48 overflow-y-auto">
                   {newProduct.variants.map((variant, index) => (
                     <div
                       key={index}
                       className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                     >
                       <div>
                         <span className="text-white font-medium">
                           {getVariantDisplayName(variant)}
                         </span>
                         <span className="text-gray-400 text-sm block">
                           {variant.sku}
                         </span>
                       </div>
                       <input
                         type="number"
                         min="0"
                         value={variant.countInStock}
                         onChange={(e) =>
                           updateVariantStock(index, e.target.value)
                         }
                         className="w-20 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                       />
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className="text-gray-400 text-sm">
                   Add sizes and/or colors, then click "Generate Variants" to
                   set up inventory.
                 </p>
               )}
             </div>

             {/* CATEGORY & IMAGES */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-2">
                   Category
                 </label>
                 <div className="flex gap-2">
                   <select
                     value={newProduct.category}
                     onChange={(e) =>
                       setNewProduct({
                         ...newProduct,
                         category: e.target.value,
                       })
                     }
                     className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                     required
                   >
                     <option value="">Select category</option>
                     {categories.map((c) => (
                       <option key={c} value={c}>
                         {c}
                       </option>
                     ))}
                   </select>
                   <button
                     type="button"
                     onClick={handleAddCategory}
                     disabled={addingCategory}
                     className="bg-emerald-700 hover:bg-emerald-600 px-4 py-3 rounded-lg text-white"
                   >
                     {addingCategory ? (
                       <Loader className="h-5 w-5 animate-spin" />
                     ) : (
                       <Plus className="h-5 w-5" />
                     )}
                   </button>
                 </div>
               </div>

               <div>
                 <input
                   type="file"
                   id="images"
                   onChange={handleImageChange}
                   className="hidden"
                   accept="image/*"
                   multiple
                   required
                 />
                 <label
                   htmlFor="images"
                   className="cursor-pointer bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg px-4 py-3 text-white flex items-center justify-center h-full"
                 >
                   <Upload className="h-5 w-5 mr-2" />
                   Upload Images
                 </label>
               </div>
             </div>

             {/* IMAGE PREVIEW */}
             {newProduct.images.length > 0 && (
               <div className="flex flex-wrap gap-2">
                 {newProduct.images.map((img, index) => (
                   <img
                     key={index}
                     src={img}
                     alt={`preview-${index}`}
                     className="w-20 h-20 object-cover rounded-lg border border-gray-600"
                   />
                 ))}
               </div>
             )}

             {/* SUBMIT BUTTON - NO EXTRA SPACE */}
             <div>
               <button
                 type="submit"
                 disabled={loading}
                 className="w-full bg-yellow-700 hover:bg-yellow-600 text-white font-medium py-4 rounded-lg disabled:opacity-50"
               >
                 {loading ? (
                   <span className="flex items-center justify-center">
                     <Loader className="h-5 w-5 animate-spin mr-2" />
                     Creating Product...
                   </span>
                 ) : (
                   <span className="flex items-center justify-center">
                     <PlusCircle className="h-5 w-5 mr-2" />
                     Create Product
                   </span>
                 )}
               </button>
             </div>
           </form>
         </div>
       </div>
     </div>
   </div>
 );
};

export default CreateProductForm;
