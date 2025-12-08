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

const previousPasswordSchema = new mongoose.Schema({
  password: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "firstname is required"],
    },
    lastname: {
      type: String,
      required: [true, "lastname is required"],
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
    previousPasswords: [previousPasswordSchema],
    passwordHistoryLimit: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },

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
    const hashedPassword = await bcrypt.hash(this.password, salt);

     if (!this.isNew) {
       // Get the current password before updating
       const currentPassword = this.password;

       this.previousPasswords.push({
         password: currentPassword,
         changedAt: new Date(),
       });

       if (this.previousPasswords.length > this.passwordHistoryLimit) {
         this.previousPasswords = this.previousPasswords.slice(
           -this.passwordHistoryLimit
         );
       }
     }
     this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};
userSchema.methods.isPasswordUsedBefore = async function (newPassword) {
  // Check if it's the same as current password
  const isCurrentPassword = await bcrypt.compare(newPassword, this.password);
  if (isCurrentPassword) return true;

  for (const previousPassword of this.previousPasswords) {
    const isMatch = await bcrypt.compare(
      newPassword,
      previousPassword.password
    );
    if (isMatch) return true;
  }

  return false;
};


userSchema.methods.getPasswordHistoryAge = function () {
  if (this.previousPasswords.length === 0) return null;

  const oldestPassword = this.previousPasswords.reduce((oldest, current) => {
    return current.changedAt < oldest.changedAt ? current : oldest;
  });

  const ageInDays = Math.floor(
    (new Date() - oldestPassword.changedAt) / (1000 * 60 * 60 * 24)
  );

  return {
    oldestChange: oldestPassword.changedAt,
    ageInDays,
  };
};


const User = mongoose.model("User", userSchema);

export default User;
