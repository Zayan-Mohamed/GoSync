import express from "express";
import Seat from "../models/seatModel.js"; // Assuming Seat is the model where seat info is stored

// Check seat availability for a bus
export const checkSeatAvailability = async (req, res) => {
  const { busId } = req.params;

  try {
    const seats = await Seat.find({ busId });
    const availableSeats = seats.filter((seat) => !seat.isBooked); // Filter out booked seats

    res.status(200).json({ availableSeats });
  } catch (error) {
    res.status(500).json({ message: "Error fetching seat availability" });
  }
};

export const bookSeats = async (req, res) => {
  const { busId, seatIds, userId } = req.body;

  try {
    const seats = await Seat.find({ _id: { $in: seatIds }, busId });

    const unavailableSeats = seats.filter((seat) => seat.isBooked);

    if (unavailableSeats.length > 0) {
      return res
        .status(400)
        .json({ message: "One or more seats are already booked" });
    }

    // Mark selected seats as booked
    await Seat.updateMany(
      { _id: { $in: seatIds } },
      { $set: { isBooked: true, bookedBy: userId } }
    );

    res.status(200).json({ message: "Seats booked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error booking seats" });
  }
};

export const cancelBooking = async (req, res) => {
    const { bookingId } = req.params;
  
    try {
      const seat = await Seat.findOne({ bookingId });
  
      if (!seat) {
        return res.status(404).json({ message: 'Booking not found' });
      }
  
      // Cancel the booking
      seat.isBooked = false;
      seat.bookedBy = null;
      await seat.save();
  
      // Process refund (mock for now)
      res.status(200).json({ message: 'Booking cancelled and refund processed' });
    } catch (error) {
      res.status(500).json({ message: 'Error cancelling booking' });
    }
  };

export const monitorSeatOccupancy = async (req, res) => {
    const { busId } = req.params;
  
    try {
      const seats = await Seat.find({ busId });
  
      const occupancy = {
        totalSeats: seats.length,
        bookedSeats: seats.filter(seat => seat.isBooked).length,
        availableSeats: seats.filter(seat => !seat.isBooked).length,
      };
  
      res.status(200).json({ occupancy });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching seat occupancy' });
    }
  };

  