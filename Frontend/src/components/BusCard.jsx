import React from "react";
import { FaBusAlt, FaArrowRight, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";

const BusCard = ({ bus, onViewSeat }) => {
  return (
    <div className="rounded-lg overflow-hidden shadow-md mb-4 bg-white border border-gray-200">
      {/* Bus route header */}
      <div className="bg-brightYellow text-darkCharcoal p-3">
        <h2 className="text-xl font-semibold">
          {bus.route} | Route No {bus.routeNumber} via Airport
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
              <p className="font-bold">{bus.departure.location}</p>
              <p className="text-sm text-gray-600">Date</p>
              <p>{bus.departure.date}</p>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-bold">{bus.departure.time}</p>
            </div>
          </div>
          
          {/* Divider with duration */}
          <div className="relative">
            <div className="border-l border-gray-300 h-full mx-4"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 border border-gray-300 rounded-full">
              <p className="text-xs font-semibold text-deepOrange whitespace-nowrap">
                {bus.duration || "4h 30m"}
              </p>
            </div>
          </div>
          
          {/* Arrival */}
          <div className="flex items-center space-x-4">
            <img src="/assets/get-off-bus.png" alt="busout" className="h-12" />
            <div>
              <p className="text-sm text-gray-600">Arrival</p>
              <p className="font-bold">{bus.arrival.location}</p>
              <p className="text-sm text-gray-600">Date</p>
              <p>{bus.arrival.date}</p>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-bold">{bus.arrival.time}</p>
            </div>
          </div>
        </div>
        
        {/* Travel information */}
        <div>
          <p className="text-sm text-gray-600">Travel Name</p>
          <p className="text-xl font-bold text-deepOrange">{bus.travel.name}</p>
          <p className="text-sm text-gray-600">Bus Number</p>
          <p>{bus.travel.busNumber}</p>
          <p className="text-sm text-gray-600">Bus Type</p>
          <p className="font-semibold">{bus.travel.type}</p>
        </div>
        {/* Price and seats */}
        <div className="flex flex-col items-end">
          <p className="text-2xl font-bold text-deepOrange">Rs. {bus.price.toLocaleString()}.00</p>
          <div className="mt-2">
            <p className="text-center text-sm text-gray-600">Available Seats</p>
            <p className="text-center text-2xl text-deepOrange font-bold">{bus.availableSeats}</p>
          </div>
          <p className="text-sm text-gray-600">Booking Closing</p>
          <p className="text-sm">{bus.bookingClosing}</p>
        </div>
      </div>
      {/* Action buttons */}
      <div className="bg-softPeach grid grid-cols-3">
        <button className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center">Boarding / Dropping Points</button>
        <button className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center">Bus Photos</button>
        <button
          className="py-2 px-4 bg-deepOrange text-white font-semibold hover:bg-sunsetOrange text-center"
          onClick={() => onViewSeat(bus.id)}
        >
          VIEW SEAT
        </button>
      </div>
    </div>
  );
};

export default BusCard;