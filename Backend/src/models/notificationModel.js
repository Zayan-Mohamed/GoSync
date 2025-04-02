import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
   
 
  notificationId: {
    type: String,
    unique: true, // Make sure it's unique
    required: true, // Ensure that notificationId is required
  },
  type: {
    type: String,
    enum: ['travel disruption', 'promotions', 'discounts', 'alert','reminders',  'info'],
    default: 'info',
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
})
     export default mongoose.model("Notifications",notificationSchema)