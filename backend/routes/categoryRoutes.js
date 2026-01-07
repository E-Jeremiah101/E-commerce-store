import express from "express";
import { categoryImage, createCategory, getCategory, getNewCategory, deleteCategory, getCategoryWithProductCount } from "../controllers/categoryWithImages.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/categories-with-images", categoryImage);

router.post("/", protectRoute,adminRoute, createCategory);

router.get("/", getCategory);

router.post("/", getNewCategory);

router.delete("/delete/:id", protectRoute, adminRoute, deleteCategory);

router.get(
  "/:id/product-count",
  protectRoute,
  adminRoute,
  getCategoryWithProductCount
);



export default router; 
