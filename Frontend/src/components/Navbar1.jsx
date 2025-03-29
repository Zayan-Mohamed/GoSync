import React from "react";
import { Link } from "react-router-dom";
import gosyncLogo from "/assets/GoSync-Logo_Length2.png";
import { FiBell} from "react-icons/fi";

const Navbar1 = () => {
  return (
    <nav className="navbar">

      <img src={gosyncLogo} alt="GoSync Logo" className="w-28 mb-2 ml-2 mt-3" />
      <span className="text-3xl text-start">An Online Bus Ticket Booking System</span>
      <div className="nav-links">

      
        
        <Link to="/send-ticket">Send Ticket</Link>
        <Link to="/transfer-ticket">Transfer Ticket</Link>
        <Link to="/cancel-ticket">Cancel Ticket</Link>
      </div>
    </nav>
  );
};

export default Navbar1;
