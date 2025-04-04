import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true,
    required: true,
  },
  type: {
    type: String,
    enum: ['travel disruption', 'promotions', 'discounts', 'alert', 'reminders', 'info'],
    default: 'info',
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'archive'],
    default: 'sent',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiredAt: {
    type: Date,
    required: false, // Optional field, doesn't need to be required
  },
});

notificationSchema.methods.isExpired = function () {
  const currentDate = new Date();
  const expiration = this.expiredAt ? new Date(this.expiredAt) : null;
  return expiration && expiration <= currentDate;
};

export default mongoose.model("Notifications", notificationSchema);
