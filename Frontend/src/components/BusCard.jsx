import React from "react";

const BusCard = ({ bus, route, schedule, onViewSeat }) => {
  return (
    <div className="rounded-lg overflow-hidden shadow-md mb-4 bg-white border border-gray-200">
      {/* Bus route header */}
      <div className="bg-brightYellow text-darkCharcoal p-3">
        <h2 className="text-xl font-semibold">
          {route.routeName} | Route No {bus.busRouteNumber}
        </h2>
      </div>
      {/* Bus details */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Departure and Arrival info */}
        <div className="flex space-x-6 relative">
          {/* Departure */}
          <div className="flex items-center space-x-4">
            <img src="/assets/get-on-bus.png" alt="busin" className="h-12" />
            <div>
              <p className="text-sm text-gray-600">Departure</p>
              <p className="font-bold">{route.startLocation}</p>
              <p className="text-sm text-gray-600">Date</p>
              <p>{new Date(schedule.departureDate).toISOString().split("T")[0]}</p>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-bold">{schedule.departureTime}</p>
            </div>
          </div>

          {/* Divider with duration */}
          <div className="relative">
            <div className="border-l border-gray-300 h-full mx-4"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 border border-gray-300 rounded-full">
              <p className="text-xs font-semibold text-deepOrange whitespace-nowrap">
                {schedule.duration || "N/A"}
              </p>
            </div>
          </div>

          {/* Arrival */}
          <div className="flex items-center space-x-4">
            <img src="/assets/get-off-bus.png" alt="busout" className="h-12" />
            <div>
              <p className="text-sm text-gray-600">Arrival</p>
              <p className="font-bold">{route.endLocation}</p>
              <p className="text-sm text-gray-600">Date</p>
              <p>{new Date(schedule.arrivalDate).toISOString().split("T")[0]}</p>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-bold">{schedule.arrivalTime}</p>
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
        </div>

        {/* Price and seats */}
        <div className="flex flex-col items-end">
          <p className="text-2xl font-bold text-deepOrange">Rs. {bus.fareAmount.toLocaleString()}.00</p>
          <div className="mt-2">
            <p className="text-center text-sm text-gray-600">Available Seats</p>
            <p className="text-center text-2xl text-deepOrange font-bold">{bus.capacity}</p>
          </div>
          <p className="text-sm text-gray-600">Status</p>
          <p className={`text-sm font-semibold ${bus.status === "Active" ? "text-green-600" : "text-red-600"}`}>
            {bus.status}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-softPeach grid grid-cols-3">
        <button className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center">
          Boarding / Dropping Points
        </button>
        <button className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center">
          Bus Photos
        </button>
        <button
          className="py-2 px-4 bg-deepOrange text-white font-semibold hover:bg-sunsetOrange text-center"
          onClick={() => onViewSeat(bus._id)}
        >
          VIEW SEAT
        </button>
      </div>
    </div>
  );
};

export default BusCard;
