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
  cancelBookingAdmin,
  cancelIndividualSeatsAdmin,
  updatePaymentStatusAdmin,
} from "../controllers/adminController.js"; // Import the new function
import * as seatController from "../controllers/seatController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Seat management routes
router.get("/seats", getAllSeats);
router.post("/seats", addSeat);
router.get("/seats/:seatId", seatController.getSeatById);
router.put("/seats/:seatId", seatController.updateSeat);
router.put("/seats/:seatId/status", seatController.updateSeatStatus);
router.delete("/seats/:seatId", seatController.deleteSeat);
router.post("/seats/bulk-update", seatController.bulkUpdateSeats);
router.post("/seats/bulk-delete", seatController.bulkDeleteSeats);

router.get("/users", getAllUsers);
router.get("/schedules", getAllSchedules);
router.get("/seat-analytics", getSeatAnalytics);
router.post("/bookings", addBooking);
router.get("/bookings", getAllBookings);
router.get("/booking-analytics", getBookingAnalytics);
router.get("/routes", getRouteByRouteId);
router.post("/bookings/cancel", protect, adminOnly, cancelBookingAdmin);
router.post(
  "/bookings/cancel-seats",
  protect,
  adminOnly,
  cancelIndividualSeatsAdmin
);
router.post(
  "/bookings/update-payment",
  protect,
  adminOnly,
  updatePaymentStatusAdmin
);

export default router;
