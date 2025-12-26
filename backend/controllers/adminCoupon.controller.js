import Coupon from "../models/coupon.model.js";
import { generateCouponCode } from "../lib/AdminGenerateCoupon.js";
import storeSettings from "../models/storeSettings.model.js"
import User from "../models/user.model.js";
import { sendEmail } from "../lib/mailer.js";
import AuditLogger from "../lib/auditLogger.js";


export const createCoupon = async (req, res) => {
  try {
    const {
      discountPercentage,
      expirationDate,
      couponReason,
      userId,
      sendToAllUsers,
    } = req.body;

    // 1️⃣ Required field checks
    if (!discountPercentage || !expirationDate || !couponReason) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // 2️⃣ Prevent manual creation of system coupons
    if (["first_order", "high_value_order"].includes(couponReason)) {
      return res.status(400).json({
        message: "System coupons are auto-generated",
      });
    }
    

    // 3️⃣ Create coupon safely
    const coupon = await Coupon.create({
      code: generateCouponCode(couponReason), // ✅ backend-only
      discountPercentage,
      expirationDate,
      couponReason,
      userId: userId || null,
      isActive: true, 
    });

    if (coupon.userId) {
      const user = await User.findById(coupon.userId);
      if (user?.email) {
        await sendCouponEmail({ to: user.email, coupon });
      }

      await AuditLogger.logCouponCreation(
        req.user._id,
        `${req.user.firstname} ${req.user.lastname}`,
        coupon,
        req
      );
      res.status(201).json({
        success: true,
        message: "Coupon created and sent to user",
        coupon,
      });
    } else {
      // Global coupon
      let emailResult = null;

      // Check if admin wants to send to all users
      if (sendToAllUsers === true) {
        emailResult = await sendGlobalCouponToAllUsers(coupon);
      }

      res.status(201).json({
        success: true,
        message: sendToAllUsers
          ? `Global coupon created and sent to ${
              emailResult?.sentCount || 0
            } users`
          : "Global coupon created (no emails sent)",
        coupon,
        emailStats: emailResult,
      });
    }

  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Server error" });
    error: process.env.NODE_ENV === "development" ? error.message : undefined;
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Check if coupon has been used
    if (coupon.usedAt && !force) {
      return res.status(400).json({
        message: "This coupon has already been used.",
        code: "COUPON_USED",
        usedAt: coupon.usedAt,
        suggestion: "Use ?force=true query parameter to delete anyway",
      });
    }

    // Delete the coupon
    await Coupon.findByIdAndDelete(id);

    // Log coupon deletion
    await AuditLogger.logCouponDeletion(
      req.user._id,
      `${req.user.firstname} ${req.user.lastname}`,
      coupon,
      !!force,
      req
    );

    // Log the action if you have user context
    console.log(
      `Coupon ${coupon.code} deleted by ${req.user?.email || "admin"}`
    );

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" deleted successfully`,
      coupon: {
        code: coupon.code,
        discount: coupon.discountPercentage,
        reason: coupon.couponReason,
      },
    });
  } catch (error) {
    console.error("Delete coupon error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }

    res.status(500).json({
      message: "Error deleting coupon",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


export const updateCoupon = async (req, res) => {
  try {
    const updates = { ...req.body };

    delete updates.code;
    delete updates.couponReason;

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    await AuditLogger.logCouponUpdate(
      req.user._id,
      `${req.user.firstname} ${req.user.lastname}`,
      coupon,
      updates,
      req
    );

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


export const toggleCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  coupon.isActive = !coupon.isActive;
  await coupon.save();

  await AuditLogger.logCouponToggle(
    req.user._id,
    `${req.user.firstname} ${req.user.lastname}`,
    coupon,
    coupon.isActive,
    req
  );

  res.json(coupon);
};

export const sendCouponEmail = async ({ to, coupon }) => {
  if (!to || !coupon) return;

  const settings = await storeSettings.findOne();
  if (!settings) return;

  const couponValue = `${coupon.discountPercentage}% OFF`;

  // Admin-only messaging
  const subject = `🎁 You’ve Received a Special Reward from ${settings.storeName}`;
  const title = "A Special Discount Just for You!";
  const message = `
    <p>We’re excited to share a special discount that was personally created for you.</p>
    <p>Enjoy this exclusive reward on your next purchase with us.</p>
  `;

  // ================= HTML EMAIL =================
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f0f9f4; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">

        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: #fff;">
          <img src="${settings.logo}" alt="${settings.storeName} Logo"
               style="max-height: 50px; display:block; margin: 0 auto 15px;" />
          <h1 style="margin:0; font-size: 28px; font-weight: bold;">${title}</h1>
          <div style="margin-top: 10px; font-size: 18px; opacity: 0.9;">
            Your Exclusive Discount Awaits!
          </div>
        </div>

        <div style="padding: 30px; color:#333;">
          ${message}

          <div style="background: linear-gradient(135deg, #fffbeb, #fed7aa);
                      border: 2px dashed #d97706;
                      border-radius: 12px;
                      padding: 25px;
                      text-align: center;
                      margin: 25px 0;">
            <div style="font-size: 14px; color: #92400e;">YOUR DISCOUNT CODE</div>
            <div style="font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 3px;">
              ${coupon.code}
            </div>
            <div style="font-size: 20px; color: #dc2626; font-weight: bold;">
              ${couponValue}
            </div>
            <div style="font-size: 14px; color: #92400e;">
              Valid until: ${new Date(
                coupon.expirationDate
              ).toLocaleDateString()}
            </div>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
            <h3 style="margin:0 0 12px 0;">✨ How to Use Your Coupon</h3>
            <ol>
              <li>Add your favorite products to the cart</li>
              <li>Proceed to checkout</li>
              <li>Enter <strong>${coupon.code}</strong> in the coupon field</li>
              <li>Enjoy your discount instantly</li>
            </ol>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 20px;">
            This coupon is exclusively for you and cannot be shared.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}"
               style="background: #10b981; color: white; padding: 14px 35px;
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              🛍️ Start Shopping Now
            </a>
          </div>
        </div>

        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
          <p>Need help? Contact us at
            <a href="mailto:${settings.supportEmail}" style="color: #10b981;">
              ${settings.supportEmail}
            </a>
          </p>
        </div>

      </div>
    </div>
  `;

  // ================= TEXT EMAIL =================
  const text = `
You’ve received a special discount!

Coupon Code: ${coupon.code}
Discount: ${couponValue}
Expires: ${new Date(coupon.expirationDate).toLocaleDateString()}

Use this code at checkout to enjoy your discount.

Shop now: ${process.env.CLIENT_URL}
  `.trim();

  await sendEmail({
    to,
    subject,
    html,
    text,
  });
};
export const sendGlobalCouponToAllUsers = async (coupon) => {
  try {
    const settings = await storeSettings.findOne();
    if (!settings) {
      console.log("Store settings not found");
      return { success: false, message: "Store settings not found" };
    }

    // Get ALL users with email addresses (excluding admin emails if needed)
    const users = await User.find({
      email: {
        $exists: true,
        $ne: null,
        $ne: "", // Exclude empty emails
      },
      role: { $ne: "" }, // Optional: exclude admin users
    }).select("email firstname lastname");

    console.log(`Found ${users.length} users with emails`);

    if (users.length === 0) {
      return {
        success: false,
        message: "No users with email addresses found",
        sentCount: 0,
      };
    }

    let sentCount = 0;
    let failedCount = 0;
    const failedEmails = [];

    // Send in small batches to avoid overwhelming
    const BATCH_SIZE = 20; // Adjust based on your email service limits

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (user) => {
        try {
          await sendGlobalCouponEmail({
            to: user.email,
            coupon,
            userName: user.firstname,
            settings,
          });
          sentCount++;
          return { email: user.email, success: true };
        } catch (emailError) {
          console.error(`Failed to send to ${user.email}:`, emailError.message);
          failedCount++;
          failedEmails.push({ email: user.email, error: emailError.message });
          return {
            email: user.email,
            success: false,
            error: emailError.message,
          };
        }
      });

      await Promise.all(batchPromises);

      // Add delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    console.log(
      `Global coupon sent to ${sentCount} users, ${failedCount} failed`
    );

    return {
      success: true,
      sentCount,
      failedCount,
      totalUsers: users.length,
      failedEmails: failedEmails.slice(0, 10), // Return first 10 failures only
      message: `Sent to ${sentCount} of ${users.length} users`,
    };
  } catch (error) {
    console.error("Error sending global coupon to all users:", error);
    return {
      success: false,
      error: error.message,
      sentCount: 0,
    };
  }
};

export const sendGlobalCouponEmail = async ({
  to,
  coupon,
  userName,
  settings,
}) => {
  const subject = `🎁 ${settings.storeName}: ${coupon.discountPercentage}% OFF Everything!`;
  const greeting = userName ? `Hi ${userName},` : "Hello,";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Exclusive Store-Wide Discount!</h1>
        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Valid for all registered customers</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          ${greeting}<br><br>
          As a valued member of ${
            settings.storeName
          }, we're excited to offer you an exclusive store-wide discount!
        </p>
        
        <!-- Coupon Box -->
        <div style="background: linear-gradient(135deg, #fff9c4, #ffecb3); border: 2px dashed #ff9800; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
          <div style="font-size: 14px; color: #ff5722; font-weight: bold; margin-bottom: 10px;">YOUR DISCOUNT CODE</div>
          <div style="font-size: 36px; font-weight: bold; color: #333; letter-spacing: 3px; font-family: monospace; margin: 15px 0;">
            ${coupon.code}
          </div>
          <div style="font-size: 24px; color: #e53935; font-weight: bold; margin: 10px 0;">
            ${coupon.discountPercentage}% OFF
          </div>
          <div style="font-size: 14px; color: #666;">
            Valid until: ${new Date(coupon.expirationDate).toLocaleDateString()}
          </div>
        </div>
        
        <!-- How to use -->
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">How to Redeem:</h3>
          <ol style="margin: 0; padding-left: 20px; color: #555;">
            <li>Browse our collection at <a href="${
              process.env.CLIENT_URL
            }" style="color: #667eea;">${process.env.CLIENT_URL}</a></li>
            <li>Add items to your cart</li>
            <li>At checkout, enter code: <strong>${coupon.code}</strong></li>
            <li>Enjoy your ${coupon.discountPercentage}% discount!</li>
          </ol>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}"
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">
            🛒 Start Shopping Now
          </a>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 5px 0;">
            <strong>${settings.storeName}</strong><br>
            ${
              settings.supportEmail
                ? `Need help? Email us at ${settings.supportEmail}`
                : ""
            }
          </p>
          <p style="margin: 15px 0 5px; font-size: 12px; color: #999;">
            You're receiving this email because you're a registered customer of ${
              settings.storeName
            }.<br>
            <a href="${
              process.env.CLIENT_URL
            }/profile/notifications" style="color: #667eea;">Update notification preferences</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
${settings.storeName} - Exclusive Discount!

${greeting}

As a valued member of ${
    settings.storeName
  }, we're excited to offer you an exclusive store-wide discount!

DISCOUNT CODE: ${coupon.code}
SAVE: ${coupon.discountPercentage}% OFF
VALID UNTIL: ${new Date(coupon.expirationDate).toLocaleDateString()}

How to use:
1. Visit ${process.env.CLIENT_URL}
2. Add items to your cart
3. At checkout, enter code: ${coupon.code}
4. Enjoy ${coupon.discountPercentage}% off your entire order!

Shop now: ${process.env.CLIENT_URL}

This offer is available to all our registered customers. Thank you for being part of our community!

${settings.storeName}
${settings.supportEmail ? `Contact: ${settings.supportEmail}` : ""}

You're receiving this email because you're a registered customer.
Update preferences: ${process.env.CLIENT_URL}/profile/notifications
  `.trim();

  await sendEmail({
    to,
    subject,
    html,
    text,
  });
};