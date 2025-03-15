import Notification from "../models/notificationModel.js";


export const create = async (req, res) => {
  try {
      const newNotification = new Notification(req.body);
      const savedNotification = await newNotification.save();
      res.status(201).json({ success: true, data: savedNotification });
  } catch (error) {
      console.error(error); // Log the error for debugging