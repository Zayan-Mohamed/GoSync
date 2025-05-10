import React, { useState, useEffect, useMemo } from "react";
import { Bus, Clock, Star, X, MapPin, Wifi, BatteryCharging, Coffee, Sunset, Wind, Droplet, MonitorSmartphone, Moon, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BusCardSchedule = ({ bus }) => {
  const [showPoints, setShowPoints] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [animateRoute, setAnimateRoute] = useState(false);
  const navigate = useNavigate();

  // Animation trigger
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimateRoute(true);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

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

  // Calculate journey duration
  const calculateDuration = useMemo(() => {
    return bus.schedule?.duration || "N/A";
  }, [bus.schedule]);

  // Determine if journey is night or day
  const isNightJourney = useMemo(() => {
    if (!bus.schedule?.departureTime) return false;
    const [hours] = bus.schedule.departureTime.split(":");
    const hour = parseInt(hours, 10);
    return hour >= 18 || hour < 6;
  }, [bus.schedule?.departureTime]);

  // Determine journey time of day for theme
  const journeyTimeOfDay = useMemo(() => {
    if (!bus.schedule?.departureTime) return "day";
    const [hours] = bus.schedule.departureTime.split(":");
    const hour = parseInt(hours, 10);
    
    if (hour >= 5 && hour < 11) return "morning";
    if (hour >= 11 && hour < 16) return "afternoon";
    if (hour >= 16 && hour < 19) return "evening";
    return "night";
  }, [bus.schedule?.departureTime]);

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

  // Journey theme styles
  const journeyTheme = {
    morning: {
      gradientBg: "bg-gradient-to-r from-amber-50 to-amber-100",
      iconColor: "text-amber-500",
      dotsBg: "bg-amber-400"
    },
    afternoon: {
      gradientBg: "bg-gradient-to-r from-blue-50 to-blue-100",
      iconColor: "text-blue-500",
      dotsBg: "bg-blue-400"
    },
    evening: {
      gradientBg: "bg-gradient-to-r from-orange-50 to-orange-100",
      iconColor: "text-orange-500",
      dotsBg: "bg-orange-400"
    },
    night: {
      gradientBg: "bg-gradient-to-r from-indigo-900/10 to-purple-900/10",
      iconColor: "text-indigo-600",
      dotsBg: "bg-indigo-400"
    }
  };

  const theme = journeyTheme[journeyTimeOfDay];

  return (
    <div 
      className={`rounded-xl overflow-hidden shadow-lg mb-6 bg-white border border-gray-200 transform transition-all duration-300 ${isHovered ? "scale-[1.02] shadow-xl" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic time-of-day header with accent */}
      <div className="relative">
        <div className={`${theme.gradientBg} p-4`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {bus.route.routeName} <span className="text-deepOrange">•</span> Route {bus.busRouteNumber}
              </h2>
              <div className="flex items-center mt-1 space-x-2 text-sm text-gray-600">
                {isNightJourney ? (
                  <span className="flex items-center"><Moon size={14} className="mr-1" /> Night Journey</span>
                ) : (
                  <span className="flex items-center"><Sunset size={14} className="mr-1" /> Day Journey</span>
                )}
                <span>•</span>
                <span className="flex items-center"><Bus size={14} className="mr-1" /> {bus.busType}</span>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-deepOrange">Rs. {bus.fareAmount}</p>
              <p className="text-xs text-gray-500 text-right">per person</p>
            </div>
          </div>
        </div>
        
        {/* Decorative dots */}
        <div className="absolute -bottom-2 left-0 right-0 flex justify-center space-x-1">
          {[...Array(7)].map((_, i) => (
            <div 
              key={i} 
              className={`${theme.dotsBg} h-1 w-1 rounded-full opacity-70`}
              style={{
                animationName: 'pulse',
                animationDuration: '1.5s',
                animationIterationCount: 'infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Journey timeline */}
      <div className="p-6">
        <div className="flex items-center relative">
          {/* Departure */}
          <div className="text-center z-10">
            <div className={`w-10 h-10 rounded-full ${animateRoute ? "bg-brightYellow" : "bg-gray-200"} flex items-center justify-center mx-auto transition-colors duration-1000`}>
              <img 
                src="/assets/get-on-bus.png" 
                alt="departure" 
                className={`h-6 transition-all duration-500 ${animateRoute ? "opacity-100" : "opacity-0"}`} 
              />
            </div>
            <p className="mt-1 font-bold">{formatTime(bus.schedule?.departureTime)}</p>
            <p className="text-xs text-gray-500">{formatDate(bus.schedule?.departureDate)}</p>
          </div>
          
          {/* Timeline line */}
          <div className="flex-grow mx-2 relative">
            <div className="h-0.5 bg-gray-200 absolute top-5 left-0 right-0"></div>
            <div 
              className="h-0.5 bg-deepOrange absolute top-5 left-0" 
              style={{
                width: animateRoute ? "100%" : "0%",
                transition: "width 1.5s ease-in-out"
              }}
            ></div>
            
            {/* Journey details popup */}
            <div className="mt-6 text-center">
              <div 
                className={`inline-block py-1 px-3 rounded-full text-xs font-medium transition-all duration-700 ${animateRoute ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                style={{ transitionDelay: "0.7s" }}
              >
                <span className={`${theme.iconColor}`}>{calculateDuration}</span>
                <p className="text-xs text-gray-500 mt-1">{bus.route.departureLocation} to {bus.route.arrivalLocation}</p>
              </div>
            </div>
          </div>
          
          {/* Arrival */}
          <div className="text-center z-10">
            <div className={`w-10 h-10 rounded-full ${animateRoute ? "bg-deepOrange" : "bg-gray-200"} flex items-center justify-center mx-auto transition-colors duration-1000`} style={{ transitionDelay: "1s" }}>
              <img 
                src="/assets/get-off-bus.png" 
                alt="arrival" 
                className={`h-6 transition-all duration-500 ${animateRoute ? "opacity-100" : "opacity-0"}`} 
                style={{ transitionDelay: "1.2s" }}
              />
            </div>
            <p className="mt-1 font-bold">{formatTime(bus.schedule?.arrivalTime)}</p>
            <p className="text-xs text-gray-500">{formatDate(bus.schedule?.arrivalDate)}</p>
          </div>
        </div>
      </div>

      {/* Travel information */}
      <div className="px-6 pb-4 grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Travel Details</h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-full bg-deepOrange/10 flex items-center justify-center mr-3">
                <Bus size={18} className="text-deepOrange" />
              </div>
              <div>
                <p className="text-lg font-bold text-deepOrange">{bus.travelName}</p>
                <p className="text-xs text-gray-500">{bus.busNumber || "Bus ID: " + bus.busId}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <div className="flex items-center">
                <Star size={14} className="text-amber-400 mr-1" />
                <span className="font-medium">4.5</span>
              </div>
              <span className="text-gray-500 text-xs">180 ratings</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Schedule Info</h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center mb-3">
              <Shield size={14} className="text-green-500 mr-2" />
              <span className="text-xs font-medium text-green-600">Safe & Secure</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-softPeach rounded-md p-2 text-center">
                <p className="text-xs text-gray-600">Frequency</p>
                <p className="font-semibold text-sm">Daily</p>
              </div>
              <div className="bg-lightYellow rounded-md p-2 text-center">
                <p className="text-xs text-gray-600">Service</p>
                <p className="font-semibold text-sm">Premium</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="px-6 pb-5">
        <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Amenities</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2 w-14">
            <Wifi size={14} className="text-gray-600" />
            <span className="text-xs mt-1">WiFi</span>
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2 w-14">
            <Wind size={14} className="text-gray-600" />
            <span className="text-xs mt-1">AC</span>
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2 w-14">
            <BatteryCharging size={14} className="text-gray-600" />
            <span className="text-xs mt-1">Charging</span>
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2 w-14">
            <Coffee size={14} className="text-gray-600" />
            <span className="text-xs mt-1">Snacks</span>
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2 w-14">
            <Droplet size={14} className="text-gray-600" />
            <span className="text-xs mt-1">Water</span>
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2 w-14">
            <MonitorSmartphone size={14} className="text-gray-600" />
            <span className="text-xs mt-1">TV</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-px bg-gray-100">
        <button
          className={`py-3 px-4 font-medium flex items-center justify-center gap-2 transition-colors ${
            showPoints ? "bg-lightYellow text-darkCharcoal" : "bg-white text-darkCharcoal hover:bg-gray-50"
          }`}
          onClick={() => setShowPoints(!showPoints)}
        >
          <MapPin size={16} className={showPoints ? "text-deepOrange" : ""} />
          {showPoints ? "Hide Points" : "Route Stops"}
        </button>
        <button
          className="py-3 px-4 bg-deepOrange text-white font-medium flex items-center justify-center gap-2 hover:bg-sunsetOrange transition-colors"
          onClick={handleViewSchedule}
        >
          <Clock size={16} />
          VIEW SCHEDULE
        </button>
      </div>

      {/* Expandable points section with animated expansion */}
      <div 
        className={`bg-white overflow-hidden transition-all duration-300 ease-in-out ${
          showPoints ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="p-5 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-deepOrange">Route Stops</h3>
            <button
              onClick={() => setShowPoints(false)}
              className="text-gray-400 hover:text-deepOrange transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-brightYellow mb-3 flex items-center gap-2">
                <MapPin size={16} /> Boarding Points
              </h4>
              <ul className="space-y-3">
                {boardingPoints.length > 0 ? (
                  boardingPoints.map((point, index) => (
                    <li 
                      key={index} 
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-brightYellow/20 flex items-center justify-center shrink-0">
                        <span className="text-deepOrange text-xs font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{point.stop.stopName}</p>
                        <p className="text-sm text-gray-500">{point.stop.stopAddress}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No boarding points available</p>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-brightYellow mb-3 flex items-center gap-2">
                <MapPin size={16} /> Dropping Points
              </h4>
              <ul className="space-y-3">
                {droppingPoints.length > 0 ? (
                  droppingPoints.map((point, index) => (
                    <li 
                      key={index} 
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-deepOrange/20 flex items-center justify-center shrink-0">
                        <span className="text-deepOrange text-xs font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{point.stop.stopName}</p>
                        <p className="text-sm text-gray-500">{point.stop.stopAddress}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No dropping points available</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.4; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default BusCardSchedule;