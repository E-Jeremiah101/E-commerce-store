// import jwt from 'jsonwebtoken';
// import User from '../models/user.model.js';

// //protectRoute
// export const protectRoute= async (req, res, next) =>{
//     try {
//         const accessToken = req.cookies.accessToken;

//         if(!accessToken){
//             return res.status(401).json({
//                 message: "Unauthorized - No access token provided"
//             })
//         }

//         try {
//             const decoded = jwt.verify(
//               accessToken,
//               process.env.ACCESS_TOKEN_SECRET
//             );
//             const user = await User.findById(decoded.userId).select(
//               "-password"
//             );

//             if (!user) {
//               return res.status(401).json({ message: "User not found" });
//             }
//             req.user = user;
//             next();

//         } catch (error) {
//             if(error.name ==="TokenExpiredError"){
//                 return res
//                   .status(401)
//                   .json({ message: "Unauthorize - Invalid access token" });
//             }
//             throw error;
//         }

        

//     } catch (error) {
//         console.log("Error in protectRoute middleware", error.message);
//         return res.status(401).json({message: "Unauthorize - Invalid access token"})
//     }

// };


// //adminRoute

// export const adminRoute = (req, res, next) => {
//     if(req.user && req.user.role === "admin"){
//         next()
//     }else{
//         return res.status(403).json({
//             message: "Access denied - Admin only"
//         });
//     }
// }...............








import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ADMIN_ROLE_PERMISSIONS } from "../constants/adminRoles.js";
import { PERMISSIONS } from "../constants/permissions.js";

//protectRoute
// export const protectRoute = async (req, res, next) => {
//   try {
//     const accessToken = req.cookies.accessToken;

//     if (!accessToken) {
//       return res.status(401).json({
//         message: "Unauthorized - No access token provided",
//       });
//     }

//     try {
//       const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
//       const user = await User.findById(decoded.userId).select("-password");

//       if (!user) {
//         return res.status(401).json({ message: "User not found" });
//       }
//       req.user = user;
//       next();
//     } catch (error) {
//       if (error.name === "TokenExpiredError") {
//         return res
//           .status(401)
//           .json({ message: "Unauthorize - Invalid access token" });
//       }
//       throw error;
//     }
//   } catch (error) {
//     console.log("Error in protectRoute middleware", error.message);
//     return res
//       .status(401)
//       .json({ message: "Unauthorize - Invalid access token" });
//   }
// };
// protectRoute middleware - corrected version
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
        return res.status(401).json({ message: "User not found" });
      }
      
      // Convert to plain object
      const userObj = user.toObject ? user.toObject() : { ...user._doc };
      
      // Calculate permissions for admin users
      if (userObj.role === "admin" && userObj.adminType) {
        if (userObj.adminType === "super_admin") {
          userObj.permissions = Object.values(PERMISSIONS);
        } else {
          userObj.permissions = ADMIN_ROLE_PERMISSIONS[userObj.adminType] || [];
        }
      } else {
        userObj.permissions = [];
      }
      
      // Set the user with permissions
      req.user = userObj;
      
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
    console.log("Error in protectRoute middleware", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error" });
  }
};
//adminRoute

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      message: "Access denied - Admin only",
    });
  }
};  