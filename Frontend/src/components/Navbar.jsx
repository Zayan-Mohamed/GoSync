import React, {useState, useRef } from "react";
import {

  FiSearch,
  FiSettings,
  FiUser,
  FiLogOut,

} from "react-icons/fi";

import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";

import AdminModal from "./AdminModal";
import NotificationBell from "./NotificationBell";


const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isAdminModalOpen, setAdminModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const toggleProfileMenu = () => {
    setShowProfileMenu((prev) => !prev);
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
        <NotificationBell role="admin" />

        {/* <NotificationBell /> */}

       
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
        <AdminModal isOpen={isAdminModalOpen} onClose={() => setAdminModalOpen(false)} />
      )}
    </div>
  );
};

export default Navbar;
