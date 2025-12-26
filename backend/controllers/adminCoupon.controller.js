import Coupon from "../models/coupon.model.js";

export const createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(coupon);
};

export const getAllCoupons = async (req, res) => {
  const coupons = await Coupon.find()
    .populate("userId", "email")
    .sort({ createdAt: -1 });
console.log("coupon called")
  res.json(coupons);
  console.log("coupon called");
};

export const updateCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(coupon);
};

export const toggleCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  coupon.isActive = !coupon.isActive;
  await coupon.save();

  res.json(coupon);
};
