// middleware/authOptional.middleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ADMIN_ROLE_PERMISSIONS } from "../constants/adminRoles.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const authenticateOptional = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      // No token, continue without user
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

      // Get user from database
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        req.user = null;
        return next();
      }

      // Attach permissions
      if (user.role === "admin" && user.adminType) {
        if (user.adminType === "super_admin") {
          user.permissions = Object.values(PERMISSIONS);
        } else {
          user.permissions = ADMIN_ROLE_PERMISSIONS[user.adminType] || [];
        }
      } else {
        user.permissions = [];
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Token expired, continue without user
        console.log("⚠️ Token expired in optional auth");
        req.user = null;
        return next();
      }
      // Other token errors, continue without user
      console.log(
        "⚠️ Token verification failed in optional auth:",
        error.message
      );
      req.user = null;
      next();
    }
  } catch (error) {
    console.log("❌ Error in authenticateOptional middleware:", error.message);
    req.user = null;
    next();
  }
};
