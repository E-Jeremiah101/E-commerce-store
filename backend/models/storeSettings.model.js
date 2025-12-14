import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      default: "My Store",
    },
    logo: {
      type: String, 
    },
    supportEmail: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    address: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("StoreSettings", storeSettingsSchema);
