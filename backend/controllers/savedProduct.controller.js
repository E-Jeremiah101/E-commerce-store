import SavedProduct from "../models/savedProduct.model.js";
import Product from "../models/product.model.js";

// Save a product
export const saveProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Check if already saved
    const existingSave = await SavedProduct.findOne({
      user: userId,
      product: productId,
    });

    if (existingSave) {
      return res.status(400).json({
        message: "Product already saved",
      });
    }

    const savedProduct = await SavedProduct.create({
      user: userId,
      product: productId,
    });

    // Populate product details for immediate response
    await savedProduct.populate("product");

    res.status(201).json({
      message: "Product saved successfully",
      savedProduct,
    });
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({
      message: "Failed to save product",
      error: error.message,
    });
  }
};

// Remove saved product
export const unsaveProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const result = await SavedProduct.findOneAndDelete({
      user: userId,
      product: productId,
    });

    if (!result) {
      return res.status(404).json({
        message: "Saved product not found",
      });
    }

    res.json({
      message: "Product removed from saved items",
    });
  } catch (error) {
    console.error("Error unsaving product:", error);
    res.status(500).json({
      message: "Failed to remove saved product",
      error: error.message,
    });
  }
};

// Get user's saved products
export const getSavedProducts = async (req, res) => {
  try {
    const userId = req.user.id;

    const savedProducts = await SavedProduct.find({ user: userId })
      .populate({
        path: "product",
        match: { archived: { $ne: true } }, // Don't show archived products
        select: "name price images category countInStock",
      })
      .sort({ savedAt: -1 });

    // Filter out any where product is null (archived)
    const validSavedProducts = savedProducts.filter(
      (sp) => sp.product !== null
    );

    res.json({
      savedProducts: validSavedProducts,
      count: validSavedProducts.length,
    });
  } catch (error) {
    console.error("Error fetching saved products:", error);
    res.status(500).json({
      message: "Failed to fetch saved products",
      error: error.message,
    });
  }
};

// Check if product is saved by user
export const checkProductSaved = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const savedProduct = await SavedProduct.findOne({
      user: userId,
      product: productId,
    });

    res.json({
      isSaved: !!savedProduct,
    });
  } catch (error) {
    console.error("Error checking saved status:", error);
    res.status(500).json({
      message: "Failed to check saved status",
      error: error.message,
    });
  }
};
