import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

// Define the bus operator schema
const busOperatorSchema = new mongoose.Schema(
  {
    operatorName: {
      type: String,
      required: true,
      trim: true,
    },
    operatorPhone: {
      type: String,
      required: true,
      trim: true,
    },
    operatorLicenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    licenseEndDate: {
      type: Date,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Driver", "Conductor", "staff"],
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Inactive"],
    },
    BusNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply the mongoose-sequence plugin to auto-increment the operatorId field if needed
busOperatorSchema.plugin(mongooseSequence(mongoose), { inc_field: "operatorId" });

// Create and export the BusOperator model
export default mongoose.model("BusOperator", busOperatorSchema);
