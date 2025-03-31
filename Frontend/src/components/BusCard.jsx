import React from "react";
import { Bus, Clock, Star } from "lucide-react";

const BusCard = ({ bus, onViewSeat }) => {
  // Format time (12:00:00 -> 12:00)
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
      {/* Bus header with route info */}
      <div className="bg-deepOrange text-white py-2 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bus size={18} />
          <h3 className="font-medium">{bus.route.routeName}</h3>
        </div>
        <div className="text-sm">{bus.busRouteNumber}</div>
      </div>

      {/* Bus details */}
      <div className="p-4">
        <div className="flex flex-col md:flex-row justify-between">
          {/* Travel and bus details */}
          <div className="flex flex-col mb-4 md:mb-0">
            <div className="text-lg font-semibold">{bus.travelName}</div>
            <div className="text-sm text-gray-600">
              {bus.busNumber} | {bus.busType}
            </div>
            <div className="mt-2 flex items-center">
              <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                <Star size={12} className="inline mr-1" />
                4.5
              </div>
              <span className="text-xs text-gray-500 ml-2">180 ratings</span>
            </div>
          </div>

          {/* Departure details */}
          <div className="flex flex-col items-center mb-4 md:mb-0">
            <div className="text-xl font-bold">{formatTime(bus.schedule.departureTime)}</div>
            <div className="text-sm">{formatDate(bus.schedule.departureDate)}</div>
            <div className="text-xs text-gray-600">{bus.route.departureLocation}</div>
          </div>

          {/* Duration */}
          <div className="flex flex-col items-center mb-4 md:mb-0">
            <div className="text-sm text-gray-600 flex items-center">
              <Clock size={14} className="mr-1" /> {bus.schedule.duration}
            </div>
            <div className="w-20 h-0.5 bg-gray-300 my-2 relative">
              <div className="absolute top-1/2 left-0 w-2 h-2 bg-deepOrange rounded-full transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 right-0 w-2 h-2 bg-deepOrange rounded-full transform -translate-y-1/2"></div>
            </div>
            <div className="text-xs text-gray-500">Direct</div>
          </div>

          {/* Arrival details */}
          <div className="flex flex-col items-center mb-4 md:mb-0">
            <div className="text-xl font-bold">{formatTime(bus.schedule.arrivalTime)}</div>
            <div className="text-sm">{formatDate(bus.schedule.arrivalDate)}</div>
            <div className="text-xs text-gray-600">{bus.route.arrivalLocation}</div>
          </div>

          {/* Pricing and availability */}
          <div className="flex flex-col items-end">
            <div className="text-xl font-bold text-deepOrange">
              Rs. {bus.fareAmount}
            </div>
            <div className="text-sm text-gray-600">
              {bus.availableSeats} seats left
            </div>
            <button
              onClick={() => onViewSeat(bus.busId)}
              className="mt-2 px-4 py-1 bg-deepOrange text-white rounded hover:bg-red-700 transition"
            >
              View Seats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusCard;