import { useEffect, useState } from "react";
import { FiBell, FiSearch, FiSettings, FiUser, FiLogOut, FiMenu, FiX } from "react-icons/fi";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [notifResponse, msgResponse] = await Promise.all([
          axios.get(`${API_URI}/api/notifications`),
          axios.get(`${API_URI}/api/shed/messages`),
        ]);

        const sentMessages = msgResponse.data.data.filter((msg) => msg.status === "sent");
        const allNotifications = [...notifResponse.data, ...sentMessages].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setNotifications(allNotifications);
        if (allNotifications.length > 0) setHasUnread(true);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchNotifications();
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
    if (!showDropdown) setHasUnread(false);
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-md w-full h-28">
      {/* Left Section - Search */}
      <div className="flex items-center space-x-3">
        <FiSearch size={20} className="hidden md:block" />
        <input type="text" placeholder="Search..." className="border-b outline-none hidden md:block" />
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Right Section - Icons & Buttons */}
      <div className={`flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 absolute md:relative top-16 md:top-0 left-0 w-full md:w-auto bg-white md:bg-transparent shadow-md md:shadow-none p-4 md:p-0 transition-all duration-300 ${isMenuOpen ? "block" : "hidden md:flex"}`}>
        <button
          onClick={() => setAdminModalOpen(true)}
          className="bg-deepOrange text-white px-4 py-2 rounded-lg hover:bg-sunsetOrange transition"
        >
          Add Admin
        </button>

        {/* Bell Icon - Notifications */}
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
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg overflow-hidden z-50">
              <div className="p-2">
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

      {/* Admin Modal */}
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
