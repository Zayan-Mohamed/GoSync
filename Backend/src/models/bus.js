import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

// Define the bus schema
const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  busId: {
    type: Number,  // Auto-increment field for internal use
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
    ref: "Route",  // Reference to the Route model 
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 1,
  },
  operator: {
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
  },
}, {
  timestamps: true,
});

// Apply the mongoose-sequence plugin to the busId field
busSchema.plugin(mongooseSequence(mongoose), { inc_field: 'busId' });

// Create and export the Bus model
export default mongoose.model('Bus', busSchema);
