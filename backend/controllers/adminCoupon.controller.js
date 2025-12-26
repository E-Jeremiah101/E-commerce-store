import Coupon from "../models/coupon.model.js";
import { generateCouponCode } from "../lib/AdminGenerateCoupon.js";
import storeSettings from "../models/storeSettings.model.js"
import User from "../models/user.model.js";
import { sendEmail } from "../lib/mailer.js";


export const createCoupon = async (req, res) => {
  try {
    const { discountPercentage, expirationDate, couponReason, userId } =
      req.body;

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
      userId: userId,
      isActive: true,
    });

    if (coupon.userId) {
      const user = await User.findById(coupon.userId);
      if (user?.email) {
        await sendCouponEmail({ to: user.email, coupon });
      }
    }

    res.status(201).json(coupon);
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Server error" });
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

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


export const toggleCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  coupon.isActive = !coupon.isActive;
  await coupon.save();

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
