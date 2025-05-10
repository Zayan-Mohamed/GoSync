import React, { useState } from "react";
import { Bus, Star, X, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BusCardSchedule = ({ bus }) => {
  const [showPoints, setShowPoints] = useState(false);
  const navigate = useNavigate();

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { day: "numeric", month: "short" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle View Schedule button click
  const handleViewSchedule = () => {
    navigate("/bus-search-results", {
      state: {
        fromLocation: bus.route.departureLocation,
        toLocation: bus.route.arrivalLocation,
        journeyDate: bus.schedule.departureDate,
      },
    });
  };

  // Filter stops by type
  const boardingPoints = bus.route?.stops?.filter((stop) => stop?.stopType === "boarding") || [];
  const droppingPoints = bus.route?.stops?.filter((stop) => stop?.stopType === "dropping") || [];

  return (
    <div className="rounded-lg overflow-hidden shadow-md mb-4 bg-white border border-gray-200">
      {/* Bus header with route info */}
      <div className="bg-brightYellow text-darkCharcoal p-3">
        <h2 className="text-xl font-semibold">
          {bus.route.routeName} | Route No {bus.busRouteNumber}
        </h2>
      </div>

      {/* Bus details */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departure and arrival locations */}
        <div className="flex flex-col items-start">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm text-gray-600">From</p>
              <p className="font-bold text-lg">{bus.route.departureLocation}</p>
              <p className="text-sm text-gray-600">To</p>
              <p className="font-bold text-lg">{bus.route.arrivalLocation}</p>
            </div>
          </div>
        </div>

        {/* Travel information */}
        <div className="flex flex-col items-end">
          <p className="text-sm text-gray-600">Travel Name</p>
          <p className="text-xl font-bold text-deepOrange">{bus.travelName}</p>
          <p className="text-sm text-gray-600">Bus Type</p>
          <p className="font-semibold">{bus.busType}</p>
          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            <Star size={12} className="inline mr-1" />
            4.5 | 180 ratings
          </div>
          <p className="mt-2 text-2xl font-bold text-deepOrange">Rs. {bus.fareAmount}.00</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-softPeach grid grid-cols-2">
        <button
          className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center flex items-center justify-center gap-1"
          onClick={() => setShowPoints(!showPoints)}
        >
          <MapPin size={16} />
          {showPoints ? "Hide Points" : "Boarding/Dropping Points"}
        </button>
        <button
          className="py-2 px-4 bg-deepOrange text-white font-semibold hover:bg-sunsetOrange text-center"
          onClick={handleViewSchedule}
        >
          VIEW SCHEDULE
        </button>
      </div>

      {/* Expandable points section */}
      {showPoints && (
        <div className="bg-white p-4 border-t border-gray-200 transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-deepOrange">Route Points</h3>
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
                      <span className="text-deepOrange font-medium">{index + 1}.</span>
                      <div>
                        <p className="font-medium">{point.stop.stopName}</p>
                        <p className="text-sm text-gray-600">{point.stop.stopAddress}</p>
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
                      <span className="text-deepOrange font-medium">{index + 1}.</span>
                      <div>
                        <p className="font-medium">{point.stop.stopName}</p>
                        <p className="text-sm text-gray-600">{point.stop.stopAddress}</p>
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
    </div>
  );
};

export default BusCardSchedule;