import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

// Initialize AutoIncrement using your mongoose connection
const AutoIncrement = mongooseSequence(mongoose);

// Define the bus schema
const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    busId: {
      type: Number, // Auto-incremented field
      unique: true,
    },
    busType: {
      type: String,
      required: true,
      enum: ["AC", "Non-AC", "Semi-Luxury"],
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Inactive", "Maintenance"],
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    busRouteNumber: {
      type: String,
      required: true,
      trim: true,
    },
    fareAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    travelName: {
      type: String,
      required: true,
      trim: true,
    },
    busImage: {
      type: String, // e.g., "/uploads/bus123.jpg"
      default: "",
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusOperator",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Apply the auto-increment plugin to busId
busSchema.plugin(AutoIncrement, { inc_field: "busId" });

const Bus = mongoose.model("Bus", busSchema);
export default Bus;
