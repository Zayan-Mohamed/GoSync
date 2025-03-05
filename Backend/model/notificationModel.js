import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
   
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Reference to the User model (foreign key)
        required: true
      },
      message: {
        type: String,
        required: true,  // Notification content/message
      },
      type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'discount', 'confirmation', 'alert'], // Updated types of notification
        default: 'info' // Default type is 'info'
      },
      status: {
        type: String,
        enum: ['unread', 'read'], // Status of the notification
        default: 'unread' // Default status is 'unread'
      },
      createdAt: {
        type: Date,
        default: Date.now, // Automatically set the creation time
      },
      updatedAt: {
        type: Date,
        default: Date.now, // Automatically set the update time
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Reference to the User model (optional)
      }
})
     export default mongoose.model("Notifications",notificationSchema)