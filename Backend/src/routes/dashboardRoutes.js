import express from "express";
import {
  getDashboardStats,
  getSystemHealth,
} from "../controllers/dashboardController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protect all dashboard routes for admin access only
router.use(protect);
router.use(adminOnly);

// Dashboard routes
router.get("/stats", getDashboardStats);
router.get("/health", getSystemHealth);

export default router;
