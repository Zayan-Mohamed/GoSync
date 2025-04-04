import User from "../models/user.js";
import bcrypt from "bcryptjs";

import Seat from "../models/seatModel.js"
import Booking from "../models/bookingModel.js";
import Route from "../models/routeModel.js";
import Bus from "../models/bus.js";

export const registerAdmin = async (req, res) => {
  // Check if requester is an admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  const { name, email, phone, password } = req.body;

  // Validate input fields
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if phone is a number
  if (isNaN(phone)) {
    return res
      .status(400)
      .json({ message: "Phone number must be a valid number" });
  }

  // Check if user with email or phone already exists
  const userExists = await User.findOne({ $or: [{ email }, { phone }] });
  if (userExists) {
    return res
      .status(400)
      .json({ message: "Email or phone number already in use" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new admin user
  const admin = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: "admin", // ✅ Ensure the role is "admin"
  });

  res.status(201).json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
  });
};

export const getAllSeats = async (req, res) => {
  const { busId, scheduleId } = req.query;
  console.log("Fetching seats with query:", { busId, scheduleId }); // Debug log

  try {
    const query = {};
    if (busId && busId.trim()) query.busId = busId; // Ensure non-empty
    if (scheduleId && scheduleId.trim()) query.scheduleId = scheduleId;

    console.log("Query constructed:", query); // Debug log

    const seats = await Seat.find(query).populate({
      path: "busId",
      select: "busNumber busRouteNumber",
      match: { _id: { $exists: true } }, // Ensure bus exists
    });

    console.log("Seats fetched:", seats.length); // Debug log
    res.status(200).json(seats);
  } catch (error) {
    console.error("Error fetching seats:", error.stack); // Full stack trace
    res.status(500).json({ message: "Failed to fetch seats", error: error.message });
  }
};

export const addSeat = async (req, res) => {
  const { busId, scheduleId, seatNumber } = req.body;
  try {
    const seat = await Seat.create({
      busId,
      scheduleId,
      seatNumber,
      isBooked: false,
    });
    res.status(201).json({ message: "Seat added", seat });
  } catch (error) {
    console.error("Error adding seat:", error);
    res.status(500).json({ message: "Failed to add seat" });
  }
};

export const getSeatAnalytics = async (req, res) => {
  try {
    const totalSeats = await Seat.countDocuments();
    const bookedSeats = await Seat.countDocuments({ isBooked: true });
    const reservedSeats = await Seat.countDocuments({
      reservedUntil: { $gt: new Date() },
    });
    const availableSeats = totalSeats - bookedSeats;

    const analytics = {
      totalSeats,
      bookedSeats,
      reservedSeats,
      availableSeats,
      occupancyRate: ((bookedSeats / totalSeats) * 100).toFixed(2) + "%",
    };
    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching seat analytics:", error);
    res.status(500).json({ message: "Failed to fetch seat analytics" });
  }
};

// Booking Management (Existing getAllBookings and cancelBookingAdmin remain)
export const addBooking = async (req, res) => {
  const { userId, busId, scheduleId, seatNumbers, fareTotal } = req.body;
  try {
    const seats = await Seat.find({
      busId,
      scheduleId,
      seatNumber: { $in: seatNumbers },
    });
    if (seats.length !== seatNumbers.length) {
      return res.status(400).json({ message: "Invalid seat numbers" });
    }
    if (
      seats.some(
        (s) =>
          s.isBooked ||
          (s.reservedUntil && new Date(s.reservedUntil) > new Date())
      )
    ) {
      return res.status(400).json({ message: "Some seats are unavailable" });
    }

    const bookingId = `BKG-${Date.now()}`;
    const booking = await Booking.create({
      userId,
      busId,
      scheduleId,
      seats: seats.map((s) => s._id),
      fareTotal,
      bookingId,
      status: "confirmed",
      paymentStatus: "pending",
    });

    await Seat.updateMany(
      { _id: { $in: seats.map((s) => s._id) } },
      {
        $set: {
          isBooked: true,
          bookingId: booking._id,
          reservedUntil: null,
          reservedBy: null,
        },
      }
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`${busId}-${scheduleId}`).emit("seatUpdate", {
        seats: await Seat.find({ busId, scheduleId }),
      });
    }

    res.status(200).json({ message: "Booking added", booking });
  } catch (error) {
    console.error("Error adding booking:", error);
    res.status(500).json({ message: "Failed to add booking" });
  }
};

export const getBookingAnalytics = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({
      status: "confirmed",
    });
    const cancelledBookings = await Booking.countDocuments({
      status: "cancelled",
    });
    const totalRevenue = await Booking.aggregate([
      { $match: { status: "confirmed", paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$fareTotal" } } },
    ]);

    const analytics = {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      cancellationRate:
        ((cancelledBookings / totalBookings) * 100).toFixed(2) + "%",
    };
    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching booking analytics:", error);
    res.status(500).json({ message: "Failed to fetch booking analytics" });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name email")
      .populate("busId", "busNumber busRouteNumber")
      .populate("seats", "seatNumber");
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const bus = await Bus.findById(booking.busId);
        const route = await Route.findOne({ routeId: bus.routeId });
        return {
          ...booking._doc,
          from: route.startLocation,
          to: route.endLocation,
          seatNumbers: booking.seats.map((s) => s.seatNumber),
        };
      })
    );
    res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};
