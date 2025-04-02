// src/controllers/seatController.js
import Bus from "../models/bus.js";
import Seat from "../models/seatModel.js";

export const getSeatLayout = async (req, res) => {
  const { busId, scheduleId } = req.params;

  try {
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    console.log(`Bus capacity for ${busId}: ${bus.capacity}`);

    let seats = await Seat.find({ busId, scheduleId });
    console.log(`Existing seats found: ${seats.length}`);

    if (seats.length < bus.capacity) {
      const existingSeatNumbers = new Set(seats.map((seat) => seat.seatNumber));
      const newSeats = [];

      for (let i = 1; i <= bus.capacity; i++) {
        const seatNumber = `S${i}`;
        if (!existingSeatNumbers.has(seatNumber)) {
          newSeats.push({
            seatNumber,
            busId,
            scheduleId,
            isBooked: false,
            reservedUntil: null,
            bookingId: null, // Explicitly null, no booking yet
          });
        }
      }

      if (newSeats.length > 0) {
        console.log(`Creating ${newSeats.length} new seats`);
        await Seat.insertMany(newSeats);
        seats = await Seat.find({ busId, scheduleId });
      }
    }

    console.log(`Returning ${seats.length} seats`);
    res.json(seats);
  } catch (error) {
    console.error("Error in getSeatLayout:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const reserveSeats = async (req, res) => {
  const { busId, scheduleId } = req.params;
  const { seatNumbers } = req.body;
  const io = req.app.get("io");

  try {
    const seats = await Seat.find({
      busId,
      scheduleId,
      seatNumber: { $in: seatNumbers },
    });

    if (seats.length !== seatNumbers.length) {
      return res.status(400).json({ message: "Invalid seat numbers" });
    }

    for (const seat of seats) {
      if (seat.isBooked || (seat.reservedUntil && seat.reservedUntil > new Date())) {
        return res.status(400).json({ message: `Seat ${seat.seatNumber} unavailable` });
      }
      seat.reservedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes reservation
      seat.isBooked = false; // Ensure the seat is not booked yet
    }

    await Promise.all(seats.map((seat) => seat.save()));

    const availableSeats = await Seat.countDocuments({
      busId,
      scheduleId,
      isBooked: false,
      $or: [{ reservedUntil: null }, { reservedUntil: { $lt: new Date() } }],
    });

    const room = `${busId}-${scheduleId}`;
    io.to(room).emit("seatUpdate", { busId, scheduleId, availableSeats });
    res.json({ message: "Seats reserved", reservedUntil: seats[0].reservedUntil });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const checkSeatAvailability = async (req, res) => {
  const { busId, scheduleId } = req.params;

  try {
    const seats = await Seat.find({ busId, scheduleId });
    const availableSeats = seats.filter(
      (seat) => !seat.isBooked && (!seat.reservedUntil || seat.reservedUntil < new Date())
    );

    res.status(200).json({ availableSeats });
  } catch (error) {
    res.status(500).json({ message: "Error fetching seat availability", error: error.message });
  }
};

export const cancelSeatBooking = async (req, res) => {
  const { bookingId } = req.params;
  const io = req.app.get("io");

  try {
    const seats = await Seat.find({ bookingId });
    if (!seats.length) {
      return res.status(404).json({ message: "Booking not found" });
    }

    for (const seat of seats) {
      seat.isBooked = false;
      seat.bookedBy = null;
      seat.bookingId = null;
      await seat.save();
    }

    const { busId, scheduleId } = seats[0];
    const availableSeats = await Seat.countDocuments({
      busId,
      scheduleId,
      isBooked: false,
      $or: [{ reservedUntil: null }, { reservedUntil: { $lt: new Date() } }],
    });

    io.emit("seatUpdate", { busId, scheduleId, availableSeats });
    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling booking", error: error.message });
  }
};

export const monitorSeatOccupancy = async (req, res) => {
  const { busId, scheduleId } = req.params;

  try {
    const seats = await Seat.find({ busId, scheduleId });

    const occupancy = {
      totalSeats: seats.length,
      bookedSeats: seats.filter((seat) => seat.isBooked).length,
      availableSeats: seats.filter(
        (seat) => !seat.isBooked && (!seat.reservedUntil || seat.reservedUntil < new Date())
      ).length,
    };

    res.status(200).json({ occupancy });
  } catch (error) {
    res.status(500).json({ message: "Error fetching seat occupancy", error: error.message });
  }
};