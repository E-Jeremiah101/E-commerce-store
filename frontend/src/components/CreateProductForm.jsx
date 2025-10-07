import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore.jsx";

const categories = [
  "bottoms",
  "t-shirts",
  "footwears",
  "accessories",
  "jackets&Outerwear",
  "sets&cords",
  "underwear&socks",
  "suits&blazers",
  "bags",
];

const CreateProductForm = () => {
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
      console.log("error creating a product");
    }
  };
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
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-300 tracking-wider"
          >
            Product Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-300 tracking-wider"
          >
            Description
          </label>
          <textarea
            type="description"
            id="description"
            name="description"
            value={newProduct.description}
            onChange={(e) =>
              setNewProduct({ ...newProduct, description: e.target.value })
            }
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            required
          />
        </div>

        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-300 tracking-wider"
          >
            Price
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
            step="0.01"
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            required
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-300 tracking-wider"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            value={newProduct.category}
            onChange={(e) =>
              setNewProduct({ ...newProduct, category: e.target.value })
            }
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:gray-600 focus:border-gray-600"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Sizes Input */}
        <div>
          <label
            htmlFor="sizes"
            className="block text-sm font-medium text-gray-300 tracking-wider"
          >
            Sizes (comma separated)
          </label>
          <input
            type="text"
            id="sizes"
            value={newProduct.sizes.join(", ")}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                sizes: e.target.value.split(",").map((s) => s.trim()),
              })
            }
            placeholder="e.g., S, M, L, XL"
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
          />
        </div>

        {/* Colors Input */}
        <div>
          <label
            htmlFor="colors"
            className="block text-sm font-medium text-gray-300 tracking-wider"
          >
            Colors (comma separated)
          </label>
          <input
            type="text"
            id="colors"
            value={newProduct.colors.join(", ")}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                colors: e.target.value.split(",").map((c) => c.trim()),
              })
            }
            placeholder="e.g., Red, Blue, Green"
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
          />
        </div>

        <div className="mt-1 flex items-center">
          <input
            type="file"
            id="images"
            onChange={handleImageChange}
            className="sr-only"
            accept="image/*"
            required
            multiple
          />
          <label
            htmlFor="images"
            className="cursor-pointer bg-gray-700 border border-gray-600 hover:bg-gray-600 rounded-md shadow-sm py-2 px-3 text-sm 
            text-white focus:outline-none focus:ring-2 focus:ring-o focus:ring-emerald-500 focus:border-emerald-500"
          >
            <Upload className="h-5 w-5 inline-block mr-2 text-white" />
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

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-700 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offest-2  disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader
                className="mr-2 h-5 w-5 animate-spin"
                aria-hidden="true"
              />
              Loading...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Product
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateProductForm;
