import ShedMessage from "../models/shedModel.js"; // Adjust the path to your model
import cron from "node-cron";
import server from "../server.js";

// Instead of initializing Socket.IO here, we'll use the instance from server.js
let io;

// Set the io object when it becomes available
export const setIoInstance = (ioInstance) => {
  io = ioInstance;
  console.log("Socket.IO instance set in shedController");
};

export const shedMessage = async (req, res) => {
  // Get the io instance from the request if not set yet
  if (!io && req.app) {
    io = req.app.get("io");
  }

  try {
    const { type, subType, message, shedDate, shedTime, expiryDate } = req.body;

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

    // Only emit if io is available
    if (io) {
      io.emit("newNotification", {
        _id: newMessage._id,
        message: `New message scheduled: ${newMessage.message}`,
        status: "pending",
      });
    } else {
      console.log("Socket.IO not available for emitting newNotification");
    }

    res
      .status(201)
      .json({ success: true, message: "Message scheduled successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllShedMessages = async (req, res) => {
  try {
    const messages = await ShedMessage.find().sort({
      shedDate: -1,
      shedTime: -1,
    });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateShedMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMessage = await ShedMessage.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedMessage) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found!" });
    }

    if (io) {
      io.emit("newNotification", {
        _id: updatedMessage._id,
        message: `Message updated: ${updatedMessage.message}`,
        status: updatedMessage.status,
      });
    } else {
      console.log("Socket.IO not available for emitting newNotification");
    }

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
      return res
        .status(404)
        .json({ success: false, message: "Message not found!" });
    }

    if (io) {
      io.emit("newNotification", {
        _id: deletedMessage._id,
        action: "delete",
      });
    } else {
      console.log("Socket.IO not available for emitting newNotification");
    }

    res
      .status(200)
      .json({ success: true, message: "Message deleted successfully!" });
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

      if (io) {
        io.emit("newNotification", {
          _id: msg._id,
          message: `Scheduled Message Sent: ${msg.message}`,
          status: "sent",
        });
      } else {
        console.log("Socket.IO not available for emitting newNotification");
      }
    }

    // Check for expired messages
    const expiredMessages = await ShedMessage.find({
      status: { $ne: "archived" },
      expiredAt: { $lte: now },
    });

    for (let expiredMessage of expiredMessages) {
      expiredMessage.status = "archived";
      await expiredMessage.save();

      if (io) {
        io.emit("newNotification", {
          _id: expiredMessage._id,
          message: `Message Archived: ${expiredMessage.message}`,
          status: "archived",
        });
      } else {
        console.log("Socket.IO not available for emitting newNotification");
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
      return res
        .status(404)
        .json({ success: false, message: "Message not found!" });
    }

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
