import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    unique: true,
  },
  routeName: {
    type: String,
    required: true,
  },
  startLocation: {
    type: String,
    required: true,
  },
  endLocation: {
    type: String,
    required: true,
  },
  totalDistance: {
    type: Number, // Distance in km or miles
    required: true,
  },
  startLocationCoordinates: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  endLocationCoordinates: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
  },
  stops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: false,
  }],
});

const Route = mongoose.model('Route', routeSchema);

export default Route;
