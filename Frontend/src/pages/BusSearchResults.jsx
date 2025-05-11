import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar1 from "../components/Navbar1";
import BusCard from "../components/BusCard";
import Footer1 from "../components/Footer1";
import BookingForm from "../components/BookingForm";
import socket from "../utils/socket";

const BusSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fromLocation, toLocation, journeyDate } = location.state || {};
  const [busResults, setBusResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("departure");
  const [showBookingForm, setShowBookingForm] = useState(false);

  const API_URI = import.meta.env.VITE_API_URL;

  // Setup socket connection for real-time updates
  useEffect(() => {
    if (!socket) {
      console.error("WebSocket connection unavailable");
      return;
    }

    console.log(
      "Using socket connection for bus search results:",
      socket.id || "connecting..."
    );

    // Handle seat updates
    socket.on("seatUpdate", (data) => {
      console.log("Received seat update:", data);
      if (data.busId && data.availableSeats !== undefined) {
        setBusResults((prev) =>
          prev.map((bus) =>
            bus.busId === data.busId && bus.scheduleId === data.scheduleId
              ? { ...bus, availableSeats: data.availableSeats }
              : bus
          )
        );
      }
    });

    // Join rooms for each bus in search results
    if (busResults.length > 0) {
      busResults.forEach((bus) => {
        socket.emit("joinTrip", {
          busId: bus.busId,
          scheduleId: bus.scheduleId,
        });
        console.log(`Joined trip room: ${bus.busId}-${bus.scheduleId}`);
      });
    }

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    return () => {
      // Clean up listeners but don't disconnect the shared socket
      socket.off("seatUpdate");
      socket.off("connect_error");
    };
  }, [busResults]);

  useEffect(() => {
    if (!fromLocation || !toLocation || !journeyDate) {
      navigate("/"); // Redirect to homepage if required data is missing
      return;
    }

    const fetchBusResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URI}/api/buses/search-buses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromLocation,
            toLocation,
            selectedDate: journeyDate,
            includeStops: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to find buses");
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
  }, [fromLocation, toLocation, journeyDate, API_URI, navigate]);

  const handleModify = () => {
    setShowBookingForm(!showBookingForm); // Toggle booking form visibility
  };

  const handleModifySearch = () => {
    navigate("/passenger", {
      state: {
        fromLocation,
        toLocation,
        journeyDate,
      },
    });
  };

  const handleFormSubmit = (formData) => {
    // Update the search with new criteria
    navigate("/bus-search-results", {
      state: {
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        journeyDate: formData.journeyDate,
      },
    });
    setShowBookingForm(false); // Hide the form after submission
  };

  const handleViewSeat = (busId, scheduleId) => {
    navigate("/seat-selection", {
      state: {
        busId,
        scheduleId,
        fromLocation,
        toLocation,
        journeyDate,
      },
    });
  };

  const sortBusResults = () => {
    let sortedResults = [...busResults];

    switch (sortBy) {
      case "departure":
        sortedResults.sort((a, b) =>
          a.schedule.departureTime.localeCompare(b.schedule.departureTime)
        );
        break;
      case "arrival":
        sortedResults.sort((a, b) =>
          a.schedule.arrivalTime.localeCompare(b.schedule.arrivalTime)
        );
        break;
      case "price":
        sortedResults.sort((a, b) => a.fareAmount - b.fareAmount);
        break;
      case "seats":
        sortedResults.sort((a, b) => b.availableSeats - a.availableSeats);
        break;
      default:
        break;
    }

    return sortedResults;
  };

  const formatDate = (dateString) => {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar1 />

      {/* Journey details header */}
      <div className="bg-gradient-to-r from-deepOrange to-sunsetOrange shadow-lg">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Journey Information */}
            <div className="flex items-center space-x-6">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-gray-200 text-sm mb-1">From</span>
                <h1 className="text-2xl font-bold text-white">
                  {fromLocation}
                </h1>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-start">
                <span className="text-gray-200 text-sm mb-1">To</span>
                <h1 className="text-2xl font-bold text-white">{toLocation}</h1>
              </div>
            </div>

            {/* Date and Modify Button */}
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-white font-medium">
                  {journeyDate ? formatDate(journeyDate) : ""}
                </span>
              </div>
              <button
                onClick={handleModify}
                className="bg-white text-deepOrange px-6 py-2 rounded-full font-medium text-sm hover:bg-gray-100 transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {showBookingForm ? "Cancel" : "Modify Search"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Booking Form - Only shown when showBookingForm is true */}
      <BookingForm
        isVisible={showBookingForm}
        initialValues={{ fromLocation, toLocation, journeyDate }}
        onSubmit={handleFormSubmit}
      />

      {/* Filter options */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto flex flex-wrap sm:flex-nowrap justify-between items-center px-4 py-3">
          <div className="text-sm font-medium text-gray-500 mr-4 hidden sm:block">
            Sort by:
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center space-x-2
                ${
                  sortBy === "price"
                    ? "bg-deepOrange text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              onClick={() => setSortBy("price")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Price</span>
            </button>
            <button
              className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center space-x-2
                ${
                  sortBy === "departure"
                    ? "bg-deepOrange text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              onClick={() => setSortBy("departure")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Departure</span>
            </button>
            <button
              className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center space-x-2
                ${
                  sortBy === "arrival"
                    ? "bg-deepOrange text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              onClick={() => setSortBy("arrival")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
              <span>Arrival</span>
            </button>
            <button
              className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center space-x-2
                ${
                  sortBy === "seats"
                    ? "bg-deepOrange text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              onClick={() => setSortBy("seats")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Seats</span>
            </button>
          </div>
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
            <p className="mt-2 text-gray-600">
              Try modifying your search criteria
            </p>
            <button
              onClick={handleModifySearch}
              className="mt-4 bg-deepOrange text-white px-6 py-2 rounded hover:bg-sunsetOrange"
            >
              Modify Search
            </button>
          </div>
        ) : busResults.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700">
              No buses found
            </h2>
            <p className="mt-2 text-gray-600">
              Try modifying your search criteria
            </p>
            <button
              onClick={handleModify}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Modify Search
            </button>
          </div>
        ) : (
          sortBusResults().map((bus) => (
            <div key={bus.busId} className="mb-6">
              <BusCard bus={bus} onViewSeat={handleViewSeat} />
            </div>
          ))
        )}
      </div>

      <Footer1 />
    </div>
  );
};

export default BusSearchResults;
