import React from "react";
import { Link } from "react-router-dom";

const Navbar1 = () => {
  return (
    <nav className="navbar">
      <h1>GoSync</h1>
      <div className="nav-links">
        <Link to="/send-ticket">Send Ticket</Link>
        <Link to="/transfer-ticket">Transfer Ticket</Link>
        <Link to="/cancel-ticket">Cancel Ticket</Link>
      </div>
    </nav>
  );
};

export default Navbar1;
