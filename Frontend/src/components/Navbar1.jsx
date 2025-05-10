import React, { useState, useEffect, useRef } from "react";
import gosyncLogo from "/assets/GoSync-Logo_Length2.png";
import { useNavigate } from "react-router-dom";
import {
  FiXCircle,
  FiLogOut,
  FiBell,
  FiSettings,
  FiUser,
  FiSearch,
  FiClock,
  FiBook,
  FiChevronDown,
  FiCheck,
  FiTrash2,
  FiCalendar,
} from "react-icons/fi";
import useAuthStore from "../store/authStore";
import axios from "axios";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const API_URI = import.meta.env.VITE_API_URL;
const socket = io(`${API_URI}`);

const Navbar1 = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Refs for clickaway detection
  const notificationRef = useRef(null);
  const actionMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
            read: false,
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

  const handleCancelTicket = () => {
    navigate("/cancel-ticket");
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleReserved = () => {
    navigate("/reserved");
    setIsDropdownOpen(false);
  };

  const handleBookingHistory = () => {
    navigate("/booking-history");
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
    if (!showDropdown) {
      setHasUnread(false);
    }
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
    <nav className="flex justify-between items-center p-4 bg-white shadow-md">
      {/* Left: Logo and Title */}
      <div className="flex items-center space-x-3 cursor-pointer">
        <img
          src={gosyncLogo}
          alt="GoSync Logo"
          onClick={() => navigate("/passenger")}
          className="h-12"
        />
        <h1 className="text-lg font-semibold text-gray-700 hidden md:block">
          An Online Bus Ticket Booking System
        </h1>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center relative mx-4 flex-1 max-w-md">
        <FiSearch
          size={20}
          className={`absolute left-3 ${isSearchFocused ? "text-deepOrange" : "text-gray-500"}`}
        />
        <input
          type="text"
          placeholder="Search routes, buses..."
          className={`w-full pl-10 pr-4 py-2 rounded-full border ${
            isSearchFocused
              ? "border-deepOrange ring-2 ring-deepOrange/20"
              : "border-gray-300"
          } focus:outline-none transition-colors duration-300`}
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

      {/* Right: Buttons */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleDropdown}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 relative"
            aria-label="Notifications"
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

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                className="absolute right-0 top-12 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-50 border border-gray-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
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
                          className={`p-3 hover:bg-gray-50 transition-colors ${!notif.read ? "bg-blue-50" : ""}`}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => navigate("/bus-schedules")}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          aria-label="Schedules"
        >
          <FiCalendar size={24} className="text-gray-600" />
        </button>

        <button
          onClick={() => navigate("/settings")}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          aria-label="Settings"
        >
          <FiSettings size={24} className="text-gray-600" />
        </button>

        <button
          onClick={() => navigate("/settings")}
          className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-deepOrange/50 transition-all duration-200"
          aria-label="Profile"
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

        {/* Dropdown Spinner */}
        <div className="relative" ref={actionMenuRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-deepOrange text-white rounded-lg hover:bg-red-700 transition"
          >
            <span className="hidden sm:inline">Actions</span>
            <FiChevronDown
              size={20}
              className={`transform transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 py-2 overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={handleReserved}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-yellow-600 hover:bg-yellow-50 transition"
                >
                  <FiClock size={20} />
                  <span>Reserved</span>
                </button>

                <button
                  onClick={handleCancelTicket}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition"
                >
                  <FiXCircle size={20} />
                  <span>Cancel Ticket</span>
                </button>

                <button
                  onClick={handleBookingHistory}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                >
                  <FiBook size={20} />
                  <span>Booking History</span>
                </button>

                <div className="border-t border-gray-100 my-2"></div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition"
                >
                  <FiLogOut size={20} />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar1;
