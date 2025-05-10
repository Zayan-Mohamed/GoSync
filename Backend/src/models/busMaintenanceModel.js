import mongoose from "mongoose";

const busMaintenanceSchema = new mongoose.Schema(
  {
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    reason: {
      type: String,
      default: "General maintenance",
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const BusMaintenance = mongoose.model("BusMaintenance", busMaintenanceSchema);

export default BusMaintenance;
