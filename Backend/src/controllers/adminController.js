import User from "../models/user.js";
import bcrypt from "bcryptjs";

import Seat from "../models/seatModel.js"
import Booking from "../models/bookingModel.js";
import Route from "../models/routeModel.js";
import Bus from "../models/bus.js";
import Schedule from "../models/scheduleModel.js";
import dotenv from "dotenv";
dotenv.config();


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
    role: "admin", //Ensure the role is "admin"
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
  const { busId, startDate, endDate } = req.query;
  try {
    const query = {};
    if (busId) query.busId = busId; // ObjectId

    const seats = await Seat.find(query).populate("busId", "busNumber travelName");
    const totalSeats = seats.length;
    const bookedSeats = seats.filter((s) => s.isBooked).length;
    const reservedSeats = seats.filter((s) => s.reservedUntil && new Date(s.reservedUntil) > new Date()).length;
    const availableSeats = totalSeats - bookedSeats;

    // Breakdown by bus
    const byBus = await Seat.aggregate([
      { $match: query },
      { $group: { _id: "$busId", total: { $sum: 1 }, booked: { $sum: { $cond: ["$isBooked", 1, 0] } } } },
      { $lookup: { from: "buses", localField: "_id", foreignField: "_id", as: "bus" } },
      { $unwind: "$bus" },
      { $project: { busNumber: "$bus.busNumber", total: 1, booked: 1, available: { $subtract: ["$total", "$booked"] } } },
    ]);

    // Avg reservation time
    const reservedDurations = seats
      .filter((s) => s.reservedUntil)
      .map((s) => (new Date(s.reservedUntil) - new Date()) / (1000 * 60));
    const avgReservationTime = reservedDurations.length
      ? (reservedDurations.reduce((a, b) => a + b, 0) / reservedDurations.length).toFixed(2)
      : 0;

    res.status(200).json({
      totalSeats,
      bookedSeats,
      reservedSeats,
      availableSeats,
      occupancyRate: totalSeats ? ((bookedSeats / totalSeats) * 100).toFixed(2) + "%" : "0%",
      byBus: byBus.length ? byBus : [],
      avgReservationTime,
    });
  } catch (error) {
    console.error("Error fetching seat analytics:", error.stack);
    res.status(500).json({ message: "Failed to fetch seat analytics", error: error.message });
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
  const { startDate, endDate, busId } = req.query;
  try {
    const match = { status: "confirmed" };
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
    if (busId) match.busId = busId;

    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });
    const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });

    // Revenue by bus
    const revenueByBus = await Booking.aggregate([
      { $match: match },
      { $group: { _id: "$busId", totalRevenue: { $sum: "$fareTotal" } } },
      { $lookup: { from: "buses", localField: "_id", foreignField: "_id", as: "bus" } },
      { $unwind: "$bus" },
      { $project: { busNumber: "$bus.busNumber", totalRevenue: 1 } },
    ]);

    // Bookings by day
    const bookingsByDay = await Booking.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Top routes (using bus.routeId as String)
    const topRoutes = await Booking.aggregate([
      { $match: match },
      { $lookup: { from: "buses", localField: "busId", foreignField: "_id", as: "bus" } },
      { $unwind: "$bus" },
      { $lookup: { from: "routes", localField: "bus.routeId", foreignField: "routeId", as: "route" } }, // String match
      { $unwind: "$route" },
      { $group: { _id: "$route.routeName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenue: (await Booking.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: "$fareTotal" } } }]))[0]?.total || 0,
      cancellationRate: totalBookings ? ((cancelledBookings / totalBookings) * 100).toFixed(2) + "%" : "0%",
      revenueByBus: revenueByBus.length ? revenueByBus : [],
      bookingsByDay: bookingsByDay.length ? bookingsByDay : [],
      topRoutes: topRoutes.length ? topRoutes : [],
    });
  } catch (error) {
    console.error("Error fetching booking analytics:", error.stack);
    res.status(500).json({ message: "Failed to fetch booking analytics", error: error.message });
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

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "name email");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find(); // Assuming a Schedule model exists
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Failed to fetch schedules" });
  }
};

// Get route by routeId (String) with populated stops
export const getRouteByRouteId = async (req, res) => {
  try {
    const { routeId } = req.query; // Use query param for flexibility
    if (!routeId) {
      return res.status(400).json({ error: "Route ID is required" });
    }

    const route = await Route.findOne({ routeId }).populate("stops.stop");
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    // Sort stops by order for consistent display
    const sortedRoute = route.toObject();
    sortedRoute.stops = sortedRoute.stops.sort((a, b) => a.order - b.order);

    res.status(200).json({ route: sortedRoute });
  } catch (error) {
    res.status(500).json({ error: "Error fetching route", details: error.message });
  }
};