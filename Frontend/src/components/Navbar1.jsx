import React from "react";
<<<<<<< HEAD
import { Link } from "react-router-dom";
import gosyncLogo from "/assets/GoSync-Logo_Length2.png";
import { FiBell} from "react-icons/fi";
=======
import { useNavigate } from "react-router-dom";
import { FiXCircle, FiLogOut, FiBell, FiSettings, FiUser } from "react-icons/fi";
>>>>>>> f6bc17066e8a99bae9dc24f455b7339a9fc9e739

const Navbar1 = () => {
  const navigate = useNavigate();

  const handleCancelTicket = () => {
    navigate("/cancel-ticket");
  };

  const handleLogout = () => {
    console.log("Logging out...");
    navigate("/login");
  };

  return (
<<<<<<< HEAD
    <nav className="navbar">

      <img src={gosyncLogo} alt="GoSync Logo" className="w-28 mb-2 ml-2 mt-3" />
      <span className="text-3xl text-start">An Online Bus Ticket Booking System</span>
      <div className="nav-links">

      
        
        <Link to="/send-ticket">Send Ticket</Link>
        <Link to="/transfer-ticket">Transfer Ticket</Link>
        <Link to="/cancel-ticket">Cancel Ticket</Link>
=======
    <nav className="flex justify-between items-center p-4 bg-white shadow-md">
      {/* Left: Logo */}
      <div className="flex items-center space-x-3">
        <img src="/assets/GoSync-Logo_Length2.png" alt="GoSync Logo" className="h-12" />
        <h1 className="text-lg font-semibold text-gray-700">An Online Bus Ticket Booking System</h1>
      </div>

      {/* Right: Buttons */}
      <div className="flex items-center space-x-4">
        {/* Notification Button */}
        <button className="relative text-gray-600 hover:text-gray-800 transition">
          <FiBell size={24} />
        </button>

        {/* Settings Button */}
        <button className="text-gray-600 hover:text-gray-800 transition">
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
>>>>>>> f6bc17066e8a99bae9dc24f455b7339a9fc9e739
      </div>
    </nav>
  );
};

export default Navbar1;
