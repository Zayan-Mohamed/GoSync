import express from "express";
import { registerAdmin } from "../controllers/adminController.js";
import { registerUser, authUser, updateUser, logout } from "../controllers/userController.js"; // ✅ Import login function
import { protect, adminOnly } from "../middlewares/authMiddleware.js"; // ✅ Middleware for security

const router = express.Router();

router.post("/register", registerUser); // Normal passenger registration
router.post("/admin/register", protect, adminOnly, registerAdmin); // ✅ Admin registration
router.post("/login", authUser); // ✅ Added login route
router.put("/update", protect, updateUser); // Update user profile
router.post("/logout", logout); 

export default router;
