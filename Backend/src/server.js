import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

import scheduleRoutes from "./routes/scheduleRoutes.js"; // ✅ Import schedule routes
import userRoutes from "./routes/userRoutes.js"; // ✅ Import user routes
import notificationRoutes from "./routes/notificationRoutes.js"; // ✅ Import notification routes
import seatRoutes from "./routes/seatRoutes.js"; // ✅ Import seat routes
import stopRoutes from "./routes/stopRoutes.js"; // ✅ Import booking routes
import routeRoutes from "./routes/routeRoutes.js"; // ✅ Import route routes
import bookingRoutes from "./routes/bookingRoutes.js"; // ✅ Import booking routes
import busRoutes from "./routes/busRoutes.js"; // ✅ Import bus routes



dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });



// ✅ Middleware
app.use(cookieParser());
app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"], 
  allowedHeaders: ["Content-Type", "Authorization"], 
}));

app.use(bodyParser.json());

app.set("io", io);
// ✅ Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Routes
app.use("/api/users", userRoutes); // User-related routes
app.use("/api/notifications", notificationRoutes); // Notification routes
app.use("/api/seats", seatRoutes); // Seat routes
app.use("/api/bookings", bookingRoutes);// Booking routes
app.use("/api/routes" , routeRoutes ); // Route routes
app.use("/api/stops" , stopRoutes ); // Stop routes/
app.use("/api/schedules", scheduleRoutes);
app.use("/api/buses", busRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { io };