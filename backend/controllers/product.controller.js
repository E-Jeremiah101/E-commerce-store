import redis  from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import {optimizeCloudinaryUrl} from "../lib/optimizeCloudinaryUrl.js";
import Category from "../models/categoy.model.js";

export const clearFeaturedCache = async (req, res) => {
  try {
    await redis.del("featured_products");
    res.json({ message: "Featured products cache cleared" });
  } catch (error) {
    console.log("Error clearing cache", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// In product.controller.js - Add these functions

// Check variant availability
export const checkVariantAvailability = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color, quantity = 1 } = req.query;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        available: false, 
        availableStock: 0,
        message: 'Product not found'
      });
    }

    let availableStock = 0;
    
    // Check variant stock
    if (size && color && product.variants?.length > 0) {
      const variant = product.variants.find(
        v => v.size === size && v.color === color
      );
      availableStock = variant ? variant.countInStock : 0;
    } else {
      // Check simple product stock
      availableStock = product.countInStock;
    }

    const isAvailable = availableStock >= parseInt(quantity);

    res.json({
      available: isAvailable,
      availableStock,
      requestedQuantity: parseInt(quantity),
      productName: product.name
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ 
      available: false, 
      availableStock: 0,
      message: 'Error checking availability'
    });
  }
};
// In product.controller.js - Add this test function
export const debugProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log('🔍 Debugging product stock for:', productId);
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const debugInfo = {
      id: product._id,
      name: product.name,
      mainStock: product.countInStock,
      variants: product.variants?.map(v => ({
        size: v.size,
        color: v.color,
        stock: v.countInStock
      })) || [],
      totalVariants: product.variants?.length || 0
    };
    
    console.log('📊 Product debug info:', debugInfo);
    res.json(debugInfo);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const checkCartAvailability = async (req, res) => {
  try {
    const { cartItems } = req.body;
    
    console.log('🔍 [START] Checking cart availability');
    console.log('📦 Cart items received:', JSON.stringify(cartItems, null, 2));
    
    // If cart is empty, return all available
    if (!cartItems || cartItems.length === 0) {
      console.log('🛒 Cart is empty, returning all available');
      return res.json({
        allAvailable: true,
        unavailableItems: [],
        availabilityResults: []
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
        color: item.color
      });
      
      const product = await Product.findById(item._id);
      if (!product) {
        console.log(`❌ Product not found in database: ${item._id}`);
        availabilityResults.push({
          productId: item._id,
          available: false,
          availableStock: 0,
          message: 'Product not found'
        });
        allAvailable = false;
        unavailableItems.push({
          ...item,
          availableStock: 0,
          message: 'Product not found'
        });
        continue;
      }

      console.log(`✅ Product found: ${product.name}, Main stock: ${product.countInStock}`);
      console.log(`📊 Product variants:`, product.variants);

      let availableStock = 0;
      let stockSource = 'main';
      
      // Check variant stock
      if (item.size && item.color && product.variants?.length > 0) {
        const variant = product.variants.find(
          v => v.size === item.size && v.color === item.color
        );
        
        if (variant) {
          availableStock = variant.countInStock;
          stockSource = 'variant';
          console.log(`✅ Found variant: ${item.size}/${item.color}, Stock: ${availableStock}`);
        } else {
          console.log(`❌ Variant not found: ${item.size}/${item.color}, using main stock`);
          availableStock = product.countInStock;
        }
      } else {
        // Check simple product stock
        availableStock = product.countInStock;
        console.log(`📊 Using main product stock: ${availableStock}`);
      }

      const isAvailable = availableStock >= item.quantity;
      console.log(`📋 Availability check: ${isAvailable ? '✅ AVAILABLE' : '❌ UNAVAILABLE'} (Requested: ${item.quantity}, Available: ${availableStock}, Source: ${stockSource})`);

      availabilityResults.push({
        productId: item._id,
        available: isAvailable,
        availableStock,
        requestedQuantity: item.quantity,
        productName: product.name,
        stockSource
      });

      if (!isAvailable) {
        allAvailable = false;
        unavailableItems.push({
          ...item,
          name: product.name,
          availableStock,
          message: `Only ${availableStock} available`
        });
        console.log(`🚫 Marking as unavailable: ${product.name}`);
      } else {
        console.log(`✅ Marking as available: ${product.name}`);
      }
    }

    console.log(`\n🎯 [FINAL RESULT]`, {
      allAvailable,
      unavailableItemsCount: unavailableItems.length,
      unavailableItems: unavailableItems.map(item => ({
        name: item.name,
        requested: item.quantity,
        available: item.availableStock
      })),
      totalItems: cartItems.length
    });

    console.log('🔍 [END] Availability check complete\n');
    
    res.json({
      allAvailable,
      unavailableItems,
      availabilityResults
    });
  } catch (error) {
    console.error('❌ [ERROR] Checking cart availability:', error);
    // Return all available on error to avoid blocking users
    res.json({ 
      allAvailable: true, 
      unavailableItems: [],
      availabilityResults: [],
      message: 'Error checking availability, defaulting to available'
    });
  }
};
// Add these new functions to your product.controller.js

// Get product variants
export const getProductVariants = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json({
      variants: product.variants || [],
      totalVariants: product.variants?.length || 0
    });
  } catch (error) {
    console.log("Error in getProductVariants controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update variant stock
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
      
      // Recalculate total stock
      product.countInStock = variants.reduce((total, variant) => 
        total + (variant.countInStock || 0), 0
      );
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.log("Error in updateVariantStock controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add this to your product.controller.js
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
    if (newStock < 0) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    variant.countInStock = newStock;
    
    // Update main product stock (sum of all variants)
    product.countInStock = product.variants.reduce((total, v) => total + v.countInStock, 0);

    await product.save();

    res.json({
      message: 'Variant stock updated successfully',
      countInStock: variant.countInStock,
      productStock: product.countInStock
    });
  } catch (error) {
    console.error('Error updating variant inventory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get variant stock specifically
export const getVariantStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color } = req.query;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let stock = product.countInStock;
    
    // If variants exist, find specific variant
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => 
        v.size === size && v.color === color
      );
      stock = variant ? variant.countInStock : 0;
    }

    res.json({ stock, productId, size, color });
  } catch (error) {
    console.log("Error in getVariantStock controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ archived: { $ne: true } }); // find all products and exclude archived
    res.json({ products });
  } catch (error) {
    console.log("Error in getAllProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }

    // if not in redis, fetch from mongodb
    // .lean() is gonna return a plain javascript object instead of a mongodb document
    // which is good for performance
    featuredProducts = await Product.find({
      isFeatured: true,
      archived: { $ne: true },
    })
      .select("name price images category sizes colors")
      .lean();

    if (!featuredProducts.length === 0) {
      return res.status(404).json({ message: "No featured products found" });
    }

    // store in redis for future quick access

    await redis.set("featured_products", JSON.stringify(featuredProducts));

    res.json(featuredProducts);
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
      variants, // ADD this new field
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

    // Calculate total stock from variants if provided
    const totalStock = variants
      ? variants.reduce((sum, variant) => sum + (variant.countInStock || 0), 0)
      : countInStock;

    const product = await Product.create({
      name,
      description,
      price,
      images: uploadedImages,
      category,
      sizes: sizes || [],
      colors: colors || [],
      countInStock: totalStock, // Set total from variants
      variants: variants || [], // ADD variants
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

export const reduceProduct =  async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0)
      return res.status(400).json({ message: "Invalid quantity" });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.countInStock < quantity)
      return res.status(400).json({ message: "Not enough stock" });

    product.countInStock -= quantity;
    await product.save();

    res.json({ message: "Stock updated", countInStock: product.countInStock });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// export const deleteProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: "Product not found" });

//     // delete all images from Cloudinary
//     if (product.images?.length > 0) {
//       for (const url of product.images) {
//         const publicId = url.split("/").pop().split(".")[0];
//         await cloudinary.uploader.destroy(`products/${publicId}`);
//       }
//     }

//     await product.deleteOne();

//     await updateFeaturedProductsCache();
//     res.json({ message: "Product deleted successfully" });
//   } catch (error) {
//     console.log("Error in deleteProduct controller", error.message);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // ✅ DON'T DELETE IMAGES FROM CLOUDINARY - JUST ARCHIVE THE PRODUCT
    // ❌ REMOVE THIS WHOLE BLOCK:
    // if (product.images?.length > 0) {
    //   for (const url of product.images) {
    //     const publicId = url.split("/").pop().split(".")[0];
    //     await cloudinary.uploader.destroy(`products/${publicId}`);
    //   }
    // }

    // ✅ INSTEAD: Just mark as archived (soft delete)
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
        },
      },
    ]);

    res.json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  const {size, color} = req.query
  try {
    let filter = { category, archived: { $ne: true } };
    if (size) filter.sizes = size; 
    if (color) filter.colors = color;
    const products = await Product.find( filter );
    res.json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
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
      .select("name price images category sizes colors")
      .lean();

    // Set with expiration to prevent stale data
   await redis.set("featured_products", JSON.stringify(featuredProducts), {
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
    const products = (await Product.find(queryConditions));

    res.status(200).json(products);
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
    res.status(200).json({product});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get archived products (admin only)
export const getArchivedProducts = async (req, res) => {
  try {
    const products = await Product.find({ archived: true });
    res.json({ products });
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
