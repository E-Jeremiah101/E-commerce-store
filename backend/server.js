import express from "express";
import dotenv from "dotenv";
import authRouthes from "./routes/auth.route.js";
import productRoutes from "./routes/product.routes.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import path from "path";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import { connectRedis } from "./lib/redis.js";
import orderRoute from "./routes/orderRoute.js";
import adminOrderRoutes from "./routes/adminOrder.route.js";
import userRoutes from "./routes/user.route.js";
import cors from "cors";
import { fileURLToPath } from "url"; 
import reviewRoutes from "./routes/review.routes.js"
import visitorRoutes from "./routes/visitor.route.js"
import refundRoutes from "./routes/refund.routes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import Product from "./models/product.model.js";
import savedProductRoutes from "./routes/savedProduct.routes.js"; 
import inventoryRoutes from "./routes/inventory.routes.js";
import auditRoutes from "./routes/auditLog.routes.js";
import adminTransactionRoutes from "./routes/admin.transaction.route.js";
import storeSettingsRoutes from "./routes/storeSettings.route.js"

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
await connectRedis(); //connect once at startup

try {
  await connectDB();
  console.log(" MongoDB connection established.");
} catch (err) {
  console.error(" MongoDB connection failed:", err.message);
  process.exit(1);
}

// const __dirname = path.resolve();
app.use(
  cors({
    origin: process.env.CLIENT_URL, // allowed frontend
    credentials: true, // allow cookies/tokens
  })
);
app.set("trust proxy", true);
app.use(express.json({ limit: "10mb" })); // allow to parse the body of the request
app.use(cookieParser());

// Add this debug route to check inventory
app.get('/api/debug-inventory', async (req, res) => {
  try {
    const products = await Product.find({});
    const inventory = products.map(p => ({
      name: p.name,
      totalStock: p.countInStock,
      reserved: p.reserved || 0,
      variants: p.variants?.map(v => ({
        size: v.size,
        color: v.color,
        stock: v.countInStock,
        reserved: v.reserved || 0
      }))
    }));
    
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//authRoute
app.use("/api/auth", authRouthes);

//productRoutes
app.use("/api/products", productRoutes);

//cartRoutes
app.use("/api/cart", cartRoutes);

//couponRoutes
app.use("/api/coupons", couponRoutes);

//paymentsRoutes
app.use("/api/payments", paymentRoutes);

//analyticsRoutes
app.use("/api/analytics", analyticsRoutes);

//orderRoutes
app.use("/api/orders", orderRoute);

//adminOderRoute
app.use("/api/admin/orders", adminOrderRoutes);

app.use("/api/users", userRoutes);
app.use("/api/admin", userRoutes);

//reviewRoute
app.use("/api/reviews", reviewRoutes);

app.use("/api/store-settings", storeSettingsRoutes);

//VisitorRoute
app.use("/api/visitors", visitorRoutes);

//RefundRoute
app.use("/api/refunds", refundRoutes);

// categoryRoute
app.use("/api", categoryRoutes)

app.use("/api/categories", categoryRoutes);

app.use("/api/saved-products", savedProductRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/admin", adminTransactionRoutes);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildPath = path.join(__dirname, "../frontend/dist");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(buildPath));

  app.use((req, res, next) => {
    if (!req.originalUrl.startsWith("/api")) {
      res.sendFile(path.join(buildPath, "index.html"));
    } else {
      next();
    }
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

 
});
