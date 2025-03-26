import { useEffect, useState } from "react";
import { FiBell, FiSearch, FiSettings, FiUser, FiLogOut } from "react-icons/fi";
<<<<<<< HEAD
import io from "socket.io-client";
import axios from "axios";
=======
import io from "socket.io-client"; // Import socket.io-client
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import AdminModal from "./AdminModal";
>>>>>>> 22430934730fd5c25693537cc2db09d8bd01f2e5

const socket = io("http://localhost:5000"); // Replace with your backend URL

const Navbar = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

<<<<<<< HEAD
=======
  const [isAdminModalOpen, setAdminModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch initial notifications from the backend
>>>>>>> 22430934730fd5c25693537cc2db09d8bd01f2e5
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch both notifications and messages
        const [notifResponse, msgResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/notifications"),
          axios.get("http://localhost:5000/api/shed/messages"),
        ]);

        // Extract sent messages
        const sentMessages = msgResponse.data.data.filter((msg) => msg.status === "sent");

        // Combine and sort notifications and messages by latest date
        const allNotifications = [...notifResponse.data, ...sentMessages].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setNotifications(allNotifications);

        // If there are new notifications, mark them as unread
        if (allNotifications.length > 0) {
          setHasUnread(true);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
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
      // Mark notifications as read when the dropdown is opened
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

<<<<<<< HEAD
=======
        {/* Bell Icon - Notifications */}
>>>>>>> 22430934730fd5c25693537cc2db09d8bd01f2e5
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
            <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg overflow-hidden">
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
