import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const InsertBus = () => {
  const [formData, setFormData] = useState({
    busNumber: "",
    busRouteNumber: "", // ✅ Added busRouteNumber as third field
    busType: "",
    capacity: "",
    status: "Active",
    routeId: "",
    fareAmount: "",
    travelName: "",// ✅ Ensure Travel Name is included
  });

  const [routes, setRoutes] = useState([]); // ✅ Store fetched routes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_URI = import.meta.env.VITE_API_URL

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get(
          `${API_URI}/api/routes/routes`,
          {
            withCredentials: true,
          }
        );

        if (response.data && Array.isArray(response.data.routes)) {
          setRoutes(response.data.routes); // ✅ Extracting routeName from API
        } else {
          console.error("Unexpected API response:", response.data);
          setRoutes([]); // Prevent errors
        }
      } catch (err) {
        console.error("Error fetching routes:", err);
        setRoutes([]); // Handle errors
      }
    };

    fetchRoutes();
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
      await axios.post(`${API_URI}/api/buses`, formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      setSuccess("Bus added successfully!");
      setFormData({
        busNumber: "",
        busRouteNumber: "", // ✅ Reset field after submit
        busType: "",
        capacity: "",
        status: "Active",
        routeId: "",
        fareAmount: "",
        operatorName: "",
        operatorPhone: "",
        travelName: "",
      });
    } catch (err) {
      setError("Failed to add bus. Please try again.");
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
        <div className="max-w-5xl mx-auto p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-3xl font-bold mb-6">Insert Bus Details</h2>

          {/* Success and Error Messages */}
          {success && <div className="text-green-500 mb-4">{success}</div>}
          {error && <div className="text-red-500 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Bus Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Bus Number</label>
                <input
                  type="text"
                  name="busNumber"
                  value={formData.busNumber}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
              {/* Bus Route Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Bus Route Number</label>
                <input
                  type="text"
                  name="busRouteNumber"
                  value={formData.busRouteNumber}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
              {/* Bus Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Bus Type</label>
                <select
                  name="busType"
                  value={formData.busType}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="">Select Bus Type</option>
                  <option value="AC">Luxury (AC)</option>
                  <option value="Non-AC">Non-AC</option>
                  <option value="Semi-Luxury">Semi-Luxury (Non-AC)</option>
                </select>
              </div>
              {/* Capacity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
              {/* Travel Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Travel Name</label>
                <input
                  type="text"
                  name="travelName"
                  value={formData.travelName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Route ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Route</label>
                <select
                  name="routeId"
                  value={formData.routeId}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="">Select a Route</option>
                  {routes.map((route) => (
                    <option key={route.routeId} value={route.routeId}>
                      {route.routeName}
                    </option>
                  ))}
                </select>
              </div>
              {/* Fare Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Fare Amount</label>
                <input
                  type="number"
                  name="fareAmount"
                  value={formData.fareAmount}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
              {/* Bus Image */}
              <div className="border p-3 rounded-md flex items-center justify-center">
                <img src="/bus-placeholder.jpg" alt="Bus" className="h-32 w-full object-cover rounded-md" />
              </div>
            </div>

            {/* Submit Button */}
            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Bus Credentials"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default InsertBus;
