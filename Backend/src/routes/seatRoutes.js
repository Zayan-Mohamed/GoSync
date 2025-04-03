// src/routes/seatRoutes.js
import express from "express";
import {
  getSeatLayout,
  reserveSeats,
  checkSeatAvailability,
  cancelSeatBooking,
  monitorSeatOccupancy,
  getUserReservedSeats,
} from "../controllers/seatController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:busId/schedule/:scheduleId/seats", protect, getSeatLayout);
router.post("/:busId/schedule/:scheduleId/reserve", protect, reserveSeats);
router.get("/:busId/schedule/:scheduleId/availability", protect, checkSeatAvailability);
router.delete("/cancel/:bookingId", protect, cancelSeatBooking);
router.get("/:busId/schedule/:scheduleId/occupancy", protect, monitorSeatOccupancy);
router.get("/reserved/user", protect, getUserReservedSeats);

export default router;