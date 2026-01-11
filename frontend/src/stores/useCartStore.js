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
      console.log(" Starting addToCart:", {
        productId: product._id,
        selectedSize,
        selectedColor,
      });

      const variantStockResponse = await axios.get(
        `/products/stock/${product._id}`,
        {
          params: {
            size: selectedSize || undefined,
            color: selectedColor || undefined,
          },
        }
      );

      const availableStock = variantStockResponse.data.stock;
      console.log(" Available stock:", availableStock);

      if (availableStock <= 0) {
        toast.error("This variant is out of stock");
        set({ isLoading: false });
        return;
      }

      const user = (await import("./useUserStore")).useUserStore.getState()
        .user;

      if (!user) {
        console.log(" Guest cart flow");
        set((prevState) => {
          const existingItem = prevState.cart.find(
            (item) =>
              item._id === product._id &&
              item.size === selectedSize &&
              item.color === selectedColor
          );

          if (existingItem && existingItem.quantity + 1 > availableStock) {
            toast.error(
              `Only ${availableStock} left in stock for this variant`
            );
            return prevState;
          }

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
                  size: selectedSize || "",
                  color: selectedColor || "",
                  countInStock: availableStock,
                },
              ];

          saveGuestCart(newCart);
          toast.success("Product added to cart");
          return { cart: newCart };
        });
        calculateTotals();
        set({ isLoading: false });
        return;
      } else {
        const requestBody = {
          productId: product._id,
          size: selectedSize || "",
          color: selectedColor || "",
        };

        console.log(" Sending to server:", requestBody);

        const response = await axios.post("/cart", requestBody);
        console.log(" Server response:", response.data);

        set({ cart: response.data });
        toast.success("Product added to cart");
      }

      calculateTotals();
    } catch (error) {
      console.error(" Error adding product to cart:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      toast.error(
        error.response?.data?.errors?.[0]?.message ||
          error.response?.data?.message ||
          "Failed to add product to cart"
      );

      if (error.response?.status === 400) {
        toast.error(error.response.data?.message || "Invalid product data");
      } else {
        toast.error("Failed to add product. Please try again.");
      }
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

      const requestData = {
        quantity: Math.max(quantity, 1),
        size: size || "",
        color: color || "",
      };

      console.log(" Updating quantity:", { productId, ...requestData });

      const response = await axios.put(`/cart/${productId}`, requestData);

      set({ cart: response.data });
      get().calculateTotals();
    } catch (error) {
      console.error(" Error updating quantity:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      await get().getCartItems();

      if (error.response?.status === 400) {
        toast.error(error.response.data?.message || "Cannot update quantity");
      } else if (error.response?.status === 404) {
        toast.error("Product no longer available");
        await get().getCartItems();
      } else {
        toast.error("Unable to update item quantity.");
      }
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

  validateCartItems: async () => {
    try {
      const { cart } = get();
      const user = (await import("./useUserStore")).useUserStore.getState()
        .user;

      if (!user) {
        const validatedCart = [];

        for (const item of cart) {
          try {
            const response = await axios.get(`/products/${item._id}`);
            const product = response.data.product || response.data;

            if (product && !product.archived && product.isActive !== false) {
              validatedCart.push(item);
            }
          } catch (error) {
            console.log(
              `Product ${item._id} no longer available, removing from cart`
            );
          }
        }

        if (validatedCart.length !== cart.length) {
          set({ cart: validatedCart });
          saveGuestCart(validatedCart);
          get().calculateTotals();
          console.log(
            `Removed ${
              cart.length - validatedCart.length
            } archived products from cart`
          );
        }
      } else {
        const res = await axios.get("/cart");
        set({ cart: res.data });
        get().calculateTotals();
      }
    } catch (error) {
      console.error("Error validating cart items:", error);
    }
  },

  syncGuestCart: async () => {
    const user = (await import("./useUserStore")).useUserStore.getState().user;
    if (!user) return;

    const guestCart = loadGuestCart();
    if (!guestCart || guestCart.length === 0) return;

    try {
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

      saveGuestCart([]);
      const res = await axios.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      console.error("Failed to sync guest cart:", error);
    }
  },
}));
