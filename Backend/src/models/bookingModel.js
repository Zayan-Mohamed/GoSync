import mongoose from "mongoose";

const bookingSchema = mongoose.Schema(
  {
    bookingId: { type: String, unique: true, required: true },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    seatNumbers: [{ type: Number, required: true }],
    status: { type: String, enum: ["booked", "cancelled"], default: "booked" },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
