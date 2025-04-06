import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiCalendar, FiClock, FiArrowRight } from "react-icons/fi";
import Sidebar from "../components/Sidebar";

const AddSchedule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedBus, setSelectedBus] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [formError, setFormError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesRes, busesRes] = await Promise.all([
          axios.get(`${API_URL}/api/routes/routes`, {
            withCredentials: true,
          }),
          axios.get(`${API_URL}/api/buses/buses`, {
            withCredentials: true,
          })
        ]);
        setRoutes(routesRes.data.routes);
        setBuses(busesRes.data);
        console.log("Routes:", routesRes.data.routes);
        console.log("Buses:", busesRes.data);
        console.log("Routes and Buses loaded successfully");
      } catch (error) {
        console.error("Error fetching data:", error);
        setFormError("Failed to load routes and buses. Please try again.");
      }
    };

    fetchData();
  }, []);

  const validateForm = () => {
    if (!selectedRoute || !selectedBus || !departureDate || !departureTime || !arrivalDate || !arrivalTime) {
      setFormError("All fields are required");
      return false;
    }

    const depDateTime = new Date(`${departureDate}T${departureTime}:00`);
    const arrDateTime = new Date(`${arrivalDate}T${arrivalTime}:00`);

    if (isNaN(depDateTime.getTime()) || isNaN(arrDateTime.getTime())) {
      setFormError("Invalid date or time format");
      return false;
    }

    if (arrDateTime <= depDateTime) {
      setFormError("Arrival time must be after departure time");
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const scheduleData = {
        routeId: selectedRoute,
        busId: selectedBus,
        departureDate,
        departureTime,
        arrivalDate,
        arrivalTime
      };

      await axios.post(`${API_URL}/api/schedules`, scheduleData);
      navigate("/schedule-management");
    } catch (error) {
      console.error("Error creating schedule:", error);
      setFormError(error.response?.data?.message || "Failed to create schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-10 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Add New Schedule</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {formError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Route Selection */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select Route
                </label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select a route</option>
                  {
            
                    routes.map((route) => (
                        <option key={route._id} value={route._id}>
                          {route.startLocation} → {route.endLocation}
                        </option>
                      ))

        

                  }
                </select>
              </div>
              
              {/* Bus Selection */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select Bus
                </label>
                <select
                  value={selectedBus}
                  onChange={(e) => setSelectedBus(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select a bus</option>
                  {buses.map((bus) => (
                    <option key={bus._id} value={bus._id}>
                      {bus.busNumber} - {bus.busType}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Departure & Arrival Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <FiCalendar className="mr-2" /> Departure Details
                </h3>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Departure Time
                  </label>
                  <div className="flex items-center">
                    <FiClock className="mr-2 text-gray-500" />
                    <input
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <FiCalendar className="mr-2" /> Arrival Details
                </h3>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Arrival Time
                  </label>
                  <div className="flex items-center">
                    <FiClock className="mr-2 text-gray-500" />
                    <input
                      type="time"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate("/schedule-management")}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded mr-2 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 flex items-center"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Create Schedule <FiArrowRight className="ml-2" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSchedule;