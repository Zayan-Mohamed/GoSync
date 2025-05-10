import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, ChevronLeft, ChevronRight, Loader, ListFilter } from "lucide-react";
import BusCard from "../components/BusCard";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import BusCardSchedule from "../components/BusCardSchedule";
import Navbar1 from "../components/Navbar1";

const BusSchedules = () => {
  const navigate = useNavigate();
  const [activeDate, setActiveDate] = useState(0); // 0: today, 1: tomorrow, 2: day after tomorrow, 3: all
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllSchedules, setShowAllSchedules] = useState(false);
  const [sortBy, setSortBy] = useState("departure");
  const [busDetails, setBusDetails] = useState({}); // New state to store bus details

  // Calculate dates for today, tomorrow, and day after tomorrow
  const dates = Array(3)
    .fill()
    .map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return date;
    });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Set up socket connection for real-time seat updates
  useEffect(() => {
    const socket = io(`${API_URL}`, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      filteredSchedules.forEach((schedule) => {
        const scheduleId = schedule._id || schedule.scheduleID;
        const busId = schedule.busId?._id || schedule.busId;
        if (busId && scheduleId) {
          socket.emit("joinTrip", {
            busId: busId,
            scheduleId: scheduleId,
          });
        }
      });
    });

    socket.on("seatUpdate", (data) => {
      console.log("Seat update received:", data);
      setSchedules((prev) =>
        prev.map((schedule) => {
          const scheduleId = schedule._id || schedule.scheduleID;
          const busId = schedule.busId?._id || schedule.busId;
          return busId === data.busId && scheduleId === data.scheduleId
            ? { ...schedule, availableSeats: data.availableSeats }
            : schedule;
        })
      );
    });

    return () => {
      console.log("Socket disconnecting");
      socket.disconnect();
    };
  }, [filteredSchedules, API_URL]);

  // Format date for API request (YYYY-MM-DD)
  const formatDateForApi = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Format date for display in tabs
  const formatTabDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const isSameDate = (date1, date2) => 
      date1.getDate() === date2.getDate() && 
      date1.getMonth() === date2.getMonth() && 
      date1.getFullYear() === date2.getFullYear();
    
    if (isSameDate(date, today)) {
      return "Today";
    } else if (isSameDate(date, tomorrow)) {
      return "Tomorrow";
    } else if (isSameDate(date, dayAfter)) {
      return "Day After";
    } else {
      const options = { weekday: 'short', day: 'numeric', month: 'short' };
      return date.toLocaleDateString(undefined, options);
    }
  };

  // NEW EFFECT: Fetch bus details for each unique busId
  useEffect(() => {
    const fetchBusDetails = async () => {
      if (!schedules.length) return;
      
      try {
        // Get unique bus IDs
        const uniqueBusIds = [...new Set(schedules.map(schedule => {
          return typeof schedule.busId === 'object' && schedule.busId?._id 
            ? schedule.busId._id 
            : schedule.busId;
        }))];
        
        console.log("Fetching details for buses:", uniqueBusIds);
        
        // Create temporary object to store bus details
        const tempBusDetails = {};
        
        // Fetch details for each unique bus ID
        await Promise.all(uniqueBusIds.map(async (busId) => {
          if (!busId) return;
          
          try {
            const response = await axios.get(`${API_URL}/api/buses/buses/${busId}`, {withCredentials: true});
            if (response.data) {
              tempBusDetails[busId] = response.data;
              console.log(`Bus details for ${busId}:`, response.data);
            }
          } catch (err) {
            console.error(`Failed to fetch bus details for ID ${busId}:`, err);
          }
        }));
        
        // Update state with all bus details
        setBusDetails(tempBusDetails);
      } catch (err) {
        console.error("Error fetching bus details:", err);
      }
    };

    fetchBusDetails();
  }, [schedules, API_URL]);

  // Fetch schedules from API
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get detailed schedule information with bus and route data populated
        const response = await axios.get(`${API_URL}/api/schedules`, {withCredentials: true});
        
        if (!response.data || response.data.length === 0) {
          console.log("No schedules found or empty response");
          setSchedules([]);
          setFilteredSchedules([]);
          setLoading(false);
          return;
        }
        
        console.log("API Response:", response.data);
        
        // Filter out past schedules - only keep present and future schedules
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const currentAndFutureSchedules = response.data.filter(schedule => {
          // Create date object without time component for proper comparison
          const scheduleDateStr = new Date(schedule.departureDate).toISOString().split('T')[0];
          const scheduleDate = new Date(scheduleDateStr);
          scheduleDate.setHours(0, 0, 0, 0);
          
          const todayStr = today.toISOString().split('T')[0];
          const todayDate = new Date(todayStr);
          
          return scheduleDate >= todayDate;
        });
        
        // Sort schedules by date (ascending)
        const sortedSchedules = [...currentAndFutureSchedules].sort((a, b) => {
          const dateA = new Date(a.departureDate);
          const dateB = new Date(b.departureDate);
          return dateA - dateB;
        });
        
        console.log("Sorted schedules:", sortedSchedules);
        
        // Fetch bus information for each schedule if not already populated
        const enrichedSchedules = await Promise.all(sortedSchedules.map(async (schedule) => {
          let busInfo = schedule.busId;
          let routeInfo = schedule.routeId;
          
          // If busId is just an ID (not populated), fetch bus details
          if (typeof schedule.busId === 'string' || (!schedule.busId?.busNumber && schedule.busId?._id)) {
            try {
              const busResponse = await axios.get(`${API_URL}/api/buses/buses/${schedule.busId._id || schedule.busId}`, {withCredentials: true});
              busInfo = busResponse.data;
            } catch (err) {
              console.error(`Failed to fetch bus info for ID ${schedule.busId}:`, err);
            }
          }
          
          // If routeId is just an ID (not populated), fetch route details
          if (typeof schedule.routeId === 'string' || (!schedule.routeId?.startLocation && schedule.routeId?._id)) {
            try {
              const routeResponse = await axios.get(`${API_URL}/api/routes/routes/${schedule.routeId._id || schedule.routeId}`, {withCredentials: true});
              routeInfo = routeResponse.data;
            } catch (err) {
              console.error(`Failed to fetch route info for ID ${schedule.routeId}:`, err);
            }
          }
          
          // Extract seats info from bus if not in schedule
          const totalSeats = schedule.totalSeats || 
            (busInfo && typeof busInfo === 'object' ? (busInfo.capacity || busInfo.totalSeats || 40) : 40);
          
          // Default to 70% available seats if not specified
          const availableSeats = schedule.availableSeats !== undefined ? 
            schedule.availableSeats : Math.floor(totalSeats * 0.7);
          
          return {
            ...schedule,
            busId: busInfo,
            routeId: routeInfo,
            totalSeats: totalSeats,
            availableSeats: availableSeats
          };
        }));
        
        console.log("Enriched schedules:", enrichedSchedules);
        setSchedules(enrichedSchedules);
        
        // Initial filtering for activeDate (today)
        if (showAllSchedules) {
          setFilteredSchedules(enrichedSchedules);
        } else {
          filterSchedulesForDate(enrichedSchedules, dates[activeDate]);
        }
      } catch (err) {
        console.error("Error fetching schedules:", err);
        setError("Failed to load bus schedules. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [showAllSchedules, API_URL]);

  // Filter schedules based on selected date
  const filterSchedulesForDate = (allSchedules, targetDate) => {
    if (!targetDate) {
      // If no target date (for "All" option), return all schedules
      setFilteredSchedules(allSchedules);
      return;
    }
    
    const targetDateStr = formatDateForApi(targetDate);
    
    const filtered = allSchedules.filter(schedule => {
      // Normalize both dates to YYYY-MM-DD format for correct comparison
      const scheduleDate = new Date(schedule.departureDate).toISOString().split('T')[0];
      return scheduleDate === targetDateStr;
    });
    
    setFilteredSchedules(filtered);
  };

  // Update filtered schedules when active date changes
  useEffect(() => {
    if (schedules.length > 0) {
      if (showAllSchedules) {
        setFilteredSchedules(schedules);
      } else {
        filterSchedulesForDate(schedules, dates[activeDate]);
      }
    }
  }, [activeDate, schedules, showAllSchedules]);

  // Handle view schedule action
const handleViewSchedule = (bus) => {
  console.log(`Viewing schedule for route ${bus.route.routeName}`);
  
  const fromLocation = bus.route.departureLocation;
  const toLocation = bus.route.arrivalLocation;
  const journeyDate = bus.schedule.departureDate;
  
  // Navigate to bus search results page
  navigate("/bus-search-results", {
    state: {
      fromLocation,
      toLocation,
      journeyDate,
    },
  });
};

  // Navigate between dates
  const navigateDate = (direction) => {
    setActiveDate((prev) => {
      const newDate = prev + direction;
      return Math.max(0, Math.min(2, newDate)); // Keep within 0-2 range
    });
  };

  // Toggle all schedules view
  const handleToggleAllSchedules = () => {
    setShowAllSchedules(prev => !prev);
  };

  // Sort schedules based on selected criteria
  const sortSchedules = (schedules) => {
    let sortedSchedules = [...schedules];

    switch (sortBy) {
      case "departure":
        sortedSchedules.sort((a, b) => {
          const timeA = a.departureTime || "00:00";
          const timeB = b.departureTime || "00:00";
          return timeA.localeCompare(timeB);
        });
        break;
      case "arrival":
        sortedSchedules.sort((a, b) => {
          const timeA = a.arrivalTime || "00:00";
          const timeB = b.arrivalTime || "00:00";
          return timeA.localeCompare(timeB);
        });
        break;
      case "price":
        sortedSchedules.sort((a, b) => {
          const fareA = getFare(a) || 0;
          const fareB = getFare(b) || 0;
          return fareA - fareB;
        });
        break;
      case "seats":
        sortedSchedules.sort((a, b) => {
          const seatsA = a.availableSeats || 0;
          const seatsB = b.availableSeats || 0;
          return seatsB - seatsA; // More seats first
        });
        break;
      default:
        break;
    }

    return sortedSchedules;
  };

  // Helper function to get fare from multiple sources
  const getFare = (schedule) => {
    // Check if fare is directly in the schedule
    if (schedule.fare) {
      return Number(schedule.fare);
    }
    
    // Try to get busId
    const busId = typeof schedule.busId === 'object' ? schedule.busId?._id : schedule.busId;
    
    // Check if we have the bus details in our state
    if (busId && busDetails[busId]) {
      // Return fare from bus details
      return Number(
        busDetails[busId].fareAmount || 
        busDetails[busId].fare || 
        busDetails[busId].price || 
        busDetails[busId].ticketPrice || 
        0
      );
    }
    
    // If busId is an object with fare info
    if (typeof schedule.busId === 'object') {
      return Number(
        schedule.busId.fareAmount || 
        schedule.busId.fare || 
        schedule.busId.price || 
        schedule.busId.ticketPrice || 
        0
      );
    }
    
    // Default fare
    return 100;
  };

  // Helper function to get travel name
  const getTravelName = (schedule) => {
    // Try to get busId
    const busId = typeof schedule.busId === 'object' ? schedule.busId?._id : schedule.busId;
    
    // Check if we have the bus details in our state
    if (busId && busDetails[busId]) {
      return busDetails[busId].travelName || "GoSync";
    }
    
    // If busId is an object with travel name
    if (typeof schedule.busId === 'object' && schedule.busId?.travelName) {
      return schedule.busId.travelName;
    }
    
    // Default travel name
    return "GoSync";
  };

  // Transform schedule data to match BusCard expected format
  const transformScheduleForBusCard = (schedule) => {
    console.log("Transforming schedule:", schedule);
    
    // Extract bus info safely - handle both populated and non-populated data
    const busInfo = typeof schedule.busId === 'object' && schedule.busId !== null
      ? schedule.busId 
      : { _id: schedule.busId };
      
    // Get the busId for lookups
    const busId = typeof busInfo === 'object' ? (busInfo._id || "") : (busInfo || "");
      
    // Extract route info safely
    const routeInfo = typeof schedule.routeId === 'object' && schedule.routeId !== null
      ? schedule.routeId
      : {};
      
    // Extract boarding and dropping points with better fallbacks
    let boardingStops = [];
    let droppingStops = [];
    
    // Check if routeInfo has stops array
    if (routeInfo.stops && Array.isArray(routeInfo.stops)) {
      // Extract boarding points from route stops
      boardingStops = routeInfo.stops
        .filter(stop => stop.stopType === 'boarding' || !stop.stopType)
        .map(stopObj => {
          const stopData = stopObj.stop || stopObj;
          return {
            stopName: typeof stopData === 'object' ? (stopData.stopName || stopData.name || "Boarding Point") : "Boarding Point",
            stopAddress: typeof stopData === 'object' ? (stopData.stopAddress || stopData.address || "Address not specified") : "Address not specified"
          };
        });

      // Extract dropping points from route stops
      droppingStops = routeInfo.stops
        .filter(stop => stop.stopType === 'dropping' || !stop.stopType)
        .map(stopObj => {
          const stopData = stopObj.stop || stopObj;
          return {
            stopName: typeof stopData === 'object' ? (stopData.stopName || stopData.name || "Dropping Point") : "Dropping Point",
            stopAddress: typeof stopData === 'object' ? (stopData.stopAddress || stopData.address || "Address not specified") : "Address not specified"
          };
        });
    }
    
    // If no boarding stops found, use start location as default
    if (boardingStops.length === 0) {
      boardingStops = [{
        stopName: routeInfo.startLocation || "Origin",
        stopAddress: "Main Bus Stand"
      }];
    }
    
    // If no dropping stops found, use end location as default
    if (droppingStops.length === 0) {
      droppingStops = [{
        stopName: routeInfo.endLocation || "Destination",
        stopAddress: "Main Bus Stand"
      }];
    }
    
    // Format stops for BusCard with better typing
    const formattedStops = [
      ...boardingStops.map(stop => ({
        stopType: "boarding",
        stop: {
          stopName: stop.stopName,
          stopAddress: stop.stopAddress
        }
      })),
      ...droppingStops.map(stop => ({
        stopType: "dropping",
        stop: {
          stopName: stop.stopName,
          stopAddress: stop.stopAddress
        }
      }))
    ];
    
    // Calculate duration if not provided
    let duration = schedule.duration;
    if (!duration && schedule.departureTime && schedule.arrivalTime) {
      const [depHours, depMinutes] = schedule.departureTime.split(':').map(Number);
      const [arrHours, arrMinutes] = schedule.arrivalTime.split(':').map(Number);
      
      let durationMinutes = (arrHours * 60 + arrMinutes) - (depHours * 60 + depMinutes);
      // Handle overnight routes
      if (durationMinutes < 0) durationMinutes += 24 * 60;
      
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      duration = `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    } else if (!duration) {
      duration = "2h"; // Default fallback
    }
    
    // Extract schedule IDs properly
    const scheduleId = schedule._id || schedule.scheduleID || "";
    
    // Get fare from our helper function
    const fare = getFare(schedule);
    
    // Extract total seats from multiple possible locations
    const totalSeats = schedule.totalSeats || 
                      (typeof busInfo === 'object' ? (busInfo.capacity || busInfo.totalSeats || 40) : 40) ||
                      (busDetails[busId]?.capacity || busDetails[busId]?.totalSeats || 40);
    
    // Extract bus route number with better fallbacks
    const busRouteNumber = (typeof busInfo === 'object' && busInfo.busRouteNumber) || 
                          (busDetails[busId]?.busRouteNumber) ||
                          (typeof routeInfo === 'object' && routeInfo.routeId) ||
                          `${routeInfo.startLocation || 'Origin'}-${routeInfo.endLocation || 'Dest'}`;
    
    // Extract bus number with better fallbacks
    const busNumber = (typeof busInfo === 'object' && busInfo.busNumber) || 
                     (busDetails[busId]?.busNumber) ||
                     `BUS-${scheduleId.slice(-5) || '00000'}`;
    
    // Extract bus type with better fallbacks
    const busType = (typeof busInfo === 'object' && busInfo.busType) || 
                   (busDetails[busId]?.busType) ||
                   "Standard";
    
    // Get travel name from our helper function
    const travelName = getTravelName(schedule);
    
    // Create the transformed bus object with reliable fallbacks
    const transformedBus = {
      busId: busId,
      scheduleId: scheduleId,
      busRouteNumber: busRouteNumber,
      busNumber: busNumber,
      busType: busType,
      travelName: travelName,
      fareAmount: fare,
      availableSeats: schedule.availableSeats || 0,
      totalSeats: totalSeats,
      route: {
        routeName: typeof routeInfo === 'object' && routeInfo.routeName 
          ? routeInfo.routeName 
          : `${routeInfo.startLocation || 'Origin'} - ${routeInfo.endLocation || 'Destination'}`,
        departureLocation: typeof routeInfo === 'object' ? (routeInfo.startLocation || "Origin") : "Origin",
        arrivalLocation: typeof routeInfo === 'object' ? (routeInfo.endLocation || "Destination") : "Destination",
        stops: formattedStops
      },
      schedule: {
        departureDate: schedule.departureDate || new Date().toISOString().split('T')[0],
        departureTime: schedule.departureTime || "00:00",
        arrivalDate: schedule.arrivalDate || schedule.departureDate || new Date().toISOString().split('T')[0],
        arrivalTime: schedule.arrivalTime || "00:00",
        duration: duration
      }
    };
    
    console.log("Transformed bus:", transformedBus);
    return transformedBus;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
      <Navbar1 />
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-orange-500">GoSync Bus Schedules</h1>
        </div>

        {/* Date selector tabs with All Schedules button */}
        <div className="flex items-center justify-between p-2 bg-orange-50">
          <button 
            onClick={() => navigateDate(-1)}
            disabled={activeDate === 0 || showAllSchedules}
            className={`p-2 rounded-full ${(activeDate === 0 || showAllSchedules) ? 'text-gray-400' : 'text-orange-500 hover:bg-orange-100'}`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex-1 flex justify-center items-center">
            <button
              onClick={handleToggleAllSchedules}
              className={`px-4 py-2 mx-1 rounded-md flex items-center ${
                showAllSchedules 
                  ? 'bg-orange-500 text-white font-semibold' 
                  : 'hover:bg-orange-100 text-gray-700'
              }`}
            >
              <ListFilter size={16} className="mr-2" />
              All Schedules
            </button>
            
            {dates.map((date, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setShowAllSchedules(false);
                  setActiveDate(idx);
                }}
                className={`px-4 py-2 mx-1 rounded-md flex items-center ${
                  activeDate === idx && !showAllSchedules
                    ? 'bg-orange-500 text-white font-semibold' 
                    : 'hover:bg-orange-100 text-gray-700'
                }`}
              >
                <Calendar size={16} className="mr-2" />
                {formatTabDate(date)}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => navigateDate(1)}
            disabled={activeDate === 2 || showAllSchedules}
            className={`p-2 rounded-full ${(activeDate === 2 || showAllSchedules) ? 'text-gray-400' : 'text-orange-500 hover:bg-orange-100'}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Sort filters */}
      <div className="bg-orange-50 p-2 rounded-t-lg shadow mb-2">
        <div className="flex justify-between text-gray-700 text-sm">
          <button
            className={`py-1 px-2 rounded hover:bg-orange-100 font-medium ${sortBy === "price" ? "bg-orange-200" : ""}`}
            onClick={() => setSortBy("price")}
          >
            PRICE
          </button>
          <button
            className={`py-1 px-2 rounded hover:bg-orange-100 font-medium ${sortBy === "departure" ? "bg-orange-200" : ""}`}
            onClick={() => setSortBy("departure")}
          >
            DEPARTURE
          </button>
          <button
            className={`py-1 px-2 rounded hover:bg-orange-100 font-medium ${sortBy === "arrival" ? "bg-orange-200" : ""}`}
            onClick={() => setSortBy("arrival")}
          >
            ARRIVAL
          </button>
          <button
            className={`py-1 px-2 rounded hover:bg-orange-100 font-medium ${sortBy === "seats" ? "bg-orange-200" : ""}`}
            onClick={() => setSortBy("seats")}
          >
            SEATS
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="bg-white p-4 rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin text-orange-500" size={32} />
            <p className="ml-2 text-lg text-gray-600">Loading bus schedules...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-center">
            <p>{error}</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-center">
            <p>No bus schedules available {!showAllSchedules ? `for ${formatTabDate(dates[activeDate])}` : ''}.</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-semibold mb-4">
              {showAllSchedules ? (
                `Showing all ${filteredSchedules.length} bus schedules`
              ) : (
                `Showing ${filteredSchedules.length} bus schedules for ${dates[activeDate].toDateString()}`
              )}
            </p>
            
            {sortSchedules(filteredSchedules).map((schedule) => {
              const busId = typeof schedule.busId === 'object' && schedule.busId !== null 
                ? schedule.busId._id 
                : schedule.busId;
                
              const scheduleId = schedule._id || schedule.scheduleID;
              
              if (!busId || !scheduleId) {
                console.warn("Missing busId or scheduleId:", schedule);
                return null;
              }
              
              const transformedBus = transformScheduleForBusCard(schedule);

              return (
                <div key={`${busId}-${scheduleId}`} className="mb-6">
                  <BusCardSchedule 
                   bus={transformedBus}
                   onViewSchedule={() => handleViewSchedule(transformedBus)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusSchedules;