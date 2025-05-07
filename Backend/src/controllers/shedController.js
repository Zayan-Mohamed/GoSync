// import ShedMessage from "../models/shedModel.js";
// import cron from "node-cron";
// import { setupWebSocket } from "../websocket.js";

import ShedMessage from "../models/shedModel.js"; // Adjust the path to your model
import cron from "node-cron";
import { setupWebSocket } from "../websocket.js";

const io = setupWebSocket();

export const shedMessage = async (req, res) => {
  try {
    const { type,  subType, message, shedDate, shedTime, expiryDate } = req.body;

    const newMessage = new ShedMessage({
      type,
      subType,
      message,
    
      shedDate,
      shedTime,
      status: "pending",
      createdBy: req.user.name,
      expiredAt: expiryDate ? new Date(expiryDate) : null,
    });

    await newMessage.save();

    io.emit("newNotification", {
      _id: newMessage._id,
      message: `New message scheduled: ${newMessage.message}`,
      status: "pending"
    });

    res.status(201).json({ success: true, message: "Message scheduled successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllShedMessages = async (req, res) => {
  try {
    const messages = await ShedMessage.find().sort({ shedDate: -1, shedTime: -1 });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateShedMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMessage = await ShedMessage.findByIdAndUpdate(id, req.body, { 
      new: true 
    });

    if (!updatedMessage) {
      return res.status(404).json({ success: false, message: "Message not found!" });
    }

    io.emit("newNotification", {
      _id: updatedMessage._id,
      message: `Message updated: ${updatedMessage.message}`,
      status: updatedMessage.status
    });

    res.status(200).json({ success: true, data: updatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteShedMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMessage = await ShedMessage.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({ success: false, message: "Message not found!" });
    }

    io.emit("newNotification", {
      _id: deletedMessage._id,
      action: "delete"
    });

    res.status(200).json({ success: true, message: "Message deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cron Job to Send Scheduled Messages
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);

    // Send scheduled messages
    const messagesToSend = await ShedMessage.find({
      shedDate: today,
      shedTime: currentTime,
      status: "pending",
    });

    for (let msg of messagesToSend) {
      msg.status = "sent";
      await msg.save();

      io.emit("newNotification", {
        _id: msg._id,
        message: `Scheduled Message Sent: ${msg.message}`,
        status: "sent"
      });
    }

    // Check for expired messages
    const expiredMessages = await ShedMessage.find({
      status: { $ne: "archived" },
      expiredAt: { $lte: now },
    });

    for (let expiredMessage of expiredMessages) {
      expiredMessage.status = "archived";
      await expiredMessage.save();

      io.emit("newNotification", {
        _id: expiredMessage._id,
        message: `Message Archived: ${expiredMessage.message}`,
        status: "archived"
      });
    }
  } catch (error) {
    console.error("Error in scheduled job:", error.message);
  }
});

export const getShedMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await ShedMessage.findById(id);

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found!" });
    }

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
