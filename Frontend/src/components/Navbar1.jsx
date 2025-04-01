import { useEffect, useState } from "react";
import { FiBell, FiSearch, FiSettings, FiUser, FiLogOut, FiXCircle } from "react-icons/fi";
import io from "socket.io-client"; 
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import AdminModal from "./AdminModal";
import axios from "axios";

const socket = io("http://localhost:5000"); // Replace with your backend URL

const Navbar1 = () => {
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

  const handleCancelTicket = () => {
    navigate("/cancel-ticket");
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [notifResponse, msgResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/notifications"),
          axios.get("http://localhost:5000/api/shed/messages"),
        ]);

        // Extract only sent messages
        const sentMessages = msgResponse.data.data.filter((msg) => msg.status === "sent");

        // Merge and sort by latest createdAt timestamp
        const allNotifications = [...notifResponse.data, ...sentMessages].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
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

    // Listen for real-time notifications
    socket.on("newNotification", (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ));
      setHasUnread(true);
    });

    return () => socket.off("newNotification");
  }, []);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
    if (!showDropdown) {
      setHasUnread(false); // Mark notifications as read
    }
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow-md">
      {/* Left: Logo & Title */}
      <div className="flex items-center space-x-3">
        <img src="/assets/GoSync-Logo_Length2.png" alt="GoSync Logo" className="h-12" />
        <h1 className="text-lg font-semibold text-gray-700">An Online Bus Ticket Booking System</h1>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center space-x-4">
        {/* Search Input */}
        <div className="flex items-center space-x-2">
          <FiSearch size={20} />
          <input type="text" placeholder="Search..." className="border-b outline-none" />
        </div>

        {/* Add Admin Button */}
        <button
          onClick={() => setAdminModalOpen(true)}
          className="bg-deepOrange text-white px-4 py-2 rounded-lg hover:bg-sunsetOrange transition"
        >
          Add an Admin
        </button>
{/* Bell Icon - Notifications */}
<div className="relative">
  <button onClick={toggleDropdown} className="relative">
    <FiBell size={24} />
    {notifications.length > 0 && (
      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
        {notifications.length}
      </span>
    )}
  </button>

  {/* Notifications Dropdown */}
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


        {/* Settings Button */}
        <button>
          <FiSettings size={24} />
        </button>

        {/* Profile Button */}
        <button className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <FiUser size={24} />
        </button>

        {/* Cancel Ticket Button */}
        <button
          onClick={handleCancelTicket}
          className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
        >
          <FiXCircle size={20} />
          <span>Cancel Ticket</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Admin Modal */}
      {isAdminModalOpen && (
        <AdminModal isOpen={isAdminModalOpen} onClose={() => setAdminModalOpen(false)} />
      )}
    </nav>
  );
};

export default Navbar1;
