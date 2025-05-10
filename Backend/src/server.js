// src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { setupWebSocket } from "./websocket.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import stopRoutes from "./routes/stopRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import busRoutes from "./routes/busRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import shedRoutes from "./routes/shedRoutes.js";
import busOperatorRoutes from "./routes/busOperatorRoutes.js";
import busRouteRoutes from"./routes/busRouteRoutes.js";
import notRoutes from "./routes/notRoutes.js";

import reportRoutes from "./routes/reportRoutes.js";
import heatmapRoutes from "./routes/heatmapRoutes.js";
 // Import the new routes
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
connectDB();

console.log("Loaded EMAIL_USER:", process.env.EMAIL_USER);
console.log("Loaded EMAIL_PASS:", process.env.EMAIL_PASS);

const app = express();
const server = createServer(app);

// Setup file paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup WebSocket
const io = setupWebSocket(server);
app.set("io", io);

// CORS Configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.CLIENT_URL
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Middleware
app.use(cookieParser());
app.use(express.json());

// IMPORTANT: Configure the static file server BEFORE the routes
// This allows images to be served without auth requirements
app.use(
  "/uploads",
  (req, res, next) => {
    // Add CORS headers specifically for image files
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );

    // Log all requests to help with debugging
    console.log(`[Static File] Requested: ${req.path}`);

    // Set proper caching headers for images
    if (req.path.match(/\.(jpg|jpeg|png|gif)$/i)) {
      // Set appropriate content type based on extension
      const ext = req.path.toLowerCase().split(".").pop();
      const contentType =
        ext === "png"
          ? "image/png"
          : ext === "gif"
          ? "image/gif"
          : "image/jpeg";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
    }

    next();
  },
  express.static(path.join(__dirname, "..", "..", "uploads"))
);

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/shed", shedRoutes);
app.use('/api/reports', reportRoutes);
app.use("/api/operator", busOperatorRoutes);
app.use("/api/busRoute",busRouteRoutes);
app.use("/api", notRoutes);
app.use("/api/user", heatmapRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default io;


