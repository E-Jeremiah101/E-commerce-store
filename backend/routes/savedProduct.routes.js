import express from "express";
import {
  saveProduct,
  unsaveProduct,
  getSavedProducts,
  checkProductSaved,
} from "../controllers/savedProduct.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

router.post("/", saveProduct);
router.delete("/:productId", unsaveProduct);
router.get("/", getSavedProducts);
router.get("/check/:productId", checkProductSaved);

export default router;
