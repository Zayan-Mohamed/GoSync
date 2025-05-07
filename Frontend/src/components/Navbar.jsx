import { FiSearch, FiSettings, FiUser, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import AdminModal from "./AdminModal";
import NotificationBell from "./NotificationBell";
import React, { useState } from 'react';


const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isAdminModalOpen, setAdminModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
        <NotificationBell role="admin" />

        {/* <NotificationBell /> */}

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
    </div>
  );
};

export default Navbar;
