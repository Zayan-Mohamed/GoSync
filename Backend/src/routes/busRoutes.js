import express from "express";
import {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  getBusesByRoute,
  getBusesByTravelName,
  searchBuses,
  getUnassignedBuses,
} from "../controllers/busController.js";

import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Set up storage for image files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/busImages/"); // Store in bus images folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bus-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// ✅ Admin-Only Routes
router.get("/unassigned", protect, adminOnly, getUnassignedBuses);
router.post("/", protect, adminOnly, createBus); // Create a bus with optional image
router.put("/buses/:id", protect, adminOnly, updateBus); // Update a bus by ID
router.delete("/buses/:id", protect, adminOnly, deleteBus); // Delete a bus by ID

// ✅ Public Routes
router.post("/search-buses", searchBuses); // Public route
router.get("/buses", protect, getAllBuses); // Get all buses (Requires authentication)
router.get("/buses/:id", protect, getBusById); // Get a bus by ID
router.get("/buses/route/:routeId", protect, getBusesByRoute); // Get buses by route
router.get("/buses/travel/:travelName", protect, getBusesByTravelName); // Get buses by travel name



export default router;
