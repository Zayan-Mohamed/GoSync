// filepath: /c:/Users/Zayan Mohamed/Documents/ProjectReact/GoSync/Backend/src/routes/seatRoutes.js
import express from "express";
import {
  checkSeatAvailability,
  bookSeats,
  cancelBooking,
  monitorSeatOccupancy,
} from "../controllers/seatController.js";

const router = express.Router();

router.get("/availability/:busId", checkSeatAvailability);
router.post("/book", bookSeats);
router.delete("/cancel/:bookingId", cancelBooking);
router.get("/occupancy/:busId", monitorSeatOccupancy); // Add this line

export default router;

