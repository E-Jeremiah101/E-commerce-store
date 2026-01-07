import express from "express";
import { visitorsTracker } from "../controllers/visitorController.js";

const router = express.Router();

router.post("/", visitorsTracker);

export default router;
