import Product from "../models/product.model.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";

// Helper to clear cache (add Redis if you use it)
const clearProductCache = async (productId) => {
  try {
    // Clear any product-related caches here
    console.log(`✅ Cleared cache for product ${productId}`);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};

export const slashProductPrice = async (req, res) => {
  try {
    console.log("🔪 [PRICE] Slash request received");
    console.log("🔪 [PRICE] Params:", req.params);
    console.log("🔪 [PRICE] Body:", req.body);

    const { id } = req.params; // Get ID from route parameter
    const { newPrice, reason } = req.body;

    // Validate input
    if (!id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    if (!newPrice || newPrice < 0) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      console.log(`❌ Product not found: ${id}`);
      return res.status(404).json({ message: "Product not found" });
    }

    const oldPrice = product.price;

    // Check if price is actually being reduced
    if (parseFloat(newPrice) >= parseFloat(oldPrice)) {
      return res.status(400).json({
        message: "New price must be lower than current price to slash",
      });
    }

    // Prevent multiple slash - only slash if not already slashed
    if (product.isPriceSlashed && product.previousPrice === oldPrice) {
      return res.status(400).json({
        message:
          "Price is already slashed. Reset first or set new price directly.",
      });
    }

    // Update product with slashed price
    product.previousPrice = oldPrice;
    product.price = parseFloat(newPrice);
    product.isPriceSlashed = true;

    // Add to price history
    product.priceHistory.push({
      price: parseFloat(newPrice),
      previousPrice: oldPrice,
      changedBy: req.user._id,
      reason: reason || "Price slash",
      isSlash: true,
      changedAt: new Date(),
    });

    await product.save();

    // Calculate discount percentage
    const discountPercentage = (
      ((oldPrice - parseFloat(newPrice)) / oldPrice) *
      100
    ).toFixed(1);

    // Log to audit trail
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: ACTIONS.PRICE_SLASH || "PRICE_SLASH",
      entityType: ENTITY_TYPES.PRODUCT,
      entityId: product._id,
      entityName: product.name,
      changes: {
        price: {
          before: oldPrice,
          after: parseFloat(newPrice),
          slash: true,
          discount: `${discountPercentage}%`,
        },
      },
      additionalInfo: reason || "Price slashed",
    });

    // Clear cache
    await clearProductCache(id);

    console.log(
      `✅ Price slashed: ${oldPrice} → ${newPrice} (${discountPercentage}% off)`
    );

    res.json({
      message: "Price slashed successfully",
      product: {
        _id: product._id,
        id: product._id,
        name: product.name,
        price: product.price,
        previousPrice: product.previousPrice,
        isPriceSlashed: product.isPriceSlashed,
        discountPercentage: discountPercentage,
      },
    });
  } catch (error) {
    console.error("❌ Error slashing price:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const resetProductPrice = async (req, res) => {
  try {
    console.log("🔄 [PRICE] Reset request received");

    const { id } = req.params;
    const { reason } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if price is actually slashed
    if (!product.isPriceSlashed || !product.previousPrice) {
      return res.status(400).json({
        message: "Price is not slashed. Nothing to reset.",
      });
    }

    const oldPrice = product.price;
    const originalPrice = product.previousPrice;

    // Reset to original price
    product.price = originalPrice;
    product.previousPrice = null;
    product.isPriceSlashed = false;

    // Add to price history
    product.priceHistory.push({
      price: originalPrice,
      previousPrice: oldPrice,
      changedBy: req.user._id,
      reason: reason || "Price reset to original",
      isReset: true,
      changedAt: new Date(),
    });

    await product.save();

    // Log to audit trail
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: ACTIONS.PRICE_RESET || "PRICE_RESET",
      entityType: ENTITY_TYPES.PRODUCT,
      entityId: product._id,
      entityName: product.name,
      changes: {
        price: {
          before: oldPrice,
          after: originalPrice,
          reset: true,
        },
      },
      additionalInfo: reason || "Price reset to original",
    });

    // Clear cache
    await clearProductCache(id);

    console.log(`✅ Price reset: ${oldPrice} → ${originalPrice}`);

    res.json({
      message: "Price reset successfully",
      product: {
        _id: product._id,
        id: product._id,
        name: product.name,
        price: product.price,
        previousPrice: null,
        isPriceSlashed: false,
      },
    });
  } catch (error) {
    console.error("❌ Error resetting price:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateProductPrice = async (req, res) => {
  try {
    console.log("📝 [PRICE] Update request received");

    const { id } = req.params;
    const { newPrice, reason, isSlash = false } = req.body;

    if (!newPrice || newPrice < 0) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const oldPrice = product.price;

    // If it's a slash, check conditions
    if (isSlash) {
      if (parseFloat(newPrice) >= parseFloat(oldPrice)) {
        return res.status(400).json({
          message: "New price must be lower for slash",
        });
      }
      if (product.isPriceSlashed && product.previousPrice === oldPrice) {
        return res.status(400).json({
          message: "Price is already slashed",
        });
      }

      product.previousPrice = oldPrice;
      product.isPriceSlashed = true;
    } else {
      // Regular price update - clear slash if price increased
      if (
        parseFloat(newPrice) > parseFloat(oldPrice) &&
        product.isPriceSlashed
      ) {
        product.previousPrice = null;
        product.isPriceSlashed = false;
      }
    }

    // Update price
    product.price = parseFloat(newPrice);

    // Add to price history
    product.priceHistory.push({
      price: parseFloat(newPrice),
      previousPrice: oldPrice,
      changedBy: req.user._id,
      reason: reason || (isSlash ? "Price slash" : "Price update"),
      isSlash: isSlash,
      isUpdate: !isSlash,
      changedAt: new Date(),
    });

    await product.save();

    // Log the action
    const action = isSlash ? "PRICE_SLASH" : "PRICE_UPDATE";
    const discountPercentage = isSlash
      ? (((oldPrice - parseFloat(newPrice)) / oldPrice) * 100).toFixed(1)
      : null;

    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: action,
      entityType: ENTITY_TYPES.PRODUCT,
      entityId: product._id,
      entityName: product.name,
      changes: {
        price: {
          before: oldPrice,
          after: parseFloat(newPrice),
          slash: isSlash,
          discount: discountPercentage ? `${discountPercentage}%` : null,
        },
      },
      additionalInfo: reason || (isSlash ? "Price slashed" : "Price updated"),
    });

    // Clear cache
    await clearProductCache(id);

    console.log(
      `✅ Price ${isSlash ? "slashed" : "updated"}: ${oldPrice} → ${newPrice}`
    );

    res.json({
      message: `Price ${isSlash ? "slashed" : "updated"} successfully`,
      product: {
        _id: product._id,
        id: product._id,
        name: product.name,
        price: product.price,
        previousPrice: product.previousPrice,
        isPriceSlashed: product.isPriceSlashed,
        discountPercentage: discountPercentage,
      },
    });
  } catch (error) {
    console.error("❌ Error updating price:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getPriceHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .select("priceHistory name price previousPrice isPriceSlashed")
      .populate("priceHistory.changedBy", "firstname lastname email");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      productName: product.name,
      priceHistory: product.priceHistory.sort(
        (a, b) => new Date(b.changedAt) - new Date(a.changedAt)
      ),
      currentPrice: product.price,
      isPriceSlashed: product.isPriceSlashed,
      previousPrice: product.previousPrice,
    });
  } catch (error) {
    console.error("❌ Error getting price history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
