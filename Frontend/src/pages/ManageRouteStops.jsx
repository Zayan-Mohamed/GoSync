import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
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
    setRouteStops,
  } = useRouteStore();

  const [allStops, setAllStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editStopData, setEditStopData] = useState({
    stopId: "",
    stopType: "boarding",
    order: 1,
    stop: { _id: "", stopName: "" }
  });
  const [newStop, setNewStop] = useState({
    stopId: "",
    stopType: "boarding",
    order: 1,
  });

  const navigate = useNavigate();
  const API_URI = import.meta.env.VITE_API_URL.replace(/\/$/, "");

  // Form handlers
  const handleNewStopChange = (e) => {
    const { name, value } = e.target;
    setNewStop(prev => ({ ...prev, [name]: value }));
  };

  const handleEditStopChange = (e) => {
    const { name, value } = e.target;
    setEditStopData(prev => ({ ...prev, [name]: value }));
  };

  // API request debugging
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use(config => {
      console.log('Request:', config.method?.toUpperCase(), config.url);
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchRoutes();
        const stopsRes = await axios.get(`${API_URI}/api/routes/routes`);
        setAllStops(stopsRes.data?.stops || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch initial data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchRoutes, API_URI]);

  // Route selection handler
  const handleRouteSelect = async (routeId) => {
    if (!routeId) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await getRouteById(routeId);
      const stops = await getStopsForRoute(routeId);

      setNewStop({
        stopId: "",
        stopType: "boarding",
        order: (stops?.length || 0) + 1,
      });
      setIsEditing(false);
      setEditStopData({
        stopId: "",
        stopType: "boarding",
        order: 1,
        stop: { _id: "", stopName: "" }
      });
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load route ${routeId}`);
    } finally {
      setLoading(false);
    }
  };

  // Add new stop
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
        order: routeStops.length + 1,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add stop");
    } finally {
      setLoading(false);
    }
  };

  // Edit stop functions
  const startEditingStop = (stop) => {
    setIsEditing(true);
    setEditStopData({ 
      ...stop,
      stopId: stop.stop?._id || stop._id,
      stopName: stop.stopName || stop.stop?.stopName
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditStopData({
      stopId: "",
      stopType: "boarding",
      order: 1,
      stop: { _id: "", stopName: "" }
    });
  };

  const updateStopHandler = async () => {
    if (!editStopData?.stopId) {
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
        order: parseInt(editStopData.order)
      });

      await getStopsForRoute(currentRoute._id);
      setSuccess("Stop updated successfully!");
      setIsEditing(false);
      setEditStopData({
        stopId: "",
        stopType: "boarding",
        order: 1,
        stop: { _id: "", stopName: "" }
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update stop");
    } finally {
      setLoading(false);
    }
  };

  const deleteStopHandler = async (stopId) => {
    if (!window.confirm("Are you sure you want to delete this stop?")) return;
  
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
  
      // Find the stop object
      const stopToDelete = routeStops.find(s => 
        (s.stop?._id === stopId) || (s._id === stopId)
      );
  
      if (!stopToDelete) {
        throw new Error("Stop not found in current route");
      }
  
      // Use the most reliable ID available
      const mongoStopId = stopToDelete.stop?._id || stopToDelete._id;
      const routeIdToUse = currentRoute._id || currentRoute.routeId;
  
      // Use Zustand store action
      await useRouteStore.getState().deleteStopFromRoute(routeIdToUse, mongoStopId);
  
      // Optional: Refresh local state if needed
      if (getStopsForRoute) {
        await getStopsForRoute(routeIdToUse);
      }
  
      setSuccess("Stop deleted successfully!");
      
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || "Failed to delete stop");
    } finally {
      setLoading(false);
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

        {/* Status messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {success}
            <button onClick={() => setSuccess(null)} className="float-right">×</button>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
            <button onClick={() => setError(null)} className="float-right">×</button>
          </div>
        )}

        {/* Route selection */}
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
            {/* Route info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                {currentRoute.routeName}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <p><span className="font-medium">Start:</span> {currentRoute.startLocation}</p>
                <p><span className="font-medium">End:</span> {currentRoute.endLocation}</p>
                <p><span className="font-medium">Distance:</span> {currentRoute.totalDistance} km</p>
                <p><span className="font-medium">Status:</span> {currentRoute.status}</p>
              </div>
            </div>

            {/* Current stops */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Current Stops</h3>
              {routeStops.length === 0 ? (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">
                    {loading ? 'Loading stops...' : 'No stops found for this route'}
                  </p>
                  {!loading && (
                    <button 
                      onClick={() => handleRouteSelect(currentRoute._id)}
                      className="mt-2 text-blue-500 hover:text-blue-700"
                    >
                      Retry loading stops
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {routeStops
                    .sort((a, b) => a.order - b.order)
                    .map((routeStop) => {
                      const stopId = routeStop.stop?._id || routeStop._id;
                      const stopName = routeStop.stopName || routeStop.stop?.stopName;
                      
                      return (
                        <div
                          key={stopId}
                          className="p-3 border rounded-lg flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {stopName} (Order: {routeStop.order})
                            </p>
                            <p className="text-sm text-gray-600">
                              Type: {routeStop.stopType}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditingStop(routeStop)}
                              className="text-blue-500 hover:text-blue-700"
                              disabled={loading}
                              title="Edit stop"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => deleteStopHandler(stopId)}
                              className="text-red-500 hover:text-red-700"
                              disabled={loading}
                              title="Delete stop"
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

            {/* Add/Edit form */}
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
                    onChange={isEditing ? handleEditStopChange : handleNewStopChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    disabled={isEditing}
                  >
                    <option value="">Select Stop</option>
                    {allStops.map((stop) => (
                      <option key={stop._id} value={stop._id}>
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
                    onChange={isEditing ? handleEditStopChange : handleNewStopChange}
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
                    onChange={isEditing ? handleEditStopChange : handleNewStopChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="1"
                    max={routeStops.length + 1}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                {isEditing && (
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={isEditing ? updateStopHandler : addStopToRouteHandler}
                  className="px-4 py-2 bg-deepOrange text-white rounded-md hover:bg-sunsetOrange"
                  disabled={loading}
                >
                  {loading ? "Processing..." : isEditing ? "Update Stop" : "Add Stop"}
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