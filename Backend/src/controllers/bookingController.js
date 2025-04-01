import Booking from "../models/bookingModel.js";
import Bus from "../models/bus.js";
import Seat from "../models/seatModel.js";
import generateBookingId from "../utils/generateBookingId.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export const confirmBooking = async (req, res) => {
  const { busId, scheduleId, seatNumbers } = req.body;
  const userId = req.user.id;

  console.log("Confirming booking with:", { busId, scheduleId, seatNumbers, userId });

  try {
    const bus = await Bus.findById(busId);
    if (!bus) {
      console.log("Bus not found:", busId);
      return res.status(404).json({ message: "Bus not found" });
    }

    console.log("Bus found:", bus);

    const seats = await Seat.find({
      busId,
      scheduleId,
      seatNumber: { $in: seatNumbers },
    });
    console.log("Seats queried:", seats);

    if (seats.length !== seatNumbers.length) {
      console.log("Seat mismatch:", { requested: seatNumbers, found: seats.map(s => s.seatNumber) });
      return res.status(400).json({ message: "Some seats are unavailable" });
    }

    const allReservedOrBooked = seats.every(
      (seat) => seat.isBooked || (seat.reservedUntil && new Date(seat.reservedUntil) > new Date())
    );
    if (!allReservedOrBooked) {
      console.log("Seats not reserved/booked:", seats);
      return res.status(400).json({ message: "Seats must be reserved before confirming" });
    }

    const fareTotal = seats.length * bus.fareAmount;
    const bookingId = `BKG-${Date.now()}`;

    const booking = await Booking.create({
      bookingId,
      userId,
      busId, // Matches schema
      scheduleId, // Matches schema
      seats: seats.map((s) => s._id),
      fareTotal,
      status: "confirmed",
      paymentStatus: "paid",
    });
    console.log("Booking created:", booking);

    await Seat.updateMany(
      { _id: { $in: seats.map((s) => s._id) } },
      { isBooked: true, reservedUntil: null }
    );
    console.log("Seats updated to booked");

    res.status(200).json({ message: "Booking confirmed", bookingId });
  } catch (error) {
    console.error("Error in confirmBooking:", error);
    res.status(500).json({ message: "Error confirming booking", error: error.message });
  }
};


export const getBookingSummary = async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user.id;

  console.log("Fetching summary for:", { userId, requestingUserId });

  try {
    if (userId !== requestingUserId) {
      console.log("Unauthorized access attempt");
      return res.status(403).json({ message: "Unauthorized" });
    }

    const bookings = await Booking.find({ userId })
      .populate("busId", "routeNumber startLocation endLocation fareAmount")
      .populate("userId", "name email")
      .populate("seats", "seatNumber");

    if (!bookings.length) {
      console.log("No bookings found for user:", userId);
      return res.status(404).json({ message: "No bookings found for this user" });
    }

    console.log("Bookings found:", bookings);

    const summary = bookings.map((booking) => ({
      bookingId: booking.bookingId,
      passengerName: booking.userId.name,
      email: booking.userId.email,
      busRoute: booking.busId.routeNumber,
      from: booking.busId.startLocation,
      to: booking.busId.endLocation,
      seatNumbers: booking.seats.map((seat) => seat.seatNumber),
      fareTotal: booking.fareTotal,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      bookedAt: booking.createdAt.toLocaleString(),
    }));

    const latestBooking = summary[0];
    const emailContent = `
      <h2>GoSync Booking Summary</h2>
      <p>Dear ${latestBooking.passengerName},</p>
      <p>Thank you for booking with GoSync! Here are your latest booking details:</p>
      <ul>
        <li><strong>Booking ID:</strong> ${latestBooking.bookingId}</li>
        <li><strong>Route:</strong> ${latestBooking.busRoute} (${latestBooking.from} to ${latestBooking.to})</li>
        <li><strong>Seats:</strong> ${latestBooking.seatNumbers.join(", ")}</li>
        <li><strong>Total Fare:</strong> $${latestBooking.fareTotal}</li>
        <li><strong>Status:</strong> ${latestBooking.status}</li>
        <li><strong>Payment Status:</strong> ${latestBooking.paymentStatus}</li>
        <li><strong>Booked At:</strong> ${latestBooking.bookedAt}</li>
      </ul>
      <p>Best regards,<br>The GoSync Team</p>
    `;

    await transporter.sendMail({
      from: `"GoSync Team" <${process.env.EMAIL_USER}>`,
      to: latestBooking.email,
      subject: `Your Booking Summary - ${latestBooking.bookingId}`,
      html: emailContent,
    });

    console.log(`Email sent to ${latestBooking.email}`);
    res.status(200).json({ summary });
  } catch (error) {
    console.error("Error in getBookingSummary:", error);
    res.status(500).json({ message: "Error fetching summary", error: error.message });
  }
};


export const reserveSeats = async (req, res) => {
  const { busId, scheduleId } = req.params;
  const { seatNumbers, release } = req.body;
  const userId = req.user.id;

  console.log("Reserve/Release request:", { busId, scheduleId, seatNumbers, release, userId });

  try {
    const seats = await Seat.find({ busId, scheduleId, seatNumber: { $in: seatNumbers } });
    if (seats.length !== seatNumbers.length) {
      console.log("Invalid seats:", { requested: seatNumbers, found: seats.map(s => s.seatNumber) });
      return res.status(400).json({ message: "Invalid seat numbers" });
    }

    if (release) {
      const canRelease = seats.every(
        (seat) => seat.reservedUntil && new Date(seat.reservedUntil) > new Date()
      );
      if (!canRelease) {
        console.log("Cannot release seats:", seats);
        return res.status(400).json({ message: "Seat(s) not reserved or already booked" });
      }

      await Seat.updateMany(
        { _id: { $in: seats.map((s) => s._id) } },
        { reservedUntil: null }
      );
      console.log("Seats released");
      return res.status(200).json({ message: "Seats released" });
    }

    const unavailable = seats.some(
      (seat) => seat.isBooked || (seat.reservedUntil && new Date(seat.reservedUntil) > new Date())
    );
    if (unavailable) {
      console.log("Seats unavailable:", seats);
      return res.status(400).json({ message: "Seat(s) unavailable" });
    }

    await Seat.updateMany(
      { _id: { $in: seats.map((s) => s._id) } },
      { reservedUntil: new Date(Date.now() + 10 * 60 * 1000) }
    );
    console.log("Seats reserved");
    res.status(200).json({ message: "Seats reserved" });
  } catch (error) {
    console.error("Error in reserveSeats:", error);
    res.status(500).json({ message: "Error processing seats" });
  }
};

export const bookSeats = async (req, res) => {
  return res.status(400).json({ message: "Use /reserve and /confirm endpoints instead" });
};


export const cancelBooking = async (req, res) => {
  const { bookingId } = req.body; // Changed to req.body for consistency
  const userId = req.user.id; // From protect middleware
  const io = req.app.get("io");

  try {
    const booking = await Booking.findOne({ bookingId, userId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found or not owned by user" });
    }

    const seats = await Seat.find({
      busId: booking.busId,
      scheduleId: booking.scheduleId,
      bookingId,
    });

    if (seats.length === 0) {
      return res.status(400).json({ message: "No seats found for this booking" });
    }

    // Revert seat status
    for (const seat of seats) {
      seat.isBooked = false;
      seat.bookedBy = null;
      seat.bookingId = null;
      seat.reservedUntil = null;
      await seat.save();
    }

    booking.status = "cancelled";
    booking.paymentStatus = "refunded"; // Or "cancelled" if no payment was processed
    await booking.save();

    const updatedSeats = await Seat.find({ busId: booking.busId, scheduleId: booking.scheduleId });
    if (io) {
      const room = `${booking.busId}-${booking.scheduleId}`;
      io.to(room).emit("seatUpdate", {
        busId: booking.busId,
        scheduleId: booking.scheduleId,
        seats: updatedSeats,
      });
    }

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error in cancelBooking:", error);
    res.status(500).json({ message: "Error cancelling booking", error: error.message });
  }
};