import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar1 from "./Navbar1";
import Footer1 from "./Footer1";

const Payment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { busId, scheduleId, selectedSeats, bookingSummary } = state || {};
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Assuming booking is already confirmed, just simulate payment
      // Update payment status (new endpoint needed)
      const paymentResponse = await axios.post(
        "http://localhost:5000/api/bookings/update-payment",
        { bookingId: bookingSummary.bookingId, paymentStatus: "completed" },
        { withCredentials: true }
      );
      console.log("Payment updated:", paymentResponse.data);

      toast.success("Payment successful!");
      navigate("/passenger");
    } catch (err) {
      console.error("Payment error:", err.response?.data);
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!busId || !scheduleId || !selectedSeats || !bookingSummary) {
    return <div>Invalid payment data</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar1 />
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-2xl font-semibold mb-4">Payment</h2>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p>Booking ID: {bookingSummary.bookingId}</p>
          <p>Route: {bookingSummary.from} to {bookingSummary.to}</p>
          <p>Seats: {bookingSummary.seatNumbers.join(", ")}</p>
          <p>Total Fare: ${bookingSummary.fareTotal}</p>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </div>
      <Footer1 />
    </div>
  );
};

export default Payment;