import Booking from "../models/booking.js";
import generateBookingId from "../utils/generateBookingId.js";

export const bookSeat = async (req, res) => {
  const { passengerId, busId, seatNumber } = req.body;

  try {
    // Check if the seat is already booked
    const existingBooking = await Booking.findOne({ bus: busId, seatNumber, status: "booked" });

    if (existingBooking) {
      return res.status(400).json({ message: "Seat is already booked" });
    }

    // Generate unique booking ID
    const bookingId = generateBookingId();

    // Create new booking
    const booking = await Booking.create({
      bookingId,
      passenger: passengerId,
      bus: busId,
      seatNumber,
      status: "booked",
    });

    res.status(201).json({
      message: "Seat booked successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
