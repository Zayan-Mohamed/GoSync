import { useState, useEffect } from "react";
import useRouteStore from "../store/routeStore";
import AdminLayout from "../layouts/AdminLayout";
import { MapPin, Plus, X } from "lucide-react";
import axios from "axios";

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
        const response = await axios.get("http://localhost:5000/api/stops/get");
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
        `http://localhost:5000/api/routes/check-name?name=${encodeURIComponent(routeName)}`
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
        "http://localhost:5000/api/routes/routes/bulk",
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
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Add Route</h2>

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b">
          <button
            className={`py-2 px-4 font-medium ${activeTab === "single" ? "text-deepOrange border-b-2 border-deepOrange" : "text-gray-500"}`}
            onClick={() => handleTabChange("single")}
          >
            Single Route
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === "multiple" ? "text-deepOrange border-b-2 border-deepOrange" : "text-gray-500"}`}
            onClick={() => handleTabChange("multiple")}
          >
            Multiple Routes
          </button>
        </div>

        {/* Success and Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Single Route Form */}
        {activeTab === "single" && (
          <form onSubmit={handleSingleRouteSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Route Name*
                </label>
                <input
                  type="text"
                  name="routeName"
                  value={singleRouteForm.routeName}
                  onChange={handleSingleRouteChange}
                  className={`w-full p-3 border ${existingRoute ? "border-red-500" : "border-gray-300"} rounded-md`}
                  required
                />
                {existingRoute && (
                  <p className="text-red-500 text-sm mt-1">
                    Route "{existingRoute.routeName}" already exists
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={singleRouteForm.status}
                  onChange={handleSingleRouteChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Start Location*
                </label>
                <input
                  type="text"
                  name="startLocation"
                  value={singleRouteForm.startLocation}
                  onChange={handleSingleRouteChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  End Location*
                </label>
                <input
                  type="text"
                  name="endLocation"
                  value={singleRouteForm.endLocation}
                  onChange={handleSingleRouteChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Start Coordinates*
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Latitude"
                    value={singleRouteForm.startLocationCoordinates.latitude}
                    onChange={(e) => handleSingleCoordinateChange("start", "latitude", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    step="0.000001"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Longitude"
                    value={singleRouteForm.startLocationCoordinates.longitude}
                    onChange={(e) => handleSingleCoordinateChange("start", "longitude", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    step="0.000001"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  End Coordinates*
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Latitude"
                    value={singleRouteForm.endLocationCoordinates.latitude}
                    onChange={(e) => handleSingleCoordinateChange("end", "latitude", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    step="0.000001"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Longitude"
                    value={singleRouteForm.endLocationCoordinates.longitude}
                    onChange={(e) => handleSingleCoordinateChange("end", "longitude", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    step="0.000001"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Total Distance (km)*
              </label>
              <input
                type="number"
                name="totalDistance"
                value={singleRouteForm.totalDistance}
                onChange={handleSingleRouteChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Stops
                </label>
                <button
                  type="button"
                  onClick={addStopToSingleRoute}
                  className="flex items-center text-deepOrange hover:text-sunsetOrange"
                >
                  <Plus size={16} className="mr-1" />
                  Add Stop
                </button>
              </div>

              {singleRouteForm.stops.map((stop, index) => (
                <div key={index} className="mb-3 p-3 border rounded-lg relative">
                  <button
                    type="button"
                    onClick={() => removeStopFromSingleRoute(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Stop
                      </label>
                      <select
                        value={stop.stopId}
                        onChange={(e) => handleSingleRouteStopChange(index, "stopId", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
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
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Type
                      </label>
                      <select
                        value={stop.stopType}
                        onChange={(e) => handleSingleRouteStopChange(index, "stopType", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="boarding">Boarding</option>
                        <option value="dropping">Dropping</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Order
                      </label>
                      <input
                        type="number"
                        value={stop.order}
                        onChange={(e) => handleSingleRouteStopChange(index, "order", parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className={`bg-deepOrange text-white px-6 py-2 rounded-md hover:bg-sunsetOrange focus:outline-none ${existingRoute ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={loading || existingRoute}
              >
                {loading ? "Creating..." : "Create Route"}
              </button>
            </div>
          </form>
        )}

        {/* Multiple Routes Form */}
        {activeTab === "multiple" && (
          <form onSubmit={handleMultipleRoutesSubmit}>
            {multipleRoutesForm.routes.map((route, routeIndex) => (
              <div key={routeIndex} className="mb-6 p-4 border rounded-lg relative">
                {multipleRoutesForm.routes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRouteField(routeIndex)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                )}

                <h3 className="text-lg font-semibold mb-3">Route {routeIndex + 1}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Route Name*
                    </label>
                    <input
                      type="text"
                      name="routeName"
                      value={route.routeName}
                      onChange={(e) => handleMultipleRouteChange(routeIndex, e)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={route.status}
                      onChange={(e) => handleMultipleRouteChange(routeIndex, e)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Start Location*
                    </label>
                    <input
                      type="text"
                      name="startLocation"
                      value={route.startLocation}
                      onChange={(e) => handleMultipleRouteChange(routeIndex, e)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      End Location*
                    </label>
                    <input
                      type="text"
                      name="endLocation"
                      value={route.endLocation}
                      onChange={(e) => handleMultipleRouteChange(routeIndex, e)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Start Coordinates*
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Latitude"
                        value={route.startLocationCoordinates.latitude}
                        onChange={(e) => handleMultipleCoordinateChange(routeIndex, "start", "latitude", e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                        step="0.000001"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Longitude"
                        value={route.startLocationCoordinates.longitude}
                        onChange={(e) => handleMultipleCoordinateChange(routeIndex, "start", "longitude", e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                        step="0.000001"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      End Coordinates*
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Latitude"
                        value={route.endLocationCoordinates.latitude}
                        onChange={(e) => handleMultipleCoordinateChange(routeIndex, "end", "latitude", e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                        step="0.000001"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Longitude"
                        value={route.endLocationCoordinates.longitude}
                        onChange={(e) => handleMultipleCoordinateChange(routeIndex, "end", "longitude", e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                        step="0.000001"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Total Distance (km)*
                  </label>
                  <input
                    type="number"
                    name="totalDistance"
                    value={route.totalDistance}
                    onChange={(e) => handleMultipleRouteChange(routeIndex, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                {/* Stops section for multiple routes */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Stops
                    </label>
                    <button
                      type="button"
                      onClick={() => addStopToMultipleRoutes(routeIndex)}
                      className="flex items-center text-deepOrange hover:text-sunsetOrange"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Stop
                    </button>
                  </div>

                  {route.stops.map((stop, stopIndex) => (
                    <div key={stopIndex} className="mb-3 p-3 border rounded-lg relative">
                      <button
                        type="button"
                        onClick={() => removeStopFromMultipleRoutes(routeIndex, stopIndex)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Stop
                          </label>
                          <select
                            value={stop.stopId}
                            onChange={(e) => handleMultipleRouteStopChange(routeIndex, stopIndex, "stopId", e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
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
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Type
                          </label>
                          <select
                            value={stop.stopType}
                            onChange={(e) => handleMultipleRouteStopChange(routeIndex, stopIndex, "stopType", e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="boarding">Boarding</option>
                            <option value="dropping">Dropping</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Order
                          </label>
                          <input
                            type="number"
                            value={stop.order}
                            onChange={(e) => handleMultipleRouteStopChange(routeIndex, stopIndex, "order", parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-between mb-6">
              <button
                type="button"
                onClick={addRouteField}
                className="flex items-center text-deepOrange hover:text-sunsetOrange"
              >
                <Plus size={16} className="mr-1" />
                Add Another Route
              </button>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-deepOrange text-white px-6 py-2 rounded-md hover:bg-sunsetOrange focus:outline-none"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Routes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AddRoute;