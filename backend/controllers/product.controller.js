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

// Check variant availability - VARIANT-ONLY VERSION
export const checkVariantAvailability = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color, quantity = 1 } = req.query;

    console.log("🔍 checkVariantAvailability called:", {
      productId,
      size,
      color,
      quantity,
    });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        available: false,
        availableStock: 0,
        message: "Product not found",
      });
    }

    // VARIANT-ONLY: Only check variant stock
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
      console.log("📊 Variant stock found:", availableStock);
    } else {
      // If no variants exist, product has 0 stock
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

// Debug function - VARIANT-ONLY
export const debugProductStock = async (req, res) => {
  try {
    const { productId } = req.params;

    console.log("🔍 Debugging product stock for:", productId);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const debugInfo = {
      id: product._id,
      name: product.name,
      // REMOVED: mainStock: product.countInStock,
      variants:
        product.variants?.map((v) => ({
          size: v.size,
          color: v.color,
          stock: v.countInStock,
        })) || [],
      totalVariants: product.variants?.length || 0,
      totalVariantStock:
        product.variants?.reduce((sum, v) => sum + (v.countInStock || 0), 0) ||
        0,
    };

    console.log("📊 Product debug info:", debugInfo);
    res.json(debugInfo);
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Check cart availability - VARIANT-ONLY
export const checkCartAvailability = async (req, res) => {
  try {
    const { cartItems } = req.body;

    console.log("🔍 [START] Checking cart availability");
    console.log("📦 Cart items received:", JSON.stringify(cartItems, null, 2));

    // If cart is empty, return all available
    if (!cartItems || cartItems.length === 0) {
      console.log("🛒 Cart is empty, returning all available");
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
      console.log(`\n📦 [Item ${index + 1}/${cartItems.length}] Checking:`, {
        id: item._id,
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      });

      const product = await Product.findById(item._id);
      if (!product) {
        console.log(`❌ Product not found in database: ${item._id}`);
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

      console.log(`✅ Product found: ${product.name}`);
      console.log(`📊 Product variants:`, product.variants);

      let availableStock = 0;

      // VARIANT-ONLY: Only check variant stock
      if (product.variants?.length === 0) {
        console.log(`❌ Product has no variants: ${product.name}`);
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

      // Find the variant
      const variant = product.variants.find(
        (v) => v.size === item.size && v.color === item.color
      );

      if (variant) {
        availableStock = variant.countInStock;
        console.log(
          `✅ Found variant: ${item.size}/${item.color}, Stock: ${availableStock}`
        );
      } else {
        console.log(`❌ Variant not found: ${item.size}/${item.color}`);
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
      console.log(
        `📋 Availability check: ${
          isAvailable ? "✅ AVAILABLE" : "❌ UNAVAILABLE"
        } (Requested: ${item.quantity}, Available: ${availableStock})`
      );

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
        console.log(`🚫 Marking as unavailable: ${product.name}`);
      } else {
        console.log(`✅ Marking as available: ${product.name}`);
      }
    }

    console.log(`\n🎯 [FINAL RESULT]`, {
      allAvailable,
      unavailableItemsCount: unavailableItems.length,
      unavailableItems: unavailableItems.map((item) => ({
        name: item.name,
        requested: item.quantity,
        available: item.availableStock,
      })),
      totalItems: cartItems.length,
    });

    console.log("🔍 [END] Availability check complete\n");

    res.json({
      allAvailable,
      unavailableItems,
      availabilityResults,
    });
  } catch (error) {
    console.error("❌ [ERROR] Checking cart availability:", error);
    res.json({
      allAvailable: true,
      unavailableItems: [],
      availabilityResults: [],
      message: "Error checking availability, defaulting to available",
    });
  }
};

// Get product variants
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

// Update variant stock - VARIANT-ONLY
export const updateVariantStock = async (req, res) => {
  try {
    const { variants } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update variants
    if (variants && Array.isArray(variants)) {
      product.variants = variants;

      // In variant-only system, main product stock is always 0
      // Or you can remove countInStock from Product model entirely
      product.countInStock = 0; // Set to 0 for variant-only system
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.log("Error in updateVariantStock controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update variant inventory - VARIANT-ONLY
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

    // In variant-only system, main product stock is 0
    product.countInStock = 0; // Always 0

    await product.save();

    res.json({
      message: "Variant stock updated successfully",
      countInStock: variant.countInStock,
      // productStock: product.countInStock // Always 0
    });
  } catch (error) {
    console.error("Error updating variant inventory:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get variant stock specifically - VARIANT-ONLY
export const getVariantStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color } = req.query;

    console.log("🔍 getVariantStock called:", { productId, size, color });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let stock = 0; // Always 0 for main product in variant-only system

    // If variants exist, find specific variant with FLEXIBLE matching
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

      console.log("📊 Found variant:", variant);
      stock = variant ? variant.countInStock : 0;
    }

    console.log("✅ Final stock:", stock);
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

    // Transform products for frontend
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
      console.log("✅ Loading featured products from cache");
      const parsed = JSON.parse(featuredProducts);
      console.log(`🔍 Sample cached product:`, {
        name: parsed[0]?.name,
        price: parsed[0]?.price,
        previousPrice: parsed[0]?.previousPrice,
        isPriceSlashed: parsed[0]?.isPriceSlashed,
      });
      return res.json(parsed);
    }

    // if not in redis, fetch from mongodb
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

    // Transform for variant-only system
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

    
    // store in redis for future quick access
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
      countInStock, // This should be ignored in variant-only system
      variants, // All stock comes from variants
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

    // VARIANT-ONLY: Calculate total stock from variants
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
      countInStock: 0, // Always 0 in variant-only system
      variants: variants || [], // All stock is in variants
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

    // Automatically create category if it doesn't exist
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

    // In variant-only system, main product should not have stock
    // This function should not be used
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

    // Just mark as archived (soft delete)
    product.archived = true;
    product.isActive = false;
    await product.save();

    // Optional: Remove from featured cache if it was featured
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
          // Check if any variant has stock > 0
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
    console.log(`✅ Found ${products.length} recommended products`);
    console.log(`🔍 Sample product slash data:`, {
      name: products[0]?.name,
      price: products[0]?.price,
      previousPrice: products[0]?.previousPrice,
      isPriceSlashed: products[0]?.isPriceSlashed,
    });

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

    // Transform for variant-only system
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
    console.log("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const wasFeatured = product.isFeatured; // Define here before using

      // Log before toggling
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

      // Update cache
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

    // Transform for variant-only system
    const transformedFeatured = featuredProducts.map((product) => {
      const totalVariantStock =
        product.variants?.reduce((sum, v) => sum + (v.countInStock || 0), 0) ||
        0;
      return {
        ...product,
        countInStock: totalVariantStock,
      };
    });

    // Set with expiration to prevent stale data
    await redis.set("featured_products", JSON.stringify(transformedFeatured), {
      EX: 3600, // Set expiration in seconds (1 hour)
    });
    console.log("✅ Featured products cache updated");
  } catch (error) {
    console.log("Error updating featured products cache:", error.message);
  }
}

export const searchProducts = async (req, res) => {
  const query = req.query.q?.trim(); // remove spaces at the ends
  if (!query) {
    return res.status(400).json({ message: "No search query provided" });
  }

  try {
    // Split the query into separate words
    const keywords = query.split(/\s+/).filter(Boolean);

    const textConditions = [];
    const numberConditions = [];

    // Loop through each keyword to build search conditions
    keywords.forEach((word, i) => {
      const lowerWord = word.toLowerCase();

      // Handle "under" and "above" for price filtering
      if (!isNaN(word)) {
        const amount = Number(word);
        const prevWord = keywords[i - 1]?.toLowerCase();

        if (prevWord === "under") {
          numberConditions.push({ amount: { $lte: amount } }); // price ≤ value
        } else if (prevWord === "above") {
          numberConditions.push({ amount: { $gte: amount } }); // price ≥ value
        } else {
          numberConditions.push({ amount }); // exact price match
        }
      } else if (lowerWord !== "under" && lowerWord !== "above") {
        // Build regex for text fields
        textConditions.push(
          { name: { $regex: word, $options: "i" } },
          { description: { $regex: word, $options: "i" } },
          { category: { $regex: word, $options: "i" } },
          { size: { $regex: word, $options: "i" } }
        );
      }
    });

    // Combine all text and number conditions
    const queryConditions = {
      $or: [...textConditions, ...numberConditions],
      archived: { $ne: true },
    };

    // Perform MongoDB search
    const products = await Product.find(queryConditions);

    // Transform for variant-only system
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

    // Transform for variant-only system
    const totalVariantStock = product.variants.reduce(
      (sum, v) => sum + (v.countInStock || 0),
      0
    );

    // Calculate discount if slashed
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
      // Include slash information
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

    // Transform for variant-only system
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

// Restore archived product
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

// Permanent delete (if really needed)
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

    // Only delete images if product is archived
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

