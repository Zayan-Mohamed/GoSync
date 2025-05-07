import express from 'express';
import { shedMessagesAnalytics, notificationsAnalytics } from "../controllers/analyticsController.js";
import { generateShedMessageReport, generateNotificationReport } from "../controllers/reportController.js";

const route = express.Router();

// Analytics Routes
route.get('/analytics/shed', shedMessagesAnalytics);
route.get('/analytics/notifications', notificationsAnalytics);

// Report Routes
route.get('/report/shed', generateShedMessageReport);
route.get('/report/notifications', generateNotificationReport);

export default route;
