import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";
import Navbar1 from "../components/Navbar1";
import Footer1 from "../components/Footer1";
import Loader from "../components/Loader";
import BookingCard from "../components/BookingCard";
import { Ticket, AlertCircle } from "lucide-react";

const BookingHistory = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'pending', 'paid', 'cancelled'
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/bookings/user`, {
        withCredentials: true,
      });
      console.log("Fetched bookings:", response.data);

      // Normalize data to ensure busNumber is always accessible directly
      const normalizedBookings = response.data.map((booking) => ({
        ...booking,
        // Ensure busNumber is always available directly, even if it's nested in busId
        busNumber:
          booking.busNumber ||
          (booking.busId && booking.busId.busNumber) ||
          "N/A",
      }));

      // Fetch QR codes for each booking
      const bookingsWithQRCodes = await Promise.all(
        normalizedBookings.map(async (booking) => {
          try {
            const qrResponse = await axios.get(
              `${API_URL}/api/bookings/getQRCode/${booking.bookingId}`,
              { withCredentials: true }
            );
            return { ...booking, qrCode: qrResponse.data.qrCode };
          } catch (err) {
            console.error(`Failed to fetch QR for ${booking.bookingId}:`, err);
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
      toast.error(
        err.response?.data?.message || "Failed to load booking history"
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

    fetchBookings();
  }, [isAuthenticated, user, navigate, API_URL]);

  const handlePayNow = (booking) => {
    navigate("/payment", {
      state: {
        busId: booking.busId,
        scheduleId: booking.scheduleId,
        selectedSeats: booking.seatNumbers,
        bookingSummary: {
          bookingId: booking.bookingId,
          from: booking.from,
          to: booking.to,
          busNumber: booking.busNumber, // This will now consistently have the value
          seatNumbers: booking.seatNumbers,
          fareTotal: booking.fareTotal,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          bookedAt:
            booking.bookedAt || new Date(booking.createdAt).toLocaleString(),
        },
      },
    });
  };

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return booking.paymentStatus === "pending";
    if (activeTab === "paid") return booking.paymentStatus === "paid";
    if (activeTab === "cancelled") return booking.status === "cancelled";
    return true;
  });

  if (loading) {
    return <Loader />;
  }

  // Check if there are any pending payments
  const hasPendingPayments = bookings.some(
    (booking) =>
      booking.paymentStatus === "pending" && booking.status === "confirmed"
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar1 />
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-grow">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <Ticket className="w-8 h-8 mr-3 text-blue-600" /> Your Booking History
        </h2>

        {hasPendingPayments && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
            <AlertCircle
              className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5"
              size={20}
            />
            <p className="text-yellow-700">
              You have bookings with pending payments. Please complete your
              payments to confirm your seats.
            </p>
          </div>
        )}

        {/* Tabs for filtering */}
        <div className="mb-6 flex border-b">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 ${activeTab === "all" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 ${activeTab === "pending" ? "border-b-2 border-yellow-500 text-yellow-600" : "text-gray-500"}`}
          >
            Pending Payment
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`px-4 py-2 ${activeTab === "paid" ? "border-b-2 border-green-500 text-green-600" : "text-gray-500"}`}
          >
            Paid
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`px-4 py-2 ${activeTab === "cancelled" ? "border-b-2 border-red-500 text-red-600" : "text-gray-500"}`}
          >
            Cancelled
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">
              {activeTab === "all"
                ? "No bookings found."
                : `No ${activeTab} bookings found.`}
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
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.bookingId}
                booking={booking}
                showPayButton={
                  booking.paymentStatus === "pending" &&
                  booking.status === "confirmed"
                }
                onPay={() => handlePayNow(booking)}
              />
            ))}
          </div>
        )}

        <button
          onClick={fetchBookings}
          className="mt-6 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          Refresh Bookings
        </button>
      </div>
      <Footer1 />
    </div>
  );
};

export default BookingHistory;
