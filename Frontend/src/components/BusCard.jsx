import React from "react";

const BusCard = ({ bus, onViewSeat }) => {
  return (
    <div className="rounded-lg overflow-hidden shadow-md mb-4">
      {/* Bus route header */}
      <div className="bg-red-600 text-white p-3">
        <h2 className="text-xl font-semibold">{bus.route} |Route No {bus.routeNumber} viaAirport</h2>
      </div>
      
      {/* Bus details */}
      <div className="bg-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Departure and arrival info */}
        <div className="flex space-x-4">
          {/* Departure */}
          <div className="flex">
            <div className="mr-3">
              <div className="w-16 h-16 flex items-center justify-center">
                <img src="/bus-icon.svg" alt="Bus" className="w-16" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Departure</p>
              <p className="font-bold">{bus.departure.location}</p>
              <p className="text-sm text-gray-600">Date</p>
              <p>{bus.departure.date}</p>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-bold">{bus.departure.time}</p>
            </div>
          </div>
          
          {/* Arrival */}
          <div className="flex">
            <div className="mr-3">
              <div className="w-16 h-16 flex items-center justify-center">
                <img src="/bus-icon.svg" alt="Bus" className="w-16" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Arrival</p>
              <p className="font-bold">{bus.arrival.location}</p>
              <p className="text-sm text-gray-600">Date</p>
              <p>{bus.arrival.date}</p>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-bold">{bus.arrival.time}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-gray-600">Duration: {bus.duration}</p>
          </div>
        </div>
        
        {/* Travel information */}
        <div>
          <p className="text-sm text-gray-600">Travel Name</p>
          <p className="text-xl font-bold text-red-600">{bus.travel.name}</p>
          <p className="text-sm text-gray-600">Bus Number</p>
          <p>{bus.travel.busNumber}</p>
          <p className="text-sm text-gray-600">Bus Type</p>
          <p className="font-semibold">{bus.travel.type}</p>
        </div>
        
        {/* Price and seats */}
        <div className="flex flex-col items-end">
          <p className="text-2xl font-bold">Rs. {bus.price.toLocaleString()}.00</p>
          <div className="mt-2">
            <p className="text-center">Available Seats</p>
            <p className="text-center text-2xl text-red-600 font-bold">{bus.availableSeats}</p>
          </div>
          <p className="text-sm text-gray-600">Booking Closing</p>
          <p className="text-sm">{bus.bookingClosing}</p>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="bg-gray-300 grid grid-cols-3">
        <button className="py-2 px-4 hover:bg-gray-400 text-center">Boarding / Dropping Points</button>
        <button className="py-2 px-4 hover:bg-gray-400 text-center">Bus Photos</button>
        <button 
          className="py-2 px-4 bg-red-600 text-white font-semibold hover:bg-red-700 text-center"
          onClick={() => onViewSeat(bus.id)}
        >
          VIEW SEAT
        </button>
      </div>
    </div>
  );
};

export default BusCard;