import express from "express";
import { registerAdmin } from "../controllers/adminController.js";
import {
  registerUser,
  authUser,
  updateUser,
  logout,
  getUserProfile,
  changePassword,
  updateNotificationPreferences,
  getSecurityLog,
  uploadProfileImage,
  getProfileImageBase64, // Add the new controller
} from "../controllers/userController.js"; // ✅ Import login function
import { protect, adminOnly } from "../middlewares/authMiddleware.js"; // ✅ Middleware for security
import { profileImageUpload } from "../utils/fileUpload.js";

const router = express.Router();

router.post("/register", registerUser); // Normal passenger registration
router.post("/admin/register", protect, adminOnly, registerAdmin); // ✅ Admin registration
router.post("/login", authUser); // ✅ Added login route
router.put("/update", protect, updateUser); // Update user profile
router.post("/logout", logout);

// New advanced user settings routes
router.get("/profile", protect, getUserProfile);
router.post("/change-password", protect, changePassword);
router.put("/notification-preferences", protect, updateNotificationPreferences);
router.get("/security-log", protect, getSecurityLog);

// Profile image upload route
router.post(
  "/upload-profile-image",
  protect,
  profileImageUpload.single("profileImage"),
  uploadProfileImage
);

// New route to get Base64 version of profile image
router.get("/profile-image-base64", protect, getProfileImageBase64);

export default router;
