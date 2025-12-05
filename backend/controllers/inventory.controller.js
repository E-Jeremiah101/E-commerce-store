import Product from "../models/product.model.js";
import InventoryLog from "../models/inventoryLog.model.js";
import mongoose from "mongoose";

// 1. 📊 STOCK DASHBOARD
export const getInventoryDashboard = async (req, res) => {
  try {
    const products = await Product.find({ archived: { $ne: true } });

    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, product) => {
      return sum + product.price * product.countInStock;
    }, 0);

    const lowStockThreshold = 10;
    const lowStockProducts = products.filter(
      (p) => p.countInStock <= lowStockThreshold && p.countInStock > 0
    );
    const outOfStockProducts = products.filter((p) => p.countInStock === 0);

    // For demo - you'll need actual order data for real turnover
    const inventoryTurnover = 4.2; // Example value

    // Get fast moving products (simplified - by lowest stock that's not zero)
    const fastMovingProducts = products
      .filter((p) => p.countInStock > 0 && p.countInStock <= 20)
      .slice(0, 5)
      .map((p) => ({
        id: p._id,
        name: p.name,
        currentStock: p.countInStock,
        value: p.price * p.countInStock,
      }));

    res.json({
      summary: {
        totalProducts,
        totalStockValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        inventoryTurnover,
      },
      fastMovingProducts,
      alerts: {
        lowStock: lowStockProducts.slice(0, 5).map((p) => ({
          id: p._id,
          name: p.name,
          image: p.images?.[0] || null,
          category: p.category,
          currentStock: p.countInStock,
          threshold: lowStockThreshold,
        })),
        outOfStock: outOfStockProducts.slice(0, 5).map((p) => ({
          id: p._id,
          name: p.name,
          image: p.images?.[0] || null,
          category: p.category,
          currentStock: p.countInStock,
          threshold: lowStockThreshold,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting inventory dashboard:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 2. 📦 STOCK LEVELS
export const getStockLevels = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      category = "",
      lowStock = false,
    } = req.query;

    const skip = (page - 1) * limit;

    let filter = { archived: { $ne: true } };

    // Search by name
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Low stock filter
    if (lowStock === "true") {
      filter.countInStock = { $lte: 10, $gt: 0 };
    }

    const products = await Product.find(filter)
      .select("name price countInStock category images variants")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ countInStock: 1 });

    const total = await Product.countDocuments(filter);

    // Transform data for frontend
    const stockLevels = products.map((product) => {
      const variantsStock =
        product.variants?.reduce((sum, v) => sum + v.countInStock, 0) || 0;
      const totalStock = product.countInStock + variantsStock;

      let status = "healthy";
      if (totalStock === 0) status = "out";
      else if (totalStock <= 10) status = "low";

      return {
        id: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        sku: product.sku || "N/A",
        category: product.category,
        price: product.price,
        mainStock: product.countInStock,
        variantsStock: variantsStock,
        totalStock: totalStock,
        status: status,
        variantsCount: product.variants?.length || 0,
        lastUpdated: product.updatedAt,
      };
    });

    res.json({
      stockLevels,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting stock levels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 3. 🚨 LOW STOCK ALERTS
export const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockThreshold = req.query.threshold || 10;

    const products = await Product.find({
      archived: { $ne: true },
      countInStock: { $lte: lowStockThreshold, $gt: 0 },
    }).select("name price countInStock category images variants");

    const alerts = products.map((product) => ({
      id: product._id,
      name: product.name,
      image: product.images?.[0] || "",
      category: product.category,
      currentStock: product.countInStock,
      threshold: lowStockThreshold,
      status: product.countInStock === 0 ? "out" : "low",
      price: product.price,
      valueAtRisk: product.price * product.countInStock,
    }));

    // Sort by urgency
    alerts.sort((a, b) => a.currentStock - b.currentStock);

    res.json({
      alerts,
      summary: {
        totalLowStock: alerts.length,
        totalValueAtRisk: alerts.reduce((sum, a) => sum + a.valueAtRisk, 0),
        mostUrgent: alerts.slice(0, 3),
      },
    });
  } catch (error) {
    console.error("Error getting low stock alerts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 4. 🔄 STOCK ADJUSTMENTS
export const adjustStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      adjustmentType, // "add", "remove", "set"
      quantity,
      reason,
      notes,
      variantId = null,
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let oldStock, newStock;

    if (variantId) {
      // Adjust variant stock
      const variant = product.variants.id(variantId);
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      oldStock = variant.countInStock;

      switch (adjustmentType) {
        case "add":
          newStock = oldStock + quantity;
          break;
        case "remove":
          newStock = oldStock - quantity;
          if (newStock < 0) {
            return res.status(400).json({ message: "Insufficient stock" });
          }
          break;
        case "set":
          newStock = quantity;
          if (newStock < 0) {
            return res
              .status(400)
              .json({ message: "Stock cannot be negative" });
          }
          break;
        default:
          return res.status(400).json({ message: "Invalid adjustment type" });
      }

      variant.countInStock = newStock;

      // Update main product stock (sum of variants)
      product.countInStock = product.variants.reduce(
        (sum, v) => sum + v.countInStock,
        0
      );
    } else {
      // Adjust main product stock
      oldStock = product.countInStock;

      switch (adjustmentType) {
        case "add":
          newStock = oldStock + quantity;
          break;
        case "remove":
          newStock = oldStock - quantity;
          if (newStock < 0) {
            return res.status(400).json({ message: "Insufficient stock" });
          }
          break;
        case "set":
          newStock = quantity;
          if (newStock < 0) {
            return res
              .status(400)
              .json({ message: "Stock cannot be negative" });
          }
          break;
        default:
          return res.status(400).json({ message: "Invalid adjustment type" });
      }

      product.countInStock = newStock;
    }

    await product.save();

    // Log the adjustment
    const inventoryLog = new InventoryLog({
      productId: product._id,
      variantId: variantId,
      adjustmentType,
      quantity: Math.abs(quantity),
      oldStock,
      newStock,
      reason,
      notes,
      adjustedBy: req.user._id,
    });

    await inventoryLog.save();

    res.json({
      message: "Stock adjusted successfully",
      product: {
        id: product._id,
        name: product.name,
        mainStock: product.countInStock,
        variantStock: variantId ? newStock : null,
        updatedAt: product.updatedAt,
      },
      adjustment: {
        type: adjustmentType,
        quantity,
        reason,
        timestamp: inventoryLog.createdAt,
      },
    });
  } catch (error) {
    console.error("Error adjusting stock:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 5. 📈 STOCK HISTORY
export const getStockHistory = async (req, res) => {
  try {
    const {
      productId,
      variantId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (page - 1) * limit;

    let filter = {};

    if (productId) {
      filter.productId = new mongoose.Types.ObjectId(productId);
    }

    if (variantId) {
      filter.variantId = variantId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const history = await InventoryLog.find(filter)
      .populate("adjustedBy", "firstname lastname email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InventoryLog.countDocuments(filter);

    res.json({
      history,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting stock history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 6. 📍 MULTI-LOCATION INVENTORY (Simplified)
export const getInventoryByLocation = async (req, res) => {
  try {
    const products = await Product.find({ archived: { $ne: true } }).select(
      "name price countInStock category"
    );

    // Simulate locations
    const locations = [
      { id: "main", name: "Main Warehouse", address: "123 Store St" },
      { id: "store1", name: "Retail Store", address: "456 Mall Rd" },
    ];

    const inventoryByLocation = locations.map((location) => {
      // Simulate stock distribution
      const locationProducts = products.map((product) => {
        let locationStock;
        if (location.id === "main") {
          locationStock = Math.floor(product.countInStock * 0.6);
        } else {
          locationStock = Math.floor(product.countInStock * 0.4);
        }

        return {
          productId: product._id,
          productName: product.name,
          stock: locationStock,
          value: locationStock * product.price,
        };
      });

      const totalValue = locationProducts.reduce((sum, p) => sum + p.value, 0);
      const totalItems = locationProducts.reduce((sum, p) => sum + p.stock, 0);

      return {
        ...location,
        totalValue,
        totalItems,
        products: locationProducts.slice(0, 5),
      };
    });

    res.json({
      locations: inventoryByLocation,
      summary: {
        totalLocations: locations.length,
        totalValueAcrossLocations: inventoryByLocation.reduce(
          (sum, loc) => sum + loc.totalValue,
          0
        ),
        totalItemsAcrossLocations: inventoryByLocation.reduce(
          (sum, loc) => sum + loc.totalItems,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error getting inventory by location:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 7. 📋 REORDER MANAGEMENT
export const getReorderSuggestions = async (req, res) => {
  try {
    const reorderThreshold = req.query.threshold || 10;

    const products = await Product.find({
      archived: { $ne: true },
      countInStock: { $lte: reorderThreshold },
    }).select("name price countInStock category");

    const suggestions = products.map((product) => {
      const suggestedOrder = Math.max(
        reorderThreshold * 2 - product.countInStock,
        10
      );

      const estimatedCost = suggestedOrder * product.price;
      const urgency =
        product.countInStock === 0
          ? "critical"
          : product.countInStock <= 5
          ? "high"
          : "medium";

      return {
        id: product._id,
        name: product.name,
        category: product.category,
        currentStock: product.countInStock,
        reorderThreshold,
        suggestedOrder,
        unitPrice: product.price,
        estimatedCost,
        leadTime: "7 days",
        urgency,
        supplier: "Default Supplier",
      };
    });

    // Sort by urgency
    suggestions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    const totalCost = suggestions.reduce((sum, s) => sum + s.estimatedCost, 0);

    res.json({
      suggestions,
      summary: {
        totalSuggestions: suggestions.length,
        totalEstimatedCost: totalCost,
        criticalCount: suggestions.filter((s) => s.urgency === "critical")
          .length,
        highPriorityCount: suggestions.filter((s) => s.urgency === "high")
          .length,
      },
    });
  } catch (error) {
    console.error("Error getting reorder suggestions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 8. 💰 INVENTORY VALUATION
export const getInventoryValuation = async (req, res) => {
  try {
    const { groupBy = "category" } = req.query;

    const products = await Product.find({ archived: { $ne: true } }).select(
      "name price countInStock category"
    );

    let valuation;

    if (groupBy === "category") {
      // Group by category
      valuation = products.reduce((acc, product) => {
        const category = product.category || "Uncategorized";
        const value = product.price * product.countInStock;

        if (!acc[category]) {
          acc[category] = {
            category,
            totalValue: 0,
            totalItems: 0,
            products: [],
          };
        }

        acc[category].totalValue += value;
        acc[category].totalItems += product.countInStock;
        acc[category].products.push({
          name: product.name,
          stock: product.countInStock,
          unitValue: product.price,
          totalValue: value,
        });

        return acc;
      }, {});

      // Convert to array
      valuation = Object.values(valuation).sort(
        (a, b) => b.totalValue - a.totalValue
      );
    } else {
      // Overall valuation
      const totalValue = products.reduce((sum, product) => {
        return sum + product.price * product.countInStock;
      }, 0);

      const totalItems = products.reduce((sum, product) => {
        return sum + product.countInStock;
      }, 0);

      const averageValuePerItem = totalItems > 0 ? totalValue / totalItems : 0;

      // Top 10 most valuable items
      const mostValuable = products
        .map((p) => ({
          name: p.name,
          stock: p.countInStock,
          unitValue: p.price,
          totalValue: p.price * p.countInStock,
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      valuation = {
        summary: {
          totalValue,
          totalItems,
          averageValuePerItem,
          totalProducts: products.length,
        },
        mostValuable,
      };
    }

    res.json({
      valuation,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error getting inventory valuation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// BULK STOCK UPDATE
export const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const product = await Product.findById(update.productId);
        if (!product) {
          errors.push({
            productId: update.productId,
            error: "Product not found",
          });
          continue;
        }

        const oldStock = product.countInStock;
        let newStock;

        switch (update.adjustmentType) {
          case "add":
            newStock = oldStock + update.quantity;
            break;
          case "remove":
            newStock = oldStock - update.quantity;
            if (newStock < 0) {
              errors.push({
                productId: update.productId,
                productName: product.name,
                error: "Insufficient stock",
              });
              continue;
            }
            break;
          case "set":
            newStock = update.quantity;
            if (newStock < 0) {
              errors.push({
                productId: update.productId,
                productName: product.name,
                error: "Stock cannot be negative",
              });
              continue;
            }
            break;
          default:
            errors.push({
              productId: update.productId,
              productName: product.name,
              error: "Invalid adjustment type",
            });
            continue;
        }

        product.countInStock = newStock;
        await product.save();

        // Log the adjustment
        const inventoryLog = new InventoryLog({
          productId: product._id,
          adjustmentType: update.adjustmentType,
          quantity: Math.abs(update.quantity),
          oldStock,
          newStock,
          reason: update.reason || "Bulk update",
          adjustedBy: req.user._id,
        });

        await inventoryLog.save();

        results.push({
          productId: product._id,
          productName: product.name,
          adjustmentType: update.adjustmentType,
          quantity: update.quantity,
          oldStock,
          newStock,
          success: true,
        });
      } catch (error) {
        errors.push({
          productId: update.productId,
          error: error.message,
        });
      }
    }

    res.json({
      message: "Bulk update completed",
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// SEARCH INVENTORY
export const searchInventory = async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query required" });
    }

    const products = await Product.find({
      archived: { $ne: true },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    }).select("name price countInStock category images");

    res.json({
      results: products.map((p) => ({
        id: p._id,
        name: p.name,
        image: p.images?.[0] || "",
        category: p.category,
        stock: p.countInStock,
        price: p.price,
        value: p.price * p.countInStock,
      })),
    });
  } catch (error) {
    console.error("Error searching inventory:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
