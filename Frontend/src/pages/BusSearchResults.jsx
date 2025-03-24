import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar1 from "../components/Navbar1";
import BusCard from "../components/BusCard";

const BusSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRoute, journeyDate } = location.state || {};
  const [busResults, setBusResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Extract from and to destinations from the route
  const [from, to] = selectedRoute ? selectedRoute.split(" - ") : ["", ""];
  
  useEffect(() => {
    // In a real application, this would be an API call
    // For demonstration, we'll simulate loading with sample data
    const loadBusData = () => {
      setLoading(true);
      
      // Simulate API call with timeout
      setTimeout(() => {
        // Sample bus data (in a real app, this would come from an API)
        const mockResults = [
          {
            id: 1,
            route: `${from} - Kattankudy`,
            routeNumber: "48",
            viaAirport: true,
            departure: {
              location: from,
              date: journeyDate,
              time: "21:00"
            },
            arrival: {
              location: "Kattankudy",
              date: new Date(new Date(journeyDate).getTime() + 86400000).toISOString().split('T')[0], // Next day
              time: "04:00"
            },
            duration: "07:00 Hours",
            travel: {
              name: "Zeena Travels",
              busNumber: "ZT-48-2100-CK",
              type: "Super Luxury"
            },
            price: 2500.00,
            availableSeats: 5,
            bookingClosing: `${journeyDate} | 20:00`
          },
          {
            id: 2,
            route: `${from} - Akkaraipattu`,
            routeNumber: "48",
            viaAirport: true,
            departure: {
              location: from,
              date: journeyDate,
              time: "19:30"
            },
            arrival: {
              location: "Akkaraipattu",
              date: new Date(new Date(journeyDate).getTime() + 86400000).toISOString().split('T')[0], // Next day
              time: "04:00"
            },
            duration: "08:30 Hours",
            travel: {
              name: "AL-ALHA TRAVELS",
              busNumber: "AAT-48-ND4401-1930-CA",
              type: "Super Luxury"
            },
            price: 2800.00,
            availableSeats: 8,
            bookingClosing: `${journeyDate} | 18:30`
          },
          {
            id: 3,
            route: `${from} - ${to}`,
            routeNumber: "42",
            viaAirport: false,
            departure: {
              location: from,
              date: journeyDate,
              time: "22:30"
            },
            arrival: {
              location: to,
              date: new Date(new Date(journeyDate).getTime() + 86400000).toISOString().split('T')[0], // Next day
              time: "05:30"
            },
            duration: "07:00 Hours",
            travel: {
              name: "Lanka Express",
              busNumber: "LE-42-5678-CO",
              type: "Semi Luxury"
            },
            price: 2300.00,
            availableSeats: 12,
            bookingClosing: `${journeyDate} | 21:30`
          }
        ];
        
        setBusResults(mockResults);
        setLoading(false);
      }, 1000);
    };
    
    if (selectedRoute && journeyDate) {
      loadBusData();
    } else {
      // If no route or date is provided, redirect back to homepage
      navigate('/');
    }
  }, [selectedRoute, journeyDate, from, to, navigate]);
  
  const handleModify = () => {
    navigate(-1);
  };
  
  const handleViewSeat = (busId) => {
    console.log(`View seat for bus ID: ${busId}`);
    // Navigate to seat selection page (implementation will come later)
    // navigate(`/select-seat/${busId}`, { state: { busId, from, to, journeyDate } });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation bar */}
      <Navbar1 />
      
      {/* Secondary navbar with actions */}
      <div className="bg-black text-white py-2 px-4">
        <div className="container mx-auto flex justify-end space-x-4">
          <button className="hover:underline">Send Ticket</button>
          <button className="hover:underline">Transfer Ticket</button>
          <button className="hover:underline">Cancel Ticket</button>
        </div>
      </div>
      
      {/* Journey details header */}
      <div className="bg-red-600 text-white py-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <h1 className="text-2xl font-bold">{from}</h1>
            <span className="text-2xl">⟫</span>
            <h1 className="text-2xl font-bold">{to}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xl">{journeyDate}</span>
            <button 
              onClick={handleModify}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Modify
            </button>
          </div>
        </div>
      </div>
      
      {/* Filter options */}
      <div className="bg-gray-200 py-3">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 text-center font-semibold">
          <div className="cursor-pointer hover:bg-gray-300 py-2">SORT</div>
          <div className="cursor-pointer hover:bg-gray-300 py-2">DEPARTURE TIME</div>
          <div className="cursor-pointer hover:bg-gray-300 py-2">ARRIVAL TIME</div>
          <div className="cursor-pointer hover:bg-gray-300 py-2">AVAILABLE SEATS</div>
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
            <BusCard 
              key={bus.id} 
              bus={bus} 
              onViewSeat={handleViewSeat} 
            />
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
      
      {/* Footer (reuse from HomePage) */}
      <footer className="bg-gray-800 text-white py-8 mt-8">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About Us</h3>
            <p>Sri Lanka's premier online bus booking platform. Book your journey across the island with ease and convenience.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">Home</a></li>
              <li><a href="#" className="hover:underline">Bus Routes</a></li>
              <li><a href="#" className="hover:underline">My Bookings</a></li>
              <li><a href="#" className="hover:underline">Contact Us</a></li>
              <li><a href="#" className="hover:underline">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Bus Operators</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:underline">Sri Lanka Transport Board</a></li>
              <li><a href="#" className="hover:underline">Luxury Bus Services</a></li>
              <li><a href="#" className="hover:underline">Express Services</a></li>
              <li><a href="#" className="hover:underline">Register as Operator</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <p>Email: support@busbooking.lk</p>
            <p>Phone: +94 11 234 5678</p>
            <p>Office Hours: 8am - 8pm (Daily)</p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500">FB</a>
              <a href="#" className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500">IG</a>
              <a href="#" className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500">TW</a>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto mt-8 pt-4 border-t border-gray-700 text-center">
          <p>&copy; 2025 Bus Booking System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BusSearchResults;