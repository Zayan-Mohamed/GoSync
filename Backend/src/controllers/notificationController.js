import Notification from "../models/notificationModel.js";
import User from "../models/user.js";
import io  from "../server.js";


export const create = async (req, res) => {
  try {
    console.log("Received request body:", req.body); // Log the request body

    // Generate a custom notificationId if it's not provided in the request body
    const customNotificationId = req.body.notificationId || `notif-${new Date().getTime()}`;

    // Ensure that notificationId is added to the body if it doesn't exist
    const notificationData = {
      ...req.body,
      notificationId: customNotificationId, // Add the generated or passed notificationId
    };

    // Create a new Notification instance with the notificationData
    const newNotification = new Notification(notificationData);
    
    // Save the new notification to the database
    const savedNotification = await newNotification.save();
     
     io.emit("newNotification",savedNotification);
    
    // Respond with the saved notification
    res.status(201).json({ success: true, data: savedNotification });
  } catch (error) {
    console.error("Error while creating notification:", error);
    res.status(500).json({
      errorMessage: error.message,
      message: "Server Error",
    });
  }
};



export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }); // Fetch all notifications
    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMessage: error.message, message: 'Server Error' });
  }
};


export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params; // Get notificationId from the URL parameter

    // Check if notification exists by notificationId (not the MongoDB _id)
    const notification = await Notification.findOne({ notificationId: id });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMessage: error.message, message: 'Server Error' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params; // Get notificationId from the URL parameter

    // Check if notification exists by notificationId (not the MongoDB _id)
    const notification = await Notification.findOne({ notificationId: id });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Update the notification by notificationId
    const updatedNotification = await Notification.findOneAndUpdate(
      { notificationId: id },  // Match by notificationId
      req.body,  // Update data
      { new: true }  // Return the updated document
    );
      io.emit("updateNotification", updatedNotification);

    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMessage: error.message, message: 'Server Error' });
  }
};

export const deleteNotification = async (req, res) => {
   try {
    const { id } = req.params; // Get notificationId from the URL parameter

    // Check if notification exists by notificationId (not the MongoDB _id)
    const notification = await Notification.findOne({ notificationId: id });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }   
    await Notification.findOneAndDelete({ notificationId: id});
    io.emit("deleteNotification", id);

    res.status(200).json({message:"Notification deleted successfuly."});   
   } catch (error) {
    res.status(500).json({ errorMessage: error.message, message: 'Server Error' });
   }

};
