import User from "../models/user.js";
import bcrypt from "bcryptjs";

export const registerAdmin = async (req, res) => {
  // Check if requester is an admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const { name, email, phone, password } = req.body;

  // Validate input fields
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if phone is a number
  if (isNaN(phone)) {
    return res.status(400).json({ message: "Phone number must be a valid number" });
  }

  // Check if user with email or phone already exists
  const userExists = await User.findOne({ $or: [{ email }, { phone }] });
  if (userExists) {
    return res.status(400).json({ message: "Email or phone number already in use" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new admin user
  const admin = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: "admin" // ✅ Ensure the role is "admin"
  });

  res.status(201).json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    role: admin.role
  });
};
