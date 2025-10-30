import redis  from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import {optimizeCloudinaryUrl} from "../lib/optimizeCloudinaryUrl.js";
import Category from "../models/categoy.model.js"
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}); // find all products
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
    featuredProducts = await Product.find({ isFeatured: true })
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
    const { name, description, price, images, category, sizes, colors } =
      req.body;

    let uploadedImages = [];

    // Upload each image to Cloudinary if provided as base64 strings

    if (Array.isArray(images) && images.length > 0) {
      const uploadPromises = images.map((img) =>
        cloudinary.uploader.upload(img, { folder: "products" })
      );
      const results = await Promise.all(uploadPromises);
      uploadedImages = results.map((r) =>
        optimizeCloudinaryUrl(r.secure_url, 800, "auto")
      );
    }

    const product = await Product.create({
      name,
      description,
      price,
      images: uploadedImages,
      category,
      sizes: sizes || [],
      colors: colors || [],
    });

    //  Automatically create category if it doesn’t exist
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

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // delete all images from Cloudinary
    if (product.images?.length > 0) {
      for (const url of product.images) {
        const publicId = url.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`products/${publicId}`);
      }
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 6 },
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
    let filter = { category };
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
    // The lean() method  is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

    const featuredProducts = await Product.find({ isFeatured: true }).select("name price images category sizes colors").lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("error in update cache function");
  }
};

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
    const queryConditions = { $or: [...textConditions, ...numberConditions] };

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


