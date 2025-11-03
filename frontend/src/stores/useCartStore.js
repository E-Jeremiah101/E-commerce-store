import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const GUEST_CART_KEY = "guest_cart_v1";

const loadGuestCart = () => {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load guest cart from localStorage", e);
    return [];
  }
};

const saveGuestCart = (cart) => {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Failed to save guest cart to localStorage", e);
  }
};

const initialGuestCart = loadGuestCart();

export const useCartStore = create((set, get) => ({
  // initialize cart from guest storage so guests can see their cart immediately
  cart: initialGuestCart,
  coupon: null,
  subtotal: initialGuestCart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 0),
    0
  ),
  total: initialGuestCart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 0),
    0
  ),
  isCouponApplied: false,
  isLoading: false,

  getMyCoupon: async () => {
    try {
      const response = await axios.get("/coupons");
      set({ coupon: response.data });
    } catch (error) {
      console.error("Error fetching coupon:", error);
      // Suppress noisy toast messages for background coupon fetches.
      // Log for debugging but avoid spamming the user with repeated toasts.
      console.debug(
        "Unable to load coupons at the moment.",
        error?.message || error
      );
    }
  },
  applyCoupon: async (code) => {
    try {
      const response = await axios.post("/coupons/validate", { code });
      set({ coupon: response.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (error) {
      console.error("Error applying coupon:", error);
      toast.error(
        error.response?.data?.message || "Invalid or expired coupon code."
      );
    }
  },
  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  getCartItems: async () => {
    try {
      // If user is logged in, fetch from server. Otherwise use guest cart from localStorage.
      const user = (await import("./useUserStore")).useUserStore.getState()
        .user;
      if (!user) {
        const guestCart = loadGuestCart();
        set({ cart: guestCart });
        get().calculateTotals();
        return;
      }

      const res = await axios.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      console.error("Error fetching cart items:", error);
      set({ cart: loadGuestCart() });
    }
  },
  clearCart: async () => {
    const user = (await import("./useUserStore")).useUserStore.getState().user;
    set({ cart: [], coupon: null, total: 0, subtotal: 0 });
    if (!user) {
      saveGuestCart([]);
      return;
    }
    try {
      await axios.delete("/cart/all");
    } catch (e) {
      console.error("Failed to clear server cart:", e);
    }
  },
  addToCart: async (product, selectedSize, selectedColor) => {
    const { calculateTotals } = get();
    set({ isLoading: true });
    try {
      const user = (await import("./useUserStore")).useUserStore.getState()
        .user;
      if (!user) {
        // guest flow: update local state and localStorage
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
          saveGuestCart(newCart);
          toast.success("Product added to cart");
          return { cart: newCart };
        });
        calculateTotals();
        return;
      }

      // logged in: existing behavior
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

      calculateTotals();
    } catch (error) {
      console.error("Error adding product to cart:", error);
      toast.error("Failed to add product. Please try again.");
    } finally {
      set({ isLoading: false });
    }
  },
  removeFromCart: async (productId, size, color) => {
    try {
      const user = (await import("./useUserStore")).useUserStore.getState()
        .user;
      if (!user) {
        set((prevState) => {
          const newCart = prevState.cart.filter(
            (item) =>
              !(
                item._id === productId &&
                item.size === size &&
                item.color === color
              )
          );
          saveGuestCart(newCart);
          return { cart: newCart };
        });
        get().calculateTotals();
        return;
      }

      await axios.delete(`/cart`, { data: { productId, size, color } });
      set((prevState) => ({
        cart: prevState.cart.filter(
          (item) =>
            !(
              item._id === productId &&
              item.size === size &&
              item.color === color
            )
        ),
      }));
      get().calculateTotals();
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove item. Please try again.");
    }
  },
  updateQuantity: async (productId, quantity, size, color) => {
    if (quantity === 0) {
      get().removeFromCart(productId, size, color);
      return;
    }

    try {
      const user = (await import("./useUserStore")).useUserStore.getState()
        .user;
      if (!user) {
        set((prevState) => {
          const newCart = prevState.cart.map((item) =>
            item._id === productId && item.size === size && item.color === color
              ? { ...item, quantity: Math.max(quantity, 1) }
              : item
          );
          saveGuestCart(newCart);
          return { cart: newCart };
        });
        get().calculateTotals();
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
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Unable to update item quantity.");
    }
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
  // Sync guest cart to server after user logs in
  syncGuestCart: async () => {
    const user = (await import("./useUserStore")).useUserStore.getState().user;
    if (!user) return;

    const guestCart = loadGuestCart();
    if (!guestCart || guestCart.length === 0) return;

    try {
      // merge guest items into server cart
      for (const item of guestCart) {
        const times = item.quantity || 1;
        for (let i = 0; i < times; i++) {
          await axios.post("/cart", {
            productId: item._id,
            ...(item.size && { size: item.size }),
            ...(item.color && { color: item.color }),
          });
        }
      }

      // clear guest cart and refresh server cart
      saveGuestCart([]);
      const res = await axios.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      console.error("Failed to sync guest cart:", error);
    }
  },
}));
