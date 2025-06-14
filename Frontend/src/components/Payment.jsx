import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar1 from "./Navbar1";
import Footer1 from "./Footer1";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import Loader from "./Loader";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { AlertTriangle, Clock } from "lucide-react";

const Payment = () => {
  // Make sure API_URL is properly formatted with http:// prefix
  const API_URL = (() => {
    let url = import.meta.env.VITE_API_URL || "http://localhost:5000";
    // Ensure URL has http:// or https:// prefix
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `http://${url}`;
    }
    return url;
  })();

  const { state } = useLocation();
  const navigate = useNavigate();
  const { busId, scheduleId, selectedSeats, bookingSummary } = state || {};
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(6 * 60 * 60); // 6 hours in seconds

  // Calculate the payment deadline time based on booking time
  useEffect(() => {
    if (bookingSummary?.bookedAt) {
      const bookedTime = new Date(bookingSummary.bookedAt).getTime();
      const deadlineTime = bookedTime + 6 * 60 * 60 * 1000; // 6 hours in milliseconds
      const currentTime = new Date().getTime();
      const remainingTime = Math.max(
        0,
        Math.floor((deadlineTime - currentTime) / 1000)
      ); // remaining seconds

      setTimeRemaining(remainingTime);

      // Update the countdown every minute
      const timerId = setInterval(() => {
        const currentTime = new Date().getTime();
        const remainingTime = Math.max(
          0,
          Math.floor((deadlineTime - currentTime) / 1000)
        );
        setTimeRemaining(remainingTime);

        // If time is up, show a warning
        if (remainingTime <= 0) {
          toast.warning(
            "Payment time limit exceeded. Your seats may be released."
          );
          clearInterval(timerId);
        }
      }, 60000); // update every minute

      return () => clearInterval(timerId);
    }
  }, [bookingSummary?.bookedAt]);

  // Format the remaining time as hours and minutes
  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return "0h 0m (expired)";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        const busResponse = await axios.get(
          `${API_URL}/api/buses/buses/${busId}`,
          { withCredentials: true }
        );
        const bus = busResponse.data;
        console.log("Bus data:", bus);
        if (!bus) throw new Error("Bus not found");

        const routeResponse = await axios.get(`${API_URL}/api/admin/routes`, {
          params: { routeId: bus.routeId },
          withCredentials: true,
        });
        const route = routeResponse.data.route;
        console.log("Route data:", route);
        if (!route) throw new Error("Route not found");

        setRouteData(route);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.message ||
            "Error fetching route data"
        );
        console.error("Fetch error:", err);
      } finally {
        setMapLoading(false);
      }
    };

    if (busId) fetchRouteData();
  }, [busId, API_URL]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const paymentStatus = "paid"; // Hardcoded for successful payment; replace with payment gateway response if applicable

      // Debug the API URL
      console.log("API_URL:", API_URL);
      console.log(
        "Full request URL:",
        `${API_URL}/api/bookings/update-payment`
      );

      console.log("Sending payment update:", {
        bookingId: bookingSummary.bookingId,
        paymentStatus,
      });

      // Optional: Integrate payment gateway (e.g., Stripe)
      // const paymentResult = await processPaymentGateway();
      // const paymentStatus = paymentResult.success ? "paid" : "failed";

      const validStatuses = ["pending", "paid", "failed"];
      if (!validStatuses.includes(paymentStatus)) {
        throw new Error(
          `Invalid payment status: ${paymentStatus}. Must be one of: ${validStatuses.join(
            ", "
          )}`
        );
      }

      const paymentResponse = await axios.post(
        `${API_URL}/api/bookings/update-payment`,
        { bookingId: bookingSummary.bookingId, paymentStatus },
        { withCredentials: true }
      );
      console.log("Payment response:", paymentResponse.data);
      toast.success(paymentResponse.data.message);
      navigate("/passenger");
    } catch (err) {
      console.error("Payment error:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.message || err.message || "Payment failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackButton = () => {
    toast.info(
      "Your booking is saved. You can complete payment from your dashboard."
    );
    navigate("/passenger");
  };

  const startIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const endIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  if (!busId || !scheduleId || !selectedSeats || !bookingSummary) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar1 />
        <div className="container mx-auto py-6 px-4 text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            Invalid payment data
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-deepOrange text-white rounded hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
        <Footer1 />
      </div>
    );
  }

  const renderMap = () => {
    if (mapLoading) return <Loader />;
    if (error || !routeData)
      return (
        <p className="text-red-500">{error || "Unable to load route map"}</p>
      );

    const {
      startLocation,
      endLocation,
      startLocationCoordinates,
      endLocationCoordinates,
    } = routeData;

    if (
      !startLocationCoordinates?.latitude ||
      !startLocationCoordinates?.longitude ||
      !endLocationCoordinates?.latitude ||
      !endLocationCoordinates?.longitude
    ) {
      return <p className="text-red-500">Missing route coordinates</p>;
    }

    const positions = [
      [startLocationCoordinates.latitude, startLocationCoordinates.longitude],
      [endLocationCoordinates.latitude, endLocationCoordinates.longitude],
    ];

    const center = [
      (startLocationCoordinates.latitude + endLocationCoordinates.latitude) / 2,
      (startLocationCoordinates.longitude + endLocationCoordinates.longitude) /
        2,
    ];

    return (
      <MapContainer
        center={center}
        zoom={8}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={positions[0]} icon={startIcon}>
          <Popup>{startLocation}</Popup>
        </Marker>
        <Marker position={positions[1]} icon={endIcon}>
          <Popup>{endLocation}</Popup>
        </Marker>
        <Polyline positions={positions} color="blue" />
      </MapContainer>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar1 />
      <div className="container mx-auto py-6 px-4">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Payment</h2>

        {/* Payment Time Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start">
          <AlertTriangle
            size={24}
            className="text-amber-500 mr-3 mt-1 flex-shrink-0"
          />
          <div>
            <h3 className="font-medium text-amber-800 mb-1">
              Important Payment Information
            </h3>
            <p className="text-amber-700">
              Your seat reservation will be automatically cancelled if payment
              is not completed within 6 hours of booking.
              {timeRemaining > 0 ? (
                <span className="font-medium">
                  {" "}
                  Time remaining: <Clock size={16} className="inline mx-1" />
                  {formatTimeRemaining(timeRemaining)}
                </span>
              ) : (
                <span className="font-medium text-red-600">
                  {" "}
                  Your time limit has expired!
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-medium mb-4 text-gray-700">
              Booking Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Booking ID:</span>
                <span className="text-gray-800">
                  {bookingSummary.bookingId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Route:</span>
                <span className="text-gray-800">
                  {bookingSummary.from} to {bookingSummary.to}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Bus Number:</span>
                <span className="text-gray-800">
                  {bookingSummary.busNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Seats:</span>
                <span className="text-gray-800">
                  {bookingSummary.seatNumbers.join(", ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Booked At:</span>
                <span className="text-gray-800">{bookingSummary.bookedAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">
                  Payment Status:
                </span>
                <span
                  className={`${
                    bookingSummary.paymentStatus === "pending"
                      ? "text-yellow-600"
                      : bookingSummary.paymentStatus === "paid"
                        ? "text-green-600"
                        : "text-red-600"
                  } font-semibold`}
                >
                  {bookingSummary.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-semibold">Total Fare:</span>
                <span className="text-gray-900 font-bold text-lg">
                  LKR. {bookingSummary.fareTotal}
                </span>
              </div>
            </div>
            <motion.button
              onClick={handlePayment}
              disabled={loading || bookingSummary.paymentStatus === "paid"}
              className={`mt-6 w-full py-3 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-300 ${
                loading || bookingSummary.paymentStatus === "paid"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
              }`}
              whileHover={
                !(loading || bookingSummary.paymentStatus === "paid")
                  ? { scale: 1.05 }
                  : {}
              }
              whileTap={
                !(loading || bookingSummary.paymentStatus === "paid")
                  ? { scale: 0.95 }
                  : {}
              }
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : bookingSummary.paymentStatus === "paid" ? (
                "Payment Completed"
              ) : (
                `Pay Now (LKR. ${bookingSummary.fareTotal})`
              )}
            </motion.button>
          </motion.div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-4 text-gray-700">
              Journey Route
            </h3>
            {renderMap()}
          </div>
        </div>
        <button
          onClick={handleBackButton}
          className="mt-6 px-6 py-2 bg-deepOrange text-white rounded hover:bg-red-700"
        >
          Back to Dashboard
        </button>
      </div>
      <Footer1 />
    </div>
  );
};

export default Payment;
