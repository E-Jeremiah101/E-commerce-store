import redis from "../lib/redis.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {sendEmail} from "../lib/mailer.js";
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};
//save token to redis database
const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refresh_token:${userId}`, refreshToken, {
    EX: 7 * 24 * 60 * 60,
  }); // 7 days
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, //prevent xss attacks (cross site scripting attacks)
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //prevent CSRF attack(croos-site request forgery)
    maxAge: 15 * 60 * 1000, //expires in 15 mins
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, //prevent xss attacks (cross site scripting attacks)
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", //prevent CSRF attack(croos-site request forgery)
    maxAge: 7 * 24 * 60 * 60 * 1000, //expires in 15 mins
  });
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User email already exists",
      });
    } else {
      const user = await User.create({ name, email, password });

      //authenticate users

      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);

      setCookies(res, accessToken, refreshToken);

      res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
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

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await redis.del(`refresh_token:${decoded.userId}`);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//this will refresh/recreate the access token
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    //generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.userId
    );
   //save new refresh token in redis
   await storeRefreshToken(decoded.userId, newRefreshToken);
   //Update cookie
   setCookies(res, accessToken, newRefreshToken)
   

    res.json({ message: "Token refresh successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

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

    res.json({ message: "Reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
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
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = password; // hash in User model pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

