import express from "express";
import { bookSeat } from "../controllers/bookingController.js";
import { protect } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

// Passenger books a seat
router.post("/book", protect, bookSeat);

export default router;
