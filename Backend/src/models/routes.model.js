import mongoose from 'mongoose';
import AutoIncrement from 'mongoose-sequence'; // Import AutoIncrement plugin

const StopSchema = new mongoose.Schema({
  stopId: { type: Number, unique: true, sparse: true }, // Make stopId unique and sparse to allow null
  stopName: { type: String, required: true },
  stopOrder: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }, // Optional stop status
});

// Ensuring that stopName and stopOrder are unique within the route
StopSchema.index({ stopName: 1, stopOrder: 1 }, { unique: true });

const RouteSchema = new mongoose.Schema({
  routeId: { type: Number, unique: true }, // Auto-incremented unique ID for the route
  routeNumber: { type: String, required: true },
  startLocation: { type: String, required: true },
  endLocation: { type: String, required: true },
  totalDistance: { type: Number, required: true },
  stops: { type: [StopSchema], default: [] }, // Stops array will be empty initially
  location: {
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }, // Route status
  createdAt: { type: Date, default: Date.now },
});

// Ensuring routeId is unique
RouteSchema.index({ routeId: 1 }, { unique: true });

// Using AutoIncrement for routeId and stopId fields
RouteSchema.plugin(AutoIncrement(mongoose), { inc_field: 'routeId' });
StopSchema.plugin(AutoIncrement(mongoose), { inc_field: 'stopId' });

const Route = mongoose.model('Route', RouteSchema);
export default Route;
