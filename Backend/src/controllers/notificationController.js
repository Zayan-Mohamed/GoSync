import Notification from "../models/notificationModel.js";
import User from "../models/user.js";
import io  from "../server.js";
import cron from 'node-cron'; // To run scheduled tasks



// Get Notification by ID
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
export const create = async (req, res) => {
  try {
    const customNotificationId = req.body.notificationId || `notif-${new Date().getTime()}`;

    // Allow setting expiration date
    const expiredAt = req.body.expiredAt ? new Date(req.body.expiredAt) : null;

    const notificationData = {
      ...req.body,
      notificationId: customNotificationId,
      expiredAt: expiredAt, // Set the expiration date
    };

    const newNotification = new Notification(notificationData);
    const savedNotification = await newNotification.save();

    io.emit("newNotification", savedNotification);

    res.status(201).json({ success: true, data: savedNotification });
  } catch (error) {
    console.error("Error while creating notification:", error);
    res.status(500).json({
      errorMessage: error.message,
      message: "Server Error",
    });
  }
};

// Get All Notifications
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }); // Fetch all notifications
    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMessage: error.message, message: 'Server Error' });
  }
};

// Update Notification
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

// Delete Notification
// Delete Notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({ notificationId: id });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.status === 'archive') {
      return res.status(400).json({ message: "Cannot delete archived notifications." });
    }

    await Notification.findOneAndDelete({ notificationId: id });
    io.emit("deleteNotification", id);
    res.status(200).json({ message: "Notification deleted successfully." });
  } catch (error) {
    res.status(500).json({ errorMessage: error.message, message: 'Server Error' });
  }
};


// Scheduler to run every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log("Running cron job...");

  try {
    const expiredNotifications = await Notification.find({
      expiredAt: { $lte: new Date() }, // Find notifications with expired dates
      status: { $ne: 'archive' } // Exclude already archived ones
    });

    console.log(`Found ${expiredNotifications.length} expired notifications.`);

    for (let notif of expiredNotifications) {
      notif.status = 'archive';  // Archive expired notifications
      await notif.save();
    }

    console.log("Expired notifications archived.");
  } catch (error) {
    console.error("Error during cron job:", error);
  }
});