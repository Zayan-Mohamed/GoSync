import mongoose from "mongoose";
import AutoIncrement from "mongoose-sequence"; // ✅ Import AutoIncrement

const StopSchema = new mongoose.Schema({
  stopId: { type: Number, unique: true }, // Auto-increment
  stopName: { type: String, required: true },
  stopOrder: { type: Number, required: true }, // Order of stop in route
  location: { 
    latitude: { type: Number, required: false },  // Optional for map integration
    longitude: { type: Number, required: false }
  }
});

const RouteSchema = new mongoose.Schema({
  routeId: { type: Number, unique: true }, // Auto-increment
  routeNumber: { type: String, required: true }, // Example: 48-1
  startLocation: { type: String, required: true },
  endLocation: { type: String, required: true },
  totalDistance: { type: Number, required: true }, // Distance in km
  stops: [StopSchema], // List of stops along the route
  routePath: [{ latitude: Number, longitude: Number }], // Path coordinates
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }, // Route status
  createdAt: { type: Date, default: Date.now } // Timestamp for tracking
});

// ✅ Auto-increment routeId and stopId using mongoose-sequence
RouteSchema.plugin(AutoIncrement(mongoose), { inc_field: "routeId" });
StopSchema.plugin(AutoIncrement(mongoose), { inc_field: "stopId" });

const Route = mongoose.model("Route", RouteSchema);
export default Route;