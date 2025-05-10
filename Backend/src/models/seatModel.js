// src/models/Seat.js
import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  seatNumber: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  reservedUntil: { type: Date },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Seat", seatSchema);
