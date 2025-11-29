import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
  try {
    const cartItems = await Promise.all(
      req.user.cartItems.map(async (cartItem) => {
        const product = await Product.findById(cartItem.product);

        // ✅ FIXED: Check if product exists AND is not archived
        if (!product || product.archived || product.isActive === false) {
          return null; // Remove from cart if product is deleted/archived
        }

        return {
          ...product.toJSON(),
          quantity: cartItem.quantity,
          size: cartItem.size,
          color: cartItem.color,
        };
      })
    );

    // Remove null items (archived/deleted products)
    const validCartItems = cartItems.filter(Boolean);

    // ✅ FIXED: Also clean up the user's cartItems array
    if (validCartItems.length !== req.user.cartItems.length) {
      req.user.cartItems = req.user.cartItems.filter(
        (cartItem, index) => cartItems[index] !== null
      );
      await req.user.save();
    }

    res.json(validCartItems);
  } catch (error) {
    console.log("Error in getCartProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, size, color } = req.body;
    const user = req.user;

    console.log("🛒 Backend addToCart received:", { productId, size, color });

    const product = await Product.findById(productId);

    // ✅ FIXED: Check if product exists AND is not archived
    if (!product || product.archived || product.isActive === false) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find variant stock - FIXED LOGIC
    let availableStock = product.countInStock;
    let variant = null;

    if (product.variants && product.variants.length > 0) {
      variant = product.variants.find((v) => {
        const sizeMatches = size
          ? v.size === size
          : !v.size || v.size === "" || v.size === "Standard";
        const colorMatches = color
          ? v.color === color
          : !v.color || v.color === "" || v.color === "Standard";
        return sizeMatches && colorMatches;
      });

      console.log("📊 Found variant:", variant);

      if (variant) {
        availableStock = variant.countInStock;
      } else {
        return res
          .status(400)
          .json({ message: "This variant is not available" });
      }
    }

    console.log("📊 Available stock:", availableStock);

    if (availableStock <= 0) {
      return res.status(400).json({ message: "Out of stock" });
    }

    // Look for existing item in user's cart - FIXED MATCHING
    const existingItem = user.cartItems.find((item) => {
      const productMatch = item.product?.toString() === productId;
      const sizeMatch = size
        ? item.size === size
        : !item.size || item.size === "";
      const colorMatch = color
        ? item.color === color
        : !item.color || item.color === "";
      return productMatch && sizeMatch && colorMatch;
    });

    if (existingItem) {
      if (existingItem.quantity + 1 > availableStock) {
        return res
          .status(400)
          .json({ message: `Only ${availableStock} left in stock` });
      }
      existingItem.quantity += 1;
    } else {
      const newItem = {
        product: productId,
        quantity: 1,
      };
      if (size) newItem.size = size;
      if (color) newItem.color = color;

      user.cartItems.push(newItem);
    }

    await user.save();

    // Return the updated cart items with validation
    const cartItems = await Promise.all(
      user.cartItems.map(async (cartItem) => {
        const product = await Product.findById(cartItem.product);

        // ✅ FIXED: Filter out archived products in response too
        if (!product || product.archived || product.isActive === false) {
          return null;
        }

        return {
          ...product.toJSON(),
          quantity: cartItem.quantity,
          size: cartItem.size || "",
          color: cartItem.color || "",
        };
      })
    );

    res.json(cartItems.filter(Boolean));
  } catch (error) {
    console.log("Error in addToCart controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId, size, color } = req.body;
    const user = req.user;

    user.cartItems = user.cartItems.filter(
      (item) =>
        !(
          item.product?.toString() === productId &&
          item.size === size &&
          item.color === color
        )
    );

    await user.save();

    // ✅ FIXED: Return validated cart items
    const validatedCartItems = await getValidatedCartItems(user.cartItems);
    res.json(validatedCartItems);
  } catch (error) {
    console.log("Error in removeFromCart controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const user = req.user;
    user.cartItems = [];
    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { size, color, quantity } = req.body;
    const user = req.user;

    console.log("🔄 Backend updateQuantity:", {
      productId,
      size,
      color,
      quantity,
    });

    // Validate quantity
    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const product = await Product.findById(productId);

    // Check if product exists and is available
    if (!product || product.archived || product.isActive === false) {
      // Remove from cart if product is archived
      user.cartItems = user.cartItems.filter(
        (item) =>
          !(
            item.product?.toString() === productId &&
            item.size === (size || "") &&
            item.color === (color || "")
          )
      );
      await user.save();
      const validatedCartItems = await getValidatedCartItems(user.cartItems);
      return res.status(404).json({
        message: "Product no longer available",
        cart: validatedCartItems,
      });
    }

    // Find variant stock - use consistent matching logic
    let availableStock = product.countInStock;
    let variant = null;

    if (product.variants && product.variants.length > 0) {
      variant = product.variants.find((v) => {
        const sizeMatches = size
          ? v.size === size
          : !v.size || v.size === "" || v.size === "Standard";
        const colorMatches = color
          ? v.color === color
          : !v.color || v.color === "" || v.color === "Standard";
        return sizeMatches && colorMatches;
      });

      if (variant) {
        availableStock = variant.countInStock;
      }
    }

    // Check stock availability
    if (quantity > availableStock) {
      return res.status(400).json({
        message: `Only ${availableStock} left in stock`,
        availableStock,
      });
    }

    // Find existing cart item with consistent matching
    const existingItem = user.cartItems.find((item) => {
      const productMatch = item.product?.toString() === productId;
      const sizeMatch = size
        ? item.size === size
        : !item.size || item.size === "";
      const colorMatch = color
        ? item.color === color
        : !item.color || item.color === "";
      return productMatch && sizeMatch && colorMatch;
    });

    if (!existingItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      user.cartItems = user.cartItems.filter(
        (item) =>
          !(
            item.product?.toString() === productId &&
            item.size === (size || "") &&
            item.color === (color || "")
          )
      );
    } else {
      existingItem.quantity = quantity;
    }

    await user.save();

    // Return validated cart items
    const validatedCartItems = await getValidatedCartItems(user.cartItems);
    res.json(validatedCartItems);
  } catch (error) {
    console.log("Error in updateQuantity controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ NEW: Helper function to validate cart items
const getValidatedCartItems = async (cartItems) => {
  const validatedItems = await Promise.all(
    cartItems.map(async (cartItem) => {
      const product = await Product.findById(cartItem.product);

      if (!product || product.archived || product.isActive === false) {
        return null;
      }

      return {
        ...product.toJSON(),
        quantity: cartItem.quantity,
        size: cartItem.size || "",
        color: cartItem.color || "",
      };
    })
  );

  return validatedItems.filter(Boolean);
};
