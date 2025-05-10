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
  verifyQRCode,
  getQRCode,
  cancelIndividualSeats,
} from "../controllers/bookingController.js";

const router = express.Router();

router.post("/:busId/schedule/:scheduleId/reserve", protect, reserveSeats);
router.post("/confirm", protect, confirmBooking);
router.get("/summary/:userId", protect, getBookingSummary);
router.post("/verifyQRCode", protect, verifyQRCode);
router.post("/send-confirmation-email", protect, sendBookingConfirmationEmail);
router.get("/user", protect, getUserBookings);
router.post("/cancel", protect, cancelBooking);
router.post("/cancel-seats", protect, cancelIndividualSeats);
router.post("/update-payment", protect, updatePayment);
router.get("/getQRCode/:bookingId", protect, getQRCode);

export default router;
