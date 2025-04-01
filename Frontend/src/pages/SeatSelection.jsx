import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Navbar1 from "../components/Navbar1";
import Footer1 from "../components/Footer1";
import { Bus } from "lucide-react";

const SeatSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { busId, scheduleId, fromLocation, toLocation, journeyDate } =
    location.state || {};

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!busId || !scheduleId) {
      navigate("/");
      return;
    }

    const fetchSeats = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/seats/${busId}/schedule/${scheduleId}/seats`,
          { withCredentials: true }
        );
        console.log("Fetched seats:", response.data);
        setSeats(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching seats");
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();

    const newSocket = io("http://localhost:5000", { withCredentials: true });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("joinTrip", { busId, scheduleId });
    });

    newSocket.on("seatUpdate", (data) => {
      console.log("Received seatUpdate:", data);
      if (data.seats && Array.isArray(data.seats)) {
        setSeats(data.seats); // Update seats if provided
      } else if (typeof data.availableSeats === "number") {
        console.log(`Available seats updated: ${data.availableSeats}`);
        // Optionally update UI with availableSeats if needed
      } else {
        console.warn("Invalid seatUpdate data:", data);
      }
    });

    return () => newSocket.disconnect();
  }, [busId, scheduleId, navigate]);

  const handleSeatClick = (seat) => {
    if (
      seat.isBooked ||
      (seat.reservedUntil && new Date(seat.reservedUntil) > new Date())
    ) {
      toast.error(`Seat ${seat.seatNumber} is unavailable`);
      return;
    }

    setSelectedSeats((prev) =>
      prev.includes(seat.seatNumber)
        ? prev.filter((num) => num !== seat.seatNumber)
        : [...prev, seat.seatNumber]
    );
  };

  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/seats/${busId}/schedule/${scheduleId}/reserve`,
        { seatNumbers: selectedSeats },
        { withCredentials: true }
      );
      toast.success(response.data.message);
      // No manual setSeats here; wait for seatUpdate
      setTimeout(
        () =>
          navigate("/payment", { state: { busId, scheduleId, selectedSeats } }),
        1000
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Error reserving seats");
    }
  };

  const handleBookSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/seats/${busId}/schedule/${scheduleId}/reserve`,
        { seatNumbers: selectedSeats },
        { withCredentials: true }
      );
      toast.success("Seats reserved, proceeding to payment");
      // No manual setSeats here; wait for seatUpdate
      setTimeout(
        () =>
          navigate("/payment", { state: { busId, scheduleId, selectedSeats } }),
        1000
      );
    } catch (err) {
      console.error("Reserve error:", err.response?.data);
      toast.error(
        err.response?.data?.message || "Error reserving seats for booking"
      );
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const renderBusLayout = () => {
    const totalSeats = seats.length;
    const isLargeBus = totalSeats >= 49;
    const seatsPerRow = isLargeBus ? 5 : 4;
    const totalRows = Math.ceil(totalSeats / seatsPerRow);
    const rows = [];

    for (let row = 0; row < totalRows; row++) {
      const rowSeats = seats.slice(row * seatsPerRow, (row + 1) * seatsPerRow);
      rows.push(
        <div key={row} className="flex justify-center items-center mb-4">
          <div className="flex space-x-2 mr-8">
            {rowSeats.slice(0, 2).map((seat) => (
              <motion.div
                key={seat.seatNumber}
                className={`w-12 h-12 flex items-center justify-center rounded-lg cursor-pointer border ${
                  seat.isBooked
                    ? "bg-red-500 text-white"
                    : seat.reservedUntil &&
                        new Date(seat.reservedUntil) > new Date()
                      ? "bg-gray-400 text-white"
                      : selectedSeats.includes(seat.seatNumber)
                        ? "bg-brightYellow text-darkCharcoal"
                        : "bg-green-100 text-gray-700 hover:bg-green-200"
                }`}
                onClick={() => handleSeatClick(seat)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {seat.seatNumber}
              </motion.div>
            ))}
          </div>
          <div className="w-12 border-l-2 border-dashed border-gray-300"></div>
          <div className="flex space-x-2">
            {rowSeats.slice(2).map((seat) => (
              <motion.div
                key={seat.seatNumber}
                className={`w-12 h-12 flex items-center justify-center rounded-lg cursor-pointer border ${
                  seat.isBooked
                    ? "bg-red-500 text-white"
                    : seat.reservedUntil &&
                        new Date(seat.reservedUntil) > new Date()
                      ? "bg-gray-400 text-white"
                      : selectedSeats.includes(seat.seatNumber)
                        ? "bg-brightYellow text-darkCharcoal"
                        : "bg-green-100 text-gray-700 hover:bg-green-200"
                }`}
                onClick={() => handleSeatClick(seat)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {seat.seatNumber}
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    return rows;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700">{error}</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-deepOrange text-white px-6 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar1 />
      <div className="bg-deepOrange text-white py-3">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center px-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold">{fromLocation}</h1>
            <span className="text-xl">⟫</span>
            <h1 className="text-xl font-bold">{toLocation}</h1>
          </div>
          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            <span>{formatDate(journeyDate)}</span>
            <button
              onClick={() => navigate(-1)}
              className="bg-brightYellow text-darkCharcoal px-3 py-1 rounded text-sm hover:bg-lightYellow"
            >
              Back
            </button>
          </div>
        </div>
      </div>
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Bus className="mr-2" /> Select Your Seats
        </h2>
        <div className="relative">
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white max-w-3xl mx-auto">
            {renderBusLayout()}
          </div>
          <div className="absolute top-0 left-0 p-2 text-sm text-gray-600">
            Driver
          </div>
        </div>
        <div className="flex justify-center space-x-6 mt-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-brightYellow mr-2"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-400 mr-2"></div>
            <span>Reserved</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 mr-2"></div>
            <span>Booked</span>
          </div>
        </div>
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={handleReserveSeats}
            className="bg-deepOrange text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Reserve Seats
          </button>
          <button
            onClick={handleBookSeats}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Book Now
          </button>
        </div>
        {selectedSeats.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-lg">
              Selected Seats: {selectedSeats.join(", ")} ({selectedSeats.length}
              )
            </p>
          </div>
        )}
      </div>
      <Footer1 />
    </div>
  );
};

export default SeatSelection;
