import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import bodyParser from "body-parser";

import userRoutes from "./routes/userRoutes.js"; // ✅ Import user routes
import notificationRoutes from "./routes/notificationRoutes.js"; // ✅ Import notification routes
import seatRoutes from "./routes/seatRoutes.js"; // ✅ Import seat routes

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Routes
app.use("/api/users", userRoutes); // User-related routes
app.use("/api/notifications", notificationRoutes); // Notification routes
app.use("/api/seats", seatRoutes); // Seat routes


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
