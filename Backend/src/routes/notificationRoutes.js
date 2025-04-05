import express from "express";
import { create, deleteNotification, getAllNotifications, getNotificationById, update } from "../controllers/notificationController.js";
import { protect } from "../controllers/userController.js";
import { adminOnly } from "../middlewares/authMiddleware.js";

const route = express.Router();

// Ensure that the POST route is properly set
// Example using Express
route.post("/", protect, adminOnly, create);

route.get("/", getAllNotifications); // Get all notifications
route.get("/:id", getNotificationById); // Get notification by id
route.put("/:id", update); 
route.delete("/:id",deleteNotification)


export default route;
