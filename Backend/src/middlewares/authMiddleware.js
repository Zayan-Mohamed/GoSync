import jwt from "jsonwebtoken";
import User from "../models/user.js";
import dotenv from "dotenv";

dotenv.config();

export const protect = (req, res, next) => {
  const token = req.cookies.jwt; // Match the cookie name 'jwt' from authUser

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "76f0a6e8ca67cdbea757096541f87b4a82c0a8adba6dd3f32552a5a65dbafa356d693530cf6f6950e32f6b950b38d40dec538ca95b5125c9c1ada472d52dd836");
    req.user = decoded; // { id, role } from JWT payload
    console.log("Decoded user:", req.user); // Debug
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

// ✅ Middleware to allow only admins
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
};
