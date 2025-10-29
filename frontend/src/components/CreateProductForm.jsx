
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader, Plus } from "lucide-react";
import { useProductStore } from "../stores/useProductStore.jsx";
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

  // Handle product creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProduct(newProduct);
      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        images: [],
        sizes: [],
        colors: [],
      });
    } catch (error) {
      toast.error("Error creating product.");
    }
  };

  // Add new category (and refresh list)
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

  //  Handle Quill input
  const handleDescriptionChange = (content) => {
    setNewProduct((prev) => ({ ...prev, description: content }));
  };

  //  Handle image uploads
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

  //  Quill setup
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
    <motion.div
      className="bg-gray-800 shadow-lg rounded-lg p-8 mb-8 max-w-xl mx-auto"
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
  );
};

export default CreateProductForm;
