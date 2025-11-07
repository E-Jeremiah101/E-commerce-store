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

// GET all users (for admin)
export const getAllUsers = async (req, res) => {
  try {
     const { role, search } = req.query;
     const query = {};

     if (role) query.role = role;
     if (search){
       query.$or = [
         { firstname: new RegExp(search, "i") },
         { lastname: new RegExp(search, "i") },
         { email: new RegExp(search, "i") },
         //  { _id: new RegExp(search, "i") },
       ];
        // If search looks like a MongoDB ObjectId (24 hex characters), add it directly
      if (/^[0-9a-fA-F]{24}$/.test(search)) {
        query.$or.push({ _id: search });
      }
    }

     const users = await User.find(query)
       .populate("cartItems.product", "name price images")
       .select("-password");
       

     res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//  Promote user to admin
export const makeAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = "admin";
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: `${user.firstname} is now an admin`, user });
  } catch (err) {
    console.error("Error promoting user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = user.role === "admin" ? "customer" : "admin"; // toggle role
    await user.save();

    res.json({ message: `User role updated to ${user.role}`, user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating role", error: error.message });
  }
};