import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,

  getMyCoupon: async () => {
    try {
      const response = await axios.get("/coupons");
      set({ coupon: response.data });
    } catch (error) {
      console.error("Error fetching coupon:", error);
    }
  },
  applyCoupon: async (code) => {
    try {
      const response = await axios.post("/coupons/validate", { code });
      set({ coupon: response.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    }
  },
  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  getCartItems: async () => {
    try {
      const res = await axios.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      set({ cart: [] });
      toast.error(error.response.data.message || "An error occurred");
    }
  },
  clearCart: async () => {
    set({ cart: [], coupon: null, total: 0, subtotal: 0 });
  },
  addToCart: async (product, selectedSize, selectedColor) => {
    try {
      await axios.post("/cart", {
        productId: product._id,
        ...(selectedSize && { size: selectedSize }),
  ...(selectedColor && { color: selectedColor }),
      });
      toast.success("Product added to cart");

      set((prevState) => {
        const existingItem = prevState.cart.find(
          (item) =>
            item._id === product._id &&
            item.size === selectedSize &&
            item.color === selectedColor
        );
        const newCart = existingItem
          ? prevState.cart.map((item) =>
              item._id === product._id &&
              item.size === selectedSize &&
              item.color === selectedColor
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [
              ...prevState.cart,
              {
                ...product,
                quantity: 1,
                size: selectedSize,
                color: selectedColor,
              },
            ];
        return { cart: newCart };
      });
      get().calculateTotals();
    } catch (error) {
      toast.error(error.response.data.message || "An error occurred");
    }
  },
  removeFromCart: async (productId, size, color) => {
    await axios.delete(`/cart`, { data: { productId, size, color } });
    set((prevState) => ({
      cart: prevState.cart.filter(
        (item) =>
          !(item._id === productId && item.size === size && item.color === color)
      ),
    }));
    get().calculateTotals();
  },
  updateQuantity: async (productId, quantity, size, color) => {
    if (quantity === 0) {
      get().removeFromCart(productId, size, color);
      return;
    }

    await axios.put(`/cart/${productId}`, { quantity, size, color });
    set((prevState) => ({
      cart: prevState.cart.map((item) =>
        item._id === productId && item.size === size && item.color === color
          ? { ...item, quantity: Math.max(quantity, 1) }
          : item
      ),
    }));
    get().calculateTotals();
  },
  calculateTotals: () => {
    const { cart, coupon } = get();
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    let total = subtotal;

    if (coupon) {
      const discount = subtotal * (coupon.discountPercentage / 100);
      total = subtotal - discount;
    }

    set({ subtotal, total });
  },
}));