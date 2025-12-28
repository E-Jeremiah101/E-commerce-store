// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { PlusCircle, Upload, Loader, Plus, Trash2 } from "lucide-react";
// import { useProductStore } from "../stores/useProductStore.js";
// import ReactQuill from "react-quill-new";
// import "react-quill-new/dist/quill.snow.css";
// import toast from "react-hot-toast";
// import axios from "../lib/axios.js";

// const fallbackCategories = [
//   "bottoms",
//   "t-shirts",
//   "footwears",
//   "accessories&essentials",
//   "jackets&Outerwear",
//   "sets&cords",
//   "underwear&socks",
//   "suits&blazers",
// ];

// const CreateProductForm = () => {
//   const [categories, setCategories] = useState(fallbackCategories);
//   const [newCategory, setNewCategory] = useState("");
//   const [addingCategory, setAddingCategory] = useState(false);
//   const [newProduct, setNewProduct] = useState({
//     name: "",
//     description: "",
//     price: "",
//     category: "",
//     images: [],
//     sizes: [],
//     colors: [],
//     countInStock: 0,
//     variants: [],
//   });

//   const { createProduct, loading } = useProductStore();

//   // Fetch categories from backend
//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await axios.get("/categories");
//         if (res.data?.length > 0) {
//           setCategories(res.data.map((c) => c.name));
//         }
//       } catch (error) {
//         console.warn("Using fallback categories (failed to fetch):", error);
//       }
//     };
//     fetchCategories();
//   }, []);

//   // Helper function to format variant display names
//   const getVariantDisplayName = (variant) => {
//     const hasSize = variant.size && variant.size.trim() !== "";
//     const hasColor = variant.color && variant.color.trim() !== "";

//     if (!hasSize && !hasColor) {
//       return "Standard";
//     }

//     if (hasSize && !hasColor) {
//       return variant.size;
//     }

//     if (!hasSize && hasColor) {
//       return variant.color;
//     }

//     return `${variant.size} / ${variant.color}`;
//   };

//   // Handle product creation
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       // Ensure variants are properly set for products without sizes/colors
//       const productData = { ...newProduct };

//       // If no variants were generated but we have a product without sizes/colors,
//       // create a default variant
//       if (
//         (!productData.sizes || productData.sizes.length === 0) &&
//         (!productData.colors || productData.colors.length === 0) &&
//         (!productData.variants || productData.variants.length === 0)
//       ) {
//         productData.variants = [
//           {
//             size: "",
//             color: "",
//             countInStock: productData.countInStock || 0,
//             sku: `${productData.name.replace(/\s+/g, "-").toUpperCase()}-STD`,
//           },
//         ];
//       }

//       const success = await createProduct(productData);
//       if (success) {
//         setNewProduct({
//           name: "",
//           description: "",
//           price: "",
//           category: "",
//           images: [],
//           sizes: [],
//           colors: [],
//           countInStock: 0,
//           variants: [],
//         });
//       }
//     } catch (error) {
//       toast.error("Error creating product, try again");
//     }
//   };

//   // Add new category
//   const handleAddCategory = async () => {
//     if (!newCategory.trim())
//       return toast.error("Category name cannot be empty.");
//     setAddingCategory(true);
//     try {
//       const res = await axios.post("/categories", { name: newCategory.trim() });
//       setCategories((prev) => [...prev, res.data.name]);
//       setNewProduct((prev) => ({ ...prev, category: res.data.name }));
//       setNewCategory("");
//       toast.success(`Category "${res.data.name}" added!`);
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed to add category.");
//     } finally {
//       setAddingCategory(false);
//     }
//   };

//   // Handle variant generation
//   const generateVariants = () => {
//     // If no sizes and no colors, create a simple product with one variant
//     if (newProduct.sizes.length === 0 && newProduct.colors.length === 0) {
//       const variants = [
//         {
//           size: "",
//           color: "",
//           countInStock: newProduct.countInStock || 0,
//           sku: `${newProduct.name.replace(/\s+/g, "-").toUpperCase()}-STD`,
//         },
//       ];

//       setNewProduct((prev) => ({
//         ...prev,
//         variants,
//         countInStock: newProduct.countInStock || 0,
//       }));
//       toast.success("Created product without variants");
//       return;
//     }

//     // If we have sizes or colors, generate combinations
//     const variants = [];
//     const sizes = newProduct.sizes.length > 0 ? newProduct.sizes : [""];
//     const colors = newProduct.colors.length > 0 ? newProduct.colors : [""];

//     sizes.forEach((size) => {
//       colors.forEach((color) => {
//         // Cleaner SKU generation
//         const sizePart = size ? `-${size.replace(/\s+/g, "")}` : "";
//         const colorPart = color ? `-${color.replace(/\s+/g, "")}` : "";

//         variants.push({
//           size,
//           color,
//           countInStock: 0,
//           sku: `${newProduct.name
//             .replace(/\s+/g, "-")
//             .toUpperCase()}${sizePart}${colorPart}`,
//         });
//       });
//     });

//     const totalStock = variants.reduce(
//       (sum, variant) => sum + variant.countInStock,
//       0
//     );

//     setNewProduct((prev) => ({
//       ...prev,
//       variants,
//       countInStock: totalStock,
//     }));
//     toast.success(`Generated ${variants.length} variants`);
//   };

//   // Update variant stock
//   const updateVariantStock = (index, stock) => {
//     const updatedVariants = [...newProduct.variants];
//     updatedVariants[index].countInStock = parseInt(stock) || 0;

//     // Calculate total stock
//     const totalStock = updatedVariants.reduce(
//       (sum, variant) => sum + variant.countInStock,
//       0
//     );

//     setNewProduct((prev) => ({
//       ...prev,
//       variants: updatedVariants,
//       countInStock: totalStock,
//     }));
//   };

//   // Handle Quill input
//   const handleDescriptionChange = (content) => {
//     setNewProduct((prev) => ({ ...prev, description: content }));
//   };

//   // Handle image uploads
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     const readers = files.map(
//       (file) =>
//         new Promise((resolve, reject) => {
//           const reader = new FileReader();
//           reader.onloadend = () => resolve(reader.result);
//           reader.onerror = reject;
//           reader.readAsDataURL(file);
//         })
//     );
//     Promise.all(readers).then((images) => {
//       setNewProduct((prev) => ({ ...prev, images }));
//     });
//   };

//   // Quill setup
//   const modules = {
//     toolbar: [
//       [{ header: [1, 2, 3, false] }],
//       ["bold", "italic", "underline", "strike"],
//       [{ list: "ordered" }, { list: "bullet" }],
//       ["link", "clean"],
//     ],
//   };
//   const formats = [
//     "header",
//     "bold",
//     "italic",
//     "underline",
//     "strike",
//     "list",
//     "link",
//   ];

//  return (
//    <div className="bg-gray-900 min-h-screen">
//      <div className="container mx-auto px-4 py-8 max-w-4xl">
//        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
//          <div className="p-6">
//            <h2 className="text-2xl font-bold text-white mb-6">
//              Create a New Product
//            </h2>

//            <form onSubmit={handleSubmit} className="space-y-6">
//              {/* PRODUCT NAME */}
//              <div>
//                <label className="block text-sm font-medium text-gray-300 mb-2">
//                  Product Name
//                </label>
//                <input
//                  type="text"
//                  value={newProduct.name}
//                  onChange={(e) =>
//                    setNewProduct({ ...newProduct, name: e.target.value })
//                  }
//                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
//                  required
//                />
//              </div>

//              {/* DESCRIPTION - Fixed Height */}
//              <div className="h-64">
//                <label className="block text-sm font-medium text-gray-300 mb-2">
//                  Description
//                </label>
//                <div className="h-48 bg-gray-700 rounded-lg overflow-hidden">
//                  <ReactQuill
//                    theme="snow"
//                    value={newProduct.description}
//                    onChange={handleDescriptionChange}
//                    modules={modules}
//                    formats={formats}
//                    className="h-full [&_.ql-container]:!min-h-[120px] [&_.ql-editor]:!min-h-[120px]"
//                  />
//                </div>
//              </div>

//              {/* PRICE */}
//              <div>
//                <label className="block text-sm font-medium text-gray-300 mb-2">
//                  Price
//                </label>
//                <input
//                  type="number"
//                  step="0.01"
//                  value={newProduct.price}
//                  onChange={(e) =>
//                    setNewProduct({ ...newProduct, price: e.target.value })
//                  }
//                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
//                  required
//                />
//              </div>

//              {/* SIZES & COLORS */}
//              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                <div>
//                  <label className="block text-sm font-medium text-gray-300 mb-2">
//                    Sizes (comma separated)
//                  </label>
//                  <input
//                    type="text"
//                    value={newProduct.sizes.join(", ")}
//                    onChange={(e) =>
//                      setNewProduct({
//                        ...newProduct,
//                        sizes: e.target.value.split(",").map((s) => s.trim()),
//                      })
//                    }
//                    placeholder="e.g. S, M, L, XL"
//                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
//                  />
//                </div>

//                <div>
//                  <label className="block text-sm font-medium text-gray-300 mb-2">
//                    Colors (comma separated)
//                  </label>
//                  <input
//                    type="text"
//                    value={newProduct.colors.join(", ")}
//                    onChange={(e) =>
//                      setNewProduct({
//                        ...newProduct,
//                        colors: e.target.value.split(",").map((c) => c.trim()),
//                      })
//                    }
//                    placeholder="e.g. Red, Blue, Green"
//                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
//                  />
//                </div>
//              </div>

//              {/* VARIANT MANAGEMENT */}
//              <div className="border border-gray-700 rounded-lg p-4">
//                <div className="flex justify-between items-center mb-4">
//                  <label className="block text-sm font-medium text-gray-300">
//                    Product Variants & Inventory
//                  </label>
//                  <button
//                    type="button"
//                    onClick={generateVariants}
//                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
//                  >
//                    Generate Variants
//                  </button>
//                </div>

//                {newProduct.variants.length > 0 ? (
//                  <div className="space-y-3 max-h-48 overflow-y-auto">
//                    {newProduct.variants.map((variant, index) => (
//                      <div
//                        key={index}
//                        className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
//                      >
//                        <div>
//                          <span className="text-white font-medium">
//                            {getVariantDisplayName(variant)}
//                          </span>
//                          <span className="text-gray-400 text-sm block">
//                            {variant.sku}
//                          </span>
//                        </div>
//                        <input
//                          type="number"
//                          min="0"
//                          value={variant.countInStock}
//                          onChange={(e) =>
//                            updateVariantStock(index, e.target.value)
//                          }
//                          className="w-20 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
//                        />
//                      </div>
//                    ))}
//                  </div>
//                ) : (
//                  <p className="text-gray-400 text-sm">
//                    Add sizes and/or colors, then click "Generate Variants" to
//                    set up inventory.
//                  </p>
//                )}
//              </div>

//              {/* CATEGORY & IMAGES */}
//              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                <div>
//                  <label className="block text-sm font-medium text-gray-300 mb-2">
//                    Category
//                  </label>
//                  <div className="flex gap-2">
//                    <select
//                      value={newProduct.category}
//                      onChange={(e) =>
//                        setNewProduct({
//                          ...newProduct,
//                          category: e.target.value,
//                        })
//                      }
//                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
//                      required
//                    >
//                      <option value="">Select category</option>
//                      {categories.map((c) => (
//                        <option key={c} value={c}>
//                          {c}
//                        </option>
//                      ))}
//                    </select>
//                    <button
//                      type="button"
//                      onClick={handleAddCategory}
//                      disabled={addingCategory}
//                      className="bg-emerald-700 hover:bg-emerald-600 px-4 py-3 rounded-lg text-white"
//                    >
//                      {addingCategory ? (
//                        <Loader className="h-5 w-5 animate-spin" />
//                      ) : (
//                        <Plus className="h-5 w-5" />
//                      )}
//                    </button>
//                  </div>
//                </div>

//                <div>
//                  <input
//                    type="file"
//                    id="images"
//                    onChange={handleImageChange}
//                    className="hidden"
//                    accept="image/*"
//                    multiple
//                    required
//                  />
//                  <label
//                    htmlFor="images"
//                    className="cursor-pointer bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg px-4 py-3 text-white flex items-center justify-center h-full"
//                  >
//                    <Upload className="h-5 w-5 mr-2" />
//                    Upload Images
//                  </label>
//                </div>
//              </div>

//              {/* IMAGE PREVIEW */}
//              {newProduct.images.length > 0 && (
//                <div className="flex flex-wrap gap-2">
//                  {newProduct.images.map((img, index) => (
//                    <img
//                      key={index}
//                      src={img}
//                      alt={`preview-${index}`}
//                      className="w-20 h-20 object-cover rounded-lg border border-gray-600"
//                    />
//                  ))}
//                </div>
//              )}

//              {/* SUBMIT BUTTON - NO EXTRA SPACE */}
//              <div>
//                <button
//                  type="submit"
//                  disabled={loading}
//                  className="w-full bg-yellow-700 hover:bg-yellow-600 text-white font-medium py-4 rounded-lg disabled:opacity-50"
//                >
//                  {loading ? (
//                    <span className="flex items-center justify-center">
//                      <Loader className="h-5 w-5 animate-spin mr-2" />
//                      Creating Product...
//                    </span>
//                  ) : (
//                    <span className="flex items-center justify-center">
//                      <PlusCircle className="h-5 w-5 mr-2" />
//                      Create Product
//                    </span>
//                  )}
//                </button>
//              </div>
//            </form>
//          </div>
//        </div>
//      </div>
//    </div>
//  );
// };

// export default CreateProductForm;
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Upload,
  Loader,
  Plus,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
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
  const [categoriesData, setCategoriesData] = useState([]); // Store full category objects
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

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
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/categories");
      if (res.data?.length > 0) {
        setCategoriesData(res.data); // Store full objects
        setCategories(res.data.map((c) => c.name)); // Store just names for select
      }
    } catch (error) {
      console.warn("Using fallback categories (failed to fetch):", error);
    }
  };

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
        toast.success("Product created successfully!");
      }
    } catch (error) {
      toast.error("Error creating product, try again");
    }
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      return toast.error("Category name cannot be empty.");
    }

    // Check if category already exists
    if (categories.includes(newCategory.trim())) {
      return toast.error("Category already exists.");
    }

    setAddingCategory(true);
    try {
      const res = await axios.post("/categories", {
        name: newCategory.trim(),
      });

      // Update both data arrays
      setCategoriesData((prev) => [...prev, res.data]);
      setCategories((prev) => [...prev, res.data.name]);
      setNewProduct((prev) => ({ ...prev, category: res.data.name }));
      setNewCategory("");
      setShowAddCategory(false);
      toast.success(`Category "${res.data.name}" added!`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add category.");
    } finally {
      setAddingCategory(false);
    }
  };

  // Delete category with confirmation
  const handleDeleteCategory = async (categoryName) => {
    if (!categoryName) return;

    setDeletingCategory(categoryName);

    try {
      // Find category by name to get its ID
      const category = categoriesData.find((c) => c.name === categoryName);

      if (!category) {
        toast.error("Category not found.");
        return;
      }

      // Delete using the category ID
      await axios.delete(`/categories/${category._id}`);

      // Update local state
      setCategoriesData((prev) => prev.filter((c) => c.name !== categoryName));
      setCategories((prev) => prev.filter((c) => c !== categoryName));

      // If deleted category was selected, clear selection
      if (newProduct.category === categoryName) {
        setNewProduct((prev) => ({ ...prev, category: "" }));
      }

      toast.success(`Category "${categoryName}" deleted successfully.`);
    } catch (error) {
      if (error.response?.status === 400) {
        // Category is in use by products
        toast.error(
          error.response?.data?.message || "Cannot delete category in use."
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to delete category."
        );
      }
    } finally {
      setDeletingCategory(null);
      setShowDeleteConfirm(null);
    }
  };

  // Open delete confirmation
  const openDeleteConfirm = (categoryName) => {
    if (newProduct.category === categoryName) {
      toast.error(
        "Cannot delete currently selected category. Please select another category first."
      );
      return;
    }
    setShowDeleteConfirm(categoryName);
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
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max

      if (!isValidType) toast.error(`${file.name} is not a valid image file`);
      if (!isValidSize) toast.error(`${file.name} is too large (max 5MB)`);

      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    const readers = validFiles.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers)
      .then((images) => {
        setNewProduct((prev) => ({
          ...prev,
          images: [...prev.images, ...images].slice(0, 10), // Max 10 images
        }));
        toast.success(`Added ${images.length} image(s)`);
      })
      .catch((error) => {
        toast.error("Error uploading images");
        console.error("Image upload error:", error);
      });
  };

  // Remove an image
  const removeImage = (index) => {
    setNewProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    toast.success("Image removed");
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
                  Product Name *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Enter product name"
                />
              </div>

              {/* DESCRIPTION - Fixed Height */}
              <div className="h-64">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <div className="h-48 bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
                  <ReactQuill
                    theme="snow"
                    value={newProduct.description}
                    onChange={handleDescriptionChange}
                    modules={modules}
                    formats={formats}
                    className="h-full [&_.ql-container]:!min-h-[120px] [&_.ql-editor]:!min-h-[120px] [&_.ql-container]:bg-gray-700 [&_.ql-editor]:text-white text-white "
                    placeholder="Enter product description..."
                  />
                </div>
              </div>

              {/* PRICE */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-8 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="0.00"
                  />
                </div>
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
                        sizes: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s),
                      })
                    }
                    placeholder="e.g. S, M, L, XL"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        colors: e.target.value
                          .split(",")
                          .map((c) => c.trim())
                          .filter((c) => c),
                      })
                    }
                    placeholder="e.g. Red, Blue, Green"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    disabled={!newProduct.name}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Variants
                  </button>
                </div>

                {newProduct.variants.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {newProduct.variants.map((variant, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <div>
                          <span className="text-white font-medium">
                            {getVariantDisplayName(variant)}
                          </span>
                          <span className="text-gray-400 text-sm block">
                            {variant.sku}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm">Stock:</span>
                          <input
                            type="number"
                            min="0"
                            value={variant.countInStock}
                            onChange={(e) =>
                              updateVariantStock(index, e.target.value)
                            }
                            className="w-24 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    Add sizes and/or colors, then click "Generate Variants" to
                    set up inventory.
                    {!newProduct.name && " (Product name required)"}
                  </p>
                )}

                {newProduct.variants.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Stock:</span>
                      <span className="text-white font-bold text-lg">
                        {newProduct.variants.reduce(
                          (sum, v) => sum + v.countInStock,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* CATEGORY SECTION */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-300">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    {showAddCategory ? (
                      <>
                        <X className="h-4 w-4" /> Cancel
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Add New Category
                      </>
                    )}
                  </button>
                </div>

                {/* Add New Category Form */}
                {showAddCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 mb-4"
                  >
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category name"
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={addingCategory || !newCategory.trim()}
                      className="bg-emerald-700 hover:bg-emerald-600 px-4 py-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addingCategory ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Category Select */}
                <div className="space-y-2">
                  <select
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        category: e.target.value,
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  {/* Category List with Delete Buttons */}
                  {categories.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-2">
                        Available Categories:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <div
                            key={category}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                              newProduct.category === category
                                ? "bg-blue-900 border border-blue-700"
                                : "bg-gray-700 hover:bg-gray-600"
                            }`}
                          >
                            <span className="text-white text-sm">
                              {category}
                            </span>
                            <button
                              type="button"
                              onClick={() => openDeleteConfirm(category)}
                              disabled={
                                deletingCategory === category ||
                                newProduct.category === category
                              }
                              className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title={
                                newProduct.category === category
                                  ? "Cannot delete selected category"
                                  : "Delete category"
                              }
                            >
                              {deletingCategory === category ? (
                                <Loader className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* IMAGES */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Images * (Max 10, 5MB each)
                </label>
                <input
                  type="file"
                  id="images"
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                <label
                  htmlFor="images"
                  className="cursor-pointer bg-gray-700 hover:bg-gray-600 border-2 border-dashed border-gray-600 rounded-lg px-4 py-6 text-white flex flex-col items-center justify-center transition-colors"
                >
                  <Upload className="h-8 w-8 mb-2 text-gray-400" />
                  <span>Click to upload images</span>
                  <span className="text-sm text-gray-400 mt-1">
                    PNG, JPG, WEBP up to 5MB
                  </span>
                </label>
              </div>

              {/* IMAGE PREVIEW */}
              {newProduct.images.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300">
                      Uploaded Images ({newProduct.images.length}/10)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setNewProduct((prev) => ({ ...prev, images: [] }))
                      }
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {newProduct.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`preview-${index}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-medium py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01] active:scale-[0.99]"
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-bold text-white">Delete Category</h3>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the category{" "}
              <span className="font-bold text-white">
                "{showDeleteConfirm}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(showDeleteConfirm)}
                disabled={deletingCategory === showDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {deletingCategory === showDeleteConfirm ? (
                  <span className="flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CreateProductForm;
