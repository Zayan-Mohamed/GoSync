import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";
import Navbar1 from "../components/Navbar1";
import Footer1 from "../components/Footer1";
import Loader from "../components/Loader";
import { FiXCircle } from "react-icons/fi";

const CancelTicket = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    const fetchBookings = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/bookings/user",
          {
            withCredentials: true,
          }
        );
        console.log("Fetched bookings:", response.data);
        setBookings(response.data.filter((b) => b.status === "confirmed"));
      } catch (err) {
        console.error("Error fetching bookings:", err);
        toast.error(err.response?.data?.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, user, navigate]);

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const response = await axios.post(
        "http://localhost:5000/api/bookings/cancel",
        { bookingId },
        { withCredentials: true }
      );
      console.log("Cancel response:", response.data);
      toast.success("Booking cancelled successfully");
      setBookings((prev) => prev.filter((b) => b.bookingId !== bookingId));
    } catch (err) {
      console.error("Cancel error:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar1 />
      <div className="container mx-auto py-6 px-4 flex-grow">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700 flex items-center">
          <FiXCircle className="mr-2" /> Cancel Tickets
        </h2>
        {bookings.length === 0 ? (
          <p className="text-gray-600">No confirmed bookings to cancel.</p>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.bookingId}
                className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{booking.bookingId}</p>
                  <p>
                    {booking.from} to {booking.to} | Seats:{" "}
                    {booking.seatNumbers.join(", ")}
                  </p>
                  <p className="text-sm text-gray-600">
                    Booked on:{" "}
                    {booking.createdAt
                      ? new Date(booking.createdAt).toLocaleString()
                      : "Date not available"}
                  </p>
                  <p className="text-sm">
                    Status:{" "}
                    <span className="text-green-600">{booking.status}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleCancelBooking(booking.bookingId)}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                >
                  Cancel
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

export default CancelTicket;
