import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the ROOT folder
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

// Optional: test that the key loaded
console.log("Stripe Key Loaded:", !!process.env.STRIPE_SECRET_KEY);
