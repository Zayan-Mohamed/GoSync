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
import { Clock, AlertCircle } from "lucide-react";

// Payment timer component to show countdown for pending payments
const PaymentTimer = ({ createdAt }) => {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Calculate time remaining for the 6-hour payment window
    const calculateTimeRemaining = () => {
      const bookingTime = new Date(createdAt).getTime();
      const deadline = bookingTime + (6 * 60 * 60 * 1000); // 6 hours in milliseconds
      const now = new Date().getTime();
      const remaining = deadline - now;
      
      if (remaining <= 0) {
        setTimeRemaining("Expired");
        setExpired(true);
        return;
      }

      // Convert to hours and minutes
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m remaining`);
    };

    calculateTimeRemaining();
    const timerId = setInterval(calculateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(timerId);
  }, [createdAt]);

  return (
    <div className={`flex items-center ${expired ? "text-red-600" : "text-yellow-600"}`}>
      <Clock size={14} className="mr-1" />
      <span className="text-xs font-medium">{timeRemaining}</span>
    </div>
  );
};

const CancelTicket = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URI = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    const fetchBookings = async () => {
      try {
        const response = await axios.get(`${API_URI}/api/bookings/user`, {
          withCredentials: true,
        });
        console.log("Fetched bookings:", response.data);
        // Normalize the data to ensure busNumber is always accessible
        const normalizedBookings = response.data.map((booking) => ({
          ...booking,
          // Ensure busNumber is always available directly, even if it's nested in busId
          busNumber:
            booking.busNumber ||
            (booking.busId && booking.busId.busNumber) ||
            "N/A",
        }));

        const confirmedBookings = normalizedBookings.filter(
          (b) => b.status === "confirmed"
        );
        const bookingsWithQRCodes = await Promise.all(
          confirmedBookings.map(async (booking) => {
            try {
              const qrResponse = await axios.get(
                `${API_URI}/api/bookings/getQRCode/${booking.bookingId}`,
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
  }, [isAuthenticated, user, navigate, API_URI]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      const response = await axios.post(
        `${API_URI}/api/bookings/cancel`,
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

  // Check if there are any pending payments
  const hasPendingPayments = bookings.some(
    (booking) => booking.paymentStatus === "pending"
  );

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

        {hasPendingPayments && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
            <AlertCircle
              className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div>
              <p className="text-yellow-700">
                Bookings with pending payments will be automatically cancelled after 6 hours from booking time.
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                You can either complete payment or cancel the booking manually.
              </p>
            </div>
          </div>
        )}
        
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
                extraComponent={
                  booking.paymentStatus === "pending" ? (
                    <PaymentTimer createdAt={booking.createdAt} />
                  ) : null
                }
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
