import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
  try {
    const cartItems = await Promise.all(
      req.user.cartItems.map(async (cartItem) => {
        const product = await Product.findById(cartItem.product);
        if (!product) return null; // in case product was deleted
        return {
          ...product.toJSON(),
          quantity: cartItem.quantity,
          size: cartItem.size,
          color: cartItem.color,
        };
      })
    );

    res.json(cartItems.filter(Boolean)); // remove nulls
  } catch (error) {
    console.log("Error in getCartProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, size, color } = req.body;
    const user = req.user;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.countInStock <= 0)
      return res.status(400).json({ message: "Out of stock" });


    // Look for an existing item (size/color only matter if they exist)
    const existingItem = user.cartItems.find(
      (item) =>
        item.product?.toString() === productId &&
        (size ? item.size === size : !item.size) &&
        (color ? item.color === color : !item.color)
    );

    if (existingItem) {
      if (existingItem.quantity + 1 > product.countInStock) {
        return res
          .status(400)
          .json({ message: `Only ${product.countInStock} left in stock` });
      }
      existingItem.quantity += 1;
    } else {
      const newItem = {
        product: productId,
        quantity: 1,
      };
      if (size) newItem.size = size; // only add if provided
      if (color) newItem.color = color; // only add if provided

      user.cartItems.push(newItem);
    }

    await user.save();
    res.json(user.cartItems);
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
    res.json(user.cartItems);
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

    // find product to check available stock
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check stock before updating
    if (quantity > product.countInStock) {
      return res.status(400).json({
        message: `Only ${product.countInStock} left in stock`,
      });
    }

    const existingItem = user.cartItems.find(
      (item) =>
        item.product?.toString() === productId &&
        item.size === size &&
        item.color === color
    );

    if (!existingItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    if (quantity <= 0) {
      // remove if quantity is 0
      user.cartItems = user.cartItems.filter(
        (item) =>
          !(
            item.product?.toString() === productId &&
            item.size === size &&
            item.color === color
          )
      );
    } else {
      existingItem.quantity = quantity;
    }

    await user.save();

    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in updateQuantity controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};