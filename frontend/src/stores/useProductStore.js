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
      return true; 
    } catch (error) {
      console.error(
        "Error creating product:",
        error.response?.data || error.message
      );
      toast.error("Failed to create product. Please try again.");
      set({ loading: false });

      return false;
    }
  },

  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const response = await axios.get("/products");
      set({ products: response.data.products, loading: false });
    } catch (error) {
      console.error("Error fetching products:", error);
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
      console.debug(
        "Failed to load category products.",
        error?.message || error
      );
      set({ loading: false });
    }
  },

  deleteProduct: async (productId, deleteType = "archive") => {
    try {
      if (deleteType === "permanent") {
        // Use permanent delete endpoint
        await axios.delete(`/products/${productId}/permanent`);
      } else {
        // Use regular delete endpoint (archive)
        await axios.delete(`/products/${productId}`);
      }

      set((prevProducts) => ({
        products: prevProducts.products.filter(
          (product) => product._id !== productId
        ),
      }));

      const message =
        deleteType === "permanent"
          ? "Product permanently deleted successfully."
          : "Product archived successfully.";

      toast.success(message);
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);

      const errorMessage =
        deleteType === "permanent"
          ? "Failed to permanently delete product. Please try again."
          : "Failed to archive product. Please try again.";

      toast.error(errorMessage);
      return false;
    }
  },
  toggleFeaturedProduct: async (productId) => {
    try {
      const response = await axios.patch(`/products/${productId}`);
      set((prevProducts) => ({
        products: prevProducts.products.map((product) =>
          product._id === productId
            ? { ...product, isFeatured: response.data.isFeatured }
            : product
        ),
      }));
      toast.success("Product updated successfully.");
    } catch (error) {
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
  clearFeaturedCache: async () => {
    try {
      await axios.delete("/api/products/cache/featured");
      toast.success("Featured products cache cleared!");
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast.error("Failed to clear cache");
    }
  },
  checkVariantAvailability: async (productId, size, color, quantity = 1) => {
    try {
      const response = await axios.get(
        `/api/products/${productId}/check-availability`,
        {
          params: { size, color, quantity },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error checking availability:", error);
      return { available: false, availableStock: 0 };
    }
  },

  checkCartAvailability: async (cartItems) => {
    try {
      const response = await axios.post(
        "/api/products/check-cart-availability",
        {
          cartItems,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error checking cart availability:", error);
      return { allAvailable: false, unavailableItems: [] };
    }
  },

  // Add function to fetch variant stock
  fetchVariantStock: async (productId, size, color) => {
    try {
      const response = await axios.get(`/products/stock/${productId}`, {
        params: { size, color },
      });
      return response.data.stock;
    } catch (error) {
      console.error("Error fetching variant stock:", error);
      return 0;
    }
  },

  updateVariantInventory: async (productId, variantId, quantityChange) => {
    try {
      const res = await axios.put(
        `/products/${productId}/variants/${variantId}/inventory`,
        {
          quantityChange: quantityChange,
        }
      );

      set((state) => ({
        products: state.products.map((product) => {
          if (product._id === productId) {
            // Update the specific variant's countInStock
            const updatedVariants = product.variants?.map((variant) =>
              variant._id === variantId
                ? { ...variant, countInStock: res.data.countInStock }
                : variant
            );

            return {
              ...product,
              variants: updatedVariants,
              countInStock: res.data.productStock,
            };
          }
          return product;
        }),
      }));

      return res.data;
    } catch (error) {
      console.error("Error updating variant inventory:", error);
      throw error;
    }
  },

  updateVariantStockBulk: async (productId, variantUpdates) => {
    try {
      const res = await axios.put(`/products/${productId}/variants`, {
        variants: variantUpdates,
      });

      set((state) => ({
        products: state.products.map((product) =>
          product._id === productId
            ? {
                ...product,
                variants: res.data.variants,
                countInStock: res.data.countInStock,
              }
            : product
        ),
      }));

      return res.data;
    } catch (error) {
      console.error("Error updating variant stock:", error);
      throw error;
    }
  },
}));
