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

const router = express.Router();

// ✅ Public Routes
router.post("/search-buses", searchBuses); // Public route
router.get("/buses", protect, getAllBuses); // Get all buses (Requires authentication)
router.get("/buses/:id", protect, getBusById); // Get a bus by ID
router.get("/buses/route/:routeId", protect, getBusesByRoute); // Get buses by route
router.get("/buses/travel/:travelName", protect, getBusesByTravelName); // Get buses by travel name

// ✅ Admin-Only Routes
router.get("/unassigned", protect, adminOnly, getUnassignedBuses);
router.post("/", protect, adminOnly, createBus); // Create a bus
router.put("/buses/:id", protect, adminOnly, updateBus); // Update a bus by ID
router.delete("/buses/:id", protect, adminOnly, deleteBus); // Delete a bus by ID

export default router;
