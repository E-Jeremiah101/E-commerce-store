import StoreSettings from "../models/storeSettings.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getStoreSettings = async (req, res) => {
  let settings = await StoreSettings.findOne();

  if (!settings) {
    settings = await StoreSettings.create({});
  }

  res.json(settings);
};



export const updateStoreSettings = async (req, res) => {
  const {
    storeName,
    logo,
    supportEmail,
    phoneNumber,
    currency,
    warehouseLocation,
    shippingFees,
    nigeriaConfig,
  } = req.body;

  let settings = await StoreSettings.findOne();

  if (!settings) {
    settings = new StoreSettings();
  }

  settings.storeName = storeName;
  settings.logo = logo;
  settings.supportEmail = supportEmail;
  settings.phoneNumber = phoneNumber;
  settings.currency = currency;

  // Update warehouse location if provided
  if (warehouseLocation) {
    settings.warehouseLocation = {
      ...settings.warehouseLocation,
      ...warehouseLocation,
    };
  }

  // Update shipping fees if provided
  if (shippingFees) {
    settings.shippingFees = {
      ...settings.shippingFees,
      ...shippingFees,
    };
  }

  // Update Nigeria config if provided
  if (nigeriaConfig) {
    settings.nigeriaConfig = {
      ...settings.nigeriaConfig,
      ...nigeriaConfig,
    };
  }

  await settings.save();

  res.json({ message: "Store settings updated successfully", settings });
};


export const uploadLogoController = async (req, res) => {
  try {
    const file = req.file.path;

    const result = await cloudinary.uploader.upload(file, {
      folder: "store-logos",
      transformation: [{ width: 300, crop: "limit" }],
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: "Logo upload failed" });
  }
};