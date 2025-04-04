import React, { useState, useEffect } from "react";
import { Bus, Clock, Star, X, MapPin } from "lucide-react";

const BusCard = ({ bus, onViewSeat }) => {
  const [showPoints, setShowPoints] = useState(false);
  const [stops, setStops] = useState({ boarding: [], dropping: [] });
  const [loading, setLoading] = useState(false);

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

  // Fetch stops when the card is expanded
  // useEffect(() => {
  //   const fetchStops = async () => {
  //     if (!showStops) return;
      
  //     setLoading(true);
  //     try {
  //       // Replace with your actual API endpoint
  //       const API_URI = import.meta.env.VITE_API_URL;
  //       const response = await fetch(`${API_URI}/api/routes/${bus.busRouteNumber}/stops`);
        
  //       if (!response.ok) {
  //         throw new Error("Failed to fetch stops");
  //       }
        
  //       const data = await response.json();
        
  //       // Filter stops by type
  //       const boardingStops = data.filter(stop => stop.stopType === 'boarding');
  //       const droppingStops = data.filter(stop => stop.stopType === 'dropping');
        
  //       setStops({
  //         boarding: boardingStops,
  //         dropping: droppingStops
  //       });
  //     } catch (error) {
  //       console.error("Error fetching stops:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
    
  //   fetchStops();
  // }, [showStops, bus.busRouteNumber]);

  // Toggle stops visibility
  // const toggleStops = () => {
  //   setShowStops(!showStops);
  // };
  // Filter stops by type
// Update these lines in BusCard.jsx
const boardingPoints = bus.route?.stops?.filter(stop => stop?.stopType === 'boarding') || [];
const droppingPoints = bus.route?.stops?.filter(stop => stop?.stopType === 'dropping') || [];
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
          <p className="text-2xl font-bold text-deepOrange">Rs. {bus.fareAmount}.00</p>
          <div className="mt-2">
            <p className="text-center text-sm text-gray-600">Available Seats</p>
            <p className="text-center text-2xl text-deepOrange font-bold">{bus.availableSeats}</p>
          </div>
          <p className="text-sm text-gray-600">Booking Closing</p>
          <p className="text-sm">{bus.bookingClosing || "N/A"}</p>
        </div>
      </div>

      {/* Boarding/Dropping points section */}
      {/* {showStops && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 transition-all duration-300 overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-lg text-deepOrange">Boarding & Dropping Points</h3>
            <button 
              onClick={toggleStops} 
              className="p-1 hover:bg-gray-200 rounded-full"
              aria-label="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-deepOrange"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
              {/* Boarding points */}
              {/* <div className="border-r border-gray-200 pr-4">
                <h4 className="text-md font-semibold mb-2 text-gray-700">
                  <img src="/assets/get-on-bus.png" alt="boarding" className="h-5 inline mr-2" />
                  Boarding Points
                </h4>
                {stops.boarding.length > 0 ? (
                  <ul className="space-y-2">
                    {stops.boarding.map((stop, index) => (
                      <li key={`boarding-${index}`} className="flex border-b border-gray-100 pb-2">
                        <div className="w-10 text-center font-bold text-deepOrange">
                          {stop.order}.
                        </div>
                        <div>
                          <p className="font-medium">{stop.stop.name}</p>
                          <p className="text-sm text-gray-600">
                            {stop.stop.address || 'No address provided'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm py-2">No boarding points available</p>
                )}
              </div>
               */}
              {/* Dropping points */}
              {/* <div className="pl-4">
                <h4 className="text-md font-semibold mb-2 text-gray-700">
                  <img src="/assets/get-off-bus.png" alt="dropping" className="h-5 inline mr-2" />
                  Dropping Points
                </h4>
                {stops.dropping.length > 0 ? (
                  <ul className="space-y-2">
                    {stops.dropping.map((stop, index) => (
                      <li key={`dropping-${index}`} className="flex border-b border-gray-100 pb-2">
                        <div className="w-10 text-center font-bold text-deepOrange">
                          {stop.order}.
                        </div>
                        <div>
                          <p className="font-medium">{stop.stop.name}</p>
                          <p className="text-sm text-gray-600">
                            {stop.stop.address || 'No address provided'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm py-2">No dropping points available</p>
                )}
              </div>
            </div>
          )}
        </div>
      )} */}

      {/* Action buttons */}
      {/* <div className="bg-softPeach grid grid-cols-3">
        <button 
          className={`py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center ${showStops ? 'bg-lightYellow' : ''}`}
          onClick={toggleStops}
        >
          Boarding / Dropping Points
        </button>
        <button className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center">
          Bus Photos
        </button>
        <button
          className="py-2 px-4 bg-deepOrange text-white font-semibold hover:bg-sunsetOrange text-center"
          onClick={() => onViewSeat(bus.busId, bus.scheduleId)}
        >
          VIEW SEAT
        </button>
      </div>
    </div>
  );
}; */}

{/* Action buttons */}
<div className="bg-softPeach grid grid-cols-3">
        <button 
          className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center flex items-center justify-center gap-1"
          onClick={() => setShowPoints(!showPoints)}
        >
          <MapPin size={16} />
          {showPoints ? "Hide Points" : "Boarding/Dropping Points"}
        </button>
        <button className="py-2 px-4 hover:bg-lightYellow text-darkCharcoal text-center">
          Bus Photos
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
            <h3 className="text-lg font-semibold text-deepOrange">Route Points</h3>
            <button 
              onClick={() => setShowPoints(false)}
              className="text-gray-500 hover:text-deepOrange"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Boarding Points */}
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

            {/* Dropping Points */}
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
    </div>
  );
};

export default BusCard;