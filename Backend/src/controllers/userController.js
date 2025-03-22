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
  console.log("Password before hashing:", password);
  // ✅ Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hashed Password before storing:", hashedPassword);

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

export const protect = async (req, res, next) => {
  let token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized, no token" });
  }

  try {
    token = token.split(" ")[1]; // Remove "Bearer "
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized, invalid token" });
  }
};


// ✅ Login user & set token in an HTTP-only cookie
export const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  // Generate token
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  // ✅ Store token in a secure HTTP-only cookie
  res.cookie("jwt", token, {
    httpOnly: true, // ✅ Prevents XSS attacks
    secure: process.env.NODE_ENV === "production", // ✅ Use only in HTTPS in production
    sameSite: "Strict", // ✅ Helps prevent CSRF
    maxAge: 30 * 24 * 60 * 60 * 1000, // ✅ Expires in 30 days
  });

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: token,
    
  });
};

// ✅ Logout User by Clearing the Cookie
export const logoutUser = async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0), // ✅ Expire immediately
  });
  res.json({ message: "Logged out successfully" });
};


