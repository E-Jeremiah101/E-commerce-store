import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
  try {
   
    const validCartItems = await getValidatedCartItems(req.user.cartItems);

    if (validCartItems.length !== req.user.cartItems.length) {
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

    console.log("Backend addToCart received:", { productId, size, color });

    const product = await Product.findById(productId);
    if (!product || product.archived || product.isActive === false) {
      return res.status(404).json({ message: "Product not found" });
    }

    const normalizedSize = size || "";
    const normalizedColor = color || "";

    
    let availableStock = product.countInStock;
    let variant = null;

    if (product.variants && product.variants.length > 0) {
      variant = product.variants.find((v) => {
        
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
        size: normalizedSize, 
        color: normalizedColor, 
      };

      user.cartItems.push(newItem);
    }

    await user.save();

    const cartItems = await Promise.all(
      user.cartItems.map(async (cartItem) => {
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

    console.log(" Backend updateQuantity:", {
      productId,
      size,
      color,
      quantity,
    });

    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const product = await Product.findById(productId);

    if (!product || product.archived || product.isActive === false) {
      user.cartItems = user.cartItems.filter(
        (item) =>
          !(
            item.product?.toString() === productId &&
            (item.size || "") === (size || "") &&
            (item.color || "") === (color || "")
          )
      );
      await user.save();
      const validatedCartItems = await getValidatedCartItems(user.cartItems);
      return res.status(404).json({
        message: "Product no longer available",
        cart: validatedCartItems,
      });
    }

    const normalizedSize = size || "";
    const normalizedColor = color || "";

    let availableStock = product.countInStock;
    let variant = null;

    if (product.variants && product.variants.length > 0) {
      variant = product.variants.find((v) => {

        const variantSize = v.size || "";
        const variantColor = v.color || "";


        return (
          normalizedSize === variantSize && normalizedColor === variantColor
        );
      });

      if (variant) {
        availableStock = variant.countInStock;
      }
    }

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

    if (!existingItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Only check stock if INCREASING quantity
    // If decreasing, always allow it regardless of stock
    if (quantity > existingItem.quantity && quantity > availableStock) {
      return res.status(400).json({
        message: `Only ${availableStock} left in stock`,
        availableStock,
      });
    }

    if (quantity <= 0) {
      user.cartItems = user.cartItems.filter(
        (item) =>
          !(
            item.product?.toString() === productId &&
            (item.size || "") === normalizedSize &&
            (item.color || "") === normalizedColor
          )
      );
    } else {
      existingItem.quantity = quantity;
    }

    await user.save();

    const validatedCartItems = await getValidatedCartItems(user.cartItems);
    res.json(validatedCartItems);
  } catch (error) {
    console.log("Error in updateQuantity controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getValidatedCartItems = async (cartItems) => {
  const validatedItems = await Promise.all(
    cartItems.map(async (cartItem) => {
      const product = await Product.findById(cartItem.product);

      if (!product || product.archived || product.isActive === false) {
        return null;
      }

      let finalStock = product.countInStock || 0;
      let variantFound = false;

      if (product.variants && product.variants.length > 0) {
        const cartSize = cartItem.size || "";
        const cartColor = cartItem.color || "";

        const variant = product.variants.find((v) => {
          const variantSize = v.size || "";
          const variantColor = v.color || "";

          return cartSize === variantSize && cartColor === variantColor;
        });

        if (variant) {
          finalStock = variant.countInStock || 0;
          variantFound = true;
        }
      }

      const result = {
        ...product.toJSON(),
        quantity: cartItem.quantity,
        size: cartItem.size || "",
        color: cartItem.color || "",
        countInStock: finalStock,
      };

      return result;
    })
  );

  return validatedItems.filter(Boolean);
};