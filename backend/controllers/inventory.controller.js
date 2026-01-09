import Product from "../models/product.model.js";
import InventoryLog from "../models/inventoryLog.model.js";
import Order from "../models/order.model.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";
import storeSettings from "../models/storeSettings.model.js"
import redis from "../lib/redis.js";


const logVariantInventoryAction = async (
  req,
  action,
  productId,
  variantId,
  changes = {},
  additionalInfo = ""
) => {
  try {

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


export const restoreStockForCancelledOrder = async (order) => {
  try {
    const stockRestorationResults = [];
    
    for (const item of order.products) {
      if (!item.product) {
        stockRestorationResults.push({
          status: 'NO_PRODUCT_ID',
          message: `No product ID found for "${item.name}" - cannot restore stock`,
          productName: item.name,
          quantity: item.quantity
        });
        continue;
      }

      const product = await Product.findById(item.product);
      if (!product) {
        stockRestorationResults.push({
          status: 'PRODUCT_NOT_FOUND',
          message: `Product "${item.name}" not found in database`,
          productName: item.name,
          quantity: item.quantity
        });
        continue;
      }

      if (product.variants && product.variants.length > 0) {

        const variant = product.variants.find(v => 
          (v.size === item.selectedSize || (!v.size && !item.selectedSize)) &&
          (v.color === item.selectedColor || (!v.color && !item.selectedColor))
        );
        
        if (variant) {
          const oldStock = variant.countInStock;
          variant.countInStock += item.quantity;
          

          const inventoryLog = new InventoryLog({
            productId: product._id,
            variantId: variant._id,
            variantName: `${variant.color || 'Default'} - ${variant.size || 'One Size'}`,
            adjustmentType: "add",
            quantity: item.quantity,
            oldStock,
            newStock: variant.countInStock,
            reason: "order_cancellation",
            notes: `Order #${order.orderNumber} cancelled - stock restored`,
            adjustedBy: order.user,
            referenceId: order._id
          });
          
          await inventoryLog.save();
          
          stockRestorationResults.push({
            status: 'RESTORED',
            message: ` Stock restored for ${item.name}: ${item.quantity} units added back to ${variant.size || 'N/A'}/${variant.color || 'N/A'}`,
            productName: item.name,
            quantity: item.quantity,
            variantSize: variant.size,
            variantColor: variant.color,
            oldStock,
            newStock: variant.countInStock
          });
        } else {
  
          const fuzzyVariant = product.variants.find(v => {
            const sizeMatch = !item.selectedSize || v.size === item.selectedSize || 
                             v.size === '' || v.size === 'Standard';
            const colorMatch = !item.selectedColor || v.color === item.selectedColor || 
                              v.color === '' || v.color === 'Standard';
            return sizeMatch && colorMatch;
          });
          
          if (fuzzyVariant) {
            const oldStock = fuzzyVariant.countInStock;
            fuzzyVariant.countInStock += item.quantity;
            
            const inventoryLog = new InventoryLog({
              productId: product._id,
              variantId: fuzzyVariant._id,
              variantName: `${fuzzyVariant.color || 'Default'} - ${fuzzyVariant.size || 'One Size'}`,
              adjustmentType: "add",
              quantity: item.quantity,
              oldStock,
              newStock: fuzzyVariant.countInStock,
              reason: "order_cancellation",
              notes: `Order #${order.orderNumber} cancelled - stock restored (fuzzy match)`,
              adjustedBy: order.user,
              referenceId: order._id
            });
            
            await inventoryLog.save();
            
            stockRestorationResults.push({
              status: 'RESTORED_FUZZY',
              message: ` Stock restored (fuzzy match) for ${item.name}: ${item.quantity} units added back to ${fuzzyVariant.size || 'N/A'}/${fuzzyVariant.color || 'N/A'}`,
              productName: item.name,
              quantity: item.quantity,
              variantSize: fuzzyVariant.size,
              variantColor: fuzzyVariant.color,
              oldStock,
              newStock: fuzzyVariant.countInStock
            });
          } else {
            stockRestorationResults.push({
              status: 'VARIANT_NOT_FOUND',
              message: ` Could not find variant for ${item.name} (Size: ${item.selectedSize || 'Any'}, Color: ${item.selectedColor || 'Any'})`,
              productName: item.name,
              quantity: item.quantity
            });
          }
        }
      } else {

        const oldStock = product.countInStock || 0;
        product.countInStock = (product.countInStock || 0) + item.quantity;
        
        const inventoryLog = new InventoryLog({
          productId: product._id,
          variantId: null,
          variantName: "No Variant",
          adjustmentType: "add",
          quantity: item.quantity,
          oldStock,
          newStock: product.countInStock,
          reason: "order_cancellation",
          notes: `Order #${order.orderNumber} cancelled - stock restored`,
          adjustedBy: order.user,
          referenceId: order._id
        });
        
        await inventoryLog.save();
        
        stockRestorationResults.push({
          status: 'RESTORED',
          message: ` Stock restored for ${item.name}: ${item.quantity} units added back`,
          productName: item.name,
          quantity: item.quantity,
          oldStock,
          newStock: product.countInStock
        });
      }
      
      await product.save();
    }
    

    return stockRestorationResults;
    
  } catch (error) {
    console.error("Error restoring stock for cancelled order:", error);
    throw error;
  }
};

const getTopSellingProducts = async (
  limit = 10,
) => {
  try {
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date();

    const matchStage = {
      status: { $nin: ["Cancelled"] },
      createdAt: { $gte: thirtyDaysAgo, $lte: today },
    };

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
      { $match: { totalSold: { $gt: 0 } } }, 
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

    return topProducts;
  } catch (error) {
    console.error(" Error getting top selling products:", error);
    return []; 
  }
};

export const syncInventoryWithStoreOrders = async () => {
  try {
    
  
    const deliveredOrders = await Order.find({
      status: "Pending",
      isProcessed: false 
    }).limit(50);

    let updatedCount = 0; 
    
    for (const order of deliveredOrders) {
      try {
        for (const item of order.products) {
          const product = await Product.findById(item.product);
          if (!product) continue;

          
          if (product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => 
              (v.size === item.selectedSize || (!v.size && !item.selectedSize)) &&
              (v.color === item.selectedColor || (!v.color && !item.selectedColor))
            );

            if (variant) {
              const oldStock = variant.countInStock;
              
          
              const newStock = Math.max(0, oldStock - item.quantity);
              variant.countInStock = newStock;

            
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

        order.isProcessed = true;
        await order.save();
        
        updatedCount++;
        
      } catch (error) {
        console.error(`Error processing order ${order.orderNumber}:`, error);
      }
    }

    return { synced: updatedCount };
  } catch (error) {
    console.error("Error syncing inventory with orders:", error);
    throw error;
  }
};


export const getInventoryDashboard = async (req, res) => {
  try {
   
    const products = await Product.find({ 
      archived: { $ne: true },
      "variants.0": { $exists: true } 
    }).select("name price category images variants");

    let totalStockValue = 0;
    let totalVariantStock = 0;
    const lowStockThreshold = 10;
    
    const lowStockProducts = [];
    const outOfStockProducts = [];
    
    products.forEach((product) => {
      const productVariants = product.variants || [];
      
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
        
        if (variantStock > 0 && variantStock <= lowStockThreshold) {
          hasLowStock = true;
        }
        
        if (variantStock === 0) {
          hasOutOfStock = true;
        }
      });
      
      totalVariantStock += productTotalStock;
      totalStockValue += productTotalValue;
      
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

    const topSellingProducts = await getTopSellingProducts(5);

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

    const totalUnitsSoldLast30Days = topSellingProducts.reduce(
      (sum, product) => sum + (product.totalSold || 0),
      0
    );

  

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
      
        totalOrdersLast30Days: stats.totalOrders,
        deliveredOrdersLast30Days: stats.deliveredOrders,
        totalRevenueLast30Days: stats.totalRevenue,
        totalSalesLast30Days: totalUnitsSoldLast30Days,
        hasOrderData: hasOrderData,
        totalVariantStock,
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

    const skip = (page - 1) * limit;

    let filter = {
      archived: { $ne: true },
      "variants.0": { $exists: true }, 
    };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    let query = Product.find(filter);

    query = query.select(
      "name price category images variants previousPrice isPriceSlashed priceHistory"
    );

    query = query.skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

    const products = await query;
    const total = await Product.countDocuments(filter);

    console.log(`Found ${products.length} products with variants`);

    const stockLevels = products.map((product) => {
      
      const variantsStock = product.variants.reduce(
        (sum, variant) => sum + (variant.countInStock || 0),
        0
      );

  
      const totalValue = product.variants.reduce((sum, variant) => {
        const variantPrice = variant.price || product.price;
        const variantStock = variant.countInStock || 0;
        return sum + variantPrice * variantStock;
      }, 0);

  
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


      let discountPercentage = null;
      if (product.isPriceSlashed && product.previousPrice) {
        discountPercentage = (
          ((product.previousPrice - product.price) / product.previousPrice) *
          100
        ).toFixed(1);
      }

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
        _id: product._id, 
        name: product.name,
        image: product.images?.[0] || "",
        category: product.category,
        price: product.price,
        previousPrice: product.previousPrice || null,
        isPriceSlashed: product.isPriceSlashed || false,
        discountPercentage: discountPercentage,
        variantsStock: variantsStock,
        totalStock: variantsStock, 
        status: status,
        variantsCount: product.variants.length,
        variants: transformedVariants,
        totalValue: totalValue,
        lastUpdated: product.updatedAt,
      };
    });

    if (stockLevels.length > 0) {
      console.log(`Sample product price data:`, {
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
    console.error(" Error getting stock levels:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockThreshold = req.query.threshold || 10;

    
    const products = await Product.find({
      archived: { $ne: true },
      "variants.0": { $exists: true }, 
    }).select("name price category images variants");

    const alerts = [];
    let totalOutOfStock = 0;
    let totalLowStock = 0;

    products.forEach((product) => {
      product.variants.forEach((variant) => {
        const variantStock = variant.countInStock || 0;

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
      variantId, 
    } = req.body;

    if (!variantId) {
      return res.status(400).json({
        message: "variantId is required in variant-only system",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

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

    await product.save();

    if (product.isFeatured) {
      await redis.del("featured_products");
    }

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


export const getInventoryByLocation = async (req, res) => {
  try {
    const settings = await storeSettings.findOne();

    const products = await Product.find({
      archived: { $ne: true },
      "variants.0": { $exists: true }, 
    }).select("name price category variants images");

   
    const locations = [
      {
        id: "main",
        name: "Main Warehouse",
        state: `${settings?.warehouseLocation?.state || "Not Set"}`,
        city: `${settings?.warehouseLocation?.city || "Not Set"}`,
        address: `${settings?.warehouseLocation?.address || "Not Set"}`,
      },
    ];

    const locationProducts = [];
    let totalLocationValue = 0;
    let totalLocationItems = 0; 
    let totalOutOfStockVariants = 0; 
    let totalVariants = 0;

    products.forEach((product) => {
      
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
       
        locationProducts.push({
          productId: product._id,
          productName: product.name,
          stock: 0,
          value: 0,
          price: product.price,
          variantsCount: productVariantsCount,
          outOfStockVariants: productOutOfStockVariants,
        });
      
      }
    });

    locationProducts.sort((a, b) => b.value - a.value);

    const inventoryByLocation = locations.map((location) => ({
      ...location,
      totalValue: totalLocationValue,
      totalItems: totalLocationItems, 
      totalVariants: totalVariants, 
      outOfStockVariants: totalOutOfStockVariants, 
      inStockVariants: totalVariants - totalOutOfStockVariants,
      products: locationProducts.slice(0, 10), 
    }));

 
    res.json({
      locations: inventoryByLocation,
      summary: {
        totalLocations: locations.length,
        totalValueAcrossLocations: totalLocationValue,
        totalItemsAcrossLocations: totalLocationItems,
        totalVariantsAcrossLocations: totalVariants, 
        outOfStockVariantsAcrossLocations: totalOutOfStockVariants, 
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

   
    const products = await Product.find({
      archived: { $ne: true },
      "variants.0": { $exists: true }, 
    }).select("name price category variants");

 

    
    let totalVariantStockDebug = 0;
    products.forEach((product) => {
      const productVariantStock = product.variants.reduce((sum, variant) => {
        return sum + (variant.countInStock || 0);
      }, 0);
      totalVariantStockDebug += productVariantStock;
    });
 

    if (groupBy === "category") {
      const categoryGroups = products.reduce((acc, product) => {
        const category = product.category || "Uncategorized";
        const productVariants = product.variants || [];
        const productStock = productVariants.reduce(
          (sum, variant) => sum + (variant.countInStock || 0),
          0
        );

        const productValue = productVariants.reduce((vSum, variant) => {
          const variantPrice = variant.price || product.price;
          const variantStock = variant.countInStock || 0;
          return vSum + variantPrice * variantStock;
        }, 0);

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

        
        acc[category].totalValue += productValue;
        acc[category].totalProducts += 1;
        acc[category].totalVariants += productVariants.length;
        acc[category].totalStock += productStock;

    
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

   
      const valuationData = Object.values(categoryGroups).sort(
        (a, b) => b.totalValue - a.totalValue
      );


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

   
    products.forEach(product => {
      const productVariants = product.variants || [];
      
      productVariants.forEach(variant => {
        const variantAge = Math.floor((now - new Date(variant.createdAt || product.createdAt)) / (1000 * 60 * 60 * 24));
        const variantPrice = variant.price || product.price;
        const variantStock = variant.countInStock || 0;
        const variantValue = variantPrice * variantStock;

        if (variantStock > 0) { 
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

 
    const totalValue = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.totalValue, 0);
    const totalItems = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.totalItems, 0);

    const bucketsArray = Object.values(agingBuckets);


    const slowMovers = [...agingBuckets.stale.products, ...agingBuckets.old.products]
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

 
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
        agingScore: Math.min(agingScore, 5), 
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

export const exportInventoryCSV = async (req, res) => {
  try {
    
    const products = await Product.find({
      archived: { $ne: true },
      "variants.0": { $exists: true }
    }).select("name price category costPrice images variants countInStock createdAt updatedAt");


    const headers = [
      'Product ID',
      'Product Name',
      'Category',
      'Product Price',
      'Total Stock',
      'Total Value',
      'Variant ID',
      'Variant Name',
      'Size',
      'Color',
      'Variant SKU',
      'Variant Price',
      'Variant Stock',
      'Variant Value',
      'Low Stock Alert',
      'Out of Stock',
      'Last Updated',
      'Created Date'
    ];

    const csvRows = [headers.join(',')];
    
    let totalInventoryValue = 0;
    let totalStockCount = 0;
    let totalProducts = 0;
    let totalVariants = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;

   
    products.forEach((product) => {
      const productVariants = product.variants || [];
      const productTotalStock = productVariants.reduce((sum, variant) => 
        sum + (variant.countInStock || 0), 0
      );
      const productTotalValue = productVariants.reduce((sum, variant) => {
        const variantPrice = variant.price || product.price;
        const variantStock = variant.countInStock || 0;
        return sum + variantPrice * variantStock;
      }, 0);

      totalInventoryValue += productTotalValue;
      totalStockCount += productTotalStock;
      totalProducts++;

      if (productVariants.length > 0) {
        productVariants.forEach((variant) => {
          totalVariants++;
          
          const variantStock = variant.countInStock || 0;
          const variantPrice = variant.price || product.price;
          const variantValue = variantPrice * variantStock;
          const variantName = `${variant.color || 'Default'} - ${variant.size || 'One Size'}`;
          
          const isLowStock = variantStock > 0 && variantStock <= 5;
          const isOutOfStock = variantStock === 0;
          
          if (isOutOfStock) outOfStockCount++;
          if (isLowStock) lowStockCount++;
          
          const row = [
            `"${product._id}"`,
            `"${product.name.replace(/"/g, '""')}"`,
            `"${product.category || ''}"`,
            product.price || 0,
            productTotalStock,
            productTotalValue,
            `"${variant._id}"`,
            `"${variantName.replace(/"/g, '""')}"`,
            `"${variant.size || ''}"`,
            `"${variant.color || ''}"`,
            `"${variant.sku || ''}"`,
            variantPrice,
            variantStock,
            variantValue,
            isLowStock ? 'YES' : 'NO',
            isOutOfStock ? 'YES' : 'NO',
            `"${product.updatedAt.toISOString()}"`,
            `"${product.createdAt.toISOString()}"`
          ];

          csvRows.push(row.join(','));
        });
      } else {

        totalVariants++;
        const isLowStock = productTotalStock > 0 && productTotalStock <= 5;
        const isOutOfStock = productTotalStock === 0;
        
        if (isOutOfStock) outOfStockCount++;
        if (isLowStock) lowStockCount++;
        
        const row = [
          `"${product._id}"`,
          `"${product.name.replace(/"/g, '""')}"`,
          `"${product.category || ''}"`,
          product.price || 0,
          productTotalStock,
          productTotalValue,
          'N/A',
          'No Variant',
          'N/A',
          'N/A',
          'N/A',
          product.price || 0,
          productTotalStock,
          productTotalValue,
          isLowStock ? 'YES' : 'NO',
          isOutOfStock ? 'YES' : 'NO',
          `"${product.updatedAt.toISOString()}"`,
          `"${product.createdAt.toISOString()}"`
        ];

        csvRows.push(row.join(','));
      }
    });

    csvRows.push('');
    csvRows.push('SUMMARY');
    csvRows.push(['Metric', 'Value'].join(','));
    csvRows.push(['Total Products', totalProducts].join(','));
    csvRows.push(['Total Variants', totalVariants].join(','));
    csvRows.push(['Total Stock Units', totalStockCount].join(','));
    csvRows.push(['Total Inventory Value', totalInventoryValue].join(','));
    csvRows.push(['Out of Stock Variants', outOfStockCount].join(','));
    csvRows.push(['Low Stock Variants', lowStockCount].join(','));
    csvRows.push(['Report Date', new Date().toISOString()].join(','));
    csvRows.push(['Generated By', `"${req.user?.firstname || 'System'} ${req.user?.lastname || ''}"`].join(','));

    const csvContent = csvRows.join('\n');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `inventory_export_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: "INVENTORY_EXPORT_CSV",
      entityType: ENTITY_TYPES.SYSTEM,
      entityId: null,
      entityName: "Inventory Export",
      changes: {
        exportDetails: {
          totalProducts,
          totalVariants,
          totalStock: totalStockCount,
          totalValue: totalInventoryValue,
          filename
        }
      },
      ...AuditLogger.getRequestInfo(req),
      additionalInfo: `CSV export generated with ${totalProducts} products and ${totalVariants} variants`
    });

    res.send(csvContent);
    console.log(`CSV export generated: ${filename} (${totalProducts} products, ${totalVariants} variants)`);

  } catch (error) {
    console.error(" Error exporting inventory to CSV:", error);
    
    // Log error
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: "INVENTORY_EXPORT_CSV_FAILED",
      entityType: ENTITY_TYPES.SYSTEM,
      entityId: null,
      entityName: "Failed Export",
      changes: {
        error: error.message
      },
      ...AuditLogger.getRequestInfo(req),
      additionalInfo: "CSV export failed"
    });
    
    res.status(500).json({ 
      message: "Failed to export inventory", 
      error: error.message 
    });
  }
};
