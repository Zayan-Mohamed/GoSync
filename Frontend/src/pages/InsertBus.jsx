import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const InsertBus = () => {
  const [formData, setFormData] = useState({
    busNumber: "",
    busRouteNumber: "",
    busType: "",
    capacity: "",
    status: "Active",
    routeId: "",
    fareAmount: "",
    travelName: "",
  });

  const [errors, setErrors] = useState({});
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const API_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get(`${API_URI}/api/routes/routes`, {
          withCredentials: true,
        });

        if (response.data && Array.isArray(response.data.routes)) {
          setRoutes(response.data.routes);
        } else {
          console.error("Unexpected API response:", response.data);
          setRoutes([]);
        }
      } catch (err) {
        console.error("Error fetching routes:", err);
        setRoutes([]);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.busNumber.trim()) newErrors.busNumber = "Bus Number is required.";
    if (!formData.busRouteNumber.trim()) newErrors.busRouteNumber = "Bus Route Number is required.";
    if (!formData.busType) newErrors.busType = "Bus Type is required.";
    if (!formData.capacity || isNaN(formData.capacity) || formData.capacity <= 0) {
      newErrors.capacity = "Enter a valid Capacity (must be greater than 0).";
    }
    if (!formData.routeId) newErrors.routeId = "Route selection is required.";
    if (!formData.fareAmount || isNaN(formData.fareAmount) || formData.fareAmount < 1) {
      newErrors.fareAmount = "Enter a valid Fare Amount (must be 1 or greater).";
    }
    if (!formData.travelName.trim()) newErrors.travelName = "Travel Name is required.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Format numeric fields and ensure all required fields are sent
      const formattedData = {
        ...formData,
        capacity: Number(formData.capacity),
        fareAmount: Number(formData.fareAmount),
        status: formData.status || "Active",
      };

      // Log formatted data before sending
      console.log('Sending formatted bus data:', formattedData);

      // Log the data being sent
      console.log('Sending bus data:', formattedData);

      const response = await axios.post(`${API_URI}/api/buses`, formattedData,
        {withCredentials: true,}
      );

      console.log('Server response:', response.data);

      setSuccess("Bus added successfully!");
      setFormData({
        busNumber: "",
        busRouteNumber: "",
        busType: "",
        capacity: "",
        status: "Active",
        routeId: "",
        fareAmount: "",
        travelName: "",
      });
      setErrors({});
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Full error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Failed to add bus. Please try again.";
      setError(errorMessage);
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

          {success && <div className="text-green-500 mb-4">{success}</div>}
          {error && <div className="text-red-500 mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Bus Number</label>
                <input
                  type="text"
                  name="busNumber"
                  value={formData.busNumber}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                {errors.busNumber && <p className="text-red-500 text-sm">{errors.busNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Bus Route Number</label>
                <input
                  type="text"
                  name="busRouteNumber"
                  value={formData.busRouteNumber}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                {errors.busRouteNumber && <p className="text-red-500 text-sm">{errors.busRouteNumber}</p>}
              </div>

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
                {errors.busType && <p className="text-red-500 text-sm">{errors.busType}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                {errors.capacity && <p className="text-red-500 text-sm">{errors.capacity}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Travel Name</label>
                <input
                  type="text"
                  name="travelName"
                  value={formData.travelName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                {errors.travelName && <p className="text-red-500 text-sm">{errors.travelName}</p>}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
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
                    <option key={route._id} value={route._id}>
                      {route.routeName} ({route.startLocation} - {route.endLocation})
                    </option>
                  ))}
                </select>
                {errors.routeId && <p className="text-red-500 text-sm">{errors.routeId}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Fare Amount</label>
                <input
                  type="number"
                  name="fareAmount"
                  value={formData.fareAmount}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
                {errors.fareAmount && <p className="text-red-500 text-sm">{errors.fareAmount}</p>}
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
