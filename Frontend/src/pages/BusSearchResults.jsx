import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Navbar1 from "../components/Navbar1";
import BusCard from "../components/BusCard";
import Footer1 from "../components/Footer1";
import BookingForm from "../components/BookingForm";

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

  useEffect(() => {
    const socket = io(`${API_URI}`, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      busResults.forEach((bus) => {
        socket.emit("joinTrip", {
          busId: bus.busId,
          scheduleId: bus.scheduleId,
        });
      });
    });

    socket.on("seatUpdate", (data) => {
      setBusResults((prev) =>
        prev.map((bus) =>
          bus.busId === data.busId && bus.scheduleId === data.scheduleId
            ? { ...bus, availableSeats: data.availableSeats }
            : bus
        )
      );
    });

    return () => socket.disconnect();
  }, [busResults, API_URI]);

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
            includeStops: true
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
      <div className="bg-deepOrange text-white py-3">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center px-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold">{fromLocation}</h1>
            <span className="text-xl">⟫</span>
            <h1 className="text-xl font-bold">{toLocation}</h1>
          </div>
          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            <span className="text-white">
              {journeyDate ? formatDate(journeyDate) : ""}
            </span>
            <button
              onClick={handleModify}
              className="bg-brightYellow text-darkCharcoal px-3 py-1 rounded text-sm hover:bg-lightYellow"
            >
              {showBookingForm ? "Cancel" : "Modify"}
            </button>
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
      <div className="bg-softPeach py-2">
        <div className="container mx-auto flex justify-between text-darkCharcoal text-sm">
          <button
            className={`py-1 px-2 hover:bg-lightYellow font-medium ${sortBy === "price" ? "bg-lightYellow" : ""}`}
            onClick={() => setSortBy("price")}
          >
            PRICE
          </button>
          <button
            className={`py-1 px-2 hover:bg-lightYellow font-medium ${sortBy === "departure" ? "bg-lightYellow" : ""}`}
            onClick={() => setSortBy("departure")}
          >
            DEPARTURE
          </button>
          <button
            className={`py-1 px-2 hover:bg-lightYellow font-medium ${sortBy === "arrival" ? "bg-lightYellow" : ""}`}
            onClick={() => setSortBy("arrival")}
          >
            ARRIVAL
          </button>
          <button
            className={`py-1 px-2 hover:bg-lightYellow font-medium ${sortBy === "seats" ? "bg-lightYellow" : ""}`}
            onClick={() => setSortBy("seats")}
          >
            SEATS
          </button>
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
