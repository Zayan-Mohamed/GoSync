import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import useAuthStore from "../store/authStore";

const Payment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { busId, scheduleId, selectedSeats } = state || {};
  const { user } = useAuthStore();

  const API_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!busId || !scheduleId || !selectedSeats || !user) {
      navigate("/seat-selection");
      return;
    }
  }, [busId, scheduleId, selectedSeats, user, navigate]);

  const handlePayment = async () => {
    try {
      console.log("Starting payment for:", { busId, scheduleId, selectedSeats });
      const paymentSuccess = await new Promise((resolve) => setTimeout(() => resolve(true), 2000));
      if (!paymentSuccess) throw new Error("Payment failed");

      const response = await axios.post(
        `${API_URI}/api/bookings/confirm`,
        { busId, scheduleId, seatNumbers: selectedSeats },
        { withCredentials: true }
      );
      console.log("Booking confirmed:", response.data);
      toast.success(response.data.message);

      try {
        const summaryResponse = await axios.get(
          `${API_URI}/api/bookings/summary/${user._id}`,
          { withCredentials: true }
        );
        console.log("Summary fetched:", summaryResponse.data);
        toast.success("Booking summary fetched and emailed!");
      } catch (summaryErr) {
        console.error("Error fetching summary:", summaryErr.response?.data || summaryErr);
      }

      navigate("/booking-confirmation", { state: { bookingId: response.data.bookingId } });
    } catch (err) {
      console.error("Payment error:", err.response?.data || err);
      try {
        const releaseResponse = await axios.post(
          `${API_URI}/api/seats/${busId}/schedule/${scheduleId}/reserve`,
          { seatNumbers: selectedSeats, release: true },
          { withCredentials: true }
        );
        console.log("Seats released:", releaseResponse.data);
      } catch (releaseErr) {
        console.error("Seat release error:", releaseErr.response?.data);
      }
      toast.error(err.response?.data?.message || "Payment failed, seats may still be reserved");
      navigate("/seat-selection", { state: { busId, scheduleId } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h2 className="text-2xl font-semibold mb-4">Payment</h2>
      <p>Booking seats: {selectedSeats?.join(", ")}</p>
      <button
        onClick={handlePayment}
        className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
      >
        Pay Now
      </button>
    </div>
  );
};

export default Payment;