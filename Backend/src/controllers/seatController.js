// src/controllers/seatController.js
import Bus from "../models/bus.js";
import Seat from "../models/seatModel.js";
import Route from "../models/routeModel.js";

export const getSeatById = async (req, res) => {
  const { seatId } = req.params;

  try {
    const seat = await Seat.findById(seatId).populate(
      "busId",
      "busNumber travelName"
    );

    if (!seat) {
      return res.status(404).json({ message: "Seat not found" });
    }

    res.status(200).json(seat);
  } catch (error) {
    console.error("Error fetching seat:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getSeatLayout = async (req, res) => {
  const { busId, scheduleId } = req.params;

  try {
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    console.log(`Bus capacity for ${busId}: ${bus.capacity}`);

    let seats = await Seat.find({ busId, scheduleId });
    console.log(`Existing seats found: ${seats.length}`);

    // CASE 1: If seats exceed capacity, we need to filter which ones to keep
    if (seats.length > bus.capacity) {
      console.log(
        `Need to reduce seats from ${seats.length} to ${bus.capacity}`
      );

      // First, separate seats into booked/reserved and available
      const bookedSeats = seats.filter(
        (seat) =>
          seat.isBooked ||
          (seat.reservedUntil && new Date(seat.reservedUntil) > new Date())
      );

      const availableSeats = seats.filter(
        (seat) =>
          !seat.isBooked &&
          (!seat.reservedUntil || new Date(seat.reservedUntil) <= new Date())
      );

      // If even the booked/reserved seats exceed capacity, we can't reduce
      if (bookedSeats.length > bus.capacity) {
        console.log(
          `Cannot reduce capacity: ${bookedSeats.length} seats are booked/reserved`
        );
        return res.status(400).json({
          message:
            "Cannot reduce capacity: too many seats are booked or reserved",
          currentCapacity: bus.capacity,
          bookedSeatsCount: bookedSeats.length,
        });
      }

      // Sort available seats by seatNumber to keep the lower-numbered ones
      availableSeats.sort((a, b) => {
        const numA = parseInt(a.seatNumber.replace(/\D/g, ""));
        const numB = parseInt(b.seatNumber.replace(/\D/g, ""));
        return numA - numB;
      });

      // Keep all booked seats plus as many available seats as needed to reach capacity
      const seatsToKeep = [
        ...bookedSeats,
        ...availableSeats.slice(0, bus.capacity - bookedSeats.length),
      ];

      // Find the seats to delete (those not in seatsToKeep)
      const seatsToDelete = availableSeats.slice(
        bus.capacity - bookedSeats.length
      );

      if (seatsToDelete.length > 0) {
        console.log(`Deleting ${seatsToDelete.length} excess seats`);
        const seatIdsToDelete = seatsToDelete.map((seat) => seat._id);
        await Seat.deleteMany({ _id: { $in: seatIdsToDelete } });
      }

      // Update our seats array to only include the ones we're keeping
      seats = seatsToKeep;
    }
    // CASE 2: If seats are fewer than capacity, create new ones (existing logic)
    else if (seats.length < bus.capacity) {
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
  const userId = req.user.id; // Add this to get the userId

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
      if (
        seat.isBooked ||
        (seat.reservedUntil && seat.reservedUntil > new Date())
      ) {
        return res
          .status(400)
          .json({ message: `Seat ${seat.seatNumber} unavailable` });
      }
      seat.reservedUntil = new Date(Date.now() + 15 * 60 * 1000);
      seat.reservedBy = userId; // Set the user who reserved it
      seat.isBooked = false;
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
    res.json({
      message: "Seats reserved",
      reservedUntil: seats[0].reservedUntil,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const checkSeatAvailability = async (req, res) => {
  const { busId, scheduleId } = req.params;

  try {
    const seats = await Seat.find({ busId, scheduleId });
    const availableSeats = seats.filter(
      (seat) =>
        !seat.isBooked &&
        (!seat.reservedUntil || seat.reservedUntil < new Date())
    );

    res.status(200).json({ availableSeats });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching seat availability",
      error: error.message,
    });
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
    res
      .status(500)
      .json({ message: "Error cancelling booking", error: error.message });
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
        (seat) =>
          !seat.isBooked &&
          (!seat.reservedUntil || seat.reservedUntil < new Date())
      ).length,
    };

    res.status(200).json({ occupancy });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching seat occupancy", error: error.message });
  }
};

export const getUserReservedSeats = async (req, res) => {
  const userId = req.user.id;

  try {
    console.log("Fetching reserved seats for userId:", userId);

    const reservedSeats = await Seat.find({
      reservedUntil: { $gt: new Date() },
      reservedBy: userId,
    }).populate("busId", "busNumber routeId");

    console.log("Raw reserved seats from DB:", reservedSeats);

    if (!reservedSeats.length) {
      console.log("No reserved seats found for user:", userId);
      return res.status(200).json([]);
    }

    const grouped = await Promise.all(
      reservedSeats.map(async (seat) => {
        const route = await Route.findOne({ routeId: seat.busId.routeId });
        return {
          busId: seat.busId._id.toString(),
          scheduleId: seat.scheduleId.toString(),
          busNumber: seat.busId.busNumber,
          from: route ? route.startLocation : "Unknown",
          to: route ? route.endLocation : "Unknown",
          seatNumbers: [seat.seatNumber],
          reservedUntil: seat.reservedUntil,
        };
      })
    );

    const result = Object.values(
      grouped.reduce((acc, curr) => {
        const key = `${curr.busId}-${curr.scheduleId}`;
        if (!acc[key]) {
          acc[key] = { ...curr, seatNumbers: [] };
        }
        acc[key].seatNumbers.push(...curr.seatNumbers);
        return acc;
      }, {})
    );

    console.log("Reserved seats for user:", result);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching reserved seats:", error);
    res.status(500).json({ message: "Failed to fetch reserved seats" });
  }
};

export const updateSeatStatus = async (req, res) => {
  const { seatId } = req.params;
  const { isDisabled } = req.body;

  try {
    const seat = await Seat.findById(seatId);
    if (!seat) {
      return res.status(404).json({ message: "Seat not found" });
    }

    // Can only disable/enable available seats
    if (
      seat.isBooked ||
      (seat.reservedUntil && seat.reservedUntil > new Date())
    ) {
      return res
        .status(400)
        .json({ message: "Cannot modify status of booked or reserved seats" });
    }

    seat.isDisabled = isDisabled;
    await seat.save();

    res.status(200).json({ message: "Seat status updated successfully", seat });
  } catch (error) {
    console.error("Error updating seat status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateSeat = async (req, res) => {
  const { seatId } = req.params;
  const { seatType, seatNumber, isDisabled } = req.body;

  try {
    const seat = await Seat.findById(seatId);
    if (!seat) {
      return res.status(404).json({ message: "Seat not found" });
    }

    // Don't allow modifying booked seats except for seatType
    if (
      (seat.isBooked ||
        (seat.reservedUntil && seat.reservedUntil > new Date())) &&
      (seatNumber !== undefined || isDisabled !== undefined)
    ) {
      return res
        .status(400)
        .json({ message: "Cannot fully modify booked or reserved seats" });
    }

    // Update fields if provided
    if (seatNumber !== undefined) seat.seatNumber = seatNumber;
    if (seatType !== undefined) seat.seatType = seatType;
    if (isDisabled !== undefined) seat.isDisabled = isDisabled;

    await seat.save();

    res.status(200).json({ message: "Seat updated successfully", seat });
  } catch (error) {
    console.error("Error updating seat:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteSeat = async (req, res) => {
  const { seatId } = req.params;

  try {
    const seat = await Seat.findById(seatId);
    if (!seat) {
      return res.status(404).json({ message: "Seat not found" });
    }

    // Cannot delete booked or reserved seats
    if (
      seat.isBooked ||
      (seat.reservedUntil && seat.reservedUntil > new Date())
    ) {
      return res
        .status(400)
        .json({ message: "Cannot delete booked or reserved seats" });
    }

    await Seat.findByIdAndDelete(seatId);

    res.status(200).json({ message: "Seat deleted successfully" });
  } catch (error) {
    console.error("Error deleting seat:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const bulkUpdateSeats = async (req, res) => {
  const { seatIds, updates } = req.body;

  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ message: "No seat IDs provided" });
  }

  try {
    // First check if any seats are booked/reserved and block update if necessary
    const seats = await Seat.find({ _id: { $in: seatIds } });

    const invalidSeats = seats.filter(
      (seat) =>
        (seat.isBooked ||
          (seat.reservedUntil && seat.reservedUntil > new Date())) &&
        (updates.seatNumber !== undefined || updates.isDisabled !== undefined)
    );

    if (invalidSeats.length > 0) {
      return res.status(400).json({
        message: `Cannot modify ${invalidSeats.length} booked or reserved seats`,
        invalidSeats: invalidSeats.map((s) => s.seatNumber),
      });
    }

    // Apply updates
    const updateResult = await Seat.updateMany(
      { _id: { $in: seatIds } },
      { $set: updates }
    );

    res.status(200).json({
      message: "Seats updated successfully",
      count: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const bulkDeleteSeats = async (req, res) => {
  const { seatIds } = req.body;

  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ message: "No seat IDs provided" });
  }

  try {
    // First check if any seats are booked/reserved
    const seats = await Seat.find({ _id: { $in: seatIds } });

    const invalidSeats = seats.filter(
      (seat) =>
        seat.isBooked || (seat.reservedUntil && seat.reservedUntil > new Date())
    );

    if (invalidSeats.length > 0) {
      return res.status(400).json({
        message: `Cannot delete ${invalidSeats.length} booked or reserved seats`,
        invalidSeats: invalidSeats.map((s) => s.seatNumber),
      });
    }

    // Delete seats
    const deleteResult = await Seat.deleteMany({ _id: { $in: seatIds } });

    res.status(200).json({
      message: "Seats deleted successfully",
      count: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error in bulk delete:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
