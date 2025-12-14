import express from "express";
import multer from "multer";
import {
  getStoreSettings,
  updateStoreSettings,
  uploadLogoController,
} from "../controllers/storeSettingsController.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",  getStoreSettings);

router.put("/", protectRoute, adminRoute, updateStoreSettings);


const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
});


router.post(
  "/logo",
  protectRoute,
  adminRoute,
  upload.single("image"),
  uploadLogoController
);

export default router; 
