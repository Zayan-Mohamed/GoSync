import { useState, useEffect } from "react";
import { addSchedule } from "../services/scheduleService";
import { getBuses } from "../services/busService";
import { getRoutes } from "../services/routeService";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const InsertSchedule = () => {
  const [formData, setFormData] = useState({
    routeId: "",
    busId: "",
    departureTime: "",
    arrivalTime: "",
    departureDate: "",
    arrivalDate: "",
  });

  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [busesData, routesData] = await Promise.all([
          getBuses(),
          getRoutes(),
        ]);
        setBuses(busesData);
        setRoutes(routesData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await addSchedule(formData);
      setSuccess("Schedule added successfully!");
      setFormData({
        routeId: "",
        busId: "",
        departureTime: "",
        arrivalTime: "",
        departureDate: "",
        arrivalDate: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add schedule. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Schedule Registration
          </h2>

          {success && <div className="text-green-500 mb-4">{success}</div>}
          {error && <div className="text-red-500 mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Route Selection */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Route
              </label>
              <select
                name="routeId"
                value={formData.routeId}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a Route</option>
                {routes.map((route) => (
                  <option key={route._id} value={route._id}>
                    {route.startLocation} → {route.endLocation}
                  </option>
                ))}
              </select>
            </div>

            {/* Bus Selection */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Bus
              </label>
              <select
                name="busId"
                value={formData.busId}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a Bus</option>
                {buses.map((bus) => (
                  <option key={bus._id} value={bus._id}>
                    {bus.busNumber} ({bus.busType})
                  </option>
                ))}
              </select>
            </div>

            {/* Departure Date */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Departure Date
              </label>
              <input
                type="date"
                name="departureDate"
                value={formData.departureDate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Departure Time */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Departure Time
              </label>
              <input
                type="time"
                name="departureTime"
                value={formData.departureTime}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Arrival Date */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Arrival Date
              </label>
              <input
                type="date"
                name="arrivalDate"
                value={formData.arrivalDate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Arrival Time */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Arrival Time
              </label>
              <input
                type="time"
                name="arrivalTime"
                value={formData.arrivalTime}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsertSchedule;