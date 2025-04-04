// controllers/scheduleNotifications.js
import Notification from "../models/notificationModel.js";
import { setupWebSocket } from "../websocket.js"; 

/**
 * Schedule follow-up notifications after an immediate delay notification.
 * After a manual message “Bus X will be delayed in 30 minutes” is sent,
 * this function schedules:
 *  - After 25 minutes: "Your bus X will be arriving in 5 minutes."
 *  - After 30 minutes: "Your bus X has arrived."
 */
export const scheduleFollowUpNotifications = async (busId) => {
  try {
    // After 25 minutes: "Your bus X will be arriving in 5 minutes."
    setTimeout(async () => {
      try {
        const fiveMinuteNotification = new Notification({
          notificationId: `notif-${new Date().getTime()}`,
          type: "reminders",
          message: `Your bus ${busId} will be arriving in 5 minutes.`,
        });
        const savedFiveMinute = await fiveMinuteNotification.save();
        io.emit("newNotification", savedFiveMinute);
      } catch (error) {
        console.error("Error sending the 5-minute notification:", error);
      }
    }, 25 * 60 * 1000);

    // After 30 minutes: "Your bus X has arrived."
    setTimeout(async () => {
      try {
        const arrivalNotification = new Notification({
          notificationId: `notif-${new Date().getTime()}`,
          type: "info",
          message: `Your bus ${busId} has arrived.`,
        });
        const savedArrival = await arrivalNotification.save();
        io.emit("newNotification", savedArrival);
      } catch (error) {
        console.error("Error sending the arrival notification:", error);
      }
    }, 30 * 60 * 1000);

    console.log(`Scheduled follow-up notifications for bus ${busId}.`);
  } catch (error) {
    console.error("Error scheduling follow-up notifications:", error);
  }
};

// --- Additional scheduling functions for other types ---

export const scheduleTravelDisruptionNotification = async (busId, issue) => {
  try {
    const disruptionNotification = new Notification({
      notificationId: `notif-${new Date().getTime()}`,
      type: "travel disruption",
      message: `Travel Disruption: Bus ${busId} is affected due to ${issue}. Please check alternate routes.`,
    });
    const savedNotification = await disruptionNotification.save();
    io.emit("newNotification", savedNotification);
  } catch (error) {
    console.error("Error scheduling travel disruption notification:", error);
  }
};

export const schedulePromotionNotification = async (description, expiryDate) => {
  try {
    const promotionNotification = new Notification({
      notificationId: `notif-${new Date().getTime()}`,
      type: "promotions",
      message: `New Promotion: ${description}. Offer valid until ${expiryDate}.`,
    });
    const savedPromotion = await promotionNotification.save();
    io.emit("newNotification", savedPromotion);

    // Optional: reminder after 1 hour.
    setTimeout(async () => {
      try {
        const reminderNotification = new Notification({
          notificationId: `notif-${new Date().getTime()}`,
          type: "reminders",
          message: `Reminder: Promotion "${description}" expires at ${expiryDate}.`,
        });
        const savedReminder = await reminderNotification.save();
        io.emit("newNotification", savedReminder);
      } catch (error) {
        console.error("Error scheduling promotion reminder:", error);
      }
    }, 60 * 60 * 1000);
  } catch (error) {
    console.error("Error scheduling promotion notification:", error);
  }
};

export const scheduleDiscountNotification = async (amount, code) => {
  try {
    const discountNotification = new Notification({
      notificationId: `notif-${new Date().getTime()}`,
      type: "discounts",
      message: `Discount Alert: Get ${amount}% off on your next booking! Use code: ${code}`,
    });
    const savedDiscount = await discountNotification.save();
    io.emit("newNotification", savedDiscount);

    // Optional: reminder after 30 minutes.
    setTimeout(async () => {
      try {
        const discountReminder = new Notification({
          notificationId: `notif-${new Date().getTime()}`,
          type: "reminders",
          message: `Reminder: Your discount code ${code} for ${amount}% off is still available.`,
        });
        const savedReminder = await discountReminder.save();
        io.emit("newNotification", savedReminder);
      } catch (error) {
        console.error("Error scheduling discount reminder:", error);
      }
    }, 30 * 60 * 1000);
  } catch (error) {
    console.error("Error scheduling discount notification:", error);
  }
};

export const scheduleAlertNotification = async (alertMessage) => {
  try {
    const alertNotification = new Notification({
      notificationId: `notif-${new Date().getTime()}`,
      type: "alert",
      message: `ALERT: ${alertMessage}`,
    });
    const savedAlert = await alertNotification.save();
    io.emit("newNotification", savedAlert);
  } catch (error) {
    console.error("Error scheduling alert notification:", error);
  }
};

export const scheduleInfoNotification = async (infoMessage) => {
  try {
    const infoNotification = new Notification({
      notificationId: `notif-${new Date().getTime()}`,
      type: "info",
      message: `INFO: ${infoMessage}`,
    });
    const savedInfo = await infoNotification.save();
    io.emit("newNotification", savedInfo);
  } catch (error) {
    console.error("Error scheduling info notification:", error);
  }
};
