import Flutterwave from "flutterwave-node-v3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

if (!process.env.FLW_PUBLIC_KEY || !process.env.FLW_SECRET_KEY) {
  throw new Error("❌ Flutterwave API keys missing in .env file");
}

export const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

console.log("✅ Flutterwave initialized successfully");

console.log(Object.keys(flw));
