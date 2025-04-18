// src/routes/bookingRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  reserveSeats,
  confirmBooking,
  getBookingSummary,
  sendBookingConfirmationEmail,
  getUserBookings,
  cancelBooking,
  updatePayment,
} from "../controllers/bookingController.js";

const router = express.Router();

router.post("/:busId/schedule/:scheduleId/reserve", protect, reserveSeats);
router.post("/confirm", protect, confirmBooking);
router.get("/summary/:userId", protect, getBookingSummary);
router.post("/send-confirmation-email", protect, sendBookingConfirmationEmail);
router.get("/user", protect, getUserBookings);
router.post("/cancel", protect, cancelBooking);
router.post("/update-payment", protect, updatePayment);

export default router;
