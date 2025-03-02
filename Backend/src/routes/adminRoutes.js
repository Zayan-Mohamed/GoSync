import express from "express";
import { registerAdmin } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Admin can create new admins
router.post("/register", protect, adminOnly, registerAdmin);

export default router;