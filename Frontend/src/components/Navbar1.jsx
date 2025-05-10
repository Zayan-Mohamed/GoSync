import React, { useState,useRef } from "react";
import gosyncLogo from "/assets/GoSync-Logo_Length2.png";
import { useNavigate } from "react-router-dom";
import {
  FiXCircle,
  FiLogOut,
  FiSettings,
  FiUser,
  FiChevronDown,
  FiSearch,
  FiClock,
  FiBook,

 

  
} from "react-icons/fi";
import useAuthStore from "../store/authStore";
import NotificationBell from "./NotificationBell";
import { motion, AnimatePresence } from "framer-motion";






const Navbar1 = () => {
 
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const actionMenuRef = useRef(null);
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
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        {/* <NotificationBell /> */}
        <NotificationBell role="passenger" />

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
