import redis  from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import {optimizeCloudinaryUrl} from "../lib/optimizeCloudinaryUrl.js";
import Category from "../models/categoy.model.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";
export const clearFeaturedCache = async (req, res) => {
  try {
    await redis.del("featured_products");
    res.json({ message: "Featured products cache cleared" });
  } catch (error) {
    console.log("Error clearing cache", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const checkVariantAvailability = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color, quantity = 1 } = req.query;


    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        available: false,
        availableStock: 0,
        message: "Product not found",
      });
    }

    let availableStock = 0;

    if (product.variants?.length > 0) {
      const variant = product.variants.find((v) => {
        const sizeMatches = size
          ? v.size === size
          : !v.size || v.size === "" || v.size === "Standard";
        const colorMatches = color
          ? v.color === color
          : !v.color || v.color === "" || v.color === "Standard";
        return sizeMatches && colorMatches;
      });

      availableStock = variant ? variant.countInStock : 0;
    } else {
      
      return res.json({
        available: false,
        availableStock: 0,
        requestedQuantity: parseInt(quantity),
        productName: product.name,
        message: "No variants available",
      });
    }

    const isAvailable = availableStock >= parseInt(quantity);

    res.json({
      available: isAvailable,
      availableStock,
      requestedQuantity: parseInt(quantity),
      productName: product.name,
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({
      available: false,
      availableStock: 0,
      message: "Error checking availability",
    });
  }
};


export const checkCartAvailability = async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.json({
        allAvailable: true,
        unavailableItems: [],
        availabilityResults: [],
      });
    }

    const availabilityResults = [];
    let allAvailable = true;
    const unavailableItems = [];

    for (const [index, item] of cartItems.entries()) {

      const product = await Product.findById(item._id);
      if (!product) {
        console.log(` Product not found in database: ${item._id}`);
        availabilityResults.push({
          productId: item._id,
          available: false,
          availableStock: 0,
          message: "Product not found",
        });
        allAvailable = false;
        unavailableItems.push({
          ...item,
          availableStock: 0,
          message: "Product not found",
        });
        continue;
      }

      let availableStock = 0;

      if (product.variants?.length === 0) {

        availabilityResults.push({
          productId: item._id,
          available: false,
          availableStock: 0,
          requestedQuantity: item.quantity,
          productName: product.name,
          message: "Product has no variants",
        });
        allAvailable = false;
        unavailableItems.push({
          ...item,
          availableStock: 0,
          message: "Product has no variants",
        });
        continue;
      }

      const variant = product.variants.find(
        (v) => v.size === item.size && v.color === item.color
      );

      if (variant) {
        availableStock = variant.countInStock;
      } else {
        console.log(`Variant not found: ${item.size}/${item.color}`);
        availabilityResults.push({
          productId: item._id,
          available: false,
          availableStock: 0,
          requestedQuantity: item.quantity,
          productName: product.name,
          message: "Variant not found",
        });
        allAvailable = false;
        unavailableItems.push({
          ...item,
          availableStock: 0,
          message: "Variant not found",
        });
        continue;
      }

      const isAvailable = availableStock >= item.quantity;
      
      availabilityResults.push({
        productId: item._id,
        available: isAvailable,
        availableStock,
        requestedQuantity: item.quantity,
        productName: product.name,
        variantId: variant._id,
      });

      if (!isAvailable) {
        allAvailable = false;
        unavailableItems.push({
          ...item,
          name: product.name,
          availableStock,
          message: `Only ${availableStock} available`,
        });
      } else {
        console.log(` Marking as available: ${product.name}`);
      }
    }

    res.json({
      allAvailable,
      unavailableItems,
      availabilityResults,
    });
  } catch (error) {
    console.error(" [ERROR] Checking cart availability:", error);
    res.json({
      allAvailable: true,
      unavailableItems: [],
      availabilityResults: [],
      message: "Error checking availability, defaulting to available",
    });
  }
};

export const getProductVariants = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      variants: product.variants || [],
      totalVariants: product.variants?.length || 0,
      totalVariantStock:
        product.variants?.reduce((sum, v) => sum + (v.countInStock || 0), 0) ||
        0,
    });
  } catch (error) {
    console.log("Error in getProductVariants controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateVariantStock = async (req, res) => {
  try {
    const { variants } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (variants && Array.isArray(variants)) {
      product.variants = variants;

      product.countInStock = 0;
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.log("Error in updateVariantStock controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateVariantInventory = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { quantityChange } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the variant
    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    // Update variant stock
    const newStock = variant.countInStock + quantityChange;

     const requestInfo = AuditLogger.getRequestInfo(req);
     await AuditLogger.log({
       adminId: req.user._id,
       adminName: `${req.user.firstname} ${req.user.lastname}`,
       action: "UPDATE_INVENTORY",
       entityType: ENTITY_TYPES.PRODUCT,
       entityId: product._id,
       entityName: product.name,
       changes: {
         variant: {
           size: variant.size,
           color: variant.color,
           before: { countInStock: oldStock },
           after: { countInStock: newStock },
           change: quantityChange,
         },
       },
       ...requestInfo,
       additionalInfo: `Variant: ${variant.size}/${variant.color}`,
     });
    if (newStock < 0) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    variant.countInStock = newStock;

   
    product.countInStock = 0;

    await product.save();

    res.json({
      message: "Variant stock updated successfully",
      countInStock: variant.countInStock,
      
    });
  } catch (error) {
    console.error("Error updating variant inventory:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getVariantStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let stock = 0;

    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => {
        const sizeMatches = size
          ? v.size === size
          : !v.size || v.size === "" || v.size === "Standard";
        const colorMatches = color
          ? v.color === color
          : !v.color || v.color === "" || v.color === "Standard";
        return sizeMatches && colorMatches;
      });

      console.log(" Found variant:", variant);
      stock = variant ? variant.countInStock : 0;
    }

    console.log(" Final stock:", stock);
    res.json({ stock, productId, size, color });
  } catch (error) {
    console.log("Error in getVariantStock controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({
      archived: { $ne: true },
    }).select(
      "name description price images category sizes colors variants isFeatured archived createdAt previousPrice isPriceSlashed"
    );

    const transformedProducts = products.map((product) => {
      const totalVariantStock = product.variants.reduce(
        (sum, v) => sum + (v.countInStock || 0),
        0
      );

      const discountPercentage =
        product.isPriceSlashed && product.previousPrice
          ? (
              ((product.previousPrice - product.price) /
                product.previousPrice) *
              100
            ).toFixed(1)
          : null;

      return {
        ...product.toObject(),
        countInStock: totalVariantStock,
        previousPrice: product.previousPrice,
        isPriceSlashed: product.isPriceSlashed,
        discountPercentage: discountPercentage,
        variants: product.variants || [],
      };
    });

    res.json({ products: transformedProducts });
  } catch (error) {
    console.log("Error in getAllProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      const parsed = JSON.parse(featuredProducts);
      return res.json(parsed);
    }

    featuredProducts = await Product.find({
      isFeatured: true,
      archived: { $ne: true },
    })
      .select(
        "name price images category sizes colors variants  previousPrice isPriceSlashed priceHistory averageRating numReviews"
      ) 
      .lean();

    if (!featuredProducts.length === 0) {
      return res.status(404).json({ message: "No featured products found" });
    }

  
    const transformedFeatured = featuredProducts.map((product) => {
      const totalVariantStock =
        product.variants?.reduce((sum, v) => sum + (v.countInStock || 0), 0) ||
        0;
        const discountPercentage =
          product.isPriceSlashed && product.previousPrice
            ? (
                ((product.previousPrice - product.price) /
                  product.previousPrice) *
                100
              ).toFixed(1)
            : null;
      return {
        ...product,
        countInStock: totalVariantStock,
        discountPercentage,
      };

    });

    await redis.set("featured_products", JSON.stringify(transformedFeatured));

    res.json(transformedFeatured);
  } catch (error) {
    console.log("Error in getFeaturedProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      images,
      category,
      sizes,
      colors,
      countInStock,
      variants, 
    } = req.body;

    let uploadedImages = [];

    if (Array.isArray(images) && images.length > 0) {
      const uploadPromises = images.map((img) =>
        cloudinary.uploader.upload(img, { folder: "products" })
      );
      const results = await Promise.all(uploadPromises);
      uploadedImages = results.map((r) =>
        optimizeCloudinaryUrl(r.secure_url, 800, "auto")
      );
    }

    const totalVariantStock = variants
      ? variants.reduce((sum, variant) => sum + (variant.countInStock || 0), 0)
      : 0;

    const product = await Product.create({
      name,
      description,
      price,
      images: uploadedImages,
      category,
      sizes: sizes || [], 
      colors: colors || [],
      countInStock: 0, 
      variants: variants || [],
    });

    const requestInfo = AuditLogger.getRequestInfo(req);
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: "CREATE_PRODUCT",
      entityType: ENTITY_TYPES.PRODUCT,
      entityId: product._id,
      entityName: product.name,
      changes: {
        created: {
          name: product.name,
          price: product.price,
          category: product.category,
          variants: product.variants,
        },
      },
      ...requestInfo,
      additionalInfo: `Created product with ${
        product.variants?.length || 0
      } variants`,
    });

    if (category) {
      const existingCategory = await Category.findOne({ name: category });
      if (!existingCategory) {
        await Category.create({
          name: category,
          imageUrl: uploadedImages[0] || "",
        });
      }
    }

    res.status(201).json(product);
  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    res.status(500).json({ error: "Server error", error: error.message });
  }
};

export const reduceProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0)
      return res.status(400).json({ message: "Invalid quantity" });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    return res.status(400).json({
      message:
        "This function is disabled in variant-only system. Use variant-specific endpoints instead.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const requestInfo = AuditLogger.getRequestInfo(req);
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: "DELETE_PRODUCT",
      entityType: ENTITY_TYPES.PRODUCT,
      entityId: product._id,
      entityName: product.name,
      changes: {
        before: {
          archived: product.archived,
          isActive: product.isActive,
        },
        after: {
          archived: true,
          isActive: false,
        },
      },
      ...requestInfo,
      additionalInfo: "Product archived (soft delete)",
    });

    product.archived = true;
    product.isActive = false;
    await product.save();

    product.archived = true;
    product.isActive = false;
    await product.save();

    if (product.isFeatured) {
      product.isFeatured = false;
      await product.save();
    }

    await updateFeaturedProductsCache();

    res.json({
      message: "Product archived successfully",
      archived: true,
    });
  } catch (error) {
    console.log("Error in deleteProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $match: {
          archived: { $ne: true },
          isActive: { $ne: false },
          "variants.countInStock": { $gt: 0 },
        },
      },
      {
        $sample: { size: 16 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          images: 1,
          price: 1,
          sizes: 1,
          colors: 1,
          variants: 1,
          previousPrice: 1, 
          isPriceSlashed: 1,
          countInStock: {
            $sum: "$variants.countInStock",
          },
        },
      },
    ]);

      const productsWithDiscount = products.map((product) => {
        const discountPercentage =
          product.isPriceSlashed && product.previousPrice
            ? (
                ((product.previousPrice - product.price) /
                  product.previousPrice) *
                100
              ).toFixed(1)
            : null;

        return {
          ...product,
          discountPercentage,
        };
      });

    res.json(productsWithDiscount);
  } catch (error) {
    console.log("Error in getRecommendedProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  const { size, color } = req.query;
  try {
    let filter = {
      category,
      archived: { $ne: true },
    };
    if (size) filter.sizes = size;
    if (color) filter.colors = color;
    const products = await Product.find(filter);

    const transformedProducts = products.map((product) => {
      const totalVariantStock = product.variants.reduce(
        (sum, v) => sum + (v.countInStock || 0),
        0
      );

      const discountPercentage =
        product.isPriceSlashed && product.previousPrice
          ? (
              ((product.previousPrice - product.price) /
                product.previousPrice) *
              100
            ).toFixed(1)
          : null;
      
      return {
        ...product.toObject(),
        countInStock: totalVariantStock,
        previousPrice: product.previousPrice,
        isPriceSlashed: product.isPriceSlashed,
        discountPercentage: discountPercentage,
      };
    }); 

    res.json({ products: transformedProducts });
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const wasFeatured = product.isFeatured; 

      const requestInfo = AuditLogger.getRequestInfo(req);
      await AuditLogger.log({
        adminId: req.user._id,
        adminName: `${req.user.firstname} ${req.user.lastname}`,
        action: "TOGGLE_FEATURED",
        entityType: ENTITY_TYPES.PRODUCT,
        entityId: product._id,
        entityName: product.name,
        changes: {
          before: { isFeatured: wasFeatured },
          after: { isFeatured: !wasFeatured },
        },
        ...requestInfo,
        additionalInfo: wasFeatured
          ? "Removed from featured"
          : "Added to featured",
      });

      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();

   
      await updateFeaturedProductsCache();

      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true })
      .select("name price images category sizes colors variants")
      .lean();

    const transformedFeatured = featuredProducts.map((product) => {
      const totalVariantStock =
        product.variants?.reduce((sum, v) => sum + (v.countInStock || 0), 0) ||
        0;
      return {
        ...product,
        countInStock: totalVariantStock,
      };
    });

    await redis.set("featured_products", JSON.stringify(transformedFeatured), {
      EX: 3600, 
    });
  
  } catch (error) {
    console.log("Error updating featured products cache:", error.message);
  }
}

export const searchProducts = async (req, res) => {
  const query = req.query.q?.trim(); 
  if (!query) {
    return res.status(400).json({ message: "No search query provided" });
  }

  try {
  
    const keywords = query.split(/\s+/).filter(Boolean);

    const textConditions = [];
    const numberConditions = [];


      keywords.forEach((word, i) => {
      const lowerWord = word.toLowerCase();

      if (!isNaN(word)) {
        const amount = Number(word);
        const prevWord = keywords[i - 1]?.toLowerCase();

        if (prevWord === "under") {
          numberConditions.push({ amount: { $lte: amount } }); 
        } else if (prevWord === "above") {
          numberConditions.push({ amount: { $gte: amount } }); 
        } else {
          numberConditions.push({ amount }); 
        }
      } else if (lowerWord !== "under" && lowerWord !== "above") {
        
        textConditions.push(
          { name: { $regex: word, $options: "i" } },
          { description: { $regex: word, $options: "i" } },
          { category: { $regex: word, $options: "i" } },
          { size: { $regex: word, $options: "i" } }
        );
      }
    });

    
    const queryConditions = {
      $or: [...textConditions, ...numberConditions],
      archived: { $ne: true },
    };

    const products = await Product.find(queryConditions);

    const transformedProducts = products.map((product) => {
      const totalVariantStock = product.variants.reduce(
        (sum, v) => sum + (v.countInStock || 0),
        0
      );
      return {
        ...product.toObject(),
        countInStock: totalVariantStock,
      };
    });

    res.status(200).json(transformedProducts);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSearchSuggestions = async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.json([]);

    const keywords = query.split(/\s+/).filter(Boolean);
    const textKeywords = keywords.filter((word) => isNaN(word));
    const numberKeywords = keywords.filter((word) => !isNaN(word));

    const textConditions = textKeywords.flatMap((word) => [
      { name: { $regex: word, $options: "i" } },
      { category: { $regex: word, $options: "i" } },
      { size: { $regex: word, $options: "i" } },
    ]);

    const numberConditions = numberKeywords.map((num) => ({
      amount: Number(num),
    }));

    const suggestions = await Product.find(
      { $or: [...textConditions, ...numberConditions] },
      { name: 1, category: 1, size: 1, amount: 1 }
    ).limit(5);

    const uniqueSuggestions = [
      ...new Set(
        suggestions.flatMap((s) =>
          [s.name, s.category, s.size, s.amount?.toString()].filter(Boolean)
        )
      ),
    ];

    res.json(uniqueSuggestions);
  } catch (error) {
    console.error("Error in getSearchSuggestions:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const totalVariantStock = product.variants.reduce(
      (sum, v) => sum + (v.countInStock || 0),
      0
    );
    const discountPercentage =
      product.isPriceSlashed && product.previousPrice
        ? (
            ((product.previousPrice - product.price) / product.previousPrice) *
            100
          ).toFixed(1)
        : null;

    const transformedProduct = {
      ...product.toObject(),
      countInStock: totalVariantStock,
      previousPrice: product.previousPrice,
      isPriceSlashed: product.isPriceSlashed,
      discountPercentage: discountPercentage,
    };

    res.status(200).json({ product: transformedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getArchivedProducts = async (req, res) => {
  try {
    const products = await Product.find({ archived: true });

    const transformedProducts = products.map((product) => {
      const totalVariantStock = product.variants.reduce(
        (sum, v) => sum + (v.countInStock || 0),
        0
      );
      return {
        ...product.toObject(),
        countInStock: totalVariantStock,
      };
    });

    res.json({ products: transformedProducts });
  } catch (error) {
    console.log("Error in getArchivedProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const trackProductView = async (req, res, next) => {
  try {

    if (!req.params.id) {
      return next();
    }

    const product = await Product.findById(req.params.id)
      .select(
        "name price images category variants previousPrice isPriceSlashed"
      )
      .lean();

    if (!product) {
      return next();
    }


    const totalVariantStock =
      product.variants?.reduce((sum, v) => sum + (v.countInStock || 0), 0) || 0;

    const discountPercentage =
      product.isPriceSlashed && product.previousPrice
        ? (
            ((product.previousPrice - product.price) / product.previousPrice) *
            100
          ).toFixed(1)
        : null;


    const productWithStock = {
      _id: product._id.toString(),
      name: product.name,
      price: product.price,
      images: product.images,
      category: product.category,
      variants: product.variants || [],
      countInStock: totalVariantStock,
      discountPercentage,
      previousPrice: product.previousPrice,
      isPriceSlashed: product.isPriceSlashed,
     
    };

    const { addToRecentlyViewed } = await import("../lib/recentlyViewed.js");

    if (req.user?._id) {
      console.log(
        "Adding to recently viewed for logged-in user:",
        req.user._id
      );
      await addToRecentlyViewed(req.user._id.toString(), productWithStock);
    }
    else {
      const guestIdentifier = generateGuestIdentifier(req);
      console.log(" Adding to recently viewed for guest:", guestIdentifier);
      await addToRecentlyViewed(`guest:${guestIdentifier}`, productWithStock);
    }

    next();
  } catch (error) {
    console.error("Error tracking product view:", error);
    next();
  }
};


const generateGuestIdentifier = (req) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  const combined = `${ip}-${userAgent}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; 
  }

  return Math.abs(hash).toString(16).slice(0, 12);
};

export const getRecentlyViewedProducts = async (req, res) => {
  try {

    const { getRecentlyViewed } = await import("../lib/recentlyViewed.js");
    let recentlyViewed = [];


    if (req.user?._id) {
      recentlyViewed = await getRecentlyViewed(req.user._id.toString(), 12);
    }
 
    else {
      const guestIdentifier = generateGuestIdentifier(req);
      console.log("Fetching recently viewed for guest:", guestIdentifier);
      recentlyViewed = await getRecentlyViewed(`guest:${guestIdentifier}`, 8);
    }

    res.json({ products: recentlyViewed });
  } catch (error) {
    console.error("Error getting recently viewed products:", error);
    res.json({ products: [] });
  }
};

export const restoreProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const requestInfo = AuditLogger.getRequestInfo(req);
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action: "RESTORE_PRODUCT",
      entityType: ENTITY_TYPES.PRODUCT,
      entityId: product._id,
      entityName: product.name,
      changes: {
        before: {
          archived: product.archived,
          isActive: product.isActive,
        },
        after: {
          archived: false,
          isActive: true,
        },
      },
      ...requestInfo,
    });

    product.archived = false;
    product.isActive = true;
    product.archivedAt = null;
    await product.save();

    res.json({ message: "Product restored successfully" });
  } catch (error) {
    console.log("Error in restoreProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const permanentDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

     const requestInfo = AuditLogger.getRequestInfo(req);
     await AuditLogger.log({
       adminId: req.user._id,
       adminName: `${req.user.firstname} ${req.user.lastname}`,
       action: "PERMANENT_DELETE_PRODUCT",
       entityType: ENTITY_TYPES.PRODUCT,
       entityId: product._id,
       entityName: product.name,
       changes: {
         deleted: {
           name: product.name,
           imagesCount: product.images?.length || 0,
           variantsCount: product.variants?.length || 0,
         },
       },
       ...requestInfo,
       additionalInfo: "Product permanently deleted from database",
     });

    if (product.archived && product.images?.length > 0) {
      for (const url of product.images) {
        const publicId = url.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`products/${publicId}`);
      }
    }

    await product.deleteOne();
    await updateFeaturedProductsCache();

    res.json({ message: "Product permanently deleted" });
  } catch (error) {
    console.log("Error in permanentDeleteProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const stripHtmlTags = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

export const exportProductsCSV = async (req, res) => {
  try {
    const products = await Product.find({
      archived: { $ne: true },
    }).select(
      "name price images category sizes colors variants isFeatured archived createdAt previousPrice isPriceSlashed averageRating numReviews"
    );
    const csvData = [];
    
    csvData.push([
      'Product ID',
      'Name',
      'Category',
      'Price',
      'Previous Price',
      'Discount Percentage',
      'Featured',
      'Average Rating',
      'Total Reviews',
      'Total Stock',
      'Total Variants',
      'Sizes Available',
      'Colors Available',
      'Image URLs',
      'Created At'
    ].join(','));

    products.forEach((product) => {
      const totalVariantStock = product.variants.reduce(
        (sum, v) => sum + (v.countInStock || 0),
        0
      );

      const discountPercentage =
        product.isPriceSlashed && product.previousPrice
          ? (
              ((product.previousPrice - product.price) /
                product.previousPrice) *
              100
            ).toFixed(1)
          : null;

      const escapeCSV = (field) => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
  
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      };

      const cleanDescription = stripHtmlTags(product.description);

      csvData.push([
        escapeCSV(product._id),
        escapeCSV(product.name),
        escapeCSV(product.category),
        escapeCSV(product.price),
        escapeCSV(product.previousPrice || ''),
        escapeCSV(discountPercentage || ''),
        escapeCSV(product.isFeatured ? 'Yes' : 'No'),
        escapeCSV(product.averageRating || 0),
        escapeCSV(product.numReviews || 0),
        escapeCSV(totalVariantStock),
        escapeCSV(product.variants?.length || 0),
        escapeCSV(product.sizes?.join('; ') || ''),
        escapeCSV(product.colors?.join('; ') || ''),
        escapeCSV(product.images?.join('; ') || ''),
        escapeCSV(product.createdAt.toISOString())
      ].join(','));
    });

    const csvContent = csvData.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products_export.csv');
    
    res.send(csvContent);
  } catch (error) {
    console.log("Error in exportProductsCSV controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const exportProductsDetailedCSV = async (req, res) => {
  try {
    const products = await Product.find({
      archived: { $ne: true },
    }).select(
      "name price images category sizes colors variants isFeatured archived createdAt previousPrice isPriceSlashed"
    );

    const csvData = [];
    
    csvData.push([
      'Product ID',
      'Product Name',
      'Category',
      'Base Price',
      'Previous Price',
      'Discount Percentage',
      'Featured',
      'Variant Size',
      'Variant Color',
      'Variant Stock',
      'Variant SKU',
      'Variant Price',
      'Total Product Stock',
      'Created At'
    ].join(','));

    products.forEach((product) => {
      const totalVariantStock = product.variants.reduce(
        (sum, v) => sum + (v.countInStock || 0),
        0
      );

      const discountPercentage =
        product.isPriceSlashed && product.previousPrice
          ? (
              ((product.previousPrice - product.price) /
                product.previousPrice) *
              100
            ).toFixed(1)
          : null;

      const escapeCSV = (field) => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      };

      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          csvData.push([
            escapeCSV(product._id),
            escapeCSV(product.name),
            escapeCSV(product.category),
            escapeCSV(product.price),
            escapeCSV(product.previousPrice || ''),
            escapeCSV(discountPercentage || ''),
            escapeCSV(product.isFeatured ? 'Yes' : 'No'),
            escapeCSV(variant.size || 'Standard'),
            escapeCSV(variant.color || 'Standard'),
            escapeCSV(variant.countInStock || 0),
            escapeCSV(variant.sku || ''),
            escapeCSV(variant.price || product.price),
            escapeCSV(totalVariantStock),
            escapeCSV(product.createdAt.toISOString())
          ].join(','));
        });
      } else {
      
        csvData.push([
          escapeCSV(product._id),
          escapeCSV(product.name),
          escapeCSV(product.category),
          escapeCSV(product.price),
          escapeCSV(product.previousPrice || ''),
          escapeCSV(discountPercentage || ''),
          escapeCSV(product.isFeatured ? 'Yes' : 'No'),
          'Standard',
          'Standard',
          '0',
          '',
          escapeCSV(product.price),
          '0',
          escapeCSV(product.createdAt.toISOString())
        ].join(','));
      }
    });

    const csvContent = csvData.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products_detailed_export.csv');
    
    res.send(csvContent);
  } catch (error) {
    console.log("Error in exportProductsDetailedCSV controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
