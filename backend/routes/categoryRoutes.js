import express from "express";
import { categoryImage, createCategory, getCategory, getNewCategory } from "../controllers/categoryWithImages.js";

const router = express.Router();

/**
 * GET /api/categories-with-images
 * Returns a list of categories with one random product image each.
 */
router.get("/categories-with-images", categoryImage);

router.post("/", createCategory);

router.get("/", getCategory);

// POST /api/categories
router.post("/", getNewCategory);



export default router; 
