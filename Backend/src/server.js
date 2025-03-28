import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import http from "http";
import { setupWebSocket } from "./websocket.js"; // ✅ Move WebSocket logic to a separate file

import scheduleRoutes from "./routes/scheduleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import stopRoutes from "./routes/stopRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import busRoutes from "./routes/busRoutes.js";
import shedRoutes from "./routes/shedRoutes.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ Setup WebSocket
const io = setupWebSocket(server);
app.set("io", io);

// ✅ Middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // ✅ Use environment variable
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// ✅ Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/shed", shedRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default io;
