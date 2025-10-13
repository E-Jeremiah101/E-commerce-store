import express from "express";
import { getAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const range = req.query.range || "weekly"; // daily, weekly, monthly, yearly
    const { analyticsData, salesData } = await getAnalytics(range);

    res.json({ analyticsData, salesData });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
