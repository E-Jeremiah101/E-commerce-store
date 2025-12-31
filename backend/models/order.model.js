import mongoose from "mongoose";
import orderSchema from "./order.schema.shared.js";

const Order = mongoose.model("Order", orderSchema);

export default Order;
