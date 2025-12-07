import redis from "../lib/redis.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {sendEmail} from "../lib/mailer.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";

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
        isAdmin: isAdmin
      },
      ...AuditLogger.getRequestInfo(req),
      additionalInfo
    });
  } catch (error) {
    console.error("Failed to log auth action:", error);
  }
};

// Helper for failed login attempts
const logFailedLogin = async (req, email, reason) => {
  try {
    await AuditLogger.log({
      adminId: null,
      adminName: "Failed Login Attempt",
      action: "LOGIN_FAILED",
      entityType: ENTITY_TYPES.SYSTEM,
      entityId: null,
      entityName: "Authentication System",
      changes: {
        attemptedEmail: email,
        reason: reason,
        ipAddress: req.ip || req.headers["x-forwarded-for"],
        userAgent: req.headers["user-agent"] || ""
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"] || "",
      additionalInfo: `Failed login attempt for ${email} - ${reason}`
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

      return res.status(400).json({
        message: "User email already exists",
      });
    } else {
      const user = await User.create({ firstname, lastname, email, password });

      //authenticate users

      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);

      setCookies(res, accessToken, refreshToken);

      await logAuthAction(
        req,
        "SIGNUP_SUCCESS",
        user._id,
        {
          userCreated: {
            firstname,
            lastname,
            email,
            role: user.role,
          },
        },
        "New user registered successfully"
      );

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
    await logAuthAction(
      req,
      "SIGNUP_ERROR",
      null,
      {
        attemptedEmail: req.body.email,
        error: error.message,
      },
      "Signup process failed"
    );
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

      await logAuthAction(
        req,
        "LOGIN",
        user._id,
        {
          loginDetails: {
            method: "email/password",
            timestamp: new Date().toISOString()
          }
        },
        user.role === "admin" ? "Admin login successful" : "User login successful"
      );

      res.json({
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
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

// export const logout = async (req, res) => {
//   try {
//     const refreshToken = req.cookies.refreshToken;
//     if (refreshToken) {
//       const decoded = jwt.verify(
//         refreshToken,
//         process.env.REFRESH_TOKEN_SECRET
//       );
//       await redis.del(`refresh_token:${decoded.userId}`);
//     }

//     res.clearCookie("accessToken");
//     res.clearCookie("refreshToken");
//     res.json({ message: "Logged out successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

//this will refresh/recreate the access token

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

    // Log logout action if we have user info
    if (user) {
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
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user){ 
       await logAuthAction(
         req,
         "FORGOT_PASSWORD_ATTEMPT",
         null,
         {
           attemptedEmail: email,
           reason: "User not found",
         },
         "Password reset request for non-existent user"
       );
      return res.status(404).json({ message: "User not found" });
    }

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

    res.json({ message: "Reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
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
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password
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

    if (!user) {
      await logAuthAction(
        req,
        "RESET_PASSWORD_FAILED",
        null,
        {
          tokenUsed: token.substring(0, 10) + "...", // Partial token for security
          reason: "Invalid or expired token",
        },
        "Password reset attempt with invalid token"
      );
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = password; // hash in User model pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

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

    await logAuthAction(
      req,
      "RESET_PASSWORD_ERROR",
      null,
      {
        tokenUsed: req.params.token?.substring(0, 10) + "...",
        error: error.message,
      },
      "Password reset process failed"
    );
    res.status(500).json({ message: "Server error" });
  }
};

