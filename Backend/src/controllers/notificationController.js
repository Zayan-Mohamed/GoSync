import Notification from "../models/notificationModel.js";
import User from "../models/user.js";
import io  from "../server.js";


export const create = async (req, res) => {
  try {
    console.log("Received request body:", req.body); 

   
    const customNotificationId = req.body.notificationId || `notif-${new Date().getTime()}`;

    const notificationData = {
      ...req.body,
      notificationId: customNotificationId, 
    };

    
    const newNotification = new Notification(notificationData);
    
    
    const savedNotification = await newNotification.save();
     
     io.emit("newNotification",savedNotification);
    
    
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
    const { id } = req.params; 
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
    const { id } = req.params; 
    const notification = await Notification.findOne({ notificationId: id });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Update the notification by notificationId
    const updatedNotification = await Notification.findOneAndUpdate(
      { notificationId: id },  
      req.body,  
      { new: true }  
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
    const { id } = req.params; 

    
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
