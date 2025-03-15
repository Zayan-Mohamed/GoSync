import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import bodyParser from "body-parser";

import userRoutes from "./routes/userRoutes.js"; // ✅ Import user routes
import notificationRoutes from "./routes/notificationRoutes.js"; // ✅ Import notification routes
import seatRoutes from "./routes/seatRoutes.js"; // ✅ Import seat routes
import bookingRoutes from "./routes/bookingRoutes.js"; // ✅ Import booking routes
import busRoutes from "./routes/busRoutes.js"; // ✅ Import bus routes


dotenv.config();
connectDB();

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Routes
app.use("/api/users", userRoutes); // User-related routes
app.use("/api/notifications", notificationRoutes); // Notification routes
app.use("/api/seats", seatRoutes); // Seat routes
app.use("/api/bookings", bookingRoutes); // Booking routes
app.use("/api/buses", busRoutes); // Bus routes

const PORT = process.env.PORT || 5000;

// ✅ Start the server AFTER defining routes
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
