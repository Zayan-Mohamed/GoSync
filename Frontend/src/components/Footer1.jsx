import React from "react";
import { FiFacebook, FiInstagram, FiTwitter } from "react-icons/fi";

const Footer1 = () => {
  return (
    <footer className="bg-white text-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo Section */}
        <div className="flex flex-col items-start">
          <img src="/assets/GoSync.png" alt="GoSync Logo" className="w-15 h-auto" />
        </div>

        {/* About Us Section */}
        <div>
          <h3 className="text-lg font-semibold text-orange-600 mb-4">About Us</h3>
          <p className="text-sm text-gray-600">
            Sri Lanka's premier online bus booking platform. Book your journey across the island
            with ease and convenience.
          </p>
        </div>

        {/* Quick Links Section */}
        <div>
          <h3 className="text-lg font-semibold text-orange-600 mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-gray-600 hover:text-orange-600 transition">Home</a></li>
            <li><a href="#" className="text-gray-600 hover:text-orange-600 transition">Bus Routes</a></li>
            <li><a href="#" className="text-gray-600 hover:text-orange-600 transition">My Bookings</a></li>
            <li><a href="#" className="text-gray-600 hover:text-orange-600 transition">Contact Us</a></li>
            <li><a href="#" className="text-gray-600 hover:text-orange-600 transition">FAQ</a></li>
          </ul>
        </div>

        {/* Contact Us Section */}
        <div>
          <h3 className="text-lg font-semibold text-orange-600 mb-4">Contact Us</h3>
          <p className="text-sm text-gray-600">Email: support@gosync.lk</p>
          <p className="text-sm text-gray-600">Phone: +94 11 234 5678</p>
          <p className="text-sm text-gray-600">Office Hours: 8am - 8pm (Daily)</p>
          <div className="flex gap-3 mt-3">
            <a href="#" className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition">
              <FiFacebook size={20} />
            </a>
            <a href="#" className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition">
              <FiInstagram size={20} />
            </a>
            <a href="#" className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition">
              <FiTwitter size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="bg-orange-500 text-white text-center py-3">
        <p>&copy; 2025 GoSync. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer1;
