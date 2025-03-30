import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar1 from "../components/Navbar1";
import BusCard from "../components/BusCard";
import Footer1 from "../components/Footer1";

const BusSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get search details from Passenger Homepage
  const { fromLocation, toLocation, journeyDate } = location.state || {};

  const [busResults, setBusResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fromLocation || !toLocation || !journeyDate) {
      navigate("/"); // Redirect to homepage if required data is missing
      return;
    }

    const fetchBusResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("http://localhost:5000/api/search-buses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromLocation,
            toLocation,
            selectedDate: journeyDate,
          }),
        });

        if (!response.ok) {
          throw new Error("No buses found for this route and date");
        }

        const data = await response.json();
        setBusResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBusResults();
  }, [fromLocation, toLocation, journeyDate, navigate]);

  const handleModify = () => {
    navigate(-1); // Go back to modify search
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
        ) : error ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700">{error}</h2>
            <p className="mt-2 text-gray-600">Try modifying your search criteria</p>
            <button
              onClick={handleModify}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
            >
              Modify Search
            </button>
          </div>
        ) : (
          busResults.map((bus, index) => (
            <BusCard key={index} bus={bus} onViewSeat={handleViewSeat} />
          ))
        )}
      </div>

      <Footer1 />
    </div>
  );
};

export default BusSearchResults;
