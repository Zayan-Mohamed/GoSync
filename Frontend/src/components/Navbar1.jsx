import React, { useState } from "react";
import gosyncLogo from "/assets/GoSync-Logo_Length2.png";
import { useNavigate } from "react-router-dom";
import { FiXCircle, FiLogOut, FiBell, FiSettings, FiUser, FiClock, FiBook, FiChevronDown } from "react-icons/fi";
import useAuthStore from "../store/authStore";

const Navbar1 = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
      <div className="flex items-center space-x-3">
        <img src={gosyncLogo} alt="GoSync Logo" onClick={() => navigate("/passenger")} className="h-12" />
        <h1 className="text-lg font-semibold text-gray-700">An Online Bus Ticket Booking System</h1>
      </div>

      {/* Right: Buttons */}
      <div className="flex items-center space-x-4">
        <button className="relative text-gray-600 hover:text-gray-800 transition" aria-label="Notifications">
          <FiBell size={24} />
        </button>
        <button className="text-gray-600 hover:text-gray-800 transition" aria-label="Settings">
          <FiSettings size={24} />
        </button>
        <button className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center" aria-label="Profile">
          <FiUser size={24} />
        </button>

        {/* Dropdown Spinner */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-deepOrange text-white rounded-lg hover:bg-red-700 transition"
          >
            <span>Actions</span>
            <FiChevronDown size={20} className={isDropdownOpen ? "rotate-180" : ""} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
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