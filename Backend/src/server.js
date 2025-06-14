// src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { setupWebSocket } from "./websocket.js";
import { setIoInstance } from "./controllers/shedController.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import seatRoutes from "./routes/seatRoutes.js";
import stopRoutes from "./routes/stopRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import busRoutes from "./routes/busRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import shedRoutes from "./routes/shedRoutes.js";
import busOperatorRoutes from "./routes/busOperatorRoutes.js";
import busRouteRoutes from "./routes/busRouteRoutes.js";
import notRoutes from "./routes/notRoutes.js";
import { setupCronJobs } from "./utils/cronScheduler.js";
import logger from "./utils/logger.js";

import reportRoutes from "./routes/reportRoutes.js";
import heatmapRoutes from "./routes/heatmapRoutes.js";
// Import the new routes
import busMaintenanceRoutes from "./routes/busMaintenanceRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
connectDB();

logger.info("Server starting up...");
logger.info("Loaded EMAIL_USER:", process.env.EMAIL_USER);
logger.info(
  "Loaded EMAIL_PASS length:",
  process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
);

const app = express();
const server = createServer(app);

// Setup file paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup WebSocket with proper server instance
const io = setupWebSocket(server);

// Share the io instance with controllers that need it
setIoInstance(io);

// Add io to app for use in request handlers
app.set("io", io);

// Set up cron jobs for automated tasks
setupCronJobs();
logger.info("Cron jobs initialized");

// CORS Configuration - simplified approach to fix the origin matching issue
const allowedOrigins = ["http://localhost", "http://127.0.0.1"];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

// Set up CORS middleware with a more direct approach
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Log CORS request details for debugging
  console.log(
    `CORS Request from: ${origin || "Unknown origin"}, Method: ${
      req.method
    }, Path: ${req.path}`
  );

  // Set CORS headers for all responses
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Expose-Headers", "set-cookie");
  }

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    res.status(200).end();
    return;
  }

  next();
});

// Middleware
app.use(cookieParser());
app.use(express.json());

app.use(
  "/uploads",
  (req, res, next) => {
    // Set proper CORS headers for image files - use specific origin rather than function
    const requestOrigin = req.headers.origin;

    // Set proper origin or fall back to * for non-credential requests
    if (
      requestOrigin &&
      (allowedOrigins.includes(requestOrigin) ||
        allowedOrigins.includes(requestOrigin.replace(/:\d+$/, "")))
    ) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "http://localhost");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.setHeader("X-Content-Type-Options", "nosniff"); // Prevent MIME type sniffing

    // Log requests for debugging
    console.log(
      `[Static File] Requested: ${req.path}, Origin: ${requestOrigin}`
    );

    // Set appropriate headers for images
    if (req.path.match(/\.(jpg|jpeg|png|gif)$/i)) {
      const ext = req.path.toLowerCase().split(".").pop();
      const contentType =
        {
          png: "image/png",
          gif: "image/gif",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
        }[ext] || "application/octet-stream";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
      res.setHeader("Content-Security-Policy", "default-src 'self'");
    }

    next();
  },
  express.static(path.join(__dirname, "..", "uploads"))
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
app.use("/api/notices", noticeRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/shed", shedRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/operator", busOperatorRoutes);
app.use("/api/busRoute", busRouteRoutes);
app.use("/api", notRoutes);
app.use("/api/user", heatmapRoutes);
app.use("/api/maintenance", busMaintenanceRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default io;
