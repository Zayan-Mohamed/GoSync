import { useEffect, useState } from "react";
import { FiBell, FiSearch, FiSettings, FiUser, FiLogOut } from "react-icons/fi";
import io from "socket.io-client";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import AdminModal from "./AdminModal";
import axios from "axios";

const API_URI = import.meta.env.VITE_API_URL;

const socket = io(`${API_URI}`); // Replace with your backend URL

const Navbar = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isAdminModalOpen, setAdminModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch initial notifications and scheduled messages
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [notifResponse, msgResponse] = await Promise.all([
          axios.get(`${API_URI}/api/notifications`),
          axios.get(`${API_URI}/api/shed/messages`),
        ]);

        const notificationsData = notifResponse.data
          .filter((notif) => !notif.expiredAt || new Date(notif.expiredAt) > new Date()) // Filter out expired notifications
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

        const allNotifications = [...notificationsData, ...sentMessages]
          .sort((a, b) => b.timestamp - a.timestamp);

        setNotifications(allNotifications);

        if (allNotifications.length > 0) {
          setHasUnread(true);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    // Listen for real-time notifications
    socket.on("newNotification", (newNotif) => {
      // Filter out expired notifications when they arrive
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

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
    if (!showDropdown) {
      setHasUnread(false);
    }
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-md">
      <div className="flex items-center space-x-3">
        <FiSearch size={20} />
        <input type="text" placeholder="Search..." className="border-b outline-none" />
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => setAdminModalOpen(true)}
          className="bg-deepOrange text-white px-4 py-2 rounded-lg hover:bg-sunsetOrange transition"
        >
          Add an Admin
        </button>

        <div className="relative">
          <button onClick={toggleDropdown}>
            <FiBell size={24} />
            {hasUnread && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="fixed right-4 top-16 w-64 bg-white shadow-lg rounded-lg overflow-hidden z-50 border border-gray-300">
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

        <button>
          <FiSettings size={24} />
        </button>
        <button className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
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
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setAdminModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Navbar;
