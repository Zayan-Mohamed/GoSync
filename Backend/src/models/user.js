import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: Number,
      required: true, // ✅ Make phone number mandatory
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "passenger"], // ✅ Role can only be "admin" or "passenger"
      default: "passenger"
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
