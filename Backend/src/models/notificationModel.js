import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
   
      
       userName: {
          type:String,
          required: true
       },
      message: {
        type: String,
        required: true,  // Notification content/message
      },
      type: {
        type: String,
        enum: ['booking confirmation', 'travel disrupution', 'promotions', 'error', 'discounts', 'alert', 'info'], // Updated types of notification
        default: 'info' // Default type is 'info'
      },
      
      
})
     export default mongoose.model("Notifications",notificationSchema)