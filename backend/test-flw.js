import Flutterwave from "flutterwave-node-v3";
import dotenv from "dotenv";
import path from "path"

dotenv.config({ path: path.resolve("../.env") });

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

console.log("✅ Flutterwave initialized!");
console.log("Available sections:", Object.keys(flw));
