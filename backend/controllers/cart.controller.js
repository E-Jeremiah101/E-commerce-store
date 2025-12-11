import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
  try {
    // ✅ Use the updated helper function
    const validCartItems = await getValidatedCartItems(req.user.cartItems);

    // Clean up user's cart if needed
    if (validCartItems.length !== req.user.cartItems.length) {
      // Map back to find which items to remove
      req.user.cartItems = req.user.cartItems.filter((cartItem, index) => {
        const productId = cartItem.product?.toString();
        return validCartItems.some(
          (validItem) => validItem._id.toString() === productId
        );
      });
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
    if (!product || product.archived || product.isActive === false) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ FIXED: Normalize size and color to empty strings if not provided
    const normalizedSize = size || "";
    const normalizedColor = color || "";

    // Find variant stock - FIXED LOGIC
    let availableStock = product.countInStock;
    let variant = null;

    if (product.variants && product.variants.length > 0) {
      variant = product.variants.find((v) => {
        // FIXED: Use normalized values
        const variantSize = v.size || "";
        const variantColor = v.color || "";

        return (
          normalizedSize === variantSize && normalizedColor === variantColor
        );
      });

      if (variant) {
        availableStock = variant.countInStock;
      } else {
        return res
          .status(400)
          .json({ message: "This variant is not available" });
      }
    }

    if (availableStock <= 0) {
      return res.status(400).json({ message: "Out of stock" });
    }

    // ✅ FIXED: Look for existing item with normalized matching
    const existingItem = user.cartItems.find((item) => {
      const productMatch = item.product?.toString() === productId;
      const itemSize = item.size || "";
      const itemColor = item.color || "";

      return (
        productMatch &&
        itemSize === normalizedSize &&
        itemColor === normalizedColor
      );
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
        size: normalizedSize, // Store normalized values
        color: normalizedColor, // Store normalized values
      };

      user.cartItems.push(newItem);
    }

    await user.save();

    // Return the updated cart items with validation
    const cartItems = await Promise.all(
      user.cartItems.map(async (cartItem) => {
        const product = await Product.findById(cartItem.product);

        if (!product || product.archived || product.isActive === false) {
          return null;
        }

        return {
          ...product.toJSON(),
          quantity: cartItem.quantity,
          size: cartItem.size || "", // Ensure consistency
          color: cartItem.color || "", // Ensure consistency
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

    // ✅ FIXED: Normalize values for matching
    const normalizedSize = size || "";
    const normalizedColor = color || "";

    user.cartItems = user.cartItems.filter((item) => {
      const itemSize = item.size || "";
      const itemColor = item.color || "";

      return !(
        item.product?.toString() === productId &&
        itemSize === normalizedSize &&
        itemColor === normalizedColor
      );
    });

    await user.save();

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

      // ✅ FIXED: Better variant matching logic
      let finalStock = product.countInStock || 0;
      let variantFound = false;

      // If product has variants
      if (product.variants && product.variants.length > 0) {
        // Try to find matching variant
        const variant = product.variants.find((v) => {
          // FIXED: Handle empty strings for size/color
          const cartSize = cartItem.size || "";
          const cartColor = cartItem.color || "";
          const variantSize = v.size || "";
          const variantColor = v.color || "";

          // Both size and color must match (or both be empty)
          return cartSize === variantSize && cartColor === variantColor;
        });

        if (variant) {
          finalStock = variant.countInStock || 0;
          variantFound = true;
        } else {
          // If no exact match found, it might be a simple product without variants
          // Or the variant might have been deleted
          console.warn(`No matching variant found for ${product.name}`, {
            cartSize: cartItem.size,
            cartColor: cartItem.color,
            availableVariants: product.variants.map((v) => ({
              size: v.size,
              color: v.color,
            })),
          });
        }
      }

      const result = {
        ...product.toJSON(),
        quantity: cartItem.quantity,
        size: cartItem.size || "", // Ensure empty string for consistency
        color: cartItem.color || "", // Ensure empty string for consistency
        countInStock: finalStock,
      };

      return result;
    })
  );

  return validatedItems.filter(Boolean);
};
