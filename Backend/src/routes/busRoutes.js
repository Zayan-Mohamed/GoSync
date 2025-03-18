import express from "express";
import {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus
} from "../controllers/busController.js";

const router = express.Router();

// CRUD Routes for Bus
router.post("/", createBus); // ✅ Correct way to define POST
router.get("/buses", getAllBuses); // Get all buses
router.get("/buses/:id", getBusById); // Get a bus by ID
router.put("/buses/:id", updateBus); // Update a bus by ID
router.delete("/buses/:id", deleteBus); // Delete a bus by ID

export default router;
