import express from "express";
import {
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
  archiveNotices,
  getNoticeStats,
  checkEditPermissions,
} from "../controllers/noticeController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes - anyone can view notices
router.get("/", getAllNotices);
router.get("/stats", getNoticeStats);
router.get("/:id", getNoticeById);

// Protected routes - need authentication
router.get("/:id/check-permissions", protect, checkEditPermissions);

// Create notice requires authentication (any authenticated user)
router.post("/", protect, createNotice);

// Update/delete/archive routes - protected but permission check happens in controller
router.put("/:id", protect, updateNotice);
router.delete("/:id", protect, deleteNotice);
router.post("/archive", protect, archiveNotices);

export default router;
