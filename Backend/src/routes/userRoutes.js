import express from "express";
import { registerUser, authUser } from "../controllers/userController.js";
import { registerAdmin } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { logoutUser } from "../controllers/userController.js";

const router = express.Router();

// Passenger registration & login
router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/logout", logoutUser);
// Admin-specific routes
router.post("/admin/register", protect, adminOnly, registerAdmin);

export default router;
