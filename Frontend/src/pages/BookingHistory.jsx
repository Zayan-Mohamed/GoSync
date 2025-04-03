import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";
import Navbar1 from "../components/Navbar1";
import Footer1 from "../components/Footer1";
import Loader from "../components/Loader";
import { Ticket } from "lucide-react";

const BookingHistory = () => {
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
        const response = await axios.get("http://localhost:5000/api/bookings/user", {
          withCredentials: true,
        });
        console.log("Fetched bookings:", response.data);
        setBookings(response.data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        toast.error(err.response?.data?.message || "Failed to load booking history");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, user, navigate]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar1 />
      <div className="container mx-auto py-6 px-4 flex-grow">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700 flex items-center">
          <Ticket className="mr-2" /> Booking History
        </h2>
        {bookings.length === 0 ? (
          <p className="text-gray-600">No bookings found.</p>
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
                    {booking.from} to {booking.to} | Seats: {booking.seatNumbers.join(", ")}
                  </p>
                  <p className="text-sm text-gray-600">
                    Booked on:{" "}
                    {booking.createdAt
                      ? new Date(booking.createdAt).toLocaleString()
                      : "Date not available"}
                  </p>
                  <p className="text-sm">
                    Status:{" "}
                    <span
                      className={
                        booking.status === "confirmed" ? "text-green-600" : "text-red-600"
                      }
                    >
                      {booking.status}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer1 />
    </div>
  );
};

export default BookingHistory;