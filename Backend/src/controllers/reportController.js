import ShedMessage from "../models/shedModel.js";
import Notification from "../models/notificationModel.js";

// Generate Report for Shed Messages
export const generateShedMessageReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // Expects date range in query params

    const messages = await ShedMessage.find({
      shedDate: { $gte: startDate, $lte: endDate },
    });

    // Example of aggregation to get counts
    const report = {
      totalMessages: messages.length,
      sentMessages: messages.filter(msg => msg.status === "sent").length,
      pendingMessages: messages.filter(msg => msg.status === "pending").length,
      archivedMessages: messages.filter(msg => msg.status === "archived").length,
    };

    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Generate Report for Notifications
export const generateNotificationReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const notifications = await Notification.find({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    // Example of aggregation to get counts
    const report = {
      totalNotifications: notifications.length,
      sentNotifications: notifications.filter(notif => notif.status === "sent").length,
      archivedNotifications: notifications.filter(notif => notif.status === "archive").length,
    };

    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
