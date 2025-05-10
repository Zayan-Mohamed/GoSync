import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

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
      type: Number, // Auto-increment field for internal use
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
      type: String,
      required: true
    },
    busRouteNumber: {
      type: String, // New field for bus route number
      required: true,
      trim: true,
    },
    fareAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    travelName: {
      type: String, // New field for travel company name
      required: true,
      trim: true,
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
      default: null
    }
    
  
  },
  {
    timestamps: true,
  }
);

// Apply the mongoose-sequence plugin to the busId field
busSchema.plugin(mongooseSequence(mongoose), { inc_field: "busId" });

// Create and export the Bus model
export default mongoose.model("Bus", busSchema);
