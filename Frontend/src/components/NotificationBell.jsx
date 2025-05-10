import { useEffect, useState } from "react";
import { FiBell, FiX } from "react-icons/fi";
import io from "socket.io-client";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const API_URI = import.meta.env.VITE_API_URL;
const socket = io(`${API_URI}`);

const NotificationBell = ({ role = "default" }) => {
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeMessage, setActiveMessage] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [notifiedTimestamps, setNotifiedTimestamps] = useState([]);

  const getStorageKey = () => `readStatuses_${role}`;

  const saveReadStatuses = (notifs) => {
    const statuses = notifs.reduce((acc, notif) => {
      acc[notif.timestamp] = notif.read;
      return acc;
    }, {});
    localStorage.setItem(getStorageKey(), JSON.stringify(statuses));
  };

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const fetchNotifications = async () => {
      try {
        const [notifResponse, msgResponse] = await Promise.all([
          axios.get(`${API_URI}/api/notifications`),
          axios.get(`${API_URI}/api/shed/messages`),
        ]);

        const notificationsData = notifResponse.data
          .filter((notif) => !notif.expiredAt || new Date(notif.expiredAt) > new Date())
          .map((notif) => ({
            ...notif,
            type: "notification",
            timestamp: new Date(notif.createdAt).getTime(),
          }));

        const sentMessages = msgResponse.data.data
          .filter((msg) => msg.status === "sent")
          .map((msg) => ({
            ...msg,
            type: "message",
            timestamp: new Date(`${msg.shedDate}T${msg.shedTime}:00`).getTime(),
          }));

        const allNotifications = [...notificationsData, ...sentMessages].sort(
          (a, b) => b.timestamp - a.timestamp
        );

        const savedReadStatuses = JSON.parse(localStorage.getItem(getStorageKey())) || {};
        const updatedNotifications = allNotifications.map((notif) => ({
          ...notif,
          read: savedReadStatuses[notif.timestamp] || false,
        }));

        setNotifications(updatedNotifications);
        setHasUnread(updatedNotifications.some((n) => !n.read));
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();

    socket.on("newNotification", (newNotif) => {
      if (!newNotif.expiredAt || new Date(newNotif.expiredAt) > new Date()) {
        const newTimestamp = new Date(newNotif.createdAt).getTime();
        const newItem = {
          ...newNotif,
          type: "notification",
          timestamp: newTimestamp,
          read: false,
        };
        setNotifications((prev) => {
          const updated = [newItem, ...prev];
          saveReadStatuses(updated);
          return updated.sort((a, b) => b.timestamp - a.timestamp);
        });
        setHasUnread(true);

        if (Notification.permission === "granted") {
          new Notification("New Notification", {
            body: newNotif.message,
            icon: "/assets/GoSync.png",
          });
        }
      }
    });

    socket.on("updateNotification", (updatedNotif) => {
      const updatedTimestamp = new Date(updatedNotif.createdAt).getTime();
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.timestamp === updatedTimestamp
            ? { ...n, ...updatedNotif, read: false }
            : n
        );
        saveReadStatuses(updated);
        setHasUnread(updated.some((n) => !n.read));
        return updated;
      });
    });

    socket.on("deleteNotification", (deletedTimestamp) => {
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.timestamp !== deletedTimestamp);
        saveReadStatuses(updated);
        setHasUnread(updated.some((n) => !n.read));
        return updated;
      });
    });

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URI}/api/shed/messages`);
        const sentMessages = res.data.data
          .filter((msg) => msg.status === "sent")
          .map((msg) => ({
            ...msg,
            type: "message",
            timestamp: new Date(`${msg.shedDate}T${msg.shedTime}:00`).getTime(),
          }));

        sentMessages.forEach((msg) => {
          if (
            Notification.permission === "granted" &&
            !notifiedTimestamps.includes(msg.timestamp)
          ) {
            const msgTime = new Date(msg.timestamp);
            const now = new Date();
            const timeDiff = Math.abs(now - msgTime);

            if (timeDiff <= 30000) {
              new Notification("New Notification", {
                body: msg.message,
                icon: "/assets/GoSync.png",
              });
              setNotifiedTimestamps((prev) => [...prev, msg.timestamp]);
            }
          }
        });
      } catch (err) {
        console.error("Scheduled message check failed:", err);
      }
    }, 15000);

    return () => {
      socket.off("newNotification");
      socket.off("updateNotification");
      socket.off("deleteNotification");
      clearInterval(interval);
    };
  }, [notifiedTimestamps, role]);

  const toggleDropdown = () => setShowDropdown((prev) => !prev);
  const handleClick = (msg) => {
    setActiveMessage(msg);
    setIsExpanded(true);
    const updated = notifications.map((n) =>
      n.timestamp === msg.timestamp ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveReadStatuses(updated);
    setHasUnread(updated.some((n) => !n.read));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="relative">
      <button onClick={toggleDropdown} aria-label="Notifications" className="relative">
        <FiBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            className="absolute right-0 top-12 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-50 border border-gray-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center space-x-2">
                <img src="/assets/GoSync.png" alt="GoSync Logo" className="w-5 h-5" />
                <span>Notifications</span>
              </h3>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {notifications.map((notif, index) => (
                    <li
                      key={index}
                      className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notif.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleClick(notif)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className={`${!notif.read ? "font-medium" : ""}`}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDateTime(notif.timestamp)}
                          </p>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeMessage && (
        <div
          className={`fixed bottom-4 right-4 bg-white shadow-lg w-64 transition-all duration-300 ease-in-out rounded-lg z-50 ${
            isExpanded ? "h-80" : "h-32"
          } overflow-hidden`}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <button onClick={() => setActiveMessage(null)} className="text-gray-500 hover:text-black">
              <FiX size={20} />
            </button>
          </div>
          <div className="p-4">
            <p>{activeMessage.message}</p>
            <button className="mt-2 text-blue-500" onClick={() => setIsExpanded((prev) => !prev)}>
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;