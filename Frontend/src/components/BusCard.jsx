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
    <div className="rounded-lg overflow-hidden shadow-md mb-4 bg-white border border-gray-200">      {/* Bus header with route info */}
      {/* Bus route header */}
      <div className="bg-brightYellow text-darkCharcoal p-3">
        <h2 className="text-xl font-semibold">
          {bus.route.routeName} | Route No {bus.busRouteNumber}
        </h2>
      </div>

       {/* Bus details */}
       <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Departure and arrival info */}
        <div className="flex space-x-6 relative">
          {/* Departure */}
          <div className="flex items-center space-x-4">
            <img src="/assets/get-on-bus.png" alt="busin" className="h-12" />
            <div>
              <p className="text-sm text-gray-600">Departure</p>
              <p className="font-bold">{bus.route.departureLocation}</p>
              <p className="text-sm text-gray-600">Date</p>
              <p>{formatDate(bus.schedule.departureDate)}</p>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-bold">{formatTime(bus.schedule.departureTime)}</p>
            </div>
          </div>

          {/* Divider with duration */}
          <div className="relative">
            <div className="border-l border-gray-300 h-full mx-4"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 border border-gray-300 rounded-full">
              <p className="text-xs font-semibold text-deepOrange whitespace-nowrap">
                {bus.schedule.duration || "N/A"}
              </p>
            </div>
          </div>


      {/* Arrival */}
      <div className="flex items-center space-x-4">
            <img src="/assets/get-off-bus.png" alt="busout" className="h-12" />
            <div>
              <p className="text-sm text-gray-600">Arrival</p>
              <p className="font-bold">{bus.route.arrivalLocation}</p>
              <p className="text-sm text-gray-600">Date</p>
              <p>{formatDate(bus.schedule.arrivalDate)}</p>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-bold">{formatTime(bus.schedule.arrivalTime)}</p>
            </div>
          </div>
        </div>

        {/* Travel information */}
        <div  className="ml-10 flex flex-col items-start">
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
          <p className="text-2xl font-bold text-deepOrange">Rs. {bus.fareAmount}.00</p>
          <div className="mt-2">
            <p className="text-center text-sm text-gray-600">Available Seats</p>
            <p className="text-center text-2xl text-deepOrange font-bold">{bus.availableSeats}</p>
          </div>
          <p className="text-sm text-gray-600">Booking Closing</p>
          <p className="text-sm">{bus.bookingClosing || "N/A"}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-softPeach grid grid-cols-3">
        <button className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center">Boarding / Dropping Points</button>
        <button className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center">Bus Photos</button>
        <button
          className="py-2 px-4 bg-deepOrange text-white font-semibold hover:bg-sunsetOrange text-center"
          onClick={() => onViewSeat(bus.busId)}
        >
          VIEW SEAT
        </button>
      </div>
    </div>
  );
};




      {/* Bus details */}
      {/* <div className="p-4">
        <div className="flex flex-col md:flex-row justify-between"> */}
          {/* Travel and bus details */}
          {/* <div className="flex flex-col mb-4 md:mb-0">
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
          </div> */}

          {/* Departure details */}
          {/* <div className="flex flex-col items-center mb-4 md:mb-0">
            <div className="text-xl font-bold">{formatTime(bus.schedule.departureTime)}</div>
            <div className="text-sm">{formatDate(bus.schedule.departureDate)}</div>
            <div className="text-xs text-gray-600">{bus.route.departureLocation}</div>
          </div> */}

          {/* Duration */}
          {/* <div className="flex flex-col items-center mb-4 md:mb-0">
            <div className="text-sm text-gray-600 flex items-center">
              <Clock size={14} className="mr-1" /> {bus.schedule.duration}
            </div>
            <div className="w-20 h-0.5 bg-gray-300 my-2 relative">
              <div className="absolute top-1/2 left-0 w-2 h-2 bg-deepOrange rounded-full transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 right-0 w-2 h-2 bg-deepOrange rounded-full transform -translate-y-1/2"></div>
            </div>
            <div className="text-xs text-gray-500">Direct</div>
          </div> */}

          {/* Arrival details */}
          {/* <div className="flex flex-col items-center mb-4 md:mb-0">
            <div className="text-xl font-bold">{formatTime(bus.schedule.arrivalTime)}</div>
            <div className="text-sm">{formatDate(bus.schedule.arrivalDate)}</div>
            <div className="text-xs text-gray-600">{bus.route.arrivalLocation}</div>
          </div> */}

          {/* Pricing and availability */}
          // <div className="flex flex-col items-end">
          //   <div className="text-xl font-bold text-deepOrange">
          //     Rs. {bus.fareAmount}
          //   </div>
          //   <div className="text-sm text-gray-600">
          //     {bus.availableSeats} seats left
          //   </div>
          //   <button
          //     onClick={() => onViewSeat(bus.busId)}
          //     className="mt-2 px-4 py-1 bg-deepOrange text-white rounded hover:bg-red-700 transition"
          //   >
          //     View Seats
          //   </button>
          // </div>


export default BusCard;