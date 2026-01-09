import Product from "../models/product.model.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";
import storeSettings from "../models/storeSettings.model.js";

const clearProductCache = async (productId) => {
  try {
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};

export const slashProductPrice = async (req, res) => {
  try {

    const { id } = req.params; 
    const { newPrice, reason } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    if (!newPrice || newPrice < 0) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const oldPrice = product.price;

    if (parseFloat(newPrice) >= parseFloat(oldPrice)) {
      return res.status(400).json({
        message: "New price must be lower than current price to slash",
      });
    }

    if (product.isPriceSlashed && product.previousPrice === oldPrice) {
      return res.status(400).json({
        message:
          "Price is already slashed. Reset first or set new price directly.",
      });
    }

    product.previousPrice = oldPrice;
    product.price = parseFloat(newPrice);
    product.isPriceSlashed = true;

    product.priceHistory.push({
      price: parseFloat(newPrice),
      previousPrice: oldPrice,
      changedBy: req.user._id,
      reason: reason || "Price slash",
      isSlash: true,
      changedAt: new Date(),
    });

    await product.save();

    const discountPercentage = (
      ((oldPrice - parseFloat(newPrice)) / oldPrice) *
      100
    ).toFixed(1);

    const auditInfo = AuditLogger.getRequestInfo(req);
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: ACTIONS.PRICE_SLASH,
      entityType: ENTITY_TYPES.PRODUCT,
      entityId: product._id,
      entityName: product.name,
      changes: {
        oldPrice: oldPrice,
        newPrice: parseFloat(newPrice),
        priceChange: {
          type: "slash",
          amount: (oldPrice - parseFloat(newPrice)).toFixed(2),
          percentage: discountPercentage + "%",
          discountApplied: true,
        },
        isPriceSlashed: true,
        previousPrice: oldPrice,
      },
      ipAddress: auditInfo.ipAddress,
      userAgent: auditInfo.userAgent,
      additionalInfo:
        `Price slashed from ₦${oldPrice.toLocaleString()} to ₦${newPrice} (${discountPercentage.toLocaleString()}% discount)` +
        (reason ? ` - Reason: ${reason}` : ""),
    });
    await clearProductCache(id);

    console.log(
      `Price slashed: ${oldPrice} → ${newPrice} (${discountPercentage}% off)`
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
    console.error("Error slashing price:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const resetProductPrice = async (req, res) => {
  try {

    const { id } = req.params;
    const { reason } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.isPriceSlashed || !product.previousPrice) {
      return res.status(400).json({
        message: "Price is not slashed. Nothing to reset.",
      });
    }

    const oldPrice = product.price;
    const originalPrice = product.previousPrice;
    const settings = await storeSettings.findOne();
    const formatter = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: settings.currency,
      });

    product.price = originalPrice;
    product.previousPrice = null;
    product.isPriceSlashed = false;

    product.priceHistory.push({
      price: originalPrice,
      previousPrice: oldPrice,
      changedBy: req.user._id,
      reason: reason || "Price reset to original",
      isReset: true,
      changedAt: new Date(),
    });

    await product.save();

   const auditInfo = AuditLogger.getRequestInfo(req);
   await AuditLogger.log({
     adminId: req.user._id,
     adminName: `${req.user.firstname} ${req.user.lastname}`,
     action: ACTIONS.PRICE_RESET,
     entityType: ENTITY_TYPES.PRODUCT,
     entityId: product._id,
     entityName: product.name,
     changes: {
       oldPrice: oldPrice,
       newPrice: originalPrice,
       priceChange: {
         type: "reset",
         amount: (originalPrice - oldPrice).toFixed(2),
         percentage:
           (((originalPrice - oldPrice) / oldPrice) * 100).toFixed(1) + "%",
         resetToOriginal: true,
       },
       isPriceSlashed: false,
       previousPrice: null,
     },
     ipAddress: auditInfo.ipAddress,
     userAgent: auditInfo.userAgent,
     additionalInfo:
       `Price reset from  ${formatter.format(
         oldPrice
       )} to original price  ${formatter.format(originalPrice)}` +
       (reason ? ` - Reason: ${reason}` : ""),
   });

  
    await clearProductCache(id);

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
    console.error("Error resetting price:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateProductPrice = async (req, res) => {
  try {

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

    
      if (
        parseFloat(newPrice) > parseFloat(oldPrice) &&
        product.isPriceSlashed
      ) {
        product.previousPrice = null;
        product.isPriceSlashed = false;
      }
    }


    product.price = parseFloat(newPrice);


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

    const auditInfo = AuditLogger.getRequestInfo(req);
    const discountPercentage = isSlash
      ? (((oldPrice - parseFloat(newPrice)) / oldPrice) * 100).toFixed(1)
      : null;
    const priceDifference = parseFloat(newPrice) - oldPrice;
       const settings = await storeSettings.findOne();
       const formatter = new Intl.NumberFormat(undefined, {
         style: "currency",
         currency: settings.currency,
       });
    const percentChange = ((priceDifference / oldPrice) * 100).toFixed(1);
    const changeType =
      priceDifference > 0
        ? "increase"
        : priceDifference < 0
        ? "decrease"
        : "no change";

    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: isSlash ? ACTIONS.PRICE_SLASH : ACTIONS.PRICE_UPDATE,
      entityType: ENTITY_TYPES.PRODUCT,
      entityId: product._id,
      entityName: product.name,
      changes: {
        oldPrice: oldPrice,
        newPrice: parseFloat(newPrice),
        priceChange: {
          type: isSlash ? "slash" : "update",
          amount: Math.abs(priceDifference).toFixed(2),
          percentage: Math.abs(percentChange) + "%",
          direction: changeType,
          discount: isSlash ? discountPercentage + "%" : null,
        },
        isPriceSlashed: isSlash,
        previousPrice: isSlash ? oldPrice : product.previousPrice,
      },
      ipAddress: auditInfo.ipAddress,
      userAgent: auditInfo.userAgent,
      additionalInfo:
        `Price ${isSlash ? "slashed" : "updated"} from  ${formatter.format(
          oldPrice
        )} to  ${formatter.format(newPrice)} (${changeType} of ${Math.abs(
          priceDifference
        ).toFixed(2)} / ${Math.abs(percentChange)}%)` +
        (isSlash ? ` - ${discountPercentage}% discount applied` : "") +
        (reason ? ` - Reason: ${reason}` : ""),
    });

    await clearProductCache(id);


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
    console.error(" Error updating price:", error);
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
    console.error("Error getting price history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
