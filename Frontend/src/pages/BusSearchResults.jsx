import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar1 from "../components/Navbar1";
import BusCard from "../components/BusCard";
import Footer1 from "../components/Footer1";

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
      
{/* Journey details header - Optimized with repositioned date */}
<div className="bg-deepOrange text-white py-3">
  <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center px-4">
    <div className="flex items-center space-x-3">
      <h1 className="text-xl font-bold">{from}</h1>
      <span className="text-xl">⟫</span>
      <h1 className="text-xl font-bold">{to}</h1>
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

{/* Filter options - Optimized */}
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
      
      <Footer1 />
    </div>
  );
};

export default BusSearchResults;