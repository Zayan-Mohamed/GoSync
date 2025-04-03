import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Pencil, Trash2, ArrowLeft } from "lucide-react";
import AdminLayout from "../layouts/AdminLayout";
import useRouteStore from "../store/routeStore";
import axios from "axios";

const ManageRouteStops = () => {
  const {
    routes,
    currentRoute,
    routeStops,
    fetchRoutes,
    getRouteById,
    getStopsForRoute,
    addStopToRoute,
    updateStopType,
    deleteStopFromRoute,
  } = useRouteStore();

  const [allStops, setAllStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editStopData, setEditStopData] = useState(null);
  const [newStop, setNewStop] = useState({
    stopId: "",
    stopType: "boarding",
    order: 1,
  });
  const navigate = useNavigate();

  // Fetch all routes and stops on component mount
  // Fetch all routes and stops on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchRoutes();

        // Fetch all stops
        const stopsRes = await axios.get("http://localhost:5000/api/stops/get");
        if (stopsRes.data && Array.isArray(stopsRes.data.stops)) {
          setAllStops(stopsRes.data.stops);
        }
      } catch (err) {
        setError("Failed to fetch data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchRoutes]);

  // Handle route selection using _id
  const handleRouteSelect = async (routeId) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Use store methods to get route and its stops
      await getRouteById(routeId);
      await getStopsForRoute(routeId);

      // Initialize new stop form
      setNewStop({
        stopId: "",
        stopType: "boarding",
        order: currentRoute?.stops?.length + 1 || 1,
      });
      setIsEditing(false);
      setEditStopData(null);
    } catch (err) {
      setError("Failed to load route details");
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const handleNewStopChange = (e) => {
    const { name, value } = e.target;
    setNewStop((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditStopChange = (e) => {
    const { name, value } = e.target;
    setEditStopData((prev) => ({ ...prev, [name]: value }));
  };

  // Start editing a stop
  const startEditingStop = (stop) => {
    setIsEditing(true);
    setEditStopData({ ...stop });
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditStopData(null);
  };

  // Add a new stop to the route
  const addStopToRouteHandler = async () => {
    if (!newStop.stopId) {
      setError("Please select a stop");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await addStopToRoute(currentRoute._id, newStop);
      await getStopsForRoute(currentRoute._id);

      setSuccess("Stop added successfully!");
      setNewStop({
        stopId: "",
        stopType: "boarding",
        order: currentRoute.stops.length + 1,
      });
    } catch (err) {
      setError(err.message || "Failed to add stop");
    } finally {
      setLoading(false);
    }
  };

  // Update an existing stop
  const updateStopHandler = async () => {
    if (!editStopData.stopId) {
      setError("Please select a stop");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateStopType({
        routeId: currentRoute._id,
        stopId: editStopData.stopId,
        stopType: editStopData.stopType,
        order: editStopData.order,
      });

      await getStopsForRoute(currentRoute._id);
      setSuccess("Stop updated successfully!");
      setIsEditing(false);
      setEditStopData(null);
    } catch (err) {
      setError(err.message || "Failed to update stop");
    } finally {
      setLoading(false);
    }
  };

  // Delete a stop from the route
  const deleteStopHandler = async (stopId) => {
    if (window.confirm("Are you sure you want to delete this stop?")) {
      try {
        setLoading(true);
        setError(null);

        await deleteStopFromRoute(currentRoute._id, stopId);
        await getStopsForRoute(currentRoute._id);

        setSuccess("Stop deleted successfully!");
        setNewStop((prev) => ({
          ...prev,
          order: currentRoute.stops.length + 1,
        }));
      } catch (err) {
        setError(err.message || "Failed to delete stop");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-gray-600 hover:text-deepOrange"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold">Manage Route Stops</h2>
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

        {/* Route Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Route
          </label>
          <select
            onChange={(e) => handleRouteSelect(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
            disabled={loading}
            value={currentRoute?._id || ""}
          >
            <option value="">-- Select a Route --</option>
            {routes.map((route) => (
              <option key={route._id} value={route._id}>
                {route.routeName} ({route.startLocation} to {route.endLocation})
              </option>
            ))}
          </select>
        </div>

        {currentRoute && (
          <>
            {/* Route Information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                {currentRoute.routeName}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <p>
                  <span className="font-medium">Start:</span>{" "}
                  {currentRoute.startLocation}
                </p>
                <p>
                  <span className="font-medium">End:</span>{" "}
                  {currentRoute.endLocation}
                </p>
                <p>
                  <span className="font-medium">Distance:</span>{" "}
                  {currentRoute.totalDistance} km
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {currentRoute.status}
                </p>
              </div>
            </div>

            {/* Current Stops */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Current Stops</h3>

              {routeStops.length === 0 ? (
                <p className="text-gray-500">
                  No stops added to this route yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {routeStops
                    .sort((a, b) => a.order - b.order)
                    .map((stop) => {
                      // Find the matching stop info from allStops
                      const stopInfo =
                        allStops.find((s) => s._id === stop._id) ||
                        allStops.find((s) => s.stopId === stop.stopId);

                      return (
                        <div
                          key={stop._id || `${stop.stopId}-${stop.order}`}
                          className="p-3 border rounded-lg flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {stopInfo?.stopName || "Unknown Stop"} (Order:{" "}
                              {stop.order})
                            </p>
                            <p className="text-sm text-gray-600">
                              Type: {stop.stopType}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditingStop(stop)}
                              className="text-blue-500 hover:text-blue-700"
                              disabled={loading}
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => deleteStopHandler(stop.stopId)}
                              className="text-red-500 hover:text-red-700"
                              disabled={loading}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Add/Edit Stop Form */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-3">
                {isEditing ? "Edit Stop" : "Add New Stop"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Stop*
                  </label>
                  <select
                    name="stopId"
                    value={isEditing ? editStopData.stopId : newStop.stopId}
                    onChange={
                      isEditing ? handleEditStopChange : handleNewStopChange
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Stop</option>
                    {allStops.map((stop) => (
                      <option key={stop._id} value={stop.stopId}>
                        {stop.stopName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Type*
                  </label>
                  <select
                    name="stopType"
                    value={isEditing ? editStopData.stopType : newStop.stopType}
                    onChange={
                      isEditing ? handleEditStopChange : handleNewStopChange
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="boarding">Boarding</option>
                    <option value="dropping">Dropping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Order*
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={isEditing ? editStopData.order : newStop.order}
                    onChange={
                      isEditing ? handleEditStopChange : handleNewStopChange
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="1"
                    max={currentRoute.stops.length + 1}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                {isEditing && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={
                    isEditing ? updateStopHandler : addStopToRouteHandler
                  }
                  className="px-4 py-2 bg-deepOrange text-white rounded-md hover:bg-sunsetOrange"
                  disabled={loading}
                >
                  {loading
                    ? "Processing..."
                    : isEditing
                      ? "Update Stop"
                      : "Add Stop"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ManageRouteStops;
