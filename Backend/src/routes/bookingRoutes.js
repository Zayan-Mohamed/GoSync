// src/routes/bookingRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { reserveSeats, confirmBooking, getBookingSummary } from "../controllers/bookingController.js";

const router = express.Router();

router.post("/:busId/schedule/:scheduleId/reserve", protect, reserveSeats);
router.post("/confirm", protect, confirmBooking);
router.get("/summary/:userId", protect, getBookingSummary);

export default router;