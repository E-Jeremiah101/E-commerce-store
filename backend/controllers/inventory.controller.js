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

// 1. 📊 STOCK DASHBOARD - VARIANT-ONLY VERSION
export const getInventoryDashboard = async (req, res) => {
  try {
    // Fetch products WITH variants ONLY
    const products = await Product.find({ 
      archived: { $ne: true },
      "variants.0": { $exists: true } // Only products with variants
    }).select("name price category images variants");

    console.log(`📊 Found ${products.length} products with variants for dashboard`);

    // Calculate totals from VARIANTS ONLY
    let totalStockValue = 0;
    let totalVariantStock = 0;
    const lowStockThreshold = 10;
    
    const lowStockProducts = [];
    const outOfStockProducts = [];
    
    // Process each product's variants
    products.forEach((product) => {
      const productVariants = product.variants || [];
      
      // Calculate product-level totals
      let productTotalStock = 0;
      let productTotalValue = 0;
      let hasLowStock = false;
      let hasOutOfStock = false;
      
      productVariants.forEach((variant) => {
        const variantStock = variant.countInStock || 0;
        const variantPrice = variant.price || product.price;
        const variantValue = variantPrice * variantStock;
        
        productTotalStock += variantStock;
        productTotalValue += variantValue;
        
        // Check for low stock
        if (variantStock > 0 && variantStock <= lowStockThreshold) {
          hasLowStock = true;
        }
        
        // Check for out of stock
        if (variantStock === 0) {
          hasOutOfStock = true;
        }
      });
      
      // Add to global totals
      totalVariantStock += productTotalStock;
      totalStockValue += productTotalValue;
      
      // Add to alert lists if needed
      if (hasLowStock) {
        lowStockProducts.push({
          id: product._id,
          name: product.name,
          image: product.images?.[0] || null,
          category: product.category,
          currentStock: productTotalStock,
          threshold: lowStockThreshold,
        });
      }
      
      if (hasOutOfStock) {
        outOfStockProducts.push({
          id: product._id,
          name: product.name,
          image: product.images?.[0] || null,
          category: product.category,
          currentStock: 0,
          threshold: lowStockThreshold,
        });
      }
    });

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
    const inventoryTurnover = totalVariantStock > 0 ? 
      (totalUnitsSoldLast30Days / totalVariantStock).toFixed(2) : 0;

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
      // Fallback: Find products with the most variant stock
      const productsWithStock = products
        .map(product => {
          const productStock = product.variants.reduce(
            (sum, variant) => sum + (variant.countInStock || 0),
            0
          );
          const productValue = product.variants.reduce((sum, variant) => {
            const variantPrice = variant.price || product.price;
            return sum + (variantPrice * (variant.countInStock || 0));
          }, 0);
          
          return {
            id: product._id,
            name: product.name,
            currentStock: productStock,
            value: productValue,
            category: product.category,
            price: product.price,
            image: product.images?.[0] || null,
            source: "stock_levels",
          };
        })
        .filter(p => p.currentStock > 0)
        .sort((a, b) => b.currentStock - a.currentStock)
        .slice(0, 10);
      
      fastMovingProducts = productsWithStock;
    }

    res.json({
      summary: {
        totalProducts: products.length,
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
        totalVariantStock, // Add this for debugging
      },
      fastMovingProducts,
      alerts: {
        lowStock: lowStockProducts.slice(0, 7),
        outOfStock: outOfStockProducts.slice(0, 7),
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
    } = req.query;

    console.log("📡 [BACKEND] getStockLevels called");

    const skip = (page - 1) * limit;

    let filter = {
      archived: { $ne: true },
      "variants.0": { $exists: true }, // Only products with variants
    };

    // Search by name
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Build query
    let query = Product.find(filter);

    // Select fields - REMOVED main product stock fields
    query = query.select("name price category images variants");

    // Apply pagination
    query = query.skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

    const products = await query;
    const total = await Product.countDocuments(filter);

    console.log(`✅ Found ${products.length} products with variants`);

    // Transform data for VARIANT-ONLY SYSTEM
    const stockLevels = products.map((product) => {
      // Calculate totals from variants ONLY
      const variantsStock = product.variants.reduce(
        (sum, variant) => sum + (variant.countInStock || 0),
        0
      );

      // Calculate total value from variants ONLY
      const totalValue = product.variants.reduce((sum, variant) => {
        const variantPrice = variant.price || product.price;
        const variantStock = variant.countInStock || 0;
        return sum + variantPrice * variantStock;
      }, 0);

      // Determine worst status among variants
      let status = "healthy";
      const hasOutOfStock = product.variants.some((v) => v.countInStock === 0);
      const hasLowStock = product.variants.some(
        (v) => v.countInStock > 0 && v.countInStock <= 5
      );

      if (hasOutOfStock) {
        status = "out";
      } else if (hasLowStock) {
        status = "low";
      }

      // Transform variants
      const transformedVariants = product.variants.map((variant) => ({
        _id: variant._id,
        id: variant._id?.toString(),
        size: variant.size || "",
        color: variant.color || "",
        countInStock: variant.countInStock || 0,
        sku: variant.sku || "N/A",
        price: variant.price || product.price,
        variantValue:
          (variant.price || product.price) * (variant.countInStock || 0),
      }));

      return {
        id: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        category: product.category,
        price: product.price,
        variantsStock: variantsStock,
        totalStock: variantsStock, // Same as variantsStock
        status: status,
        variantsCount: product.variants.length,
        variants: transformedVariants,
        totalValue: totalValue,
        lastUpdated: product.updatedAt,
      };
    });

    // Log for debugging
    const totalStockInResponse = stockLevels.reduce(
      (sum, p) => sum + p.totalStock,
      0
    );
    console.log(`📊 Total variant stock in response: ${totalStockInResponse}`);

    res.json({
      stockLevels,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error getting stock levels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockThreshold = req.query.threshold || 10;

    // Find products with variants that have low stock
    const products = await Product.find({
      archived: { $ne: true },
      "variants.0": { $exists: true }, // Has variants
      "variants.countInStock": { $lte: lowStockThreshold },
    }).select("name price category images variants");

    const alerts = [];

    products.forEach((product) => {
      product.variants.forEach((variant) => {
        // Check low stock variants
        if (
          variant.countInStock <= lowStockThreshold &&
          variant.countInStock > 0
        ) {
          alerts.push({
            id: `${product._id}-${variant._id}`,
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
            variantId: variant._id,
            variantInfo: {
              color: variant.color,
              size: variant.size,
              sku: variant.sku,
            },
          });
        }
      });
    });

    // Sort by urgency
    alerts.sort((a, b) => {
      if (a.status === "out" && b.status !== "out") return -1;
      if (b.status === "out" && a.status !== "out") return 1;
      return a.currentStock - b.currentStock;
    });

    console.log(`🚨 Found ${alerts.length} variant alerts`);

    res.json({
      alerts,
      summary: {
        totalLowStock: alerts.length,
        totalValueAtRisk: alerts.reduce((sum, a) => sum + a.valueAtRisk, 0),
        variantAlerts: alerts.length, // All alerts are variants
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

// 7. 📋 REORDER MANAGEMENT - VARIANT-LEVEL SUGGESTIONS
export const getReorderSuggestions = async (req, res) => {
  try {
    const reorderThreshold = req.query.threshold || 10;

    // Find products with variants
    const products = await Product.find({
      archived: { $ne: true },
      "variants.0": { $exists: true }
    }).select("name price category images variants");

    const suggestions = [];

    products.forEach((product) => {
      product.variants.forEach((variant) => {
        const variantStock = variant.countInStock || 0;
        
        // Only create suggestion for low/out of stock variants
        if (variantStock <= reorderThreshold) {
          const variantName = `${variant.color || "Default"} - ${variant.size || "One Size"}`;
          const variantPrice = variant.price || product.price;
          
          // Calculate suggested order quantity
          let suggestedOrder = 0;
          let urgency = "medium";
          
          if (variantStock === 0) {
            suggestedOrder = reorderThreshold * 3; // More for out of stock
            urgency = "critical";
          } else if (variantStock <= 5) {
            suggestedOrder = reorderThreshold * 2 - variantStock;
            urgency = "high";
          } else {
            suggestedOrder = reorderThreshold * 2 - variantStock;
            urgency = "medium";
          }
          
          // Ensure minimum order
          suggestedOrder = Math.max(suggestedOrder, 10);
          
          const estimatedCost = suggestedOrder * variantPrice;

          suggestions.push({
            id: `${product._id}-${variant._id}`,
            productId: product._id,
            variantId: variant._id,
            name: product.name,
            variantName: variantName,
            category: product.category,
            currentStock: variantStock,
            reorderThreshold,
            suggestedOrder,
            unitPrice: variantPrice,
            estimatedCost,
            leadTime: "7 days",
            urgency,
            supplier: "Default Supplier",
            image: product.images?.[0] || "",
            size: variant.size,
            color: variant.color,
            sku: variant.sku || product.sku || "N/A"
          });
        }
      });
    });

    // Sort by urgency
    suggestions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    const totalCost = suggestions.reduce((sum, s) => sum + s.estimatedCost, 0);

    console.log(`📋 Generated ${suggestions.length} reorder suggestions (variant-level)`);

    res.json({
      suggestions,
      summary: {
        totalSuggestions: suggestions.length,
        totalEstimatedCost: totalCost,
        criticalCount: suggestions.filter((s) => s.urgency === "critical").length,
        highPriorityCount: suggestions.filter((s) => s.urgency === "high").length,
        variantSuggestions: suggestions.length, // All are variant-level
      },
    });
  } catch (error) {
    console.error("Error getting reorder suggestions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getInventoryValuation = async (req, res) => {
  try {
    const { groupBy = "category" } = req.query;

    // Fetch products WITH variants ONLY
    const products = await Product.find({
      archived: { $ne: true },
      "variants.0": { $exists: true }, // Only products with variants
    }).select("name price category variants");

    console.log(
      `📊 Found ${products.length} products with variants for valuation`
    );

    // DEBUG: Calculate total variant stock
    let totalVariantStockDebug = 0;
    products.forEach((product) => {
      const productVariantStock = product.variants.reduce((sum, variant) => {
        return sum + (variant.countInStock || 0);
      }, 0);
      totalVariantStockDebug += productVariantStock;
    });
    console.log(
      `🔍 DEBUG: Total variant stock from all products: ${totalVariantStockDebug}`
    );

    if (groupBy === "category") {
      // Group by category - VARIANT-ONLY SYSTEM
      const categoryGroups = products.reduce((acc, product) => {
        const category = product.category || "Uncategorized";
        const productVariants = product.variants || [];

        // Calculate stock and value from variants ONLY
        const productStock = productVariants.reduce(
          (sum, variant) => sum + (variant.countInStock || 0),
          0
        );

        const productValue = productVariants.reduce((vSum, variant) => {
          const variantPrice = variant.price || product.price;
          const variantStock = variant.countInStock || 0;
          return vSum + variantPrice * variantStock;
        }, 0);

        // Initialize category if not exists
        if (!acc[category]) {
          acc[category] = {
            category,
            totalValue: 0,
            totalProducts: 0,
            totalVariants: 0,
            totalStock: 0,
            products: [],
          };
        }

        // Add to category totals
        acc[category].totalValue += productValue;
        acc[category].totalProducts += 1;
        acc[category].totalVariants += productVariants.length;
        acc[category].totalStock += productStock;

        // Only add product if it has variant stock
        if (productStock > 0) {
          acc[category].products.push({
            name: product.name,
            variantsCount: productVariants.length,
            totalStock: productStock,
            unitValue: product.price,
            totalValue: productValue,
            variants: productVariants.map((v) => ({
              color: v.color,
              size: v.size,
              stock: v.countInStock || 0,
              price: v.price || product.price,
            })),
          });
        }

        return acc;
      }, {});

      // Convert to array and sort
      const valuationData = Object.values(categoryGroups).sort(
        (a, b) => b.totalValue - a.totalValue
      );

      // Calculate summary stats from VARIANTS ONLY
      const totalValue = valuationData.reduce(
        (sum, cat) => sum + cat.totalValue,
        0
      );
      const totalProducts = valuationData.reduce(
        (sum, cat) => sum + cat.totalProducts,
        0
      );
      const totalVariants = valuationData.reduce(
        (sum, cat) => sum + cat.totalVariants,
        0
      );
      const totalStock = valuationData.reduce(
        (sum, cat) => sum + cat.totalStock,
        0
      );

      console.log("✅ FINAL CALCULATION:", {
        totalStockCalculated: totalStock,
        totalValueCalculated: totalValue,
        averageValue: totalStock > 0 ? totalValue / totalStock : 0,
      });

      res.json({
        valuation: {
          summary: {
            totalValue,
            totalProducts,
            totalVariants,
            totalStock,
            averageValuePerItem: totalStock > 0 ? totalValue / totalStock : 0,
          },
          categories: valuationData,
        },
        timestamp: new Date(),
      });
    } else {
      // Overall valuation - VARIANT-ONLY
      const totalValue = products.reduce((sum, product) => {
        const productValue = product.variants.reduce((vSum, variant) => {
          const variantPrice = variant.price || product.price;
          const variantStock = variant.countInStock || 0;
          return vSum + variantPrice * variantStock;
        }, 0);
        return sum + productValue;
      }, 0);

      const totalProducts = products.length;
      const totalVariants = products.reduce((sum, product) => {
        return sum + product.variants.length;
      }, 0);

      const totalStock = products.reduce((sum, product) => {
        const productStock = product.variants.reduce((vSum, variant) => {
          return vSum + (variant.countInStock || 0);
        }, 0);
        return sum + productStock;
      }, 0);

      const averageValuePerItem = totalStock > 0 ? totalValue / totalStock : 0;

      // Most valuable items
      const mostValuable = products
        .map((product) => {
          const productVariants = product.variants;
          const productValue = productVariants.reduce((vSum, variant) => {
            const variantPrice = variant.price || product.price;
            const variantStock = variant.countInStock || 0;
            return vSum + variantPrice * variantStock;
          }, 0);

          const productStock = productVariants.reduce((vSum, variant) => {
            return vSum + (variant.countInStock || 0);
          }, 0);

          return {
            name: product.name,
            category: product.category,
            variantsCount: productVariants.length,
            stock: productStock,
            unitValue: product.price,
            totalValue: productValue,
          };
        })
        .filter((item) => item.totalValue > 0)
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      res.json({
        valuation: {
          summary: {
            totalValue,
            totalProducts,
            totalVariants,
            totalStock,
            averageValuePerItem,
          },
          mostValuable,
        },
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error("Error getting inventory valuation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
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


export const getInventoryAgingReport = async (req, res) => {
  try {
    const products = await Product.find({ 
      archived: { $ne: true },
      "variants.0": { $exists: true }
    }).select("name category price variants createdAt updatedAt");

    const now = new Date();
    const agingBuckets = {
      fresh: { label: "Fresh (0-30 days)", days: 30, totalValue: 0, totalItems: 0, products: [] },
      aging: { label: "Aging (31-90 days)", days: 90, totalValue: 0, totalItems: 0, products: [] },
      stale: { label: "Stale (91-180 days)", days: 180, totalValue: 0, totalItems: 0, products: [] },
      old: { label: "Old (180+ days)", days: 365, totalValue: 0, totalItems: 0, products: [] }
    };

    // Process each product's variants
    products.forEach(product => {
      const productVariants = product.variants || [];
      
      productVariants.forEach(variant => {
        const variantAge = Math.floor((now - new Date(variant.createdAt || product.createdAt)) / (1000 * 60 * 60 * 24));
        const variantPrice = variant.price || product.price;
        const variantStock = variant.countInStock || 0;
        const variantValue = variantPrice * variantStock;

        if (variantStock > 0) { // Only count items in stock
          let bucket;
          
          if (variantAge <= 30) {
            bucket = agingBuckets.fresh;
          } else if (variantAge <= 90) {
            bucket = agingBuckets.aging;
          } else if (variantAge <= 180) {
            bucket = agingBuckets.stale;
          } else {
            bucket = agingBuckets.old;
          }

          bucket.totalValue += variantValue;
          bucket.totalItems += variantStock;

          // Add to product list (limit to top 5 per bucket)
          if (bucket.products.length < 5) {
            bucket.products.push({
              productId: product._id,
              name: product.name,
              variantName: `${variant.color || 'Default'} - ${variant.size || 'One Size'}`,
              ageInDays: variantAge,
              stock: variantStock,
              unitPrice: variantPrice,
              totalValue: variantValue,
              lastMovement: variant.updatedAt || product.updatedAt
            });
          }
        }
      });
    });

    // Calculate totals
    const totalValue = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.totalValue, 0);
    const totalItems = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.totalItems, 0);

    // Sort buckets by age (fresh to old)
    const bucketsArray = Object.values(agingBuckets);

    // Find slow movers (highest value in old/stale buckets)
    const slowMovers = [...agingBuckets.stale.products, ...agingBuckets.old.products]
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    // Calculate aging score (lower is better)
    const agingScore = Math.round(
      (agingBuckets.fresh.totalValue * 1 + 
       agingBuckets.aging.totalValue * 2 + 
       agingBuckets.stale.totalValue * 3 + 
       agingBuckets.old.totalValue * 4) / totalValue
    );

    res.json({
      summary: {
        totalValue,
        totalItems,
        agingScore: Math.min(agingScore, 5), // Scale to 1-5
        freshPercentage: Math.round((agingBuckets.fresh.totalValue / totalValue) * 100),
        stalePercentage: Math.round(((agingBuckets.stale.totalValue + agingBuckets.old.totalValue) / totalValue) * 100),
        reportDate: now
      },
      agingBuckets: bucketsArray,
      slowMovers,
      recommendations: generateAgingRecommendations(agingBuckets, totalValue)
    });
  } catch (error) {
    console.error("Error getting inventory aging report:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function for aging  recommendations
const generateAgingRecommendations = (buckets, totalValue) => {
  const recommendations = [];
  const staleOldValue = buckets.stale.totalValue + buckets.old.totalValue;
  const staleOldPercentage = Math.round((staleOldValue / totalValue) * 100);

  if (staleOldPercentage > 30) {
    recommendations.push({
      type: "urgent",
      title: "High Aging Inventory",
      message: `${staleOldPercentage}% of your inventory value is over 90 days old. Consider promotions or markdowns.`,
      action: "Create clearance sale"
    });
  }

  if (buckets.old.totalValue > totalValue * 0.15) {
    recommendations.push({
      type: "warning",
      title: "Old Stock Detected",
      message: "Significant inventory is over 6 months old. This may become obsolete.",
      action: "Review oldest items"
    });
  }

  if (buckets.fresh.totalValue < totalValue * 0.3) {
    recommendations.push({
      type: "info",
      title: "Low Fresh Inventory",
      message: "Consider bringing in new merchandise to keep assortment fresh.",
      action: "Plan new arrivals"
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "success",
      title: "Healthy Inventory Age",
      message: "Your inventory age distribution looks good. Keep up the good work!",
      action: "Maintain current turnover"
    });
  }

  return recommendations;
};
 