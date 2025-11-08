import express from "express";
import { visitorsTracker } from "../controllers/visitorController.js";

const router = express.Router();

// Track new visitor
router.post("/", visitorsTracker);

export default router;
