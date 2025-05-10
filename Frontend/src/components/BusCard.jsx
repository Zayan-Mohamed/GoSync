import React, { useState, useEffect, useMemo } from "react";
import { Bus, Clock, Star, X, MapPin } from "lucide-react";
import UserRouteHeatmapIframe from "./UserRouteHeatmapIframe"; // Updated import

const BusCard = ({ bus, onViewSeat }) => {
  const [showPoints, setShowPoints] = useState(false);
  const [seatsData, setSeatsData] = useState(null);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [showPath, setShowPath] = useState(false);

  // Format time (12:00:00 -> 12:00 AM/PM)
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const adjustedHour = hour % 12 || 12; // Convert to 12-hour format
    return `${adjustedHour}:${minutes} ${period}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { day: "numeric", month: "short" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate booking closing (12 hours before departure)
  const calculateBookingClosing = (departureDate, departureTime) => {
    if (!departureDate || !departureTime) return "N/A";
    const [hours, minutes] = departureTime.split(":");
    const departureDateTime = new Date(departureDate);
    departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const closingTime = new Date(
      departureDateTime.getTime() - 6 * 60 * 60 * 1000
    ); // 12 hours before
    return `${formatDate(closingTime)}, ${formatTime(closingTime.toTimeString().split(" ")[0])}`;
  };

  // Fetch seats dynamically
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const API_URI = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(
          `${API_URI}/api/seats/${bus.busId}/schedule/${bus.scheduleId}/seats`,
          { credentials: "include" } // Include cookies if authentication is needed
        );
        if (!response.ok) throw new Error("Failed to fetch seats");
        const seats = await response.json();
        setSeatsData(seats);
      } catch (error) {
        console.error("Error fetching seats:", error);
        setSeatsData([]); // Fallback to empty array
      } finally {
        setLoadingSeats(false);
      }
    };

    fetchSeats();
  }, [bus.busId, bus.scheduleId]);

  // Memoize available seats calculation
  const availableSeats = useMemo(() => {
    if (!seatsData) return null;
    return seatsData.filter(
      (seat) =>
        !seat.isBooked &&
        (!seat.reservedUntil || new Date(seat.reservedUntil) < new Date())
    ).length;
  }, [seatsData]);

  // Memoize booking closing calculation
  const bookingClosing = useMemo(() => {
    return calculateBookingClosing(
      bus.schedule.departureDate,
      bus.schedule.departureTime
    );
  }, [bus.schedule.departureDate, bus.schedule.departureTime]);

  // Filter stops by type
  const boardingPoints =
    bus.route?.stops?.filter((stop) => stop?.stopType === "boarding") || [];
  const droppingPoints =
    bus.route?.stops?.filter((stop) => stop?.stopType === "dropping") || [];

  return (
    <div className="rounded-lg overflow-hidden shadow-md mb-4 bg-white border border-gray-200">
      {/* Bus header with route info */}
      <div className="bg-brightYellow text-darkCharcoal p-3">
        <h2 className="text-xl font-semibold">
          {bus.route.routeName} | Route No {bus.busRouteNumber}
        </h2>
      </div>

      {/* Bus details */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Departure and arrival info */}
        <div className="flex space-x-6 relative">
          <div className="flex items-center space-x-4">
            <img src="/assets/get-on-bus.png" alt="busin" className="h-12" />
            <div>
              <p className="text-sm text-gray-600">Departure</p>
              <p className="font-bold">{bus.route.departureLocation}</p>
              <p className="text-sm text-gray-600">Date</p>
              <p>{formatDate(bus.schedule.departureDate)}</p>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-bold">
                {formatTime(bus.schedule.departureTime)}
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="border-l border-gray-300 h-full mx-4"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 border border-gray-300 rounded-full">
              <p className="text-xs font-semibold text-deepOrange whitespace-nowrap">
                {bus.schedule.duration || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <img src="/assets/get-off-bus.png" alt="busout" className="h-12" />
            <div>
              <p className="text-sm text-gray-600">Arrival</p>
              <p className="font-bold">{bus.route.arrivalLocation}</p>
              <p className="text-sm text-gray-600">Date</p>
              <p>{formatDate(bus.schedule.arrivalDate)}</p>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-bold">
                {formatTime(bus.schedule.arrivalTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Travel information */}
        <div className="ml-10 flex flex-col items-start">
          <p className="text-sm text-gray-600">Travel Name</p>
          <p className="text-xl font-bold text-deepOrange">{bus.travelName}</p>
          <p className="text-sm text-gray-600">Bus Number</p>
          <p>{bus.busNumber}</p>
          <p className="text-sm text-gray-600">Bus Type</p>
          <p className="font-semibold">{bus.busType}</p>
          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            <Star size={12} className="inline mr-1" />
            4.5 | 180 ratings
          </div>
        </div>

        {/* Price and seats */}
        <div className="flex flex-col items-end">
          <p className="text-2xl font-bold text-deepOrange">
            Rs. {bus.fareAmount}.00
          </p>
          <div className="mt-2">
            <p className="text-center text-sm text-gray-600">Available Seats</p>
            {loadingSeats ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-deepOrange"></div>
              </div>
            ) : (
              <p className="text-center text-2xl text-deepOrange font-bold">
                {availableSeats !== null ? availableSeats : "N/A"}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-600">Booking Closing</p>
          <p className="text-sm">{bookingClosing}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-softPeach grid grid-cols-3">
        <button
          className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center flex items-center justify-center gap-1"
          onClick={() => setShowPoints(!showPoints)}
        >
          <MapPin size={16} />
          {showPoints ? "Hide Points" : "Boarding/Dropping Points"}
        </button>
        <button
          className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center"
          onClick={() => setShowPath(!showPath)}
        >
          {showPath ? "Hide Heatmap" : "View Your Most Used Routes"}
        </button>
        <button
          className="py-2 px-4 bg-deepOrange text-white font-semibold hover:bg-sunsetOrange text-center"
          onClick={() => onViewSeat(bus.busId, bus.scheduleId)}
        >
          VIEW SEAT
        </button>
      </div>

      {/* Expandable points section */}
      {showPoints && (
        <div className="bg-white p-4 border-t border-gray-200 transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-deepOrange">
              Route Points
            </h3>
            <button
              onClick={() => setShowPoints(false)}
              className="text-gray-500 hover:text-deepOrange"
            >
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-brightYellow mb-2 flex items-center gap-2">
                <MapPin size={16} /> Boarding Points
              </h4>
              <ul className="space-y-2">
                {boardingPoints.length > 0 ? (
                  boardingPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-deepOrange font-medium">
                        {index + 1}.
                      </span>
                      <div>
                        <p className="font-medium">{point.stop.stopName}</p>
                        <p className="text-sm text-gray-600">
                          {point.stop.stopAddress}
                        </p>
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">No boarding points available</p>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-brightYellow mb-2 flex items-center gap-2">
                <MapPin size={16} /> Dropping Points
              </h4>
              <ul className="space-y-2">
                {droppingPoints.length > 0 ? (
                  droppingPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-deepOrange font-medium">
                        {index + 1}.
                      </span>
                      <div>
                        <p className="font-medium">{point.stop.stopName}</p>
                        <p className="text-sm text-gray-600">
                          {point.stop.stopAddress}
                        </p>
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">No dropping points available</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Path section */}
      {showPath && (
        <div className="bg-white p-4 border-t border-gray-200 transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-deepOrange">
              Your Most Used Travel Routes
            </h3>
            <button
              onClick={() => setShowPath(false)}
              className="text-gray-500 hover:text-deepOrange"
            >
              <X size={20} />
            </button>
          </div>
          <div className="h-[400px] w-full">
            <UserRouteHeatmapIframe />
          </div>
        </div>
      )}
    </div>
  );
};

export default BusCard;