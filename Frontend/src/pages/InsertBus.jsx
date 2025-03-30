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

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/routes/routes",
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
      await axios.post("http://localhost:5000/api/buses", formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      setSuccess("Bus added successfully!");
      setFormData({
        busNumber: "",
        busRouteNumber: "", // ✅ Reset field after submit
        busType: "AC",
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
        <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Bus Registration
          </h2>

          {/* Success and Error Messages */}
          {success && <div className="text-green-500 mb-4">{success}</div>}
          {error && <div className="text-red-500 mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Bus Number */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Bus Number
              </label>
              <input
                type="text"
                name="busNumber"
                value={formData.busNumber}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            {/* Bus Route Number (New Field - 3rd Field) */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Bus Route Number
              </label>
              <input
                type="text"
                name="busRouteNumber"
                value={formData.busRouteNumber}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            {/* Bus Type */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Bus Type
              </label>
              <select
                name="busType"
                value={formData.busType}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="AC">Luxury (AC)</option>
                <option value="Non-AC">Non-AC</option>{" "}
                {/* ["AC", "Non-AC", "Semi-Luxury"] */}
                <option value="Semi-Luxury">Semi-Luxury (Non-AC)</option>
              </select>
            </div>

            {/* Capacity */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Capacity
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            {/* Route ID (Dropdown) */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Route
              </label>
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
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Fare Amount
              </label>
              <input
                type="number"
                name="fareAmount"
                value={formData.fareAmount}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            {/* Travel Name */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Travel Name
              </label>
              <input
                type="text"
                name="travelName"
                value={formData.travelName}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>

            {/* Submit Button */}
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

export default InsertBus;
