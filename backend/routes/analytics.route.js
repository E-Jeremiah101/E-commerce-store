import express from "express";
import { getAnalytics } from "../controllers/analytics.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",  async (req, res) => {
  try {
    const range = req.query.range || "weekly";
    const result = await getAnalytics(range); 
    res.json(result);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
// requirePermission("product:read"),