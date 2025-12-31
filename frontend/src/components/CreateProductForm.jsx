import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  Upload,
  Loader,
  Plus,
  Trash2,
  X,
  Archive,
  Info,
  ChevronRight,
  Package,
  ShieldAlert,
  AlertOctagon,
  CheckCircle,
  Lock,
  Database,
  FileArchive,
  FileX,
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
  const [categoriesData, setCategoriesData] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [productCount, setProductCount] = useState(0);
  const [deleteType, setDeleteType] = useState("archive");
  const [fetchingProductCount, setFetchingProductCount] = useState(false);

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
        setCategoriesData(res.data);
        setCategories(res.data.map((c) => c.name));
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
      const productData = { ...newProduct };

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
    if (!newCategory.trim()) {
      return toast.error("Category name cannot be empty.");
    }

    if (categories.includes(newCategory.trim())) {
      return toast.error("Category already exists.");
    }

    setAddingCategory(true);
    try {
      const res = await axios.post("/categories", {
        name: newCategory.trim(),
      });

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

  // Open delete confirmation and fetch product count
  const openDeleteConfirm = async (categoryName) => {
    if (newProduct.category === categoryName) {
      toast.error(
        "Cannot delete currently selected category. Please select another category first."
      );
      return;
    }

    const category = categoriesData.find((c) => c.name === categoryName);
    if (!category) {
      toast.error("Category not found.");
      return;
    }

    setCategoryToDelete({ id: category._id, name: categoryName });
    setFetchingProductCount(true);
    setDeleteType("archive");

    try {
      const res = await axios.get(`/categories/${category._id}/product-count`);
      setProductCount(res.data.productCount || 0);
    } catch (error) {
      console.error("Error fetching product count:", error);
      setProductCount(0);
    } finally {
      setFetchingProductCount(false);
      setShowDeleteConfirm(true);
    }
  };

  // Delete category with selected option
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeletingCategory(categoryToDelete.name);

    try {
      const res = await axios.delete(
        `/categories/delete/${categoryToDelete.id}`,
        {
          data: { deleteType },
        }
      );

      if (res.data.success) {
        // Update local state
        setCategoriesData((prev) =>
          prev.filter((c) => c.name !== categoryToDelete.name)
        );
        setCategories((prev) =>
          prev.filter((c) => c !== categoryToDelete.name)
        );

        // If deleted category was selected, clear selection
        if (newProduct.category === categoryToDelete.name) {
          setNewProduct((prev) => ({ ...prev, category: "" }));
        }

        toast.success(res.data.message);

        // Refresh categories list
        fetchCategories();
      } else {
        toast.error(res.data.message || "Failed to delete category.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete category."
      );
    } finally {
      setDeletingCategory(null);
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      setProductCount(0);
      setDeleteType("archive");
    }
  };

  // Handle variant generation
  const generateVariants = () => {
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

    const variants = [];
    const sizes = newProduct.sizes.length > 0 ? newProduct.sizes : [""];
    const colors = newProduct.colors.length > 0 ? newProduct.colors : [""];

    sizes.forEach((size) => {
      colors.forEach((color) => {
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

    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 5 * 1024 * 1024;

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
          images: [...prev.images, ...images].slice(0, 10),
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
    <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen">
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

              {/* DESCRIPTION */}
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
                    className="h-full [&_.ql-container]:!min-h-[120px] [&_.ql-editor]:!min-h-[120px] [&_.ql-container]:bg-gray-700 [&_.ql-editor]:text-white"
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
                              disabled={newProduct.category === category}
                              className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title={
                                newProduct.category === category
                                  ? "Cannot delete selected category"
                                  : "Delete category"
                              }
                            >
                              <Trash2 className="h-3 w-3" />
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

      {/* Enhanced Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && categoryToDelete && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-lg w-full h-150 overflow-y-scroll overflow-hidden border border-gray-700"
            >
              {/* Modal Header */}
              <div className="relative p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl ${
                        productCount > 0 && deleteType === "permanent"
                          ? "bg-red-900/30 border border-red-800/50"
                          : "bg-yellow-900/30 border border-yellow-800/50"
                      }`}
                    >
                      {productCount > 0 && deleteType === "permanent" ? (
                        <AlertOctagon className="h-6 w-6 text-red-400" />
                      ) : (
                        <ShieldAlert className="h-6 w-6 text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {productCount > 0
                          ? `Delete "${categoryToDelete?.name}"`
                          : `Remove "${categoryToDelete?.name}"`}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {productCount > 0
                          ? `${productCount} product(s) will be affected`
                          : "Empty category removal"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setCategoryToDelete(null);
                      setProductCount(0);
                      setDeleteType("archive");
                    }}
                    disabled={deletingCategory}
                    className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 group"
                  >
                    <X className="h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {fetchingProductCount ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Database className="h-5 w-5 text-blue-400 animate-pulse" />
                      </div>
                    </div>
                    <p className="mt-4 text-gray-400 font-medium">
                      Checking category usage...
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Please wait a moment
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Summary Card */}
                    <div
                      className={`rounded-xl p-4 mb-6 ${
                        productCount > 0
                          ? "bg-gradient-to-r from-red-900/20 to-red-800/10 border border-red-800/30"
                          : "bg-gradient-to-r from-blue-900/20 to-blue-800/10 border border-blue-800/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {productCount > 0 ? (
                          <div className="p-2 bg-red-900/50 rounded-lg">
                            <Package className="h-5 w-5 text-red-400" />
                          </div>
                        ) : (
                          <div className="p-2 bg-blue-900/50 rounded-lg">
                            <Info className="h-5 w-5 text-blue-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {productCount > 0
                              ? `Category contains ${productCount} product(s)`
                              : "This category is currently empty"}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {productCount > 0
                              ? "Choose how to handle existing products:"
                              : "Only the category name will be removed from the system."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Cards - Only show if there are products */}
                    {productCount > 0 && (
                      <div className="space-y-3 mb-6">
                        <div className="text-sm font-medium text-gray-300 mb-2">
                          Select action for {productCount} product(s):
                        </div>

                        {/* Archive Option */}
                        <button
                          type="button"
                          onClick={() => setDeleteType("archive")}
                          className={`w-full p-4 rounded-xl border transition-all duration-200 ${
                            deleteType === "archive"
                              ? "bg-gradient-to-r from-blue-900/40 to-blue-800/30 border-blue-600 ring-2 ring-blue-500/30"
                              : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-lg ${
                                deleteType === "archive"
                                  ? "bg-blue-900/50"
                                  : "bg-gray-700"
                              }`}
                            >
                              <FileArchive
                                className={`h-5 w-5 ${
                                  deleteType === "archive"
                                    ? "text-blue-400"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center justify-between">
                                <p
                                  className={`font-medium ${
                                    deleteType === "archive"
                                      ? "text-white"
                                      : "text-gray-300"
                                  }`}
                                >
                                  Archive Products
                                </p>
                                {deleteType === "archive" && (
                                  <CheckCircle className="h-5 w-5 text-blue-400" />
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mt-1">
                                Move all products to archive for later recovery
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded">
                                  Safe Option
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">
                                  Reversible
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Permanent Delete Option */}
                        <button
                          type="button"
                          onClick={() => setDeleteType("permanent")}
                          className={`w-full p-4 rounded-xl border transition-all duration-200 ${
                            deleteType === "permanent"
                              ? "bg-gradient-to-r from-red-900/40 to-red-800/30 border-red-600 ring-2 ring-red-500/30"
                              : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-lg ${
                                deleteType === "permanent"
                                  ? "bg-red-900/50"
                                  : "bg-gray-700"
                              }`}
                            >
                              <FileX
                                className={`h-5 w-5 ${
                                  deleteType === "permanent"
                                    ? "text-red-400"
                                    : "text-gray-400"
                                }`}
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center justify-between">
                                <p
                                  className={`font-medium ${
                                    deleteType === "permanent"
                                      ? "text-white"
                                      : "text-gray-300"
                                  }`}
                                >
                                  Delete Permanently
                                </p>
                                {deleteType === "permanent" && (
                                  <Lock className="h-5 w-5 text-red-400" />
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mt-1">
                                Permanently delete all products and their data
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-1 bg-red-900/30 text-red-300 rounded">
                                  Irreversible
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">
                                  High Risk
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Critical Warning for Permanent Delete */}
                    {productCount > 0 && deleteType === "permanent" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-800/40 rounded-xl p-4 mb-6"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-900/50 rounded-lg flex-shrink-0">
                            <AlertOctagon className="h-5 w-5 text-red-400" />
                          </div>
                          <div>
                            <p className="text-red-200 font-medium mb-2">
                              Critical Action Required
                            </p>
                            <ul className="text-red-300 text-sm space-y-1.5">
                              <li className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>
                                  {productCount} product(s) will be permanently
                                  deleted
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>
                                  All product images and variants will be
                                  removed
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>
                                  This action cannot be undone or recovered
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>
                                  Sales history and analytics will be
                                  permanently lost
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Archive Warning */}
                    {productCount > 0 && deleteType === "archive" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-800/40 rounded-xl p-4 mb-6"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-900/50 rounded-lg flex-shrink-0">
                            <Info className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-blue-200 font-medium mb-2">
                              Safe Archive Process
                            </p>
                            <ul className="text-blue-300 text-sm space-y-1.5">
                              <li className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>
                                  Products moved to archive for safe keeping
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>
                                  Can be restored from archived products section
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>
                                  Sales history and analytics preserved
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>
                                  No data loss - products remain recoverable
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setCategoryToDelete(null);
                          setProductCount(0);
                          setDeleteType("archive");
                        }}
                        disabled={deletingCategory}
                        className="px-5 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 disabled:opacity-50 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteCategory}
                        disabled={deletingCategory}
                        className={`px-5 py-2.5 text-white rounded-lg transition-all duration-200 disabled:opacity-50 font-medium flex items-center gap-2 ${
                          deleteType === "permanent"
                            ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                            : "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                        }`}
                      >
                        {deletingCategory ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            {deleteType === "permanent"
                              ? "Deleting..."
                              : "Archiving..."}
                          </>
                        ) : (
                          <>
                            {deleteType === "permanent" ? (
                              <>
                                <Trash2 className="h-4 w-4" />
                                Delete Permanently
                              </>
                            ) : (
                              <>
                                <Archive className="h-4 w-4" />
                                {productCount > 0
                                  ? "Archive & Delete"
                                  : "Delete Category"}
                              </>
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Progress Indicator */}
              {deletingCategory && (
                <div className="px-6 pb-4">
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "linear" }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Processing action, please wait...
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateProductForm;
