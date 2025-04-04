import React, { useState, useEffect } from "react";
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
} from "react-icons/fi";
import useAuthStore from "../store/authStore";
import AdminModal from "./AdminModal";
import axios from "axios";
import io from "socket.io-client"; // Import socket.io-client

const API_URI = import.meta.env.VITE_API_URL;
const socket = io(`${API_URI}`); // Replace with your backend URL

const Navbar1 = () => {
  const [isAdminModalOpen, setAdminModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
        if (allNotifications.length > 0) {
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
            { ...newNotif, timestamp: new Date(newNotif.createdAt).getTime() },
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

  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow-md">
      {/* Left: Logo and Title */}
      <div className="flex items-center space-x-3">
        <img
          src={gosyncLogo}
          alt="GoSync Logo"
          onClick={() => navigate("/passenger")}
          className="h-12"
        />
        <h1 className="text-lg font-semibold text-gray-700">
          An Online Bus Ticket Booking System
        </h1>
      </div>

      {/* Right: Buttons */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button onClick={toggleDropdown} className="relative">
            <FiBell size={24} />
            {hasUnread && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full w-64 bg-white shadow-lg rounded-lg z-50 border border-gray-300">
              <div className="p-2 h-[500px] overflow-y-auto">
                <h3 className="font-semibold text-lg">Notifications</h3>
                <ul className="space-y-2">
                  {notifications.map((notif, index) => (
                    <li key={index} className="border-b py-2">
                      {notif.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <button
          className="text-gray-600 hover:text-gray-800 transition"
          aria-label="Settings"
        >
          <FiSettings size={24} />
        </button>
        <button
          className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"
          aria-label="Profile"
        >
          <FiUser size={24} />
        </button>

        {/* Dropdown Spinner */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-deepOrange text-white rounded-lg hover:bg-red-700 transition"
          >
            <span>Actions</span>
            <FiChevronDown
              size={20}
              className={isDropdownOpen ? "rotate-180" : ""}
            />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
              <button
                onClick={handleReserved}
                className="flex items-center space-x-2 w-full px-4 py-2 text-yellow-600 hover:bg-yellow-100 transition"
              >
                <FiClock size={20} />
                <span>Reserved</span>
              </button>
              <button
                onClick={handleCancelTicket}
                className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-100 transition"
              >
                <FiXCircle size={20} />
                <span>Cancel Ticket</span>
              </button>
              <button
                onClick={handleBookingHistory}
                className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
              >
                <FiBook size={20} />
                <span>Booking History</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar1;
