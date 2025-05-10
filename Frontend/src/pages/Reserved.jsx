import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";
import Navbar1 from "../components/Navbar1";
import Footer1 from "../components/Footer1";
import GoSyncLoader from "../components/Loader";
import { FiClock } from "react-icons/fi";

const Reserved = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [reservedSeats, setReservedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchReservedSeats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/seats/reserved/user`, {
        withCredentials: true,
      });
      console.log("Fetched reserved seats:", response.data);
      const filteredSeats = response.data.filter(
        (r) => new Date(r.reservedUntil) > new Date()
      );
      // Sort by reservedUntil in descending order
      const sortedSeats = filteredSeats.sort(
        (a, b) => new Date(b.reservedUntil) - new Date(a.reservedUntil)
      );
      setReservedSeats(sortedSeats);
    } catch (err) {
      console.error("Error fetching reserved seats:", err);
      toast.error(
        err.response?.data?.message || "Failed to load reserved seats"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }
    fetchReservedSeats();
  }, [isAuthenticated, user, navigate]);

  const handleConfirmBooking = async (busId, scheduleId, seatNumbers) => {
    try {
      // First, get bus details to ensure we have the bus number
      const busResponse = await axios.get(
        `${API_URL}/api/buses/buses/${busId}`,
        { withCredentials: true }
      );

      const busDetails = busResponse.data;
      console.log("Bus details for confirmation:", busDetails);

      // Now confirm the booking
      const response = await axios.post(
        `${API_URL}/api/bookings/confirm`,
        { busId, scheduleId, seatNumbers },
        { withCredentials: true }
      );

      console.log("Booking response:", response.data);
      toast.success("Booking confirmed! Proceeding to payment.");

      // Create an enhanced booking summary with guaranteed bus number
      const bookingSummary = {
        ...response.data.summary,
        busNumber:
          response.data.summary.busNumber || busDetails.busNumber || "Unknown",
      };

      // Log the summary to verify
      console.log("Booking summary with bus number:", bookingSummary);

      navigate("/payment", {
        state: {
          busId,
          scheduleId,
          selectedSeats: seatNumbers,
          bookingSummary: bookingSummary,
        },
      });
    } catch (err) {
      console.error("Confirm error:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to confirm booking");
      fetchReservedSeats();
    }
  };

  if (loading) {
    return <GoSyncLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar1 />
      <div className="container mx-auto py-6 px-4 flex-grow">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700 flex items-center">
          <FiClock className="mr-2" /> Reserved Seats
        </h2>
        <button
          onClick={fetchReservedSeats}
          className="ml-4 px-4 py-2 bg-deepOrange text-white rounded hover:bg-sunsetOrange transition"
          disabled={loading}
        >
          Refresh
        </button>
        {reservedSeats.length === 0 ? (
          <p className="text-gray-600">No seats reserved.</p>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            {reservedSeats.map((reservation) => (
              <div
                key={`${reservation.busId}-${reservation.scheduleId}`}
                className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">
                    Bus: {reservation.busNumber} | Route:{" "}
                    {reservation.from || "Unknown"} to{" "}
                    {reservation.to || "Unknown"}
                  </p>
                  <p>Seats: {reservation.seatNumbers.join(", ")}</p>
                  <p className="text-sm text-gray-600">
                    Reserved until:{" "}
                    {reservation.reservedUntil
                      ? new Date(reservation.reservedUntil).toLocaleString()
                      : "Date not available"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleConfirmBooking(
                      reservation.busId,
                      reservation.scheduleId,
                      reservation.seatNumbers
                    )
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={new Date(reservation.reservedUntil) <= new Date()}
                >
                  Confirm Booking
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer1 />
    </div>
  );
};

export default Reserved;
