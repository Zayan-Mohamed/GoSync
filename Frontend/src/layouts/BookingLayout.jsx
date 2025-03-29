import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const BookingLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Can be hidden if not needed */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col bg-gray-100 h-screen overflow-hidden">
        {/* Navbar */}
        <Navbar />
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default BookingLayout;
