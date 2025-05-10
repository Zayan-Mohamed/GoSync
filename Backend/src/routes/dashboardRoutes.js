import express from "express";
import {
  getDashboardStats,
  getSystemHealth,
  getFilteredDashboardStats,
} from "../controllers/dashboardController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protect all dashboard routes for admin access only
router.use(protect);
router.use(adminOnly);

// Dashboard routes
router.get("/", getFilteredDashboardStats); // Add new period-filtered route
router.get("/stats", getDashboardStats);
router.get("/health", getSystemHealth);

export default router;
