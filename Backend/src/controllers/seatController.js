import Seat from "../models/seatModel.js";

// ✅ Check seat availability for a bus
export const checkSeatAvailability = async (req, res) => {
  const { busId } = req.params;

  try {
    const seats = await Seat.find({ busId });
    const availableSeats = seats.filter((seat) => !seat.isBooked); // Filter out booked seats

    res.status(200).json({ availableSeats });
  } catch (error) {
    res.status(500).json({ message: "Error fetching seat availability", error: error.message });
  }
};

// ✅ Book multiple seats
export const bookSeats = async (req, res) => {
  const { busId, seatIds, userId } = req.body;

  try {
    // Fetch the seats from DB
    const seats = await Seat.find({ _id: { $in: seatIds }, busId });

    // Check if any seat is already booked
    const unavailableSeats = seats.filter((seat) => seat.isBooked);
    if (unavailableSeats.length > 0) {
      return res.status(400).json({ message: "One or more selected seats are already booked" });
    }

    // Mark seats as booked
    await Seat.updateMany(
      { _id: { $in: seatIds } },
      { $set: { isBooked: true, bookedBy: userId } }
    );

    res.status(200).json({ message: "Seats booked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error booking seats", error: error.message });
  }
};

// ✅ Cancel seat booking
export const cancelSeatBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const seat = await Seat.findOne({ bookingId });

    if (!seat) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Cancel the booking
    seat.isBooked = false;
    seat.bookedBy = null;
    await seat.save();

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling booking", error: error.message });
  }
};

// ✅ Monitor seat occupancy
export const monitorSeatOccupancy = async (req, res) => {
  const { busId } = req.params;

  try {
    const seats = await Seat.find({ busId });

    const occupancy = {
      totalSeats: seats.length,
      bookedSeats: seats.filter((seat) => seat.isBooked).length,
      availableSeats: seats.filter((seat) => !seat.isBooked).length,
    };

    res.status(200).json({ occupancy });
  } catch (error) {
    res.status(500).json({ message: "Error fetching seat occupancy", error: error.message });
  }
};
