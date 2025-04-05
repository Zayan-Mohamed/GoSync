import express from "express";
import {
  getAllSeats,
  addSeat,
  getSeatAnalytics,
  addBooking,
  getBookingAnalytics,
  getAllBookings,
  getAllUsers,
  getAllSchedules,
  getRouteByRouteId,
} from "../controllers/adminController.js"; // Import the new functions
import { protect, adminOnly } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

router.get("/seats", getAllSeats);
router.get("/users", getAllUsers);
router.get("/schedules", getAllSchedules);
router.post("/seats", addSeat);
router.get("/seat-analytics", getSeatAnalytics);
router.post("/bookings", addBooking);
router.get("/bookings", getAllBookings);
router.get("/booking-analytics", getBookingAnalytics);
router.get("/routes", getRouteByRouteId);

export default router;
