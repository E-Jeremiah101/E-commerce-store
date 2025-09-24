import User from "../models/user.model.js";

// GET profile
export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
};

// UPDATE profile (only phone & addresses)
export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) return res.status(404).json({ message: "User not found" });

  if (req.body.phones) user.phones = req.body.phones;
  if (req.body.addresses) user.addresses = req.body.addresses;

  await user.save();
  res.json({ message: "Profile updated", user });
};
