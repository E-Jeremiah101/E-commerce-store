import express from "express";
import Product from "../models/product.model.js";
import Category from "../models/categoy.model.js";

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



router.get("/categories-with-images", async (req, res) => {
  try {
    const categories = await Category.find();

    const result = await Promise.all(
      categories.map(async (cat) => {
        const products = await Product.find({ category: cat.name });
        let imageUrl = cat.imageUrl;

        if (products.length > 0) {
          const randomProduct =
            products[Math.floor(Math.random() * products.length)];
          imageUrl = randomProduct.images?.[0] || cat.imageUrl;
        }

        return { name: cat.name, imageUrl };
      })
    );

    res.json(result);
  } catch (error) {
    console.error("Error in /categories-with-images:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.post("/", async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error creating category", error });
  }
});

router.get("/", async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});




export default router;
