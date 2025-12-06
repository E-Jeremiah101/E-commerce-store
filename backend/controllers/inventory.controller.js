import Product from "../models/product.model.js";
import InventoryLog from "../models/inventoryLog.model.js";
import mongoose from "mongoose";
import Order from "../models/order.model.js";
const getTopSellingProducts = async (
  limit = 10,
) => {
  try {
    console.log("🔍 Getting top selling products for inventory dashboard...");
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date();

    const matchStage = {
      status: { $nin: ["Cancelled"] },
      createdAt: { $gte: thirtyDaysAgo, $lte: today },
    };

    console.log("📊 Looking for orders in last 30 days");

    const topProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          productId: { $first: "$products.product" },
          name: { $first: "$products.name" },
          totalSold: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$products.price", "$products.quantity"],
            },
          },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      { $match: { totalSold: { $gt: 0 } } }, // Only products that were sold
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          name: { $ifNull: ["$productDetails.name", "$name"] },
          category: "$productDetails.category",
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1,
          lastOrderDate: 1,
          currentStock: { $ifNull: ["$productDetails.countInStock", 0] },
          price: { $ifNull: ["$productDetails.price", 0] },
          image: {
            $let: {
              vars: {
                imagesArray: "$productDetails.images",
              },
              in: {
                $cond: {
                  if: { $gt: [{ $size: "$$imagesArray" }, 0] },
                  then: { $arrayElemAt: ["$$imagesArray", 0] },
                  else: null,
                },
              },
            },
          },
        },
      },
    ]);

    console.log(`✅ Found ${topProducts.length} top selling products`);
    return topProducts;
  } catch (error) {
    console.error("❌ Error getting top selling products:", error);
    return []; // Return empty array on error
  }
};

// Helper to sync inventory when orders are delivered
export const syncInventoryWithStoreOrders = async () => {
  try {
    console.log("🔄 Syncing inventory with store orders...");
    
    // Find orders that are delivered but not synced
    const deliveredOrders = await Order.find({
      status: "Pending",
      isProcessed: false // Assuming this tracks if inventory was updated
    }).limit(50); // Process in batches

    let updatedCount = 0; 
    
    for (const order of deliveredOrders) {
      try {
        for (const item of order.products) {
          const product = await Product.findById(item.product);
          if (!product) continue;

          // Find the specific variant
          if (product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => 
              (v.size === item.selectedSize || (!v.size && !item.selectedSize)) &&
              (v.color === item.selectedColor || (!v.color && !item.selectedColor))
            );

            if (variant) {
              const oldStock = variant.countInStock;
              
              // Ensure we don't go negative
              const newStock = Math.max(0, oldStock - item.quantity);
              variant.countInStock = newStock;

              // Log the inventory change
              const inventoryLog = new InventoryLog({
                productId: product._id,
                variantId: variant._id,
                variantName: `${variant.color || 'Default'} - ${variant.size || 'One Size'}`,
                adjustmentType: "remove",
                quantity: item.quantity,
                oldStock,
                newStock,
                reason: "sale",
                notes: `Order #${order.orderNumber}`,
                adjustedBy: order.user,
                referenceId: order._id
              });

              await inventoryLog.save();
            }
          }

          await product.save();
        }

        // Mark order as processed for inventory
        order.isProcessed = true;
        await order.save();
        
        updatedCount++;
        
      } catch (error) {
        console.error(`Error processing order ${order.orderNumber}:`, error);
      }
    }

    console.log(`✅ Synced ${updatedCount} orders with inventory`);
    return { synced: updatedCount };
  } catch (error) {
    console.error("❌ Error syncing inventory with orders:", error);
    throw error;
  }
};

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

    // Get top selling products from orders (LAST 30 DAYS)
    const topSellingProducts = await getTopSellingProducts(5);
    console.log(
      "🛒 Top selling products from orders:",
      topSellingProducts.length
    );

    // Get order stats for dashboard
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orderStats = await Order.aggregate([
      {
        $match: {
          status: { $nin: ["Cancelled"] },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          deliveredOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      deliveredOrders: 0,
    };

    // Calculate total units sold from top selling products
    const totalUnitsSoldLast30Days = topSellingProducts.reduce(
      (sum, product) => sum + (product.totalSold || 0),
      0
    );

    // For demo - you'll need actual order data for real turnover
    const inventoryTurnover = 4.2; // Example value - you can calculate this properly later

    // Prepare fast moving products - USE ACTUAL ORDER DATA
    let fastMovingProducts = [];
    let hasOrderData = false;

    if (topSellingProducts.length > 0) {
      hasOrderData = true;
      fastMovingProducts = topSellingProducts.map((product, index) => ({
        id: product.productId || product._id,
        name: product.name,
        currentStock: product.currentStock || 0,
        value: product.totalRevenue || 0,
        orderCount: product.orderCount || 0,
        totalQuantitySold: product.totalSold || 0,
        lastOrderDate: product.lastOrderDate,
        category: product.category,
        price: product.price,
        image: product.image,
        source: "orders",
      }));
    } else {
      // Fallback to original logic if no order data
      fastMovingProducts = products
        .filter((p) => p.countInStock > 0 && p.countInStock <= 20)
        .slice(0, 10)
        .map((p) => ({
          id: p._id,
          name: p.name,
          currentStock: p.countInStock,
          value: p.price * p.countInStock,
          category: p.category,
          image: p.images?.[0] || null,
          source: "stock_levels",
        }));
    }

    res.json({
      summary: {
        totalProducts,
        totalStockValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        inventoryTurnover,
        // ORDER STATS - FROM ACTUAL ORDERS
        totalOrdersLast30Days: stats.totalOrders,
        deliveredOrdersLast30Days: stats.deliveredOrders,
        totalRevenueLast30Days: stats.totalRevenue,
        totalSalesLast30Days: totalUnitsSoldLast30Days,
        hasOrderData: hasOrderData,
      },
      fastMovingProducts,
      alerts: {
        lowStock: lowStockProducts.slice(0, 7).map((p) => ({
          id: p._id,
          name: p.name,
          image: p.images?.[0] || null,
          category: p.category,
          currentStock: p.countInStock,
          threshold: lowStockThreshold,
        })),
        outOfStock: outOfStockProducts.slice(0, 7).map((p) => ({
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
export const syncOrdersWithInventory = async (req, res) => {
  try {
    const result = await syncInventoryWithStoreOrders();
    res.json({
      message: "Inventory sync completed",
      ...result,
    });
  } catch (error) {
    console.error("Error syncing orders:", error);
    res.status(500).json({ message: "Sync failed", error: error.message });
  }
};
// 1. 📊 STOCK DASHBOARD


// 2. 📦 STOCK LEVELS
// export const getStockLevels = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       search = "",
//       category = "",
//       lowStock = false,
//       includeVariants = true,
//     } = req.query;

//     const skip = (page - 1) * limit;

//     let filter = { archived: { $ne: true } };

//     // Search by name
//     if (search) {
//       filter.name = { $regex: search, $options: "i" };
//     }

//     // Filter by category
//     if (category) {
//       filter.category = category;
//     }

//     // Low stock filter
//     if (lowStock === "true") {
//       filter.countInStock = { $lte: 10, $gt: 0 };
//     }
//     if (includeVariants === "true") {
//       selectFields += " variants";
//     }

//     const products = await Product.find(filter)
//       .select("name price countInStock category images variants sku sizes and colors")
//       .skip(skip)
//       .limit(parseInt(limit))
//       .sort({ countInStock: 1 });

//     const total = await Product.countDocuments(filter);

//     // Transform data for frontend
//     const stockLevels = products.map((product) => {
//       const variantsStock =
//         product.variants?.reduce((sum, v) => sum + v.countInStock, 0) || 0;
//       const totalStock = product.countInStock + variantsStock;

//       let status = "healthy";
//       if (totalStock === 0) status = "out";
//       else if (totalStock <= 10) status = "low";


//       const transformedVariants = (product.variants || []).map((variant) => ({
//         _id: variant._id,
//         id: variant._id.toString(),
//         size: variant.size,
//         color: variant.color,
//         countInStock: variant.countInStock || 0,
//         sku: variant.sku || product.sku,
//         price: variant.price || product.price,
//       }));

//       return {
//         id: product._id,
//         name: product.name,
//         image: product.images?.[0] || "",
//         sku: product.sku || "N/A",
//         category: product.category,
//         price: product.price,
//         mainStock: product.countInStock,
//         variantsStock: variantsStock,
//         totalStock: totalStock,
//         status: status,
//         variantsCount: product.variants?.length || 0,
//         variants: transformedVariants,
//         variants: transformedVariants,
//         sizes: product.sizes || [],
//         colors: product.colors || [],
//         lastUpdated: product.updatedAt,
//       };
//     });

//     res.json({
//       stockLevels,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         totalProducts: total,
//         hasNextPage: page * limit < total,
//         hasPrevPage: page > 1,
//       },
//     });
//   } catch (error) {
//     console.error("Error getting stock levels:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
export const getStockLevels = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      category = "",
      lowStock = false,
      includeVariants = "true",
    } = req.query;

    console.log("📡 [BACKEND] getStockLevels called with:", {
      page,
      limit,
      search,
      category,
      lowStock,
      includeVariants,
    });

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

    // Only include products that have variants
    filter["variants.0"] = { $exists: true };

    // Build query
    let query = Product.find(filter);

    // Select fields
    query = query.select(
      "name price category images variants sku sizes colors"
    );

    // Apply pagination
    query = query.skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

    console.log("📡 [BACKEND] MongoDB query - skip:", skip, "limit:", limit);

    const products = await query;
    const total = await Product.countDocuments(filter);

    console.log(
      "✅ [BACKEND] Found products:",
      products.length,
      "Total:",
      total
    );

    // Transform data for frontend - VARIANT-ONLY SYSTEM
    const stockLevels = products.map((product) => {
      // Calculate totals from variants only
      const variantsStock =
        product.variants?.reduce((sum, v) => sum + (v.countInStock || 0), 0) ||
        0;

      // Calculate total value from variants
      const totalValue =
        product.variants?.reduce((sum, variant) => {
          const variantPrice = variant.price || product.price;
          return sum + variantPrice * (variant.countInStock || 0);
        }, 0) || 0;

      // Determine worst status among variants
      let status = "healthy";
      const hasOutOfStock = product.variants?.some((v) => v.countInStock === 0);
      const hasLowStock = product.variants?.some(
        (v) => v.countInStock > 0 && v.countInStock <= 5
      );

      if (hasOutOfStock) {
        status = "out";
      } else if (hasLowStock) {
        status = "low";
      }

      // Transform variants
      const transformedVariants = (product.variants || []).map((variant) => ({
        _id: variant._id,
        id: variant._id?.toString() || variant.id,
        size: variant.size || "",
        color: variant.color || "",
        countInStock: variant.countInStock || 0,
        sku: variant.sku || product.sku || "N/A",
        price: variant.price || product.price,
        variantValue:
          (variant.price || product.price) * (variant.countInStock || 0),
      }));

      return {
        id: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        sku: product.sku || "N/A",
        category: product.category,
        price: product.price, // base price
        variantsStock: variantsStock,
        totalStock: variantsStock, // Same as variantsStock since no main stock
        status: status,
        variantsCount: product.variants?.length || 0,
        variants: transformedVariants,
        totalValue: totalValue,
        sizes: product.sizes || [],
        colors: product.colors || [],
        lastUpdated: product.updatedAt,
      };
    });

    const response = {
      stockLevels,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
        limit: parseInt(limit),
        skip: skip,
      },
    };

    console.log(
      "✅ [BACKEND] Sending response with pagination:",
      response.pagination
    );

    res.json(response);
  } catch (error) {
    console.error("❌ Error getting stock levels:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};


export const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockThreshold = req.query.threshold || 10;

    const products = await Product.find({
      archived: { $ne: true },
      // Only look for products with variants that have low stock
      "variants.countInStock": { $lte: lowStockThreshold },
    }).select("name price countInStock category images variants sku");

    const alerts = [];

    products.forEach((product) => {
      // ONLY check variant stock - NO main product checks
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          // Check low stock variants (stock > 0 but <= threshold)
          if (
            variant.countInStock <= lowStockThreshold &&
            variant.countInStock > 0
          ) {
            alerts.push({
              id: `${product._id}-${variant._id}`, // Unique ID for variant
              productId: product._id,
              name: product.name,
              variantName: `${variant.color || "Default"} - ${
                variant.size || "One Size"
              }`,
              image: product.images?.[0] || "",
              category: product.category,
              currentStock: variant.countInStock,
              threshold: lowStockThreshold,
              status: "low",
              price: variant.price || product.price,
              valueAtRisk:
                (variant.price || product.price) * variant.countInStock,
              type: "variant",
              variantId: variant._id,
              variantInfo: {
                color: variant.color,
                size: variant.size,
                sku: variant.sku,
              },
            });
          }

          // Check out of stock variants
          if (variant.countInStock === 0) {
            alerts.push({
              id: `${product._id}-${variant._id}-out`,
              productId: product._id,
              name: product.name,
              variantName: `${variant.color || "Default"} - ${
                variant.size || "One Size"
              }`,
              image: product.images?.[0] || "",
              category: product.category,
              currentStock: 0,
              threshold: lowStockThreshold,
              status: "out",
              price: variant.price || product.price,
              valueAtRisk: 0,
              type: "variant",
              variantId: variant._id,
              variantInfo: {
                color: variant.color,
                size: variant.size,
                sku: variant.sku,
              },
            });
          }
        });
      }
    });

    // Sort by urgency (out of stock first, then lowest stock)
    alerts.sort((a, b) => {
      if (a.status === "out" && b.status !== "out") return -1;
      if (b.status === "out" && a.status !== "out") return 1;
      return a.currentStock - b.currentStock;
    });

    res.json({
      alerts,
      summary: {
        totalLowStock: alerts.length,
        totalValueAtRisk: alerts.reduce((sum, a) => sum + a.valueAtRisk, 0),
        variantAlerts: alerts.filter((a) => a.type === "variant").length,
        mostUrgent: alerts.slice(0, 3),
      },
    });
  } catch (error) {
    console.error("Error getting low stock alerts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const adjustStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      adjustmentType,
      quantity,
      reason,
      notes,
      variantId, // REQUIRED - variantId must be provided
    } = req.body;

    // Validate that variantId is provided
    if (!variantId) {
      return res.status(400).json({
        message: "variantId is required in variant-only system",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the variant
    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    const oldStock = variant.countInStock;
    let newStock;
    const variantName = `${variant.color || "Default"} - ${
      variant.size || "One Size"
    }`;

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
          return res.status(400).json({ message: "Stock cannot be negative" });
        }
        break;
      default:
        return res.status(400).json({ message: "Invalid adjustment type" });
    }

    variant.countInStock = newStock;

    // Save the product (this will save the variant changes)
    await product.save();

    // Log the adjustment
    const inventoryLog = new InventoryLog({
      productId: product._id,
      variantId: variantId,
      variantName: variantName,
      adjustmentType,
      quantity: Math.abs(quantity),
      oldStock,
      newStock,
      reason,
      notes,
      adjustedBy: req.user._id,
    });

    await inventoryLog.save();

    // Return updated variant data
    res.json({
      message: "Stock adjusted successfully",
      product: {
        id: product._id,
        name: product.name,
        variantId: variantId,
        variantName: variantName,
        newStock: newStock,
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
    }).select("name price countInStock category images");

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
        image: product.images?.[0] || "",
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

    // Fetch products WITH variants
    const products = await Product.find({ archived: { $ne: true } }).select(
      "name price category variants"
    );

    let valuation;

    if (groupBy === "category") {
      // Group by category - CORRECTED
      valuation = products.reduce((acc, product) => {
        const category = product.category || "Uncategorized";

        // Calculate total value and items from VARIANTS
        const productValue = (product.variants || []).reduce(
          (vSum, variant) => {
            const variantPrice = variant.price || product.price;
            return vSum + variantPrice * (variant.countInStock || 0);
          },
          0
        );

        const productItems = (product.variants || []).reduce(
          (vSum, variant) => {
            return vSum + (variant.countInStock || 0);
          },
          0
        );

        if (!acc[category]) {
          acc[category] = {
            category,
            totalValue: 0,
            totalItems: 0,
            products: [],
          };
        }

        acc[category].totalValue += productValue;
        acc[category].totalItems += productItems;

        if (productValue > 0) {
          acc[category].products.push({
            name: product.name,
            stock: productItems,
            unitValue: product.price,
            totalValue: productValue,
          });
        }

        return acc;
      }, {});

      // Convert to array and sort
      valuation = Object.values(valuation).sort(
        (a, b) => b.totalValue - a.totalValue
      );
    } else {
      // Overall valuation - CORRECTED
      const totalValue = products.reduce((sum, product) => {
        return (
          sum +
          (product.variants || []).reduce((vSum, variant) => {
            const variantPrice = variant.price || product.price;
            return vSum + variantPrice * (variant.countInStock || 0);
          }, 0)
        );
      }, 0);

      const totalItems = products.reduce((sum, product) => {
        return (
          sum +
          (product.variants || []).reduce((vSum, variant) => {
            return vSum + (variant.countInStock || 0);
          }, 0)
        );
      }, 0);

      const averageValuePerItem = totalItems > 0 ? totalValue / totalItems : 0;

      // Most valuable items (products with highest total variant value)
      const mostValuable = products
        .map((product) => {
          const productValue = (product.variants || []).reduce(
            (vSum, variant) => {
              const variantPrice = variant.price || product.price;
              return vSum + variantPrice * (variant.countInStock || 0);
            },
            0
          );

          const productItems = (product.variants || []).reduce(
            (vSum, variant) => {
              return vSum + (variant.countInStock || 0);
            },
            0
          );

          return {
            name: product.name,
            stock: productItems,
            unitValue: product.price,
            totalValue: productValue,
          };
        })
        .filter((item) => item.totalValue > 0) // Only include items with stock
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
// Rename getLowStockAlerts to getAllAlerts in backend
 