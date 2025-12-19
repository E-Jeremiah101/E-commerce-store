import Product from "../models/product.model.js";
import InventoryLog from "../models/inventoryLog.model.js";
import Order from "../models/order.model.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";
import storeSettings from "../models/storeSettings.model.js"

// Helper for variant-specific inventory logging
const logVariantInventoryAction = async (
  req,
  action,
  productId,
  variantId,
  changes = {},
  additionalInfo = ""
) => {
  try {
    // Only log if user is an admin
    if (!req.user || req.user.role !== "admin") {
      return;
    }

    const product = await Product.findById(productId);
    if (!product) return;

    const variant = product.variants.id(variantId);
    if (!variant) return;

    const variantName = `${variant.color || "Default"} - ${
      variant.size || "One Size"
    }`;

    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action,
      entityType: ENTITY_TYPES.PRODUCT,
      entityId: product._id,
      entityName: `${product.name} - ${variantName}`,
      changes,
      ...AuditLogger.getRequestInfo(req),
      additionalInfo,
    });
  } catch (error) {
    console.error("Failed to log variant inventory action:", error);
  }
};


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

// 1. STOCK DASHBOARD - VARIANT-ONLY VERSION
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
        lowStock: lowStockProducts.slice(0, 5),
        outOfStock: outOfStockProducts.slice(0, 5),
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

     await AuditLogger.log({
       adminId: req.user._id,
       adminName: `${req.user.firstname} ${req.user.lastname}`,
       action: "INVENTORY_SYNC",
       entityType: ENTITY_TYPES.SYSTEM,
       entityId: null,
       entityName: "Order-Inventory Sync",
       changes: {
         syncResult: {
           syncedOrders: result.synced || 0,
           timestamp: new Date().toISOString(),
         },
       },
       ...AuditLogger.getRequestInfo(req),
       additionalInfo: `Manual inventory sync completed: ${
         result.synced || 0
       } orders processed`,
     });

    res.json({
      message: "Inventory sync completed",
      ...result,
    });
  } catch (error) {
    console.error("Error syncing orders:", error);
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: "INVENTORY_SYNC_FAILED",
      entityType: ENTITY_TYPES.SYSTEM,
      entityId: null,
      entityName: "Failed Sync",
      changes: {
        error: error.message,
      },
      ...AuditLogger.getRequestInfo(req),
      additionalInfo: "Manual inventory sync failed",
    });
    res.status(500).json({ message: "Sync failed", error: error.message });
  }
};

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

    // ✅ FIXED: Select ALL price fields including slash data
    query = query.select(
      "name price category images variants previousPrice isPriceSlashed priceHistory"
    );

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

      // ✅ ADD: Calculate discount percentage if price is slashed
      let discountPercentage = null;
      if (product.isPriceSlashed && product.previousPrice) {
        discountPercentage = (
          ((product.previousPrice - product.price) / product.previousPrice) *
          100
        ).toFixed(1);
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
        _id: product._id, // Also include _id for consistency
        name: product.name,
        image: product.images?.[0] || "",
        category: product.category,
        price: product.price,
        // ✅ ADD: Price slash data
        previousPrice: product.previousPrice || null,
        isPriceSlashed: product.isPriceSlashed || false,
        discountPercentage: discountPercentage,
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

    // Log sample product with price data
    if (stockLevels.length > 0) {
      console.log(`🔍 Sample product price data:`, {
        name: stockLevels[0].name,
        price: stockLevels[0].price,
        previousPrice: stockLevels[0].previousPrice,
        isPriceSlashed: stockLevels[0].isPriceSlashed,
        discountPercentage: stockLevels[0].discountPercentage,
      });
    }

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

    // Find ALL products with variants (not just those with low stock)
    const products = await Product.find({
      archived: { $ne: true },
      "variants.0": { $exists: true }, // Has variants
    }).select("name price category images variants");

    console.log(
      `📊 Found ${products.length} products with variants for low stock alerts`
    );

    const alerts = [];
    let totalOutOfStock = 0;
    let totalLowStock = 0;

    products.forEach((product) => {
      product.variants.forEach((variant) => {
        const variantStock = variant.countInStock || 0;

        // Check low stock variants
        if (variantStock <= lowStockThreshold && variantStock > 0) {
          alerts.push({
            id: `${product._id}-${variant._id}`,
            productId: product._id,
            name: product.name,
            variantName: `${variant.color || "Default"} - ${
              variant.size || "One Size"
            }`,
            image: product.images?.[0] || "",
            category: product.category,
            currentStock: variantStock,
            threshold: lowStockThreshold,
            status: "low",
            price: variant.price || product.price,
            valueAtRisk: (variant.price || product.price) * variantStock,
            variantId: variant._id,
            variantInfo: {
              color: variant.color,
              size: variant.size,
              sku: variant.sku,
            },
          });
          totalLowStock++;
        }

        // Check out of stock variants
        if (variantStock === 0) {
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
          totalOutOfStock++;
        }
      });
    });

    console.log(
      `🚨 Found ${totalOutOfStock} out of stock variants and ${totalLowStock} low stock variants`
    );

    // Sort by urgency
    alerts.sort((a, b) => {
      if (a.status === "out" && b.status !== "out") return -1;
      if (b.status === "out" && a.status !== "out") return 1;
      return a.currentStock - b.currentStock;
    });

    res.json({
      alerts,
      summary: {
        totalOutOfStock,
        totalLowStock,
        totalAlerts: alerts.length,
        totalValueAtRisk: alerts.reduce((sum, a) => sum + a.valueAtRisk, 0),
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

    // AUDIT LOG: Log the admin action
    await logVariantInventoryAction(
      req,
      ACTIONS.UPDATE_INVENTORY,
      productId,
      variantId,
      {
        variant: {
          name: variantName,
          size: variant.size,
          color: variant.color,
          before: { countInStock: oldStock },
          after: { countInStock: newStock },
        },
        adjustment: {
          type: adjustmentType,
          quantity: Math.abs(quantity),
          reason,
          notes,
        },
      },
      `Variant stock ${
        adjustmentType === "add"
          ? "increased"
          : adjustmentType === "remove"
          ? "decreased"
          : "set"
      } from ${oldStock} to ${newStock}`
    );

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

// 6. MULTI-LOCATION INVENTORY (Simplified)
export const getInventoryByLocation = async (req, res) => {
  try {
    const settings = await storeSettings.findOne();

    // Fetch products WITH variants ONLY
    const products = await Product.find({
      archived: { $ne: true },
      "variants.0": { $exists: true }, // Only products with variants
    }).select("name price category variants images");

    console.log(
      `📊 Found ${products.length} products with variants for location view`
    );

    // Main warehouse location
    const locations = [
      {
        id: "main",
        name: "Main Warehouse",
        state: `${settings?.warehouseLocation?.state || "Not Set"}`,
        city: `${settings?.warehouseLocation?.city || "Not Set"}`,
        address: `${settings?.warehouseLocation?.address || "Not Set"}`,
      },
    ];

    // Process all products for the main warehouse
    const locationProducts = [];
    let totalLocationValue = 0;
    let totalLocationItems = 0; // Total stock items (items with stock > 0)
    let totalOutOfStockVariants = 0; // Count of variants with 0 stock
    let totalVariants = 0;

    products.forEach((product) => {
      // Calculate total stock from ALL variants of this product
      let productTotalStock = 0;
      let productOutOfStockVariants = 0;
      let productVariantsCount = product.variants.length;

      product.variants.forEach((variant) => {
        const variantStock = variant.countInStock || 0;
        productTotalStock += variantStock;

        if (variantStock === 0) {
          productOutOfStockVariants++;
          totalOutOfStockVariants++;
        }

        totalVariants++;
      });

      if (productTotalStock > 0) {
        // Calculate product value (using product price as base)
        const productValue = product.price * productTotalStock;

        locationProducts.push({
          productId: product._id,
          productName: product.name,
          productImage:product.images,
          stock: productTotalStock,
          value: productValue,
          price: product.price,
          variantsCount: productVariantsCount,
          outOfStockVariants: productOutOfStockVariants,
        });

        totalLocationValue += productValue;
        totalLocationItems += productTotalStock;
      } else {
        // Product is completely out of stock
        locationProducts.push({
          productId: product._id,
          productName: product.name,
          stock: 0,
          value: 0,
          price: product.price,
          variantsCount: productVariantsCount,
          outOfStockVariants: productOutOfStockVariants,
        });
        // Don't add to totalLocationItems since stock is 0
      }
    });

    // Sort products by value (highest first)
    locationProducts.sort((a, b) => b.value - a.value);

    const inventoryByLocation = locations.map((location) => ({
      ...location,
      totalValue: totalLocationValue,
      totalItems: totalLocationItems, // Items with stock > 0
      totalVariants: totalVariants, // Total variant count
      outOfStockVariants: totalOutOfStockVariants, // Variants with 0 stock
      inStockVariants: totalVariants - totalOutOfStockVariants, // Variants with stock > 0
      products: locationProducts.slice(0, 10), // Top 10 products
    }));

    console.log(
      `✅ Location data: ${totalLocationItems} total items, ${totalLocationValue} total value`
    );

    res.json({
      locations: inventoryByLocation,
      summary: {
        totalLocations: locations.length,
        totalValueAcrossLocations: totalLocationValue,
        totalItemsAcrossLocations: totalLocationItems, // Items with stock
        totalVariantsAcrossLocations: totalVariants, // All variants
        outOfStockVariantsAcrossLocations: totalOutOfStockVariants, // Out of stock variants
        averageValuePerItem:
          totalLocationItems > 0 ? totalLocationValue / totalLocationItems : 0,
      },
    });
  } catch (error) {
    console.error("Error getting inventory by location:", error);
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