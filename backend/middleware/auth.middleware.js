import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ADMIN_ROLE_PERMISSIONS } from "../constants/adminRoles.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({
        message: "Unauthorized - No access token provided",
      });
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        console.error(`User not found for valid token: ${decoded.userId}`);
        return res.status(401).json({ message: "User not found" });
      }

    
      if (user.role === "admin" && user.adminType) {
        if (user.adminType === "super_admin") {
          user.permissions = Object.values(PERMISSIONS);
        } else {
          user.permissions = ADMIN_ROLE_PERMISSIONS[user.adminType] || [];
        }
      } else {
        user.permissions = [];
      }

      req.user = user;

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Unauthorized - Token expired" });
      }
      throw error;
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      message: "Access denied - Admin only",
    });
  }
};  