import Booking from "../models/bookingModel.js";
// import Bus from "../models/busModel.js";
import generateBookingId from "../utils/generateBookingId.js";

// ✅ Create a booking (multiple seats allowed)
export const bookSeats = async (req, res) => {
  const { passengerId, busId, seatNumbers } = req.body; // seatNumbers = array

  try {
    // Check if any of the selected seats are already booked
    const existingBookings = await Booking.find({ bus: busId, seatNumber: { $in: seatNumbers }, status: "booked" });

    if (existingBookings.length > 0) {
      return res.status(400).json({ message: "One or more selected seats are already booked" });
    }

    // Get fare amount per seat
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    const farePerSeat = bus.fareAmount;
    const totalFare = farePerSeat * seatNumbers.length;

    // Create bookings for all selected seats
    const bookings = await Promise.all(seatNumbers.map(async (seatNumber) => {
      const bookingId = generateBookingId();
      return Booking.create({
        bookingId,
        passenger: passengerId,
        bus: busId,
        seatNumber,
        status: "booked",
      });
    }));

    res.status(201).json({
      message: "Seats booked successfully",
      totalFare,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get booking summary
export const getBookingSummary = async (req, res) => {
  const { passengerId } = req.params;

  try {
    const bookings = await Booking.find({ passenger: passengerId })
      .populate("bus", "routeNumber startLocation endLocation")
      .populate("passenger", "name email");

    if (!bookings.length) {
      return res.status(404).json({ message: "No bookings found for this user" });
    }

    const summary = bookings.map((booking) => ({
      passengerName: booking.passenger.name,
      email: booking.passenger.email,
      busRoute: booking.bus.routeNumber,
      from: booking.bus.startLocation,
      to: booking.bus.endLocation,
      seatNumber: booking.seatNumber,
      status: booking.status,
      bookedAt: booking.createdAt,
    }));

    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking summary", error: error.message });
  }
};

// ✅ Cancel a booking
export const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Mark as cancelled
    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling booking", error: error.message });
  }
};
