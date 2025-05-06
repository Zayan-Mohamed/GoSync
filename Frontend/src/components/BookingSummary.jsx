import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";
import API from "../services/authService";

const BookingSummary = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    const fetchSummary = async () => {
      try {
        const response = await axios.get(
          `${API_URI}/api/bookings/summary/${user._id}`,
          { withCredentials: true }
        );
        setSummary(response.data.summary);
        toast.success("Booking summary fetched!");
      } catch (err) {
        toast.error(err.response?.data?.message || "Error fetching summary");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user, isAuthenticated, navigate, API_URI]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-6 px-4">
      <h2 className="text-2xl font-semibold mb-4">Booking Summary</h2>
      {summary.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        summary.map((booking) => (
          <div key={booking.bookingId} className="border p-4 mb-4 rounded bg-white">
            <h3 className="font-bold">Booking ID: {booking.bookingId}</h3>
            <p><strong>Name:</strong> {booking.passengerName}</p>
            <p><strong>Email:</strong> {booking.email}</p>
            <p><strong>Route:</strong> {booking.busRoute} ({booking.from} to {booking.to})</p>
            <p><strong>Seats:</strong> {booking.seatNumbers.join(", ")}</p>
            <p><strong>Total Fare:</strong> ${booking.fareTotal}</p>
            <p><strong>Status:</strong> {booking.status}</p>
            <p><strong>Payment Status:</strong> {booking.paymentStatus}</p>
            <p><strong>Booked At:</strong> {booking.bookedAt}</p>
          </div>
        ))
      )}
      <button
        onClick={() => navigate("/passenger")}
        className="mt-4 bg-deepOrange text-white px-6 py-2 rounded"
      >
        Back to Homepage
      </button>
    </div>
  );
};

export default BookingSummary;