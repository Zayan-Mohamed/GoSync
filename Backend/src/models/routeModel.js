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
    enum: ['active', 'inactive'],
    default: 'active',
  },
  // In routeModel.js
stops: [{
  stop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  stopType: { 
    type: String, 
    enum: ['boarding', 'dropping'], // Enforce valid values
    required: false    // Optional if you want partial updates
  },
  _id: false // This prevents MongoDB from creating an _id for each subdocument
}],
});

const Route = mongoose.model('Route', routeSchema);

export default Route;
