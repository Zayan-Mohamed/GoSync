import React, { useState } from "react";
import {  FiMap, FiCalendar } from "react-icons/fi";
import { IoSwapHorizontal } from "react-icons/io5";
import useStopStore from "../store/stopStore";
import { useNavigate } from "react-router-dom";
import "../styles/BookingForm.css";

const BookingForm = ({ isVisible }) => {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [journeyDate, setJourneyDate] = useState("");

  const navigate = useNavigate();
  const { stops, loading, error, fetchStops } = useStopStore();

  React.useEffect(() => {
    fetchStops();
  }, [fetchStops]);

  const findBuses = () => {
    if (!fromLocation || !toLocation) {
      alert("Please select both from and to locations");
      return;
    }

    navigate("/bus-search-results", {
      state: { fromLocation, toLocation, journeyDate },
    });
  };

  const swapLocations = () => {
    setFromLocation(toLocation);
    setToLocation(fromLocation);
  };

  const locations = loading || error ? [] : stops
    .filter((stop) => stop.status === "active")
    .map((stop) => stop.stopName)
    .sort();

  return (
    <div className={`booking-container ${isVisible ? "slide-down" : "slide-up"}`}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl mx-auto transform hover:shadow-2xl transition-all duration-300">
        <h2 className="text-2xl font-bold text-[#212121] mb-6 text-center">Find Your Perfect Journey</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          {/* From Location */}
          <div className="md:col-span-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMap className="h-5 w-5 text-[#E65100]" />
              </div>
              <input
                type="text"
                list="fromLocations"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                placeholder="Where from?"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#E65100] focus:ring-2 focus:ring-[#FFE082] transition-all duration-300"
                required
                disabled={loading}
              />
              <datalist id="fromLocations">
                {locations.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center">
            <button
              onClick={swapLocations}
              className="p-2 rounded-full bg-[#FFE082] hover:bg-[#FFC107] transition-all duration-300"
              aria-label="Swap locations"
            >
              <IoSwapHorizontal className="h-6 w-6 text-[#E65100]" />
            </button>
          </div>

          {/* To Location */}
          <div className="md:col-span-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMap className="h-5 w-5 text-[#E65100]" />
              </div>
              <input
                type="text"
                list="toLocations"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                placeholder="Where to?"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#E65100] focus:ring-2 focus:ring-[#FFE082] transition-all duration-300"
                required
                disabled={loading}
              />
              <datalist id="toLocations">
                {locations.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Date Input - Full Width on Mobile */}
          <div className="md:col-span-4 md:mt-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiCalendar className="h-5 w-5 text-[#E65100]" />
              </div>
              <input
                type="date"
                value={journeyDate ? new Date(journeyDate).toISOString().split("T")[0] : ""}
                onChange={(e) => setJourneyDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#E65100] focus:ring-2 focus:ring-[#FFE082] transition-all duration-300"
                required
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="md:col-span-3 md:mt-4">
            <button
              onClick={findBuses}
              disabled={loading || !fromLocation || !toLocation}
              className="w-full py-3 px-6 bg-gradient-to-r from-[#E65100] to-[#FF8F00] text-white rounded-lg 
                hover:from-[#FF8F00] hover:to-[#FFC107] transition-all duration-300 
                disabled:opacity-50 disabled:cursor-not-allowed
                transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FFE082]
                flex items-center justify-center space-x-2"
            >
              <span>{loading ? "Loading Stops..." : "Search Buses"}</span>
              <svg
                className="w-5 h-5 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-red-700">Failed to load available stops. Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingForm;
