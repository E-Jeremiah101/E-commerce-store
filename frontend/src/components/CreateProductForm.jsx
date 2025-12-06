import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader, Plus, Trash2 } from "lucide-react";
import { useProductStore } from "../stores/useProductStore.js";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import toast from "react-hot-toast";
import axios from "../lib/axios.js";
import { useUserStore } from "../stores/useUserStore.js";

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
  const {user} = useUserStore()

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
    <>
    <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className=" flex justify-center align-middle text-black py-5 ">
              <h1 className="text-3xl font-bold">
                Welcome👋 {user?.firstname || "Admin"}
              </h1>
            </div>
          </motion.div>
    <motion.div
      className="bg-gray-800 shadow-lg rounded-lg p-8 mb-8 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="text-2xl font-semibold mb-6 text-white tracking-wider">
        Create a New Product
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* PRODUCT NAME */}
        <div>
          <label className="block text-sm font-medium text-gray-300 tracking-wider">
            Product Name
          </label>
          <input
            type="text"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-gray-600"
            required
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-sm font-medium text-gray-300 tracking-wider">
            Description
          </label>
          <ReactQuill
            modules={modules}
            formats={formats}
            value={newProduct.description}
            onChange={handleDescriptionChange}
            className="bg-gray-700 rounded-md"
          />
        </div>

        {/* PRICE */}
        <div>
          <label className="block text-sm font-medium text-gray-300 tracking-wider">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-gray-600"
            required
          />
        </div>

        {/* SIZES */}
        <div>
          <label className="block text-sm font-medium text-gray-300 tracking-wider">
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
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
          />
        </div>

        {/* COLORS */}
        <div>
          <label className="block text-sm font-medium text-gray-300 tracking-wider">
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
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
          />
        </div>

        {/* VARIANT MANAGEMENT */}
        <div className="border border-gray-600 rounded-md p-4">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-300 tracking-wider">
              Product Variants & Inventory
            </label>
            <button
              type="button"
              onClick={generateVariants}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              Generate Variants
            </button>
          </div>

          {newProduct.variants.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {newProduct.variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-gray-700 p-2 rounded"
                >
                  <div className="flex-1">
                    <span className="text-white text-sm">
                      {getVariantDisplayName(variant)}
                    </span>
                    <span className="text-gray-400 text-xs block">
                      {variant.sku}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={variant.countInStock}
                    onChange={(e) => updateVariantStock(index, e.target.value)}
                    placeholder="Stock"
                    className="w-20 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              Add sizes and/or colors, then click "Generate Variants" to set up
              inventory per variant.
            </p>
          )}

          {/* TOTAL STOCK DISPLAY */}
          {newProduct.variants.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <p className="text-green-400 text-sm">
                Total Stock: {newProduct.countInStock} units
              </p>
            </div>
          )}
        </div>

        {/* CATEGORY SELECT + CREATE NEW */}
        <div>
          <label className="block text-sm font-medium text-gray-300 tracking-wider">
            Category
          </label>
          <div className="flex items-center gap-2">
            <select
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
              className="mt-1 flex-1 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-gray-600"
              required
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="New category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-md py-2 px-2 text-white w-32 focus:ring-2 focus:ring-gray-600"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={addingCategory}
                className="bg-emerald-700 hover:bg-emerald-600 p-2 rounded-md text-white disabled:opacity-50"
              >
                {addingCategory ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* IMAGES */}
        <div>
          <input
            type="file"
            id="images"
            onChange={handleImageChange}
            className="sr-only"
            accept="image/*"
            multiple
            required
          />
          <label
            htmlFor="images"
            className="cursor-pointer bg-gray-700 border border-gray-600 hover:bg-gray-600 rounded-md shadow-sm py-2 px-3 text-sm text-white"
          >
            <Upload className="h-5 w-5 inline-block mr-2" />
            Upload Images
          </label>
        </div>

        {newProduct.images.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {newProduct.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`preview-${index}`}
                className="w-20 h-20 object-cover rounded border border-gray-600"
              />
            ))}
          </div>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" /> Creating...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-5 w-5" /> Create Product
            </>
          )}
        </button>
      </form>
    </motion.div>
    </>
  );
};

export default CreateProductForm;
