import User from "../models/user.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

import Seat from "../models/seatModel.js";
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
    res
      .status(500)
      .json({ message: "Failed to fetch seats", error: error.message });
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

    const seats = await Seat.find(query).populate(
      "busId",
      "busNumber travelName"
    );
    const totalSeats = seats.length;
    const bookedSeats = seats.filter((s) => s.isBooked).length;
    const reservedSeats = seats.filter(
      (s) => s.reservedUntil && new Date(s.reservedUntil) > new Date()
    ).length;
    const availableSeats = totalSeats - bookedSeats;

    // Breakdown by bus
    const byBus = await Seat.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$busId",
          total: { $sum: 1 },
          booked: { $sum: { $cond: ["$isBooked", 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "buses",
          localField: "_id",
          foreignField: "_id",
          as: "bus",
        },
      },
      { $unwind: "$bus" },
      {
        $project: {
          busNumber: "$bus.busNumber",
          total: 1,
          booked: 1,
          available: { $subtract: ["$total", "$booked"] },
        },
      },
    ]);

    // Avg reservation time
    const reservedDurations = seats
      .filter((s) => s.reservedUntil)
      .map((s) => (new Date(s.reservedUntil) - new Date()) / (1000 * 60));
    const avgReservationTime = reservedDurations.length
      ? (
          reservedDurations.reduce((a, b) => a + b, 0) /
          reservedDurations.length
        ).toFixed(2)
      : 0;

    res.status(200).json({
      totalSeats,
      bookedSeats,
      reservedSeats,
      availableSeats,
      occupancyRate: totalSeats
        ? ((bookedSeats / totalSeats) * 100).toFixed(2) + "%"
        : "0%",
      byBus: byBus.length ? byBus : [],
      avgReservationTime,
    });
  } catch (error) {
    console.error("Error fetching seat analytics:", error.stack);
    res.status(500).json({
      message: "Failed to fetch seat analytics",
      error: error.message,
    });
  }
};

export const cancelIndividualSeatsAdmin = async (req, res) => {
  const { bookingId, seatNumbers } = req.body;

  try {
    // Validate input
    if (
      !bookingId ||
      !seatNumbers ||
      !Array.isArray(seatNumbers) ||
      seatNumbers.length === 0
    ) {
      return res.status(400).json({
        message:
          "Invalid request data. Booking ID and seat numbers are required.",
      });
    }

    // Find the booking
    const booking = await Booking.findOne({ bookingId })
      .populate("busId", "busNumber busRouteNumber routeId fareAmount")
      .populate("userId", "name email notificationPreferences")
      .populate("seats", "seatNumber");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message: "Cannot cancel seats from a booking that is not confirmed",
      });
    }

    // Find the seats to cancel
    const seatsToCancel = await Seat.find({
      bookingId: booking._id,
      seatNumber: { $in: seatNumbers },
      isBooked: true,
    });

    if (seatsToCancel.length === 0) {
      return res
        .status(404)
        .json({ message: "No matching seats found in this booking" });
    }

    if (seatsToCancel.length !== seatNumbers.length) {
      return res.status(400).json({
        message: "Some seat numbers were not found in this booking",
        foundSeats: seatsToCancel.map((s) => s.seatNumber),
      });
    }

    // Calculate refund amount
    const refundAmount = seatsToCancel.length * booking.busId.fareAmount;

    // Check if all seats in the booking are being cancelled
    if (seatsToCancel.length === booking.seats.length) {
      // Cancel the entire booking
      await Booking.updateOne({ bookingId }, { status: "cancelled" });

      // Release all seats
      await Seat.updateMany(
        { bookingId: booking._id },
        {
          $set: {
            isBooked: false,
            bookingId: null,
            reservedUntil: null,
            reservedBy: null,
          },
        }
      );
    } else {
      // Update booking to remove the cancelled seats and adjust fare
      await Booking.updateOne(
        { bookingId },
        {
          $pull: { seats: { $in: seatsToCancel.map((seat) => seat._id) } },
          $set: { fareTotal: booking.fareTotal - refundAmount },
        }
      );

      // Release only the cancelled seats
      await Seat.updateMany(
        { _id: { $in: seatsToCancel.map((seat) => seat._id) } },
        {
          $set: {
            isBooked: false,
            bookingId: null,
            reservedUntil: null,
            reservedBy: null,
          },
        }
      );
    }

    // Get updated seats for websocket notification
    const updatedSeats = await Seat.find({
      busId: booking.busId._id,
      scheduleId: booking.scheduleId,
    });

    // Send websocket update
    const io = req.app.get("io");
    if (io) {
      io.to(`${booking.busId._id}-${booking.scheduleId}`).emit("seatUpdate", {
        seats: updatedSeats,
      });
      console.log(
        `Seat update emitted after admin seat cancellation: ${booking.busId._id}-${booking.scheduleId}`
      );
    }

    // Get route information for notifications
    const route = await Route.findOne({ routeId: booking.busId.routeId });
    const from = route ? route.startLocation : "Unknown";
    const to = route ? route.endLocation : "Unknown";

    // Get cancelled seat numbers for notification
    const canceledSeatNumbers = seatsToCancel.map((seat) => seat.seatNumber);

    // Send notification email to user if they have email notifications enabled
    const user = booking.userId;
    if (user && user.notificationPreferences?.email) {
      const isFullCancellation = seatsToCancel.length === booking.seats.length;

      const emailContent = `
        <h2>GoSync ${
          isFullCancellation ? "Booking" : "Seat"
        } Cancellation Notice</h2>
        <p>Dear ${user.name},</p>
        <p>${
          isFullCancellation
            ? "Your booking with GoSync has been cancelled by an administrator."
            : "Some seats from your booking with GoSync have been cancelled by an administrator."
        }</p>
        <ul>
          <li><strong>Booking ID:</strong> ${booking.bookingId}</li>
          <li><strong>Bus Number:</strong> ${booking.busId.busNumber}</li>
          <li><strong>Route:</strong> ${
            booking.busId.busRouteNumber
          } (${from} to ${to})</li>
          <li><strong>${
            isFullCancellation ? "Cancelled Seats" : "Seats Cancelled"
          }:</strong> ${canceledSeatNumbers.join(", ")}</li>
          <li><strong>Refund Amount:</strong> Rs. ${refundAmount}</li>
          <li><strong>Cancelled At:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        ${
          !isFullCancellation
            ? `<p>Your booking still contains the following seats: ${booking.seats
                .filter(
                  (seat) => !seatsToCancel.some((s) => s._id.equals(seat._id))
                )
                .map((seat) => seat.seatNumber)
                .join(", ")}</p>`
            : ""
        }
        <p>If you have any questions about this cancellation, please contact our customer service.</p>
        <p>Best regards,<br>The GoSync Team</p>
      `;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"GoSync Team" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `${
          isFullCancellation ? "Booking" : "Seat"
        } Cancellation Notice - ${booking.bookingId}`,
        html: emailContent,
      });

      console.log(
        `Seat cancellation email sent to ${user.email} by admin action`
      );
    }

    res.status(200).json({
      message:
        `${canceledSeatNumbers.length} seat(s) cancelled successfully` +
        (user && user.notificationPreferences?.email
          ? " and notification sent to user"
          : ""),
      canceledSeats: canceledSeatNumbers,
      refundAmount: refundAmount,
      isFullBookingCancelled: seatsToCancel.length === booking.seats.length,
    });
  } catch (error) {
    console.error("Error in admin seat cancellation:", error);
    res.status(500).json({
      message: "Failed to cancel seats",
      error: error.message,
    });
  }
};

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
        busId,
        scheduleId,
        availableSeats: await Seat.countDocuments({
          busId,
          scheduleId,
          isBooked: false,
          $or: [
            { reservedUntil: null },
            { reservedUntil: { $lt: new Date() } },
          ],
        }),
      });
    }

    res.status(201).json({
      message: "Booking added",
      booking: {
        ...booking._doc,
        seats: await Seat.find({ busId, scheduleId }),
      },
    });
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
    if (endDate)
      match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
    if (busId) match.busId = busId;

    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({
      status: "confirmed",
    });
    const cancelledBookings = await Booking.countDocuments({
      status: "cancelled",
    });

    // Revenue by bus
    const revenueByBus = await Booking.aggregate([
      { $match: match },
      { $group: { _id: "$busId", totalRevenue: { $sum: "$fareTotal" } } },
      {
        $lookup: {
          from: "buses",
          localField: "_id",
          foreignField: "_id",
          as: "bus",
        },
      },
      { $unwind: "$bus" },
      { $project: { busNumber: "$bus.busNumber", totalRevenue: 1 } },
    ]);

    // Bookings by day
    const bookingsByDay = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top routes (using bus.routeId as String)
    const topRoutes = await Booking.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      { $unwind: "$bus" },
      {
        $lookup: {
          from: "routes",
          localField: "bus.routeId",
          foreignField: "routeId",
          as: "route",
        },
      }, // String match
      { $unwind: "$route" },
      { $group: { _id: "$route.routeName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      totalRevenue:
        (
          await Booking.aggregate([
            { $match: match },
            { $group: { _id: null, total: { $sum: "$fareTotal" } } },
          ])
        )[0]?.total || 0,
      cancellationRate: totalBookings
        ? ((cancelledBookings / totalBookings) * 100).toFixed(2) + "%"
        : "0%",
      revenueByBus: revenueByBus.length ? revenueByBus : [],
      bookingsByDay: bookingsByDay.length ? bookingsByDay : [],
      topRoutes: topRoutes.length ? topRoutes : [],
    });
  } catch (error) {
    console.error("Error fetching booking analytics:", error.stack);
    res.status(500).json({
      message: "Failed to fetch booking analytics",
      error: error.message,
    });
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
    res
      .status(500)
      .json({ error: "Error fetching route", details: error.message });
  }
};

export const cancelBookingAdmin = async (req, res) => {
  const { bookingId } = req.body;

  try {
    // Find the booking first to get associated information
    const booking = await Booking.findOne({ bookingId })
      .populate("busId", "busNumber busRouteNumber routeId")
      .populate("userId", "name email notificationPreferences")
      .populate("seats", "seatNumber");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Update booking status
    await Booking.updateOne({ bookingId }, { status: "cancelled" });

    // Release the seats
    await Seat.updateMany(
      { bookingId: booking._id },
      {
        $set: {
          isBooked: false,
          bookingId: null,
          reservedUntil: null,
          reservedBy: null,
        },
      }
    );

    // Update seats in real-time using the websocket
    const updatedSeats = await Seat.find({
      busId: booking.busId._id,
      scheduleId: booking.scheduleId,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`${booking.busId._id}-${booking.scheduleId}`).emit("seatUpdate", {
        seats: updatedSeats,
      });
      console.log(
        `Seat update emitted after admin cancellation: ${booking.busId._id}-${booking.scheduleId}`
      );
    }

    // Get route information for the email notification
    const route = await Route.findOne({ routeId: booking.busId.routeId });
    const from = route ? route.startLocation : "Unknown";
    const to = route ? route.endLocation : "Unknown";

    // Send cancellation email to user if they have email notifications enabled
    const user = booking.userId;
    if (user && user.notificationPreferences?.email) {
      const emailContent = `
        <h2>GoSync Booking Cancellation Notice</h2>
        <p>Dear ${user.name},</p>
        <p>Your booking with GoSync has been cancelled by an administrator. Here are the details:</p>
        <ul>
          <li><strong>Booking ID:</strong> ${booking.bookingId}</li>
          <li><strong>Bus Number:</strong> ${booking.busId.busNumber}</li>
          <li><strong>Route:</strong> ${
            booking.busId.busRouteNumber
          } (${from} to ${to})</li>
          <li><strong>Seats:</strong> ${booking.seats
            .map((seat) => seat.seatNumber)
            .join(", ")}</li>
          <li><strong>Total Fare:</strong> Rs. ${booking.fareTotal}</li>
          <li><strong>Status:</strong> Cancelled</li>
          <li><strong>Cancelled At:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>If you have any questions about this cancellation, please contact our customer service.</p>
        <p>Best regards,<br>The GoSync Team</p>
      `;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"GoSync Team" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Booking Cancellation Notice - ${booking.bookingId}`,
        html: emailContent,
      });

      console.log(`Cancellation email sent to ${user.email} by admin action`);
    }

    res.status(200).json({
      message:
        "Booking cancelled successfully by admin" +
        (user && user.notificationPreferences?.email
          ? " and notification sent to user"
          : ""),
    });
  } catch (error) {
    console.error("Error in admin booking cancellation:", error);
    res.status(500).json({
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
};

export const updatePaymentStatusAdmin = async (req, res) => {
  const { bookingId, paymentStatus } = req.body;

  try {
    const validStatuses = ["pending", "paid", "failed", "completed"];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        message: `Invalid payment status. Must be one of: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    const booking = await Booking.findOne({ bookingId })
      .populate("busId")
      .populate("userId", "name email notificationPreferences")
      .populate("seats", "seatNumber");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await Booking.updateOne({ bookingId }, { paymentStatus });

    // Get route information for email notifications
    const route = await Route.findOne({ routeId: booking.busId.routeId });

    // Send email notification to the user if they have email notifications enabled
    const user = booking.userId;
    if (user && user.notificationPreferences?.email) {
      const qrImage = booking.qrCode;

      if (qrImage && qrImage.startsWith("data:image/png;base64,")) {
        const base64Content = qrImage.split("base64,")[1];

        const emailContent = `
          <h2>GoSync Payment Status Update</h2>
          <p>Dear ${user.name},</p>
          <p>The payment status for your booking (${
            booking.bookingId
          }) has been updated by an administrator to: <strong>${paymentStatus}</strong></p>
          <ul>
            <li><strong>Booking ID:</strong> ${booking.bookingId}</li>
            <li><strong>Bus Number:</strong> ${booking.busId.busNumber}</li>
            <li><strong>Route:</strong> ${booking.busId.busRouteNumber} (${
          route ? route.startLocation : "Unknown"
        } to ${route ? route.endLocation : "Unknown"})</li>
            <li><strong>Seats:</strong> ${booking.seats
              .map((seat) => seat.seatNumber)
              .join(", ")}</li>
            <li><strong>Total Fare:</strong> Rs. ${booking.fareTotal}</li>
            <li><strong>Payment Status:</strong> ${paymentStatus}</li>
          </ul>
          ${
            paymentStatus === "paid" || paymentStatus === "completed"
              ? `
          <p>Scan the QR code below to validate your ticket:</p>
          <img src="cid:qrCode@${booking.bookingId}" alt="Booking QR Code" style="max-width: 200px;" />
          <p>Please find the QR code attached as <strong>qr-${booking.bookingId}.png</strong> for offline use.</p>
          `
              : ""
          }
          <p>Thank you for choosing GoSync!<br>Best regards,<br>The GoSync Team</p>
        `;

        const mailOptions = {
          from: `"GoSync Team" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: `Payment Status Updated - ${booking.bookingId}`,
          html: emailContent,
        };

        // Add QR code attachments only if payment is paid or completed
        if (paymentStatus === "paid" || paymentStatus === "completed") {
          mailOptions.attachments = [
            {
              filename: `qr-${booking.bookingId}-inline.png`,
              content: Buffer.from(base64Content, "base64"),
              contentType: "image/png",
              cid: `qrCode@${booking.bookingId}`,
            },
            {
              filename: `qr-${booking.bookingId}.png`,
              content: Buffer.from(base64Content, "base64"),
              contentType: "image/png",
            },
          ];
        }

        await transporter.sendMail(mailOptions);
        console.log(`Payment status update email sent to ${user.email}`);
      }
    }

    res.status(200).json({
      message:
        "Payment status updated successfully" +
        (user.notificationPreferences?.email ? " and notification sent" : ""),
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      message: "Failed to update payment status",
      error: error.message,
    });
  }
};
