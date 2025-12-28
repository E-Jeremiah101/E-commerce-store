import redis from "../lib/redis.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {sendEmail} from "../lib/mailer.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";
import dotenv from "dotenv";
import storeSettings from "../models/storeSettings.model.js";
import { ADMIN_ROLE_PERMISSIONS } from "../constants/adminRoles.js";
import { PERMISSIONS } from "../constants/permissions.js";
dotenv.config();

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30m",
  }); 

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { 
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};
//save token to redis database
const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  ); // 7days
};

const setCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true, // prevent XSS attacks, cross site scripting attack
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax", // prevents CSRF attack, cross-site request forgery attack
    maxAge:15 * 60 * 1000, // 15 minutes
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // prevent XSS attacks, cross site scripting attack
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax", // prevents CSRF attack, cross-site request forgery attack
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Helper for auth audit logging
const logAuthAction = async (req, action, userId = null, changes = {}, additionalInfo = "") => {
  try {
    let user = null;
    let userName = "Unknown User";

    if (userId) {
      user = await User.findById(userId);
      if (user) {
        userName = `${user.firstname} ${user.lastname}`;
      }
    }

    // For login/logout, we want to log for ALL users (including admins)
    // We'll check if the user is admin to determine if it's an admin action
    const isAdmin = user?.role === "admin";

    // NEW: Skip logging if not admin (except for critical auth failures)
    const isCriticalAuthFailure = [
      "LOGIN_FAILED",
      "SIGNUP_FAILED",
      "FORGOT_PASSWORD_ATTEMPT",
    ].includes(action);

    if (!isAdmin && !isCriticalAuthFailure) {
      return; // Don't log non-admin actions
    }

    await AuditLogger.log({
      adminId: userId,
      adminName: userName,
      action,
      entityType: ENTITY_TYPES.USER,
      entityId: userId,
      entityName: userName,
      changes: {
        ...changes,
        userRole: user?.role || "unknown",
        isAdmin: isAdmin,
      },
      ...AuditLogger.getRequestInfo(req),
      additionalInfo,
    });
  } catch (error) {
    console.error("Failed to log auth action:", error);
  }
};

// Helper for failed login attempts
const logFailedLogin = async (req, email, reason) => {
  try {
    // NEW: Check if the user exists and is admin
    const user = await User.findOne({ email });
    const isAdmin = user?.role === "admin";

    // Only log failed admin logins
    if (!isAdmin) {
      return;
    }

    await AuditLogger.log({
      adminId: user?._id || null,
      adminName: user ? `${user.firstname} ${user.lastname}` : "Unknown Admin",
      action: "LOGIN_FAILED",
      entityType: ENTITY_TYPES.SYSTEM,
      entityId: null,
      entityName: "Authentication System",
      changes: {
        attemptedEmail: email,
        reason: reason,
        ipAddress: req.ip || req.headers["x-forwarded-for"],
        userAgent: req.headers["user-agent"] || "",
        userRole: user?.role || "unknown",
      },
      ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress,
      userAgent: req.headers["user-agent"] || "",
      additionalInfo: `Failed admin login attempt for ${email} - ${reason}`,
    });
  } catch (error) {
    console.error("Failed to log failed login:", error);
  }
};

export const signup = async (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {

      const isAdmin = userExists.role === "admin";
      if(isAdmin){
       await logAuthAction(
         req,
         "SIGNUP_FAILED",
         null,
         {
           attemptedEmail: email,
           reason: "Email already exists",
         },
         "Signup failed - email already registered"
       );
      }

      return res.status(400).json({
        message: "User email already exists",
      });
    } else {
      const user = await User.create({ firstname, lastname, email, password });

      //authenticate users

      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);

      setCookies(res, accessToken, refreshToken);
      const settings = await storeSettings.findOne();



       (async () => {
         try {
           await sendEmail({
             to: user.email,
             subject: `Welcome to  ${settings?.storeName}, ${user.firstname}! `,
             text: `Welcome ${user.firstname}! Thank you for joining  ${settings?.storeName}. Your account is ready. Start exploring eco-friendly products at ${process.env.CLIENT_URL}.`,
             html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #10b981, #047857); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .content { padding: 30px; }
            .welcome { color: #047857; font-size: 20px; margin-bottom: 20px; font-weight: 600; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .icon { font-size: 24px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">
  <img src="${
    settings?.logo
  }" alt="Logo" style="max-height:50px; display:block; margin: 0 auto 8px;" />
</div>
              <h1>Welcome to  ${settings?.storeName}</h1>
              <p>Sustainable Shopping, Beautiful Living</p>
            </div>
            
            <div class="content">
              <div class="welcome">Hello ${user.firstname} ${
               user.lastname
             },</div>
              
              <p>We're thrilled to welcome you to our community! Your account is now active and ready to use.</p>
              
              <p><strong>Email:</strong> ${user.email}</p>
              
              <p>Start your sustainable shopping journey today:</p>
              
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL}/products" class="button">
                  Start Shopping →
                </a>
              </div>
              
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                <strong>Tip:</strong> Complete your profile for personalized recommendations.
              </p>
            </div>
            
            <div class="footer">
              <p> ${settings?.storeName} | Sustainable Living Made Easy</p>
              <p>📍 ${settings.warehouseLocation.state}, Nigeria | 📧 ${
               settings?.supportEmail
             }</p>
              <p style="font-size: 12px; margin-top: 15px;">
                &copy; ${new Date().getFullYear()} ${
               settings?.storeName
             } . All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
           });
           console.log(`Welcome email sent to ${user.email}`);
         } catch (emailError) {
           console.error("Welcome email failed:", emailError);
         }
       })();

      res.status(201).json({
        user: {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
        },
        message: "User created successfully",
      });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);

      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      if (user.role === "admin") {
        await logAuthAction(
          req,
          "LOGIN",
          user._id,
          {
            loginDetails: {
              method: "email/password",
              timestamp: new Date().toISOString(),
            },
          },
          user.role === "admin"
            ? "Admin login successful"
            : "User login successful"
        );
      }

      // Convert to plain object
      const userObj = user.toObject ? user.toObject() : { ...user._doc };

      // Calculate permissions
      if (userObj.role === "admin" && userObj.adminType) {
        if (userObj.adminType === "super_admin") {
          userObj.permissions = Object.values(PERMISSIONS);
        } else {
          userObj.permissions = ADMIN_ROLE_PERMISSIONS[userObj.adminType] || [];
        }
      } else {
        userObj.permissions = [];
      }

      res.json({
        _id: userObj._id,
        firstname: userObj.firstname,
        lastname: userObj.lastname,
        email: userObj.email,
        role: userObj.role,
        adminType: userObj.adminType,
        permissions: userObj.permissions,
      });
    } else {
      await logFailedLogin(
        req,
        email,
        user ? "Invalid password" : "User not found"
      );

      res.status(400).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in login controller", error.message);

    await logAuthAction(
      req,
      "LOGIN_ERROR",
      null,
      {
        attemptedEmail: req.body.email,
        error: error.message,
      },
      "Login process failed"
    );

    res.status(500).json({ message: error.message });
  }
};
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    let userId = null;
    let user = null;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );
        userId = decoded.userId;
        user = await User.findById(userId);
        await redis.del(`refresh_token:${userId}`);
      } catch (error) {
        console.log("Token verification failed during logout:", error.message);
      }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    
    if (user && user.role === "admin") {
      await logAuthAction(
        req,
        "LOGOUT",
        user._id,
        {
          logoutDetails: {
            timestamp: new Date().toISOString(),
            initiatedBy: req.user ? "user" : "system",
          },
        },
        user.role === "admin" ? "Admin logout" : "User logout"
      );
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);

    // Log logout error
    await logAuthAction(
      req,
      "LOGOUT_ERROR",
      null,
      {
        error: error.message,
      },
      "Logout process failed"
    );

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // Verify old refresh token
    const decoded = jwt.verify(
      oldRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Check that token exists in Redis
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    if (!storedToken || storedToken !== oldRefreshToken) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    //  Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { userId: decoded.userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    //  Store the new refresh token in Redis (and overwrite the old one)
    await storeRefreshToken(decoded.userId, newRefreshToken);

    //  Reset cookies (renew expiration)
    setCookies(res, newAccessToken, newRefreshToken);

    res.json({ message: "Tokens refreshed successfully" });
    console.log(
      `Refreshed tokens for user ${
        decoded.userId
      } at ${new Date().toISOString()}`
    );
  } catch (error) {
    console.error("Error in refreshToken controller:", error.message);
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const getProfile = async (req, res) => {
  try {
    console.log("🔍 Auth getProfile called for:", req.user?.email);

    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Make sure we have a fresh user object with all properties
    const user = req.user;

    // Calculate permissions if not already set
    if (!user.permissions) {
      let permissions = [];
      if (user.role === "admin" && user.adminType) {
        console.log("Calculating permissions for admin type:", user.adminType);
        if (user.adminType === "super_admin") {
          permissions = Object.values(PERMISSIONS);
        } else {
          permissions = ADMIN_ROLE_PERMISSIONS[user.adminType] || [];
        }
      }
      user.permissions = permissions;
    }

    console.log("✅ Auth getProfile returning user with permissions:", {
      email: user.email,
      role: user.role,
      adminType: user.adminType,
      permissions: user.permissions,
      permissionsLength: user.permissions?.length || 0,
    });

    res.json(user);
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const message = `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
    `;

    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      text: `We received a request to reset your password. 
      If you made this request, use the link below to reset it:
      ${resetUrl}
      If you did not request a password reset, you can safely ignore this email.`,
      html: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto;">
      <h2 style="color: #222;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. If you made this request, please click the button below:</p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" target="_blank" 
           style="background-color: #2563eb; color: #fff; text-decoration: none; 
                  padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset My Password
        </a>
      </p>

      <p>If the button above doesn’t work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">
        <a href="${resetUrl}" target="_blank" style="color: #2563eb;">${resetUrl}</a>
      </p>

      <p>If you didn’t request a password reset, you can safely ignore this email. 
      Your account will remain secure.</p>

      <p style="margin-top: 30px;">Best regards,<br><strong>Eco-Store</strong></p>
    </div>
  `,
    });
    if (user.role === "admin"){
    await logAuthAction(
      req,
      "FORGOT_PASSWORD_REQUEST",
      user._id,
      {
        passwordReset: {
          tokenGenerated: true,
          expiresAt: user.resetPasswordExpire,
          emailSent: true,
        },
      },
      "Password reset request sent successfully"
    );
  }

    res.json({ message: "Reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    if (user.role === "admin"){
    await logAuthAction(
      req,
      "FORGOT_PASSWORD_ERROR",
      null,
      {
        attemptedEmail: req.body.email,
        error: error.message,
      },
      "Password reset request failed"
    );
  }
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    // Check if password was used before
    const isPasswordUsed = await user.isPasswordUsedBefore(password);
    if (isPasswordUsed) {
      if (user.role === "admin"){
      await logAuthAction(
        req,
        "RESET_PASSWORD_FAILED",
        user._id,
        {
          reason: "Password reuse not allowed",
          attemptedReuse: true,
          historySize: user.previousPasswords.length,
        },
        "Password reset failed - attempted to reuse old password"
      );
    }
      return res.status(400).json({
        message:
          "New password cannot be the same as your current or previous passwords",
        code: "PASSWORD_REUSE",
      });
    }

    user.password = password; // hash in User model pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    if (user.role === "admin") {
    await logAuthAction(
      req,
      "RESET_PASSWORD",
      user._id,
      {
        passwordReset: {
          tokenUsed: true,
          passwordChanged: true,
          timestamp: new Date().toISOString(),
        },
      },
      "Password reset successfully"
    );
  }

    (async () => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Password Reset Successful",
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto;">
              <h2 style="color: #27ae60;">Password Reset Successful</h2>
              <p>Hello ${user.firstname},</p>
              <p>Your password has been successfully reset.</p>
              <p>If you did not initiate this password reset, please contact our support team immediately.</p>
              <p>Best regards,<br><strong>Eco-Store Security Team</strong></p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Password reset confirmation email failed:", emailError);
      }
    })();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      await logAuthAction(
        req,
        "CHANGE_PASSWORD_FAILED",
        userId,
        {
          reason: "Incorrect current password",
        },
        "Password change failed - incorrect current password"
      );
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      await logAuthAction(
        req,
        "CHANGE_PASSWORD_FAILED",
        userId,
        {
          reason: "Same as current password",
        },
        "Password change failed - same as current password"
      );
      return res.status(400).json({ 
        message: "New password cannot be the same as current password" 
      });
    }

   

    // Check if password was used before
    const isPasswordUsed = await user.isPasswordUsedBefore(newPassword);
    if (isPasswordUsed) {
      await logAuthAction(
        req,
        "CHANGE_PASSWORD_FAILED",
        userId,
        {
          reason: "Password reuse not allowed",
          attemptedReuse: true,
        },
        "Password change failed - attempted to reuse old password"
      );
      return res.status(400).json({ 
        message: "New password cannot be the same as your previous passwords",
        code: "PASSWORD_REUSE"
      });
    }

    // Update password (pre-save hook handles history)
    user.password = newPassword;
    await user.save();

    // Invalidate refresh token
    await redis.del(`refresh_token:${userId}`);

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    await logAuthAction(
      req,
      "CHANGE_PASSWORD",
      userId,
      {
        passwordChanged: true,
        timestamp: new Date().toISOString(),
        previousPasswordsCount: user.previousPasswords.length,
        passwordStrength: passwordValidation.score,
      },
      "Password changed directly from profile"
    );

    res.json({ 
      message: "Password changed successfully. Please login again.",
      requiresReauth: true 
    });
  } catch (error) {
    console.error("Change password error:", error);
    
    await logAuthAction(
      req,
      "CHANGE_PASSWORD_ERROR",
      req.user?._id || null,
      {
        error: error.message,
      },
      "Password change process failed"
    );
    
    res.status(500).json({ message: "Server error" });
  }
};
