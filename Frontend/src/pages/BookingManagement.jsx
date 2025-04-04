import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";

const BookingManagement = () => {
    const API_URL = import.meta.env.VITE_API_URL;
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        console.log("Fetching bookings from /api/admin/bookings"); // Debug
        const response = await axios.get(`${API_URL}/api/admin/bookings`, {
          withCredentials: true,
        });
        console.log("Bookings fetched:", response.data); // Debug
        setBookings(response.data);
      } catch (err) {
        console.error("Fetch bookings error:", err.response); // Debug
        toast.error(err.response?.data?.message || "Failed to fetch bookings");
      }
    };
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    try {
      await axios.post(
        "http://localhost:5000/api/bookings/cancel",
        { bookingId },
        { withCredentials: true }
      );
      setBookings(bookings.map((b) => (b.bookingId === bookingId ? { ...b, status: "cancelled" } : b)));
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  return (
    <AdminLayout>
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Current Bookings</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Booking ID</th>
            <th className="p-2">Passenger</th>
            <th className="p-2">Route</th>
            <th className="p-2">Seats</th>
            <th className="p-2">Status</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.bookingId} className="border-t">
              <td className="p-2">{booking.bookingId}</td>
              <td className="p-2">{booking.userId.name}</td>
              <td className="p-2">{`${booking.from} to ${booking.to}`}</td>
              <td className="p-2">{booking.seatNumbers.join(", ")}</td>
              <td className="p-2">{booking.status}</td>
              <td className="p-2">
                {booking.status === "confirmed" && (
                  <button
                    onClick={() => handleCancel(booking.bookingId)}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </AdminLayout>
  );
};

export default BookingManagement;