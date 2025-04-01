// src/models/Seat.js
import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule",
    required: true,
  },
  isBooked: { type: Boolean, default: false },
  reservedUntil: { type: Date, default: null },
  bookingId: {
    type: String, // Changed to String to match generateBookingId output
    default: null,
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

const Seat = mongoose.model("Seat", seatSchema);
export default Seat;
