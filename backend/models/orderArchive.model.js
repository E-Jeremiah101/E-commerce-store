import mongoose from "mongoose";
import orderSchema from "./order.schema.shared.js";

const OrderArchive = mongoose.model(
  "OrderArchive",
  orderSchema,
  "orders_archive"
);

export default OrderArchive;