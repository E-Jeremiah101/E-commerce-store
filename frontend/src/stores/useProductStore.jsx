import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set, get) => ({
  products: [],
  product: null,
  loading: false,

  setProducts: (products) => set({ products }),
  createProduct: async (productData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/products", productData);
      set((prevState) => ({
        products: [...prevState.products, res.data],
        loading: false,
      }));
      toast.success("Product created successfully!");
    } catch (error) {
      console.error(
        "Error creating product:",
        error.response?.data || error.message
      );
      toast.error("Failed to create product. Please try again.");
      set({ loading: false });
    }
  },
  reduceStock: async (productId) => {
    try {
      const product = get().products.find((p) => p._id === productId); // <-- now works
      if (!product || product.countInStock <= 0) {
        throw new Error("No stock left");
      }

      const res = await axios.put(`/products/${productId}/reduce-stock`, {
        quantity: 1, // reduce by 1
      });

      set((state) => ({
        products: state.products.map((p) =>
          p._id === productId
            ? { ...p, countInStock: res.data.countInStock }
            : p
        ),
      }));

      return res.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/products");
      set({ products: response.data.products, loading: false });
    } catch (error) {
      console.error("Error fetching products:", error);
      // Suppress noisy toast for background product fetch failures.
      console.debug("Unable to load products.", error?.message || error);
      set({ loading: false });
    }
  },
  fetchProductsByCategory: async (category) => {
    set({ loading: true });
    try {
      const response = await axios.get(`/products/category/${category}`);
      set({ products: response.data.products, loading: false });
    } catch (error) {
      console.error("Error fetching category products:", error);
      // Suppress noisy toast for category fetch failures.
      console.debug(
        "Failed to load category products.",
        error?.message || error
      );
      set({ loading: false });
    }
  },
  deleteProduct: async (productId) => {
    set({ loading: true });
    try {
      await axios.delete(`/products/${productId}`);
      set((prevProducts) => ({
        products: prevProducts.products.filter(
          (product) => product._id !== productId
        ),
        loading: false,
      }));
      toast.success("Product deleted successfully.");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product. Please try again.");
      set({ loading: false });
    }
  },
  toggleFeaturedProduct: async (productId) => {
    set({ loading: true });
    try {
      const response = await axios.patch(`/products/${productId}`);
      // this will update the isFeatured prop of the product
      set((prevProducts) => ({
        products: prevProducts.products.map((product) =>
          product._id === productId
            ? { ...product, isFeatured: response.data.isFeatured }
            : product
        ),
        loading: false,
      }));
      toast.success("Product updated successfully.");
    } catch (error) {
      set({ loading: false });
      console.error("Error updating product:", error);
      toast.error("Failed to update product.");
    }
  },
  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      let url = "/products/featured";
      const response = await axios.get("/products/featured");
      set({ products: response.data, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false });
      console.log("Error fetching featured products:", error);
    }
  },
  fetchProductById: async (id) => {
    try {
      const res = await axios.get(`/products/${id}`);
      const product = res.data.product || res.data;
      set({ product });
      return product;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  },
}));
