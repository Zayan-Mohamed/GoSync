import { useState, useEffect } from "react";
import useRouteStore from "../store/routeStore";
import AdminLayout from "../layouts/AdminLayout";
import { MapPin, Plus, X } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";

const AddRoute = () => {
  // State for single route form
  const [singleRouteForm, setSingleRouteForm] = useState({
    routeName: "",
    startLocation: "",
    endLocation: "",
    totalDistance: "",
    startLocationCoordinates: { latitude: "", longitude: "" },
    endLocationCoordinates: { latitude: "", longitude: "" },
    stops: [],
    status: "active"
  });

  // State for multiple routes form
  const [multipleRoutesForm, setMultipleRoutesForm] = useState({
    routes: [{
      routeName: "",
      startLocation: "",
      endLocation: "",
      totalDistance: "",
      startLocationCoordinates: { latitude: "", longitude: "" },
      endLocationCoordinates: { latitude: "", longitude: "" },
      stops: [],
      status: "active"
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("single");
  const [allStops, setAllStops] = useState([]);
  const [existingRoute, setExistingRoute] = useState(null);
  const [existingMultipleRoutes, setExistingMultipleRoutes] = useState([]);

  const API_URI = import.meta.env.VITE_API_URL

  // Clear messages when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSuccess(null);
    setError(null);
  };

  // Fetch all stops on component mount
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await axios.get(`${API_URI}/api/stops/get`);
        if (response.data && Array.isArray(response.data.stops)) {
          setAllStops(response.data.stops);
        }
      } catch (err) {
        console.error("Error fetching stops:", err);
      }
    };
    fetchStops();
  }, []);

  // Check for existing route (case-insensitive)
  const checkExistingRoute = async (routeName) => {
    try {
      const response = await axios.get(
        `${API_URI}/api/routes/check-name?name=${encodeURIComponent(routeName)}`
      );
      return response.data.exists ? response.data.route : null;
    } catch (error) {
      console.error("Error checking route name:", error);
      return null;
    }
  };

  // Handle single route form changes with validation
  const handleSingleRouteChange = async (e) => {
    const { name, value } = e.target;
    setSingleRouteForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === "routeName" && value.trim() !== "") {
      const existing = await checkExistingRoute(value);
      setExistingRoute(existing);
    } else if (name === "routeName" && value.trim() === "") {
      setExistingRoute(null);
    }
  };

  // Handle coordinate changes for single route
  const handleSingleCoordinateChange = (location, field, value) => {
    setSingleRouteForm(prev => ({
      ...prev,
      [`${location}LocationCoordinates`]: {
        ...prev[`${location}LocationCoordinates`],
        [field]: value
      }
    }));
  };

  // Handle multiple routes form changes
  const handleMultipleRouteChange = (index, e) => {
    const { name, value } = e.target;
    const updatedRoutes = [...multipleRoutesForm.routes];
    updatedRoutes[index] = {
      ...updatedRoutes[index],
      [name]: value
    };

    setMultipleRoutesForm(prev => ({
      ...prev,
      routes: updatedRoutes
    }));
  };

  // Handle coordinate changes for multiple routes
  const handleMultipleCoordinateChange = (routeIndex, location, field, value) => {
    const updatedRoutes = [...multipleRoutesForm.routes];
    updatedRoutes[routeIndex] = {
      ...updatedRoutes[routeIndex],
      [`${location}LocationCoordinates`]: {
        ...updatedRoutes[routeIndex][`${location}LocationCoordinates`],
        [field]: value
      }
    };

    setMultipleRoutesForm(prev => ({
      ...prev,
      routes: updatedRoutes
    }));
  };

  // Add stop to single route
  const addStopToSingleRoute = () => {
    setSingleRouteForm(prev => ({
      ...prev,
      stops: [...prev.stops, { stopId: "", stopType: "boarding", order: prev.stops.length + 1 }]
    }));
  };

  // Remove stop from single route
  const removeStopFromSingleRoute = (index) => {
    const updatedStops = [...singleRouteForm.stops];
    updatedStops.splice(index, 1);
    setSingleRouteForm(prev => ({
      ...prev,
      stops: updatedStops.map((stop, i) => ({ ...stop, order: i + 1 }))
    }));
  };

  // Handle single route stop changes
  const handleSingleRouteStopChange = (stopIndex, field, value) => {
    const updatedStops = [...singleRouteForm.stops];
    updatedStops[stopIndex] = {
      ...updatedStops[stopIndex],
      [field]: value
    };
    setSingleRouteForm(prev => ({
      ...prev,
      stops: updatedStops
    }));
  };

  // Add stop to a route in multiple routes form
  const addStopToMultipleRoutes = (routeIndex) => {
    const updatedRoutes = [...multipleRoutesForm.routes];
    updatedRoutes[routeIndex] = {
      ...updatedRoutes[routeIndex],
      stops: [...updatedRoutes[routeIndex].stops, { 
        stopId: "", 
        stopType: "boarding", 
        order: updatedRoutes[routeIndex].stops.length + 1 
      }]
    };

    setMultipleRoutesForm(prev => ({
      ...prev,
      routes: updatedRoutes
    }));
  };

  // Remove stop from a route in multiple routes form
  const removeStopFromMultipleRoutes = (routeIndex, stopIndex) => {
    const updatedRoutes = [...multipleRoutesForm.routes];
    const updatedStops = [...updatedRoutes[routeIndex].stops];
    updatedStops.splice(stopIndex, 1);
    
    updatedRoutes[routeIndex] = {
      ...updatedRoutes[routeIndex],
      stops: updatedStops.map((stop, i) => ({ ...stop, order: i + 1 }))
    };

    setMultipleRoutesForm(prev => ({
      ...prev,
      routes: updatedRoutes
    }));
  };

  // Handle stop changes for a route in multiple routes form
  const handleMultipleRouteStopChange = (routeIndex, stopIndex, field, value) => {
    const updatedRoutes = [...multipleRoutesForm.routes];
    const updatedStops = [...updatedRoutes[routeIndex].stops];
    
    updatedStops[stopIndex] = {
      ...updatedStops[stopIndex],
      [field]: value
    };

    updatedRoutes[routeIndex] = {
      ...updatedRoutes[routeIndex],
      stops: updatedStops
    };

    setMultipleRoutesForm(prev => ({
      ...prev,
      routes: updatedRoutes
    }));
  };

  // Add another route field to multiple routes form
  const addRouteField = () => {
    setMultipleRoutesForm(prev => ({
      ...prev,
      routes: [...prev.routes, {
        routeName: "",
        startLocation: "",
        endLocation: "",
        totalDistance: "",
        startLocationCoordinates: { latitude: "", longitude: "" },
        endLocationCoordinates: { latitude: "", longitude: "" },
        stops: [],
        status: "active"
      }]
    }));
    setExistingMultipleRoutes(prev => [...prev, null]);
  };

  // Remove a route field from multiple routes form
  const removeRouteField = (index) => {
    if (multipleRoutesForm.routes.length > 1) {
      const updatedRoutes = [...multipleRoutesForm.routes];
      updatedRoutes.splice(index, 1);
      setMultipleRoutesForm(prev => ({
        ...prev,
        routes: updatedRoutes
      }));

      const updatedExisting = [...existingMultipleRoutes];
      updatedExisting.splice(index, 1);
      setExistingMultipleRoutes(updatedExisting);
    }
  };

  // Submit single route form
  const handleSingleRouteSubmit = async (e) => {
    e.preventDefault();
    
    if (existingRoute) {
      setError(`Route "${existingRoute.routeName}" already exists`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await useRouteStore.getState().createRoute(singleRouteForm);
      setSuccess("Route created successfully!");
      setSingleRouteForm({
        routeName: "",
        startLocation: "",
        endLocation: "",
        totalDistance: "",
        startLocationCoordinates: { latitude: "", longitude: "" },
        endLocationCoordinates: { latitude: "", longitude: "" },
        stops: [],
        status: "active"
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create route");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit multiple routes form
  const handleMultipleRoutesSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_URI}/api/routes/routes/bulk`,
        multipleRoutesForm
      );

      setSuccess(`${response.data.created} routes created successfully!`);
      setMultipleRoutesForm({
        routes: [{
          routeName: "",
          startLocation: "",
          endLocation: "",
          totalDistance: "",
          startLocationCoordinates: { latitude: "", longitude: "" },
          endLocationCoordinates: { latitude: "", longitude: "" },
          stops: [],
          status: "active"
        }]
      });
    } catch (err) {
      const errorDetails = err.response?.data?.details || err.message;
      console.error("Full error:", err);
      setError(`Failed to create routes: ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6"
      >
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#FFE082] to-[#FFC107] rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-[#E65100] mb-2">
            Add Route
          </h2>
          <p className="text-gray-700">
            Create and configure new bus routes in the system
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex mb-0 bg-gray-50 rounded-t-lg p-2 border-b border-gray-200">
              <button
                className={`flex-1 py-3 px-6 rounded-lg transition-all duration-200 font-medium ${
                  activeTab === "single"
                    ? "bg-white text-deepOrange shadow-md border border-gray-100"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => handleTabChange("single")}
              >
                Single Route
              </button>
              <button
                className={`flex-1 py-3 px-6 rounded-lg transition-all duration-200 font-medium ${
                  activeTab === "multiple"
                    ? "bg-white text-deepOrange shadow-md border border-gray-100"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => handleTabChange("multiple")}
              >
                Multiple Routes
              </button>
            </div>

            <div className="p-8">
              {/* Success and Error Messages */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg shadow-sm"
                >
                  {success}
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg shadow-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Single Route Form */}
              {activeTab === "single" && (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSingleRouteSubmit}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Route Name*
                      </label>
                      <input
                        type="text"
                        name="routeName"
                        value={singleRouteForm.routeName}
                        onChange={handleSingleRouteChange}
                        className={`w-full p-4 border ${
                          existingRoute ? "border-red-500" : "border-gray-300"
                        } rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm`}
                        required
                      />
                      {existingRoute && (
                        <p className="text-red-500 text-sm mt-1">
                          Route "{existingRoute.routeName}" already exists
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Status
                      </label>
                      <select
                        name="status"
                        value={singleRouteForm.status}
                        onChange={handleSingleRouteChange}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm bg-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Start Location*
                      </label>
                      <input
                        type="text"
                        name="startLocation"
                        value={singleRouteForm.startLocation}
                        onChange={handleSingleRouteChange}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        End Location*
                      </label>
                      <input
                        type="text"
                        name="endLocation"
                        value={singleRouteForm.endLocation}
                        onChange={handleSingleRouteChange}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Start Coordinates*
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          placeholder="Latitude"
                          value={singleRouteForm.startLocationCoordinates.latitude}
                          onChange={(e) => handleSingleCoordinateChange("start", "latitude", e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                          step="0.000001"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Longitude"
                          value={singleRouteForm.startLocationCoordinates.longitude}
                          onChange={(e) => handleSingleCoordinateChange("start", "longitude", e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                          step="0.000001"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        End Coordinates*
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          placeholder="Latitude"
                          value={singleRouteForm.endLocationCoordinates.latitude}
                          onChange={(e) => handleSingleCoordinateChange("end", "latitude", e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                          step="0.000001"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Longitude"
                          value={singleRouteForm.endLocationCoordinates.longitude}
                          onChange={(e) => handleSingleCoordinateChange("end", "longitude", e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                          step="0.000001"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Total Distance (km)*
                    </label>
                    <input
                      type="number"
                      name="totalDistance"
                      value={singleRouteForm.totalDistance}
                      onChange={handleSingleRouteChange}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  {/* Stops Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-semibold text-gray-700">
                        Stops
                      </label>
                      <button
                        type="button"
                        onClick={addStopToSingleRoute}
                        className="flex items-center space-x-2 text-deepOrange hover:text-sunsetOrange transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-orange-50"
                      >
                        <Plus size={16} />
                        <span>Add Stop</span>
                      </button>
                    </div>

                    {singleRouteForm.stops.map((stop, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 bg-gray-50 rounded-lg relative border border-gray-200 hover:shadow-md transition-shadow duration-200"
                      >
                        <button
                          type="button"
                          onClick={() => removeStopFromSingleRoute(index)}
                          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors duration-200 shadow-sm"
                        >
                          ×
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">
                              Stop
                            </label>
                            <select
                              value={stop.stopId}
                              onChange={(e) => handleSingleRouteStopChange(index, "stopId", e.target.value)}
                              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm bg-white"
                              required
                            >
                              <option value="">Select Stop</option>
                              {allStops.map(stop => (
                                <option key={stop._id} value={stop.stopId}>
                                  {stop.stopName}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">
                              Type
                            </label>
                            <select
                              value={stop.stopType}
                              onChange={(e) => handleSingleRouteStopChange(index, "stopType", e.target.value)}
                              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm bg-white"
                            >
                              <option value="boarding">Boarding</option>
                              <option value="dropping">Dropping</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">
                              Order
                            </label>
                            <input
                              type="number"
                              value={stop.order}
                              onChange={(e) => handleSingleRouteStopChange(index, "order", parseInt(e.target.value))}
                              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                              min="1"
                              required
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-center pt-6">
                    <button
                      type="submit"
                      className={`w-full md:w-auto px-8 py-4 bg-deepOrange text-white rounded-lg hover:bg-sunsetOrange transform hover:scale-105 transition-all duration-200 shadow-md ${
                        existingRoute ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={loading || existingRoute}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </span>
                      ) : (
                        "Create Route"
                      )}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Multiple Routes Form */}
              {activeTab === "multiple" && (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleMultipleRoutesSubmit}
                  className="space-y-6"
                >
                  {multipleRoutesForm.routes.map((route, routeIndex) => (
                    <motion.div
                      key={routeIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: routeIndex * 0.1 }}
                      className="p-6 bg-gray-50 rounded-lg relative border border-gray-200 hover:shadow-md transition-shadow duration-200"
                    >
                      {multipleRoutesForm.routes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRouteField(routeIndex)}
                          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors duration-200 shadow-sm"
                        >
                          ×
                        </button>
                      )}

                      <h3 className="text-lg font-semibold mb-4 text-gray-700">Route {routeIndex + 1}</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Route Name*
                          </label>
                          <input
                            type="text"
                            name="routeName"
                            value={route.routeName}
                            onChange={(e) => handleMultipleRouteChange(routeIndex, e)}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Status
                          </label>
                          <select
                            name="status"
                            value={route.status}
                            onChange={(e) => handleMultipleRouteChange(routeIndex, e)}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Start Location*
                          </label>
                          <input
                            type="text"
                            name="startLocation"
                            value={route.startLocation}
                            onChange={(e) => handleMultipleRouteChange(routeIndex, e)}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            End Location*
                          </label>
                          <input
                            type="text"
                            name="endLocation"
                            value={route.endLocation}
                            onChange={(e) => handleMultipleRouteChange(routeIndex, e)}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Start Coordinates*
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="number"
                              placeholder="Latitude"
                              value={route.startLocationCoordinates.latitude}
                              onChange={(e) => handleMultipleCoordinateChange(routeIndex, "start", "latitude", e.target.value)}
                              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                              step="0.000001"
                              required
                            />
                            <input
                              type="number"
                              placeholder="Longitude"
                              value={route.startLocationCoordinates.longitude}
                              onChange={(e) => handleMultipleCoordinateChange(routeIndex, "start", "longitude", e.target.value)}
                              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                              step="0.000001"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            End Coordinates*
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="number"
                              placeholder="Latitude"
                              value={route.endLocationCoordinates.latitude}
                              onChange={(e) => handleMultipleCoordinateChange(routeIndex, "end", "latitude", e.target.value)}
                              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                              step="0.000001"
                              required
                            />
                            <input
                              type="number"
                              placeholder="Longitude"
                              value={route.endLocationCoordinates.longitude}
                              onChange={(e) => handleMultipleCoordinateChange(routeIndex, "end", "longitude", e.target.value)}
                              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                              step="0.000001"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Total Distance (km)*
                        </label>
                        <input
                          type="number"
                          name="totalDistance"
                          value={route.totalDistance}
                          onChange={(e) => handleMultipleRouteChange(routeIndex, e)}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>

                      {/* Stops section for multiple routes */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-semibold text-gray-700">
                            Stops
                          </label>
                          <button
                            type="button"
                            onClick={() => addStopToMultipleRoutes(routeIndex)}
                            className="flex items-center space-x-2 text-deepOrange hover:text-sunsetOrange transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-orange-50"
                          >
                            <Plus size={16} />
                            <span>Add Stop</span>
                          </button>
                        </div>

                        {route.stops.map((stop, stopIndex) => (
                          <motion.div
                            key={stopIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: stopIndex * 0.1 }}
                            className="p-6 bg-gray-50 rounded-lg relative border border-gray-200 hover:shadow-md transition-shadow duration-200"
                          >
                            <button
                              type="button"
                              onClick={() => removeStopFromMultipleRoutes(routeIndex, stopIndex)}
                              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors duration-200 shadow-sm"
                            >
                              ×
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">
                                  Stop
                                </label>
                                <select
                                  value={stop.stopId}
                                  onChange={(e) => handleMultipleRouteStopChange(routeIndex, stopIndex, "stopId", e.target.value)}
                                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm bg-white"
                                  required
                                >
                                  <option value="">Select Stop</option>
                                  {allStops.map(stop => (
                                    <option key={stop._id} value={stop.stopId}>
                                      {stop.stopName}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">
                                  Type
                                </label>
                                <select
                                  value={stop.stopType}
                                  onChange={(e) => handleMultipleRouteStopChange(routeIndex, stopIndex, "stopType", e.target.value)}
                                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm bg-white"
                                >
                                  <option value="boarding">Boarding</option>
                                  <option value="dropping">Dropping</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">
                                  Order
                                </label>
                                <input
                                  type="number"
                                  value={stop.order}
                                  onChange={(e) => handleMultipleRouteStopChange(routeIndex, stopIndex, "order", parseInt(e.target.value))}
                                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm"
                                  min="1"
                                  required
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}

                  <div className="flex justify-between items-center pt-4">
                    <button
                      type="button"
                      onClick={addRouteField}
                      className="text-deepOrange hover:text-sunsetOrange flex items-center space-x-2 transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-orange-50"
                    >
                      <Plus size={16} />
                      <span>Add Another Route</span>
                    </button>
                  </div>

                  <div className="flex justify-center pt-6">
                    <button
                      type="submit"
                      className="w-full md:w-auto px-8 py-4 bg-deepOrange text-white rounded-lg hover:bg-sunsetOrange transform hover:scale-105 transition-all duration-200 shadow-md"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </span>
                      ) : (
                        "Create Routes"
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AddRoute;