import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar1 from "../components/Navbar1";

const BookingLayout = ({ children }) => {
  return (
      <div className="flex-1 flex flex-col bg-gray-100 h-screen overflow-hidden">
        {/* Navbar */}
        <Navbar1 />
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
  );
};

export default BookingLayout;
