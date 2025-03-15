import express from "express";
import { create, deleteNotification, getAllNotifications, getNotificationById, update } from "../controllers/notificationController.js";

const route = express.Router();

// Ensure that the POST route is properly set
route.post("/", create); // Post to /api/notifications
route.get("/", getAllNotifications); // Get all notifications
route.get("/:id", getNotificationById); // Get notification by id
route.put("/:id", update); 
route.delete("/:id",deleteNotification)

export default route;
