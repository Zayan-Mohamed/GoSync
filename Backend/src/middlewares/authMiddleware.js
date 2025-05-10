import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";


dotenv.config();

export const protect = async (req, res, next) => {
  const token = req.cookies.jwt; // Match the cookie name 'jwt'

  if (!token) {
    console.error("No token provided in cookies");
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // Debug JWT payload

    // Fetch user from database to include phone, name, and email
    const user = await User.findById(decoded.id).select("name email phone role");
    if (!user) {
      console.error("User not found for ID:", decoded.id);
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    console.log("req.user set:", req.user); // Debug req.user

    next();
  } catch (error) {
    console.error("Token verification failed:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    console.error("Admin access denied for user:", req.user);
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
};
