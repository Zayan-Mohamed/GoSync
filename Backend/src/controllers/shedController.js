import ShedMessage from "../models/shedModel.js";
import cron from "node-cron";
import { setupWebSocket } from "../websocket.js"; 

// WebSocket connection setup
const io = setupWebSocket();

export const shedMessage = async (req, res) => {
  try {
    const { message, shedDate, shedTime } = req.body;

    const newMessage = new ShedMessage({
      message,
      shedDate, // YYYY-MM-DD
      shedTime, // HH:mm
      status: "pending",
    });

    await newMessage.save();

    // Emit WebSocket notification
    io.emit("newNotification", {
      _id: newMessage._id,
      message: `New message scheduled: ${newMessage.message}`,
    });

    res.status(201).json({ success: true, message: "Message scheduled successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllShedMessages = async (req, res) => {
  try {
    // Fetch all shed messages and sort by shedDate and shedTime (newest first)
    const messages = await ShedMessage.find()
      .sort({ shedDate: -1, shedTime: -1 }); // Sorting by shedDate and shedTime, most recent first
    
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateShedMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMessage = await ShedMessage.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedMessage) {
      return res.status(404).json({ success: false, message: "Message not found!" });
    }

    // Emit WebSocket notification
    io.emit("newNotification", {
      _id: updatedMessage._id,
      message: `Message updated: ${updatedMessage.message}`,
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

    // Emit WebSocket notification
    io.emit("newNotification", {
      _id: deletedMessage._id,
      message: `Message deleted: ${deletedMessage.message}`,
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
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm

    const messagesToSend = await ShedMessage.find({
      shedDate: today,
      shedTime: currentTime,
      status: "pending",
    });

    for (let msg of messagesToSend) {
      console.log(`Sending scheduled message: "${msg.message}"`);
      msg.status = "sent";
      await msg.save();

      // Emit WebSocket notification for each sent message
      if (io) {
        io.emit("newNotification", {
          _id: msg._id,
          message: `Scheduled Message Sent: ${msg.message}`,
        });
      }
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