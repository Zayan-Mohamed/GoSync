import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";
import Navbar1 from "../components/Navbar1";
import Footer1 from "../components/Footer1";
import Loader from "../components/Loader";
import BookingCard from "../components/BookingCard";
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
        const confirmedBookings = response.data.filter(
          (b) => b.status === "confirmed"
        );
        const bookingsWithQRCodes = await Promise.all(
          confirmedBookings.map(async (booking) => {
            try {
              const qrResponse = await axios.get(
                `http://localhost:5000/api/bookings/getQRCode/${booking.bookingId}`,
                { withCredentials: true }
              );
              return { ...booking, qrCode: qrResponse.data.qrCode };
            } catch (err) {
              console.error(
                `Failed to fetch QR for ${booking.bookingId}:`,
                err
              );
              return booking;
            }
          })
        );
        // Sort by createdAt in descending order
        const sortedBookings = bookingsWithQRCodes.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setBookings(sortedBookings);
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
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar1 />
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-grow">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
          <FiXCircle className="w-8 h-8 mr-3 text-red-600" /> Cancel Tickets
        </h2>
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">
              No confirmed bookings to cancel.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Book a Ticket
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.bookingId}
                booking={booking}
                onCancel={handleCancelBooking}
                showCancelButton={true}
              />
            ))}
          </div>
        )}
      </div>
      <Footer1 />
    </div>
  );
};

export default CancelTicket;
