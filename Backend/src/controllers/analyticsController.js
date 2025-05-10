import ShedMessage from "../models/shedModel.js";
import Notification from "../models/notificationModel.js";

// Analytics for Shed Messages
// export const shedMessagesAnalytics = async (req, res) => {
//   try {
//     const totalMessages = await ShedMessage.countDocuments();
//     const pendingMessages = await ShedMessage.countDocuments({ status: "pending" });
//     const sentMessages = await ShedMessage.countDocuments({ status: "sent" });
//     const archivedMessages = await ShedMessage.countDocuments({ status: "archived" });

//     // Analytics for different types
//     const typeCount = await ShedMessage.aggregate([
//       { $group: { _id: "$type", count: { $sum: 1 } } },
//     ]);

//     res.status(200).json({
//       success: true,
//       totalMessages,
//       pendingMessages,
//       sentMessages,
//       archivedMessages,
//       typeCount,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// // Analytics for Notifications
// export const notificationsAnalytics = async (req, res) => {
//   try {
//     const totalNotifications = await Notification.countDocuments();
//     const sentNotifications = await Notification.countDocuments({ status: "sent" });
//     const archivedNotifications = await Notification.countDocuments({ status: "archive" });

//     // Analytics for different types
//     const typeCount = await Notification.aggregate([
//       { $group: { _id: "$type", count: { $sum: 1 } } },
//     ]);

//     res.status(200).json({
//       success: true,
//       totalNotifications,
//       sentNotifications,
//       archivedNotifications,
//       typeCount,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };



// Analytics for Shed Messages
export const shedMessagesAnalytics = async (req, res) => {
    try {
      
            const { start, end } = req.query;
            const dateFilter = {};
            
            if (start && end) {
              dateFilter.createdAt = {
                $gte: new Date(start),
                $lte: new Date(end)
              };
            }
        
      const totalMessages = await ShedMessage.countDocuments();
      const pendingMessages = await ShedMessage.countDocuments({ status: "pending" });
      const sentMessages = await ShedMessage.countDocuments({ status: "sent" });
      const archivedMessages = await ShedMessage.countDocuments({ status: "archived" });
  
      // Count by type
      const typeCount = await ShedMessage.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]);
  
      // Count by subType for only travel disruption
      const travelDisruptionSubTypes = await ShedMessage.aggregate([
        { $match: { type: "travel disruption" } },
        { $group: { _id: "$subType", count: { $sum: 1 } } },
      ]);
      const dailyStats = await ShedMessage.aggregate([
        {
            $addFields: {
              shedDateObj: {
                $dateFromString: {
                  dateString: {
                    $concat: ["$shedDate", "T", "$shedTime", ":00"] // e.g., "2024-05-08T13:45:00"
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$shedDateObj" }
              },
              count: { $sum: 1 },
              sent: {
                $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] }
              },
              pending: {
                $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
              }
            }
          },
          { $sort: { _id: 1 } },
          { $limit: 30 }
        ]);
      const monthlyStats = await ShedMessage.aggregate([
        
            {
                $addFields: {
                  shedDateObj: {
                    $dateFromString: {
                      dateString: {
                        $concat: ["$shedDate", "T", "$shedTime", ":00"]
                      }
                    }
                  }
                }
              },
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m", date: "$shedDateObj" }
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ]);
      res.status(200).json({
        success: true,
        totalMessages,
        pendingMessages,
        sentMessages,
        archivedMessages,
        typeCount,
        travelDisruptionSubTypes,
        dailyStats,
        monthlyStats,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  
  // Analytics for Notifications
export const notificationsAnalytics = async (req, res) => {
    try {
        const { start, end } = req.query;
        const dateFilter = {};
        
        if (start && end) {
          dateFilter.createdAt = {
            $gte: new Date(start),
            $lte: new Date(end)
          };
        }
      const totalNotifications = await Notification.countDocuments();
      const sentNotifications = await Notification.countDocuments({ status: "sent" });
      const archivedNotifications = await Notification.countDocuments({ status: "archive" });
  
      const typeCount = await Notification.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]);
  
      const travelDisruptionSubTypes = await Notification.aggregate([
        { $match: { type: "travel disruption" } },
        { $group: { _id: "$subType", count: { $sum: 1 } } },
      ]);
  
    // Date-based analytics
    const dailyStats = await Notification.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 },
            sent: {
              $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 } // Last 30 days
      ]);
  
      const monthlyStats = await Notification.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
  
  
      res.status(200).json({
        success: true,
        totalNotifications,
        sentNotifications,
        archivedNotifications,
        typeCount,
        travelDisruptionSubTypes,
        dailyStats,
      monthlyStats,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
  // controllers/analyticsController.js

