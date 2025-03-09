import mongoose from 'mongoose';

const seatSchema = mongoose.Schema(
  {
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus', // Assuming you have a Bus model to associate with the bus
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the user who booked the seat
      default: null,
    },
    bookingId: {
      type: String,
      unique: true,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Seat = mongoose.model('Seat', seatSchema);

export default Seat;
