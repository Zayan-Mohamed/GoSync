import { useEffect, useState } from "react";
import {
  FiBell,
  FiSearch,
  FiSettings,
  FiUser,
  FiLogOut,
  FiX,
} from "react-icons/fi";
import io from "socket.io-client";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import AdminModal from "./AdminModal";
import axios from "axios";

const API_URI = import.meta.env.VITE_API_URL;
const socket = io(`${API_URI}`);

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isAdminModalOpen, setAdminModalOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [notifiedTimestamps, setNotifiedTimestamps] = useState([]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const saveReadStatuses = (notifs) => {
    const statuses = notifs.reduce((acc, notif) => {
      acc[notif.timestamp] = notif.read;
      return acc;
    }, {});
    localStorage.setItem("readStatuses", JSON.stringify(statuses));
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

        const savedReadStatuses = JSON.parse(localStorage.getItem("readStatuses")) || {};
        const updatedNotifications = allNotifications.map((notif) => ({
          ...notif,
          read: savedReadStatuses[notif.timestamp] || false,
        }));

        setNotifications(updatedNotifications);
        setHasUnread(updatedNotifications.some((n) => !n.read));
      } catch (error) {
        console.error("Error fetching notifications:", error);
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
            icon: "/public/assets/GoSync.png",
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

    // Push notification for scheduled messages
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
                icon: "/public/assets/GoSync.png",
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
  }, [notifiedTimestamps]);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleMessageClick = (msg) => {
    setActiveMessage(msg);
    setIsExpanded(true);
    const updatedNotifications = notifications.map((n) =>
      n.timestamp === msg.timestamp ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    saveReadStatuses(updatedNotifications);
    setHasUnread(updatedNotifications.some((n) => !n.read));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-md">
      <div className="flex items-center space-x-3">
        <FiSearch size={20} />
        <input
          type="text"
          placeholder="Search..."
          className="border-b outline-none"
        />
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => setAdminModalOpen(true)}
          className="bg-deepOrange text-white px-4 py-2 rounded-lg hover:bg-sunsetOrange transition"
        >
          Add an Admin
        </button>

        <div className="relative">
          <button onClick={toggleDropdown} aria-label="Notifications" className="relative">
            <FiBell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="fixed right-4 top-16 w-72 bg-white shadow-lg rounded-lg overflow-hidden z-50 border border-gray-300">
              <div className="p-2 h-[500px] overflow-y-auto">
                <h3 className="font-semibold text-lg flex items-center space-x-2">
                  <img src="/public/assets/GoSync.png" alt="Bell" className="w-5 h-5" />
                  <span>Notifications</span>
                </h3>

                {notifications.length === 0 ? (
                  <p className="text-gray-500 py-2">No notifications</p>
                ) : (
                  <ul className="space-y-2 mt-2">
                    {notifications.map((notif, index) => (
                      <li
                        key={index}
                        className={`border-b pb-2 cursor-pointer ${
                          notif.read ? "text-gray-500" : "text-black font-medium"
                        }`}
                        onClick={() => handleMessageClick(notif)}
                      >
                        <div>{notif.message}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDateTime(notif.timestamp)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => navigate("/settings")} aria-label="Settings">
          <FiSettings size={24} />
        </button>
        <button className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center" aria-label="User profile">
          <FiUser size={24} />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-red-500 hover:text-red-700"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {isAdminModalOpen && (
        <AdminModal isOpen={isAdminModalOpen} onClose={() => setAdminModalOpen(false)} />
      )}

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

export default Navbar;
