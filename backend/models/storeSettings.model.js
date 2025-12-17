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
    // Updated warehouse location (admin configurable)
    warehouseLocation: {
      state: {
        type: String,
        required: true,
        default: "Edo",
      },
      city: {
        type: String,
        required: true,
        default: "Benin City",
      },
      lga: {
        type: String,
        required: true,
        default: "Oredo",
      },
      address: {
        type: String,
      },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },

    shippingFees: {
      sameCity: { type: Number, default: 500 },
      sameLGA: { type: Number, default: 1000 },
      sameState: { type: Number, default: 1500 },
      sameRegion: { type: Number, default: 2500 },
      southern: { type: Number, default: 3500 },
      northern: { type: Number, default: 5000 },
    },

    // Nigerian states and regions configuration
    nigeriaConfig: {
      regions: {
        type: Map,
        of: [String], // Region name -> array of states
        default: () =>
          new Map([
            [
              "south_south",
              ["Delta", "Edo", "Bayelsa", "Cross River", "Akwa Ibom", "Rivers"],
            ],
            ["south_east", ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"]],
            ["south_west", ["Lagos", "Ogun", "Ondo", "Osun", "Oyo", "Ekiti"]],
            [
              "north_central",
              ["Benue", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau", "FCT"],
            ],
            [
              "north_east",
              ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
            ],
            [
              "north_west",
              [
                "Jigawa",
                "Kaduna",
                "Kano",
                "Katsina",
                "Kebbi",
                "Sokoto",
                "Zamfara",
              ],
            ],
          ]),
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("StoreSettings", storeSettingsSchema);
