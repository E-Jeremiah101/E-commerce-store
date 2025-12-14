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
  const { storeName, logo, supportEmail, phoneNumber, currency, address } =
    req.body;

  let settings = await StoreSettings.findOne();

  if (!settings) {
    settings = new StoreSettings();
  }

  settings.storeName = storeName;
  settings.logo = logo;
  settings.supportEmail = supportEmail;
  settings.phoneNumber = phoneNumber;
  settings.currency = currency;
  settings.address = address;

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