import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid"; // Import UUID for unique scheduleID

const scheduleSchema = new mongoose.Schema(
  {
    scheduleID: {
      type: String,
      default: uuidv4, // Generate a unique schedule ID
      unique: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    departureTime: {
      type: String,
      required: true,
    },
    arrivalTime: {
      type: String,
      required: true,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },
  },
  { timestamps: true }
);

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;
