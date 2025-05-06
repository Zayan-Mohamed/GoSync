import { useEffect, useState, useRef } from "react";
import {
  FiBell,
  FiSearch,
  FiSettings,
  FiUser,
  FiLogOut,
  FiCheck,
  FiTrash2,
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isAdminModalOpen, setAdminModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch initial notifications and scheduled messages
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [notifResponse, msgResponse] = await Promise.all([
          axios.get(`${API_URI}/api/notifications`),
          axios.get(`${API_URI}/api/shed/messages`),
        ]);

        const notificationsData = notifResponse.data
          .filter(
            (notif) =>
              !notif.expiredAt || new Date(notif.expiredAt) > new Date()
          )
          .map((notif) => ({
            ...notif,
            type: "notification",
            timestamp: new Date(notif.createdAt).getTime(),
            read: notif.read || false,
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

        setNotifications(allNotifications);

        if (allNotifications.some((notif) => !notif.read)) {
          setHasUnread(true);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    // Listen for real-time notifications
    socket.on("newNotification", (newNotif) => {
      if (!newNotif.expiredAt || new Date(newNotif.expiredAt) > new Date()) {
        setNotifications((prev) => {
          const updatedList = [
            {
              ...newNotif,
              timestamp: new Date(newNotif.createdAt).getTime(),
              read: false,
            },
            ...prev,
          ];
          return updatedList.sort((a, b) => b.timestamp - a.timestamp);
        });
        setHasUnread(true);
      }
    });

    return () => socket.off("newNotification");
  }, []);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
    if (!showDropdown) {
      setHasUnread(false);
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu((prev) => !prev);
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${API_URI}/api/notifications/mark-all-read`,
        {},
        { withCredentials: true }
      );
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setHasUnread(false);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await axios.delete(`${API_URI}/api/notifications/clear-all`, {
        withCredentials: true,
      });
      setNotifications([]);
      setHasUnread(false);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return diffMins <= 1 ? "Just now" : `${diffMins} mins ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-md">
      <div className="flex items-center space-x-3 relative">
        <FiSearch
          size={20}
          className={`${isSearchFocused ? "text-deepOrange" : "text-gray-500"}`}
        />
        <input
          type="text"
          placeholder="Search buses, routes, schedules..."
          className={`border-b ${
            isSearchFocused ? "border-deepOrange" : "border-gray-300"
          } outline-none transition-colors duration-300 w-64`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchQuery.trim()) {
              navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            }
          }}
        />
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => setAdminModalOpen(true)}
          className="bg-deepOrange text-white px-4 py-2 rounded-lg hover:bg-sunsetOrange transition"
        >
          Add an Admin
        </button>

        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleDropdown}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <FiBell
              size={24}
              className={hasUnread ? "text-deepOrange" : "text-gray-600"}
            />
            {hasUnread && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-12 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-50 border border-gray-200">
              <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-lg text-gray-800">
                  Notifications
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="p-1 hover:bg-gray-200 rounded text-sm flex items-center gap-1 text-green-600"
                    title="Mark all as read"
                  >
                    <FiCheck size={16} />
                  </button>
                  <button
                    onClick={deleteAllNotifications}
                    className="p-1 hover:bg-gray-200 rounded text-sm flex items-center gap-1 text-red-600"
                    title="Clear all"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {notifications.map((notif, index) => (
                      <li
                        key={index}
                        className={`p-3 hover:bg-gray-50 transition-colors ${
                          !notif.read ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <p
                              className={`text-sm ${!notif.read ? "font-medium" : ""}`}
                            >
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatNotificationTime(notif.timestamp)}
                            </p>
                          </div>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 border-t border-gray-200 text-center">
                  <button
                    className="text-sm font-medium text-deepOrange hover:underline"
                    onClick={() => {
                      navigate("/notification-management");
                      setShowDropdown(false);
                    }}
                  >
                    View All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/settings")}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          title="Settings"
        >
          <FiSettings size={24} className="text-gray-600" />
        </button>

        <div className="relative" ref={profileRef}>
          <button
            onClick={toggleProfileMenu}
            className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-deepOrange transition-all duration-200"
          >
            {user?.profilePictureData ? (
              <img
                src={user.profilePictureData}
                alt={user?.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser size={24} className="text-gray-600" />
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 py-2 border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || ""}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    navigate("/settings");
                    setShowProfileMenu(false);
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                >
                  <FiSettings className="mr-2" size={16} /> Profile Settings
                </button>

                <button
                  onClick={() => {
                    handleLogout();
                    setShowProfileMenu(false);
                  }}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left flex items-center"
                >
                  <FiLogOut className="mr-2" size={16} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAdminModalOpen && (
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setAdminModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Navbar;
