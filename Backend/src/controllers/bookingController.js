import Booking from "../models/bookingModel.js";
import Bus from "../models/bus.js";
import Seat from "../models/seatModel.js";
import Route from "../models/routeModel.js";
import nodemailer from "nodemailer";
import { createQRPayload, generateQRCode, verifyQRPayload } from "../utils/qr.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export const confirmBooking = async (req, res) => {
  const { busId, scheduleId, seatNumbers } = req.body;
  const userId = req.user.id;

  console.log("Confirm booking request:", { busId, scheduleId, seatNumbers, userId });

  try {
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const route = await Route.findOne({ routeId: bus.routeId });
    if (!route) return res.status(404).json({ message: "Route not found for this bus" });

    const seats = await Seat.find({
      busId,
      scheduleId,
      seatNumber: { $in: seatNumbers },
    });

    console.log("Seats state before confirmation:", seats);

    if (seats.length !== seatNumbers.length) {
      console.log("Invalid seat numbers requested:", seatNumbers);
      return res.status(400).json({ message: "Invalid seat numbers" });
    }

    const unavailable = seats.some(
      (seat) => {
        const isReserved = seat.reservedUntil && new Date(seat.reservedUntil) > new Date();
        const isReservedByOther = isReserved && seat.reservedBy && seat.reservedBy.toString() !== userId;
        return seat.isBooked || isReservedByOther;
      }
    );
    if (unavailable) {
      console.log("Seats unavailable:", seats);
      return res.status(400).json({ message: "Some seats are already booked or reserved by another user" });
    }

    const fareTotal = seatNumbers.length * bus.fareAmount;
    const bookingId = `BKG-${Date.now()}`;

    const qrPayload = createQRPayload({ bookingId, userId, busId, scheduleId, seatNumbers });
    const qrImage = await generateQRCode(qrPayload);

    const booking = await Booking.create({
      userId,
      busId,
      scheduleId,
      seats: seats.map((seat) => seat._id),
      fareTotal,
      bookingId,
      status: "confirmed",
      paymentStatus: "pending",
      qrCode: qrImage,
      qrPayload,
    });

    await Seat.updateMany(
      { _id: { $in: seats.map((s) => s._id) } },
      { $set: { isBooked: true, bookingId: booking._id, reservedUntil: null, reservedBy: null } }
    );

    const summary = {
      bookingId: booking.bookingId,
      passengerName: req.user.name,
      email: req.user.email,
      busRoute: bus.busRouteNumber,
      busNumber: bus.busNumber,
      from: route.startLocation,
      to: route.endLocation,
      seatNumbers: seats.map((seat) => seat.seatNumber),
      fareTotal: booking.fareTotal,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      bookedAt: booking.createdAt.toLocaleString(),
      qrCode: qrImage,
    };

    const updatedSeats = await Seat.find({ busId, scheduleId });
    const io = req.app.get("io");
    if (io) {
      io.to(`${busId}-${scheduleId}`).emit("seatUpdate", { seats: updatedSeats });
      console.log(`Seat update emitted: ${busId}-${scheduleId}`);
    }

    res.status(200).json({ message: "Booking confirmed", bookingId: booking.bookingId, summary });
  } catch (error) {
    console.error("Error in confirmBooking:", error);
    res.status(500).json({ message: "Booking failed", error: error.message });
  }
};

export const getQRCode = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  try {
    const booking = await Booking.findOne({ bookingId, userId });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!booking.qrCode) return res.status(404).json({ message: "QR code not available" });
    console.log("Returning QR data for:", { bookingId, qrPayload: booking.qrPayload });
    res.status(200).json({ qrCode: booking.qrCode, qrPayload: booking.qrPayload });
  } catch (error) {
    console.error("Error fetching QR code:", error);
    res.status(500).json({ message: "Failed to fetch QR code", error: error.message });
  }
};

export const sendBookingConfirmationEmail = async (req, res) => {
  const { bookingId } = req.body;
  const userId = req.user.id;

  try {
    const booking = await Booking.findOne({ bookingId, userId })
      .populate("busId")
      .populate("userId", "name email")
      .populate("seats", "seatNumber");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const route = await Route.findOne({ routeId: booking.busId.routeId });
    if (!route) return res.status(404).json({ message: "Route not found" });

    const qrImage = booking.qrCode;

    if (!qrImage.startsWith("data:image/png;base64,")) {
      console.error("Invalid QR code format:", qrImage.substring(0, 50));
      throw new Error("Failed to generate valid QR code image");
    }

    const base64Content = qrImage.split("base64,")[1];
    if (!base64Content) {
      console.error("Failed to extract Base64 content from QR image");
      throw new Error("Invalid QR code Base64 content");
    }

    const emailContent = `
      <h2>GoSync Booking Confirmation</h2>
      <p>Dear ${booking.userId.name},</p>
      <p>Thank you for booking with GoSync! Here are your booking details:</p>
      <ul>
        <li><strong>Booking ID:</strong> ${booking.bookingId}</li>
        <li><strong>Bus Number:</strong> ${booking.busId.busNumber}</li>
        <li><strong>Route:</strong> ${booking.busId.busRouteNumber} (${route.startLocation} to ${route.endLocation})</li>
        <li><strong>Seats:</strong> ${booking.seats.map((seat) => seat.seatNumber).join(", ")}</li>
        <li><strong>Total Fare:</strong> $${booking.fareTotal}</li>
        <li><strong>Status:</strong> ${booking.status}</li>
        <li><strong>Payment Status:</strong> ${booking.paymentStatus}</li>
        <li><strong>Booked At:</strong> ${booking.createdAt.toLocaleString()}</li>
      </ul>
      <p>Scan the QR code below to validate your ticket:</p>
      <img src="cid:qrCode@${booking.bookingId}" alt="Booking QR Code" style="max-width: 200px;" />
      <p>Please find the QR code attached as <strong>qr-${booking.bookingId}.png</strong> for offline use.</p>
      <p>Best regards,<br>The GoSync Team</p>
    `;

    const mailOptions = {
      from: `"GoSync Team" <${process.env.EMAIL_USER}>`,
      to: booking.userId.email,
      subject: `Your Booking Confirmation - ${booking.bookingId}`,
      html: emailContent,
      attachments: [
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
      ],
    };

    console.log("Sending email with attachments:", {
      inline: mailOptions.attachments[0].filename,
      attachment: mailOptions.attachments[1].filename,
      base64Length: base64Content.length,
    });

    await transporter.sendMail(mailOptions);

    console.log(`Email sent to ${booking.userId.email} with QR code inline and attached`);
    res.status(200).json({ message: "Booking confirmation email sent with QR code" });
  } catch (error) {
    console.error("Error in sendBookingConfirmationEmail:", error);
    res.status(500).json({ message: "Error sending email", error: error.message });
  }
};

export const verifyQRCode = async (req, res) => {
  const { bookingId, issuedAt, signature } = req.body;

  console.log("Verifying QR code:", { bookingId, issuedAt, signature });
  console.log("Requesting user ID:", req.user.id);
  console.log("Hitting verifyQRCode endpoint");

  try {
    const payload = { bookingId, issuedAt, signature };
    const isValid = verifyQRPayload(payload);
    if (!isValid) {
      console.log("Signature verification failed. Expected:", generateSignature({ bookingId, issuedAt }));
      return res.status(400).json({ message: "Invalid QR code" });
    }

    const booking = await Booking.findOne({ bookingId })
      .populate("busId")
      .populate("seats", "seatNumber");
    if (!booking) {
      console.log("Booking not found:", bookingId);
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.status !== "confirmed" || (booking.paymentStatus !== "paid" && booking.paymentStatus !== "completed")) {
      console.log("Invalid booking status:", { status: booking.status, paymentStatus: booking.paymentStatus });
      return res.status(400).json({ message: "Invalid or cancelled booking" });
    }

    const issuedAtDate = new Date(issuedAt);
    const isExpired = Date.now() - issuedAtDate.getTime() > 24 * 60 * 60 * 1000; // 24 hours
    if (isExpired) {
      console.log("QR code expired:", { issuedAt, now: new Date().toISOString() });
      return res.status(400).json({ message: "QR code expired, please validate online" });
    }

    const route = await Route.findOne({ routeId: booking.busId.routeId });
    const summary = {
      bookingId: booking.bookingId,
      busNumber: booking.busId.busNumber,
      busRoute: booking.busId.busRouteNumber,
      from: route ? route.startLocation : "Unknown",
      to: route ? route.endLocation : "Unknown",
      seatNumbers: booking.seats.map((seat) => seat.seatNumber),
      fareTotal: booking.fareTotal,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      bookedAt: booking.createdAt.toLocaleString(),
    };

    res.status(200).json({ message: "QR code valid", summary });
  } catch (error) {
    console.error("Error verifying QR code:", error);
    res.status(500).json({ message: "Error verifying QR code", error: error.message });
  }
};

export const updatePayment = async (req, res) => {
  const { bookingId, paymentStatus } = req.body;
  const userId = req.user.id;

  console.log("Update payment request:", { bookingId, paymentStatus, userId });

  try {
    const validStatuses = ["pending", "paid", "failed"];
    if (!validStatuses.includes(paymentStatus)) {
      console.log("Invalid paymentStatus:", paymentStatus);
      return res.status(400).json({ message: `Invalid payment status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const booking = await Booking.findOne({ bookingId, userId })
      .populate("busId")
      .populate("userId", "name email")
      .populate("seats", "seatNumber");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.paymentStatus === "paid" || booking.paymentStatus === "completed") {
      return res.status(400).json({ message: "Payment already completed" });
    }

    await Booking.updateOne({ bookingId }, { paymentStatus });

    const route = await Route.findOne({ routeId: booking.busId.routeId });
    if (!route) return res.status(404).json({ message: "Route not found" });

    const qrImage = booking.qrCode;

    if (!qrImage.startsWith("data:image/png;base64,")) {
      console.error("Invalid QR code format:", qrImage.substring(0, 50));
      throw new Error("Failed to generate valid QR code image");
    }

    const base64Content = qrImage.split("base64,")[1];
    if (!base64Content) {
      console.error("Failed to extract Base64 content from QR image");
      throw new Error("Invalid QR code Base64 content");
    }

    const emailContent = `
      <h2>GoSync Payment Confirmation</h2>
      <p>Dear ${booking.userId.name},</p>
      <p>Your payment for booking ${booking.bookingId} has been successfully processed!</p>
      <ul>
        <li><strong>Booking ID:</strong> ${booking.bookingId}</li>
        <li><strong>Bus Number:</strong> ${booking.busId.busNumber}</li>
        <li><strong>Route:</strong> ${booking.busId.busRouteNumber} (${route.startLocation} to ${route.endLocation})</li>
        <li><strong>Seats:</strong> ${booking.seats.map((seat) => seat.seatNumber).join(", ")}</li>
        <li><strong>Total Fare:</strong> $${booking.fareTotal}</li>
        <li><strong>Payment Status:</strong> ${paymentStatus}</li>
        <li><strong>Booked At:</strong> ${booking.createdAt.toLocaleString()}</li>
      </ul>
      <p>Scan the QR code below to validate your ticket:</p>
      <img src="cid:qrCode@${booking.bookingId}" alt="Booking QR Code" style="max-width: 200px;" />
      <p>Please find the QR code attached as <strong>qr-${booking.bookingId}.png</strong> for offline use.</p>
      <p>Thank you for choosing GoSync!<br>Best regards,<br>The GoSync Team</p>
    `;

    const mailOptions = {
      from: `"GoSync Team" <${process.env.EMAIL_USER}>`,
      to: booking.userId.email,
      subject: `Payment Confirmation - ${booking.bookingId}`,
      html: emailContent,
      attachments: [
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
      ],
    };

    console.log("Sending payment confirmation email with attachments:", {
      inline: mailOptions.attachments[0].filename,
      attachment: mailOptions.attachments[1].filename,
      base64Length: base64Content.length,
    });

    await transporter.sendMail(mailOptions);

    console.log(`Payment confirmation email sent to ${booking.userId.email} with QR code`);
    res.status(200).json({ message: "Payment status updated and confirmation email sent with QR code" });
  } catch (error) {
    console.error("Error updating payment or sending email:", error);
    res.status(500).json({ message: "Failed to update payment or send email", error: error.message });
  }
};

// Other functions unchanged (omitted for brevity)
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
      .populate("busId", "busRouteNumber busNumber fareAmount")
      .populate("userId", "name email")
      .populate("seats", "seatNumber");

    if (!bookings.length) {
      console.log("No bookings found for user:", userId);
      return res.status(404).json({ message: "No bookings found for this user" });
    }

    console.log("Bookings found:", bookings);

    const summaries = await Promise.all(
      bookings.map(async (booking) => {
        const route = await Route.findOne({ routeId: booking.busId.routeId });
        return {
          bookingId: booking.bookingId,
          passengerName: booking.userId.name,
          email: booking.userId.email,
          busRoute: booking.busId.busRouteNumber,
          busNumber: booking.busId.busNumber,
          from: route ? route.startLocation : "Unknown",
          to: route ? route.endLocation : "Unknown",
          seatNumbers: booking.seats.map((seat) => seat.seatNumber),
          fareTotal: booking.fareTotal,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          bookedAt: booking.createdAt.toLocaleString(),
        };
      })
    );

    res.status(200).json({ summary: summaries });
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
    const seats = await Seat.find({
      busId,
      scheduleId,
      seatNumber: { $in: seatNumbers },
    });

    if (seats.length !== seatNumbers.length) {
      console.log("Invalid seats:", { requested: seatNumbers, found: seats.map((s) => s.seatNumber) });
      return res.status(400).json({ message: "Invalid seat numbers" });
    }

    if (release) {
      const canRelease = seats.every(
        (seat) =>
          seat.reservedUntil &&
          new Date(seat.reservedUntil) > new Date() &&
          seat.reservedBy?.toString() === userId
      );
      if (!canRelease) {
        console.log("Cannot release seats:", seats);
        return res.status(400).json({ message: "Seat(s) not reserved by you or already booked" });
      }

      await Seat.updateMany(
        { _id: { $in: seats.map((s) => s._id) } },
        { $set: { reservedUntil: null, reservedBy: null } }
      );
      console.log("Seats released");

      const updatedSeats = await Seat.find({ busId, scheduleId });
      const io = req.app.get("io");
      if (io) {
        io.to(`${busId}-${scheduleId}`).emit("seatUpdate", { seats: updatedSeats });
        console.log(`Seat update emitted after release: ${busId}-${scheduleId}`);
      }

      return res.status(200).json({ message: "Seats released" });
    }

    const unavailable = seats.some(
      (seat) =>
        seat.isBooked ||
        (seat.reservedUntil && new Date(seat.reservedUntil) > new Date() && seat.reservedBy?.toString() !== userId)
    );
    if (unavailable) {
      console.log("Seats unavailable:", seats);
      return res.status(400).json({ message: "Seat(s) unavailable" });
    }

    await Seat.updateMany(
      { _id: { $in: seats.map((s) => s._id) } },
      { $set: { 
        reservedUntil: new Date(Date.now() + 15 * 60 * 1000), 
        reservedBy: userId 
      } }
    );
    console.log("Seats reserved for user:", userId);

    const updatedSeats = await Seat.find({ busId, scheduleId });
    const io = req.app.get("io");
    if (io) {
      io.to(`${busId}-${scheduleId}`).emit("seatUpdate", { seats: updatedSeats });
      console.log(`Seat update emitted after reserve: ${busId}-${scheduleId}`);
    }

    res.status(200).json({ message: "Seats reserved" });
  } catch (error) {
    console.error("Error in reserveSeats:", error);
    res.status(500).json({ message: "Error processing seats" });
  }
};

export const getUserReservedSeats = async (req, res) => {
  const userId = req.user.id;

  try {
    const reservedSeats = await Seat.find({
      reservedUntil: { $gt: new Date() },
      reservedBy: userId,
    })
      .populate({
        path: "busId",
        select: "busNumber routeId",
        populate: {
          path: "routeId",
          model: "Route",
          select: "startLocation endLocation",
        },
      });

    const grouped = reservedSeats.reduce((acc, seat) => {
      const key = `${seat.busId._id}-${seat.scheduleId}`;
      if (!acc[key]) {
        acc[key] = {
          busId: seat.busId._id.toString(),
          scheduleId: seat.scheduleId.toString(),
          busNumber: seat.busId.busNumber,
          from: seat.busId.routeId?.startLocation || "Unknown",
          to: seat.busId.routeId?.endLocation || "Unknown",
          seatNumbers: [],
          reservedUntil: seat.reservedUntil,
        };
      }
      acc[key].seatNumbers.push(seat.seatNumber);
      return acc;
    }, {});

    const result = Object.values(grouped);
    console.log("Reserved seats for user:", result);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching reserved seats:", error);
    res.status(500).json({ message: "Failed to fetch reserved seats" });
  }
};

export const bookSeats = async (req, res) => {
  return res.status(400).json({ message: "Use /reserve and /confirm endpoints instead" });
};

export const cancelBooking = async (req, res) => {
  const { bookingId } = req.body;
  const userId = req.user.id;

  console.log("Cancel booking request:", { bookingId, userId });

  try {
    const booking = await Booking.findOne({ bookingId, userId })
      .populate("busId", "busNumber busRouteNumber routeId")
      .populate("userId", "name email")
      .populate("seats", "seatNumber");

    if (!booking) {
      console.log("Booking not found:", { bookingId, userId });
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.status !== "confirmed") {
      console.log("Cannot cancel booking with status:", booking.status);
      return res.status(400).json({ message: "Cannot cancel this booking" });
    }

    await Booking.updateOne({ bookingId }, { status: "cancelled" });

    await Seat.updateMany(
      { bookingId: booking._id },
      { $set: { isBooked: false, bookingId: null, reservedUntil: null } }
    );

    const updatedSeats = await Seat.find({
      busId: booking.busId,
      scheduleId: booking.scheduleId,
    });
    const io = req.app.get("io");
    if (io) {
      io.to(`${booking.busId}-${booking.scheduleId}`).emit("seatUpdate", {
        seats: updatedSeats,
      });
      console.log(`Seat update emitted: ${booking.busId}-${booking.scheduleId}`);
    }

    const route = await Route.findOne({ routeId: booking.busId.routeId });
    const from = route ? route.startLocation : "Unknown";
    const to = route ? route.endLocation : "Unknown";

    const emailContent = `
      <h2>GoSync Booking Cancellation Confirmation</h2>
      <p>Dear ${booking.userId.name},</p>
      <p>Your booking with GoSync has been successfully cancelled. Below are the details:</p>
      <ul>
        <li><strong>Booking ID:</strong> ${booking.bookingId}</li>
        <li><strong>Bus Number:</strong> ${booking.busId.busNumber}</li>
        <li><strong>Route:</strong> ${booking.busId.busRouteNumber} (${from} to ${to})</li>
        <li><strong>Seats:</strong> ${booking.seats.map((seat) => seat.seatNumber).join(", ")}</li>
        <li><strong>Total Fare:</strong> Rs. ${booking.fareTotal}</li>
        <li><strong>Status:</strong> Cancelled</li>
        <li><strong>Cancelled At:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>We’re sorry to see you go! If you have any questions, feel free to contact us.</p>
      <p>Best regards,<br>The GoSync Team</p>
    `;

    await transporter.sendMail({
      from: `"GoSync Team" <${process.env.EMAIL_USER}>`,
      to: booking.userId.email,
      subject: `Booking Cancellation Confirmation - ${booking.bookingId}`,
      html: emailContent,
    });

    console.log(`Cancellation email sent to ${booking.userId.email}`);
    res.status(200).json({ message: "Booking cancelled and confirmation email sent" });
  } catch (error) {
    console.error("Error cancelling booking or sending email:", error);
    res.status(500).json({ message: "Failed to cancel booking or send email", error: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  const userId = req.user.id;

  console.log("Fetching bookings for user:", userId);

  try {
    const bookings = await Booking.find({ userId }).lean();
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const bus = await Bus.findById(booking.busId);
        const route = await Route.findOne({ routeId: bus.routeId });
        return {
          ...booking,
          from: route.startLocation,
          to: route.endLocation,
          seatNumbers: (await Seat.find({ _id: { $in: booking.seats } })).map(
            (s) => s.seatNumber
          ),
          bookedAt: booking.createdAt,
        };
      })
    );
    console.log("Enriched bookings sent:", enrichedBookings);
    res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};
