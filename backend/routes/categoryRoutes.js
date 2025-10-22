import express from "express";
import Product from "../models/product.model.js";

const router = express.Router();

/**
 * GET /api/categories-with-images
 * Returns a list of categories with one random product image each.
 */
router.get("/categories-with-images", async (req, res) => {
  try {
    // Step 1: Get all distinct category names from products
    const categoryNames = await Product.distinct("category");

    // Step 2: For each category, get one random product image
    const categoriesWithImages = await Promise.all(
      categoryNames.map(async (catName) => {
        const randomProduct = await Product.aggregate([
          { $match: { category: catName } },
          { $sample: { size: 1 } },
        ]);

        return {
          name: catName,
          href: `/${catName.toLowerCase().replace(/\s+/g, "")}`,
          imageUrl: randomProduct[0]?.images?.[0] || "/default-category.jpg",
        };
      })
    );

    res.status(200).json(categoriesWithImages);
  } catch (error) {
    console.error("Error fetching categories with images:", error.message);
    res.status(500).json({ message: "Error fetching categories" });
  }
});

export default router;
