import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { nigeriaLocations } from "../../frontend/src/utils/nigeriaLocation.js";

const addressSchema = new mongoose.Schema({
  label: { type: String, default: "Home" },
  state: { type: String, required: true },
  city: { type: String, required: true },
  lga: { type: String, required: true },
  landmark: { type: String },
  address: { type: String },
  isDefault: { type: Boolean, default: false },
});

addressSchema.pre("validate", function (next) {
  const { state, city, lga } = this;
  const validState = nigeriaLocations[state];
  if (!validState) return next(new Error("Invalid state"));
  const validCity = validState.cities[city];
  if (!validCity) return next(new Error("Invalid city for selected state"));
  if (!validCity.includes(lga))
    return next(new Error("Invalid LGA for selected city"));
  next();
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    addresses: [
      {
        label: { type: String, default: "Home" },

        isDefault: { type: Boolean, default: false },
      },
    ],
    addresses: [addressSchema],

    phones: [
      {
        number: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    cartItems: [
      {
        quantity: {
          type: Number,
          default: 1,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        size: {
          type: String,
        },
        color: {
          type: String,
        },
      },
    ],
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password before saving to database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
