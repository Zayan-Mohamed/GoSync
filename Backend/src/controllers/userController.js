import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body; // ✅ Added phone

  // ✅ Validate input fields
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // ✅ Ensure phone is numeric
  if (isNaN(phone)) {
    return res.status(400).json({ message: "Phone number must be a valid number" });
  }

  // ✅ Check if user already exists by email or phone
  const userExists = await User.findOne({ $or: [{ email }, { phone }] });
  if (userExists) {
    return res.status(400).json({ message: "Email or phone number already in use" });
  }

  // ✅ Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // ✅ Always assign "passenger" role unless created by an admin
  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: "passenger",
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;

  // Check if the user exists
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" }), // ✅ Generate JWT
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};
