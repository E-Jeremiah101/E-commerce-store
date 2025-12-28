import express from "express";
import {
  getAnalytics,
  exportAnalytics,
} from "../controllers/analytics.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";
import redis from "../lib/redis.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const range = req.query.range || "weekly";
    const result = await getAnalytics(range);
    res.json(result);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/export", protectRoute, adminRoute, exportAnalytics);

// ⚡ Cache invalidation endpoint - called after order updates
router.post("/invalidate-cache", protectRoute, adminRoute, async (req, res) => {
  try {
    const ranges = ["daily", "weekly", "monthly", "yearly", "all"];
    for (const range of ranges) {
      await redis.del(`analytics:${range}`);
    }
    res.json({ message: "Analytics cache cleared successfully" });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
// requirePermission("product:read"),
