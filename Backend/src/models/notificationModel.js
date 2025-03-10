import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
   
 
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true, // Automatically generated
    },
    recipientType: {
      type: String,
      enum: ['individual', 'group', 'all'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Only used if recipientType is 'individual'
      default: null
    },
    userName: {
      type: String,
      required: true // Required when sending to an individual user
    },
    message: {
      type: String,
      required: true // Notification content/message
    },
    type: {
      type: String,
      enum: ['booking confirmation', 'travel disruption', 'promotions', 'error', 'discounts', 'alert', 'info'], 
      default: 'info'
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent' // Since it's instant, it should be 'sent' immediately
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  
      
})
     export default mongoose.model("Notifications",notificationSchema)