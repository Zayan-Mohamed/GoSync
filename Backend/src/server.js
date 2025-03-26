import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import http from "http";
<<<<<<< HEAD
import { Server } from "socket.io";
import cron from 'node-cron';



import scheduleRoutes from "./routes/scheduleRoutes.js"; // ✅ Import schedule routes
import userRoutes from "./routes/userRoutes.js"; // ✅ Import user routes
import notificationRoutes from "./routes/notificationRoutes.js"; // ✅ Import notification routes
import seatRoutes from "./routes/seatRoutes.js"; // ✅ Import seat routes
import stopRoutes from "./routes/stopRoutes.js"; // ✅ Import booking routes
import routeRoutes from "./routes/routeRoutes.js"; // ✅ Import route routes
import bookingRoutes from "./routes/bookingRoutes.js"; // ✅ Import booking routes
import busRoutes from "./routes/busRoutes.js"; // ✅ Import bus routes
import shedRoutes from "./routes/shedRoutes.js";

=======
import { setupWebSocket } from "./websocket.js"; // ✅ Move WebSocket logic to a separate file
>>>>>>> 22430934730fd5c25693537cc2db09d8bd01f2e5

import scheduleRoutes from "./routes/scheduleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import stopRoutes from "./routes/stopRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import busRoutes from "./routes/busRoutes.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ Setup WebSocket
const io = setupWebSocket(server);

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

// ✅ Attach io to app for WebSocket access in controllers
app.set("io", io);

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
