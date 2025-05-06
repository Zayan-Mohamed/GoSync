import mongoose from "mongoose";

const shedSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['travel disruption', 'promotions', 'discounts', 'alert', 'reminders', 'info'],
    default: 'info',
  },
  message: { type: String, required: true },
  shedDate: { type: String, required: true }, // YYYY-MM-DD
  shedTime: { type: String, required: true }, // HH:mm
  createdBy: {
    type: "String",
    required: true
  },
  status: { type: String, enum: ["pending", "sent", "archived"], default: "pending" },
  expiredAt: {
    type: Date,
    required: false, // Optional field, doesn't need to be required
  },
});

shedSchema.methods.isExpired = function () {
  const currentDate = new Date();
  const expiration = this.expiredAt ? new Date(this.expiredAt) : null;
  return expiration && expiration <= currentDate;
};

shedSchema.virtual("shedDateTime").get(function () {
  // Combine the shedDate and shedTime into a proper Date object
  const [year, month, day] = this.shedDate.split("-"); // Split shedDate (YYYY-MM-DD)
  const [hour, minute] = this.shedTime.split(":"); // Split shedTime (HH:mm)
  return new Date(year, month - 1, day, hour, minute); // Create Date object
});

const ShedMessage = mongoose.model("ShedMessage", shedSchema);

export default ShedMessage;
