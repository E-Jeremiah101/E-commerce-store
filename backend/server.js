import express from "express";
import dotenv from "dotenv";
import authRouthes from "./routes/auth.route.js";
import productRoutes from "./routes/product.routes.js"
import {connectDB} from "./lib/db.js";
import cookieParser from "cookie-parser";
import path from "path"
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import { connectRedis } from "./lib/redis.js";
import orderRoute from "./routes/orderRoute.js";
import adminOrderRoutes from "./routes/adminOrder.route.js";
import userRoutes from "./routes/user.route.js"
import cors from "cors"
dotenv.config()
const app = express();
await connectRedis(); //connect once at startup
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();
app.use(
  cors({
    origin: process.env.CLIENT_URL, // allowed frontend
    credentials: true, // allow cookies/tokens
  })
);

app.use(express.json({limit: "10mb"})); // allow to parse the body of the request
app.use(cookieParser())

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

if(process.env.NODE_ENV ==="production"){
   const buildPath = path.join(__dirname, "../frontend/dist");
   app.use(express.static(buildPath));
   app.get("*", (req, res) => {
     res.sendFile(path.join(buildPath, "index.html"));
   });
}





app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    connectDB();
});