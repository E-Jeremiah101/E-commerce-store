import express from "express";
import { getAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const range = req.query.range || "weekly";
    const { analyticsData, salesData, statusCharts } = await getAnalytics(
      range
    );
    res.json({ analyticsData, salesData, statusCharts });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
