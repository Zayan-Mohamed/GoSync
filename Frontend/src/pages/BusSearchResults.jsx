import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar1 from "../components/Navbar1";
import BusCard from "../components/BusCard";
import Footer1 from "../components/Footer1";

const BusSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get from, to, and date from Passenger Homepage
  const { fromLocation, toLocation, journeyDate } = location.state || {};

  const [busResults, setBusResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fromLocation || !toLocation || !journeyDate) {
      navigate("/"); // Redirect if required data is missing
      return;
    }

    setLoading(true);

    // Simulate API call with sample bus data
    setTimeout(() => {
      const mockResults = [
        {
          id: 1,
          route: `${fromLocation} - Kattankudy`,
          routeNumber: "48",
          viaAirport: true,
          departure: {
            location: fromLocation,
            date: journeyDate,
            time: "21:00",
          },
          arrival: {
            location: "Kattankudy",
            date: new Date(new Date(journeyDate).getTime() + 86400000).toISOString().split("T")[0], // Next day
            time: "04:00",
          },
          duration: "07:00 Hours",
          travel: {
            name: "Zeena Travels",
            busNumber: "ZT-48-2100-CK",
            type: "Super Luxury",
          },
          price: 2500.0,
          availableSeats: 5,
          bookingClosing: `${journeyDate} | 20:00`,
        },
        {
          id: 2,
          route: `${fromLocation} - ${toLocation}`,
          routeNumber: "42",
          viaAirport: false,
          departure: {
            location: fromLocation,
            date: journeyDate,
            time: "22:30",
          },
          arrival: {
            location: toLocation,
            date: new Date(new Date(journeyDate).getTime() + 86400000).toISOString().split("T")[0], // Next day
            time: "05:30",
          },
          duration: "07:00 Hours",
          travel: {
            name: "Lanka Express",
            busNumber: "LE-42-5678-CO",
            type: "Semi Luxury",
          },
          price: 2300.0,
          availableSeats: 12,
          bookingClosing: `${journeyDate} | 21:30`,
        },
      ];

      setBusResults(mockResults);
      setLoading(false);
    }, 1000);
  }, [fromLocation, toLocation, journeyDate, navigate]);

  const handleModify = () => {
    navigate(-1);
  };

  const handleViewSeat = (busId) => {
    console.log(`View seat for bus ID: ${busId}`);
    // Navigate to seat selection page
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar1 />

      {/* Journey details header */}
      <div className="bg-deepOrange text-white py-3">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center px-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold">{fromLocation}</h1>
            <span className="text-xl">⟫</span>
            <h1 className="text-xl font-bold">{toLocation}</h1>
          </div>
          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            <span className="text-white">{journeyDate}</span>
            <button
              onClick={handleModify}
              className="bg-brightYellow text-darkCharcoal px-3 py-1 rounded text-sm hover:bg-lightYellow"
            >
              Modify
            </button>
          </div>
        </div>
      </div>

      {/* Filter options */}
      <div className="bg-softPeach py-2">
        <div className="container mx-auto flex justify-between text-darkCharcoal text-sm">
          <button className="py-1 px-2 hover:bg-lightYellow font-medium">SORT</button>
          <button className="py-1 px-2 hover:bg-lightYellow font-medium">DEPARTURE</button>
          <button className="py-1 px-2 hover:bg-lightYellow font-medium">ARRIVAL</button>
          <button className="py-1 px-2 hover:bg-lightYellow font-medium">SEATS</button>
        </div>
      </div>

      {/* Bus results */}
      <div className="container mx-auto py-4 px-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-lg text-gray-700">Loading buses...</p>
            </div>
          </div>
        ) : busResults.length > 0 ? (
          busResults.map((bus) => (
            <BusCard key={bus.id} bus={bus} onViewSeat={handleViewSeat} />
          ))
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700">No buses found for this route and date</h2>
            <p className="mt-2 text-gray-600">Try modifying your search criteria</p>
            <button
              onClick={handleModify}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
            >
              Modify Search
            </button>
          </div>
        )}
      </div>

      <Footer1 />
    </div>
  );
};

export default BusSearchResults;
