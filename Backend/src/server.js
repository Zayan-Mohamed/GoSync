// src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { setupWebSocket } from "./websocket.js";
import authRoutes from "./routes/authRoutes.js"; // Renamed from userRoutes for clarity
import notificationRoutes from "./routes/notificationRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import stopRoutes from "./routes/stopRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import busRoutes from "./routes/busRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import shedRoutes from "./routes/shedRoutes.js";
import busOperatorRoutes from "./routes/busOperatorRoutes.js";

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

// Setup WebSocket
const io = setupWebSocket(server);
app.set("io", io);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/auth", authRoutes); // Updated from /users to match authRoutes
app.use("/api/notifications", notificationRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/shed", shedRoutes);
app.use("/api/operator", busOperatorRoutes);

// Note: searchBuses is now part of busRoutes (/api/buses/search-buses), so removing searchBusesRoutes

// Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default io;
