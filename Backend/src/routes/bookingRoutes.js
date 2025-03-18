import express from "express";
import { bookSeats } from "../controllers/bookingController.js";
import { protect } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

// Passenger books a seat
router.post("/book", protect, bookSeats);

export default router;
