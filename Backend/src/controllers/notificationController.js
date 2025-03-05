import Notication from "../model/notificationModel.js";


export const create = async (req, res) => {
    try {
      const newNotification = new Notification(req.body);
      const savedNotification = await newNotification.save();
      res.status(201).json({ success: true, data: savedNotification });
    } catch (error) {
      res.status(500).json({ errorMessage: error.message, message: 'Server Error' });
    }
  };