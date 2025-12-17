import express from "express";
import { NIGERIAN_STATES,getAllStates, getLGAsByState } from "../service/deliveryConfig.js";

const router = express.Router();

// Get all Nigerian states
router.get("/states", (req, res) => {
  try {
    const states = getAllStates();
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch states" });
  }
});

// Get LGAs by state
router.get("/lgas/:state", (req, res) => {
  try {
    const { state } = req.params;
    const lgas = getLGAsByState(state);
    res.json(lgas);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch LGAs" });
  }
});

export default router;
