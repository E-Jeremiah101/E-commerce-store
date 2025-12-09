import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    ipAddress: { type: String, required: true },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Visitor", visitorSchema);