import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema({
  stopId: {
    type: String,
    required: true,
    unique: true,
  },
  stopName: {
    type: String,
    required: true,
  },
  stopOrder: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  });

const Stop = mongoose.model('Stop', stopSchema);

export default Stop;
