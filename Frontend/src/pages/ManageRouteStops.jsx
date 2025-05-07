import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Pencil, Trash2, ArrowLeft, Plus, Minus } from "lucide-react";
import AdminLayout from "../layouts/AdminLayout";
import useRouteStore from "../store/routeStore";
import axios from "axios";
import { toast } from "react-toastify";
import GoSyncLoader from "../components/Loader"; 

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
    // Add clearCurrentRoute to the destructured items if it exists in your store
  } = useRouteStore();

  const formRef = useRef(null);
  const topRef = useRef(null);
  const [allStops, setAllStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // Separate loading state for actions
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
  const [selectedRouteId, setSelectedRouteId] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const API_URI = import.meta.env.VITE_API_URL.replace(/\/$/, "");

  // Fetch all stops from API
  const fetchAllStops = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URI}/api/stops/get`);
      setAllStops(response.data.stops || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch stops");
    } finally {
      setLoading(false);
    }
  };

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

  // Clear route data when component unmounts
  useEffect(() => {
    return () => {
      // Use the store's clearCurrentRoute function if available
      const storeActions = useRouteStore.getState();
      if (storeActions.clearCurrentRoute) {
        storeActions.clearCurrentRoute();
      } else {
        // Fallback: clear route data manually
        storeActions.setRouteStops([]);
      }
    };
  }, []);

  // Initial data fetch and route restoration from URL
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchRoutes();
        await fetchAllStops();

        // Check for routeId in URL query params
        const params = new URLSearchParams(location.search);
        const routeId = params.get('routeId');
        if (routeId) {
          setSelectedRouteId(routeId);
          await handleRouteSelect(routeId);
        } else {
          // Clear current route data if no routeId in URL
          clearRouteData();
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch initial data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchRoutes, API_URI, location.search]);

  // Function to clear route data
  const clearRouteData = () => {
    const storeActions = useRouteStore.getState();
    if (storeActions.clearCurrentRoute) {
      storeActions.clearCurrentRoute();
    } else {
      // Fallback method to clear route data
      storeActions.setRouteStops([]);
    }
  };

  // Route selection handler
  const handleRouteSelect = async (routeId) => {
    if (!routeId) {
      setSelectedRouteId("");
      clearRouteData();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await getRouteById(routeId);
      const stops = await getStopsForRoute(routeId);

      setSelectedRouteId(routeId);
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
      clearRouteData();
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh route data without page reload
  const refreshRouteData = async (routeId) => {
    if (!routeId) return;
    
    try {
      setActionLoading(true);
      await getRouteById(routeId);
      await getStopsForRoute(routeId);
      
      // Update URL without reload
      navigate(`?routeId=${routeId}`, { replace: true });
      
      // Reset form states
      setNewStop({
        stopId: "",
        stopType: "boarding",
        order: (routeStops?.length || 0) + 1,
      });
      setIsEditing(false);
      setEditStopData({
        stopId: "",
        stopType: "boarding",
        order: 1,
        stop: { _id: "", stopName: "" }
      });
    } catch (err) {
      setError(err.response?.data?.message || `Failed to refresh route data`);
    } finally {
      setActionLoading(false);
    }
  };

  // Get stops not already in current route
  const getAvailableStops = () => {
    if (!currentRoute || !allStops.length) return allStops;
    
    const existingStopIds = new Set(
      routeStops.map(stop => stop.stop?._id?.toString() || stop.stop?.toString())
    );
    
    return allStops.filter(stop => !existingStopIds.has(stop._id.toString()));
  };

  // Single stop add handler with explicit toast call
const addStopToRouteHandler = async () => {
  if (!newStop.stopId) {
    toast.error("Please select a stop", { position: "top-right" });
    return;
  }

  try {
    setActionLoading(true);

    // Validate order isn't already taken
    const orderConflict = routeStops.some(stop => 
      stop.order === parseInt(newStop.order)
    );

    if (orderConflict) {
      throw new Error(`Order ${newStop.order} is already taken`);
    }

    // Prepare the stop data for the route
    const stopData = {
      stopId: newStop.stopId,
      order: parseInt(newStop.order),
      stopType: newStop.stopType
    };

    // Use the store action
    await addStopToRoute(currentRoute._id || currentRoute.routeId, stopData);

    // Explicit toast call
    toast.success("Stop added successfully!", {
      position: "top-right",
      autoClose: 3000
    });
    
    // Refresh route data
    await refreshRouteData(currentRoute._id || currentRoute.routeId);
  } catch (err) {
    console.error("Add stop error:", err);
    // Explicit toast call
    toast.error(err.response?.data?.message || err.message || "Failed to add stop", {
      position: "top-right"
    });
  } finally {
    setActionLoading(false);
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
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
      toast.error("Please select a stop", { position: "top-right" });
      return;
    }
  
    try {
      setActionLoading(true);
  
      const { updateRouteStop } = useRouteStore.getState();
  
      await updateRouteStop(
        currentRoute._id || currentRoute.routeId,
        editStopData.stopId,
        {
          stopType: editStopData.stopType,
          order: parseInt(editStopData.order)
        }
      );
  
      // Explicit toast call
      toast.success("Stop updated successfully!", {
        position: "top-right",
        autoClose: 3000
      });
      
      // Refresh route data
      await refreshRouteData(currentRoute._id || currentRoute.routeId);
      
      // Reset edit mode
      setIsEditing(false);
      setEditStopData({
        stopId: "",
        stopType: "boarding",
        order: 1,
        stop: { _id: "", stopName: "" }
      });
    } catch (err) {
      console.error("Update stop error:", err);
      // Explicit toast call
      toast.error(err.response?.data?.message || err.message || "Failed to update stop", {
        position: "top-right"
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Improved deleteStopHandler function
  const deleteStopHandler = async (stopId) => {
    if (!window.confirm("Are you sure you want to delete this stop?")) return;
  
    try {
      setActionLoading(true);
  
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
  
      // Add logging for debugging
      console.log("Deleting stop with details:", {
        routeId: routeIdToUse,
        stopId: mongoStopId,
        currentRouteStops: routeStops.length
      });
  
      // Use Zustand store action
      await useRouteStore.getState().deleteStopFromRoute(routeIdToUse, mongoStopId);
  
      // Explicit toast call
      toast.success("Stop deleted successfully!", {
        position: "top-right",
        autoClose: 3000
      });
      
      // Refresh route data without delay (the delay might be causing issues)
      await refreshRouteData(routeIdToUse);
    } catch (err) {
      console.error("Delete stop failed:", err);
      // Explicit toast call
      toast.error(err.message || "Failed to delete stop", {
        position: "top-right"
      });
    } finally {
      setActionLoading(false);
    }
  };
// Add these states to your component's state declarations
const [multipleStopsMode, setMultipleStopsMode] = useState(false);
const [stopFields, setStopFields] = useState([
  { stopId: "", stopType: "boarding", order: 1 }
]);
const [validationErrors, setValidationErrors] = useState([]);

// Add these functions to handle multiple stops
const toggleMultipleStopsMode = () => {
  // Reset fields when toggling
  setStopFields([
    { stopId: "", stopType: "boarding", order: routeStops.length + 1 }
  ]);
  setValidationErrors([]);
  setMultipleStopsMode(!multipleStopsMode);
};

const addStopField = () => {
  setStopFields([
    ...stopFields,
    {
      stopId: "",
      stopType: "boarding",
      order: routeStops.length + stopFields.length + 1
    }
  ]);
};

const removeStopField = (index) => {
  if (stopFields.length === 1) {
    toast.warning("You need at least one stop", {
      position: "top-right"
    });
    return;
  }
  
  const updatedFields = stopFields.filter((_, i) => i !== index);
  
  // Reorder stops after removal
  const reorderedFields = updatedFields.map((field, idx) => ({
    ...field,
    order: routeStops.length + idx + 1
  }));
  
  setStopFields(reorderedFields);
  
  // Clear validation error for removed field
  setValidationErrors(validationErrors.filter((_, i) => i !== index));
};

const handleStopFieldChange = (index, field, value) => {
  const updatedFields = [...stopFields];
  updatedFields[index] = { ...updatedFields[index], [field]: value };
  setStopFields(updatedFields);
  
  // Clear validation error when field is updated
  if (validationErrors[index]) {
    const updatedErrors = [...validationErrors];
    updatedErrors[index] = "";
    setValidationErrors(updatedErrors);
  }
};

const validateStops = () => {
  const errors = stopFields.map(field => {
    if (!field.stopId) return "Stop is required";
    if (!field.stopType) return "Stop type is required";
    if (!field.order || field.order < 1) return "Valid order is required";
    return "";
  });
  
  setValidationErrors(errors);
  return errors.every(error => !error);
};

const addMultipleStopsHandler = async () => {
  // Validate first
  if (!validateStops()) {
    toast.error("Please fix the validation errors", {
      position: "top-right"
    });
    return;
  }

  // Check for duplicate orders
  const orders = stopFields.map(field => parseInt(field.order));
  const existingOrders = routeStops.map(stop => parseInt(stop.order));
  const allOrders = [...orders, ...existingOrders];
  const hasDuplicates = allOrders.length !== new Set(allOrders).size;
  
  if (hasDuplicates) {
    toast.error("Order numbers must be unique", {
      position: "top-right"
    });
    return;
  }

  try {
    setActionLoading(true);
    
    const stopsData = {
      routeId: currentRoute._id || currentRoute.routeId,
      stops: stopFields.map(field => ({
        stopId: field.stopId,
        stopType: field.stopType,
        order: parseInt(field.order)
      }))
    };

    console.log("Submitting multiple stops:", stopsData);

    // Use the store action
    const response = await useRouteStore.getState().addMultipleStops(stopsData);
    console.log("Response from API:", response); // Add this line

    // Explicit toast call with longer duration
    toast.success(`${stopFields.length} stops added successfully!`, {
      position: "top-right",
      autoClose: 5000
    });
    
    // Reset the form
    setMultipleStopsMode(false);
    setStopFields([
      { stopId: "", stopType: "boarding", order: routeStops.length + 1 }
    ]);
    setValidationErrors([]);
    
    // Refresh route data
    await refreshRouteData(currentRoute._id || currentRoute.routeId);
  } catch (err) {
    console.error("Add multiple stops failed:", err);
    // Explicit toast call
    toast.error(err.response?.data?.message || err.message || "Failed to add stops", {
      position: "top-right",
      autoClose: 5000
    });
  } finally {
    setActionLoading(false);
  }
};


  // Render the loader when performing actions
  if (actionLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <GoSyncLoader />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div ref={topRef} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-gray-600 hover:text-deepOrange"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold">Manage Route Stops</h2>
        </div>

        {/* Route selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Route
          </label>
          <select
            onChange={(e) => handleRouteSelect(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
            disabled={loading}
            value={selectedRouteId}
          >
            <option value="">-- Select a Route --</option>
            {routes.map((route) => (
              <option key={route._id} value={route._id}>
                {route.routeName} ({route.startLocation} to {route.endLocation})
              </option>
            ))}
          </select>
        </div>

        {currentRoute && selectedRouteId && (
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

            {/* Replace your existing form UI with this code */}
{/* Add/Edit form */}
<div ref={formRef} className="p-4 border rounded-lg bg-gray-50 mb-4 relative">
  <div className="flex justify-between items-center mb-3">
    <h3 className="text-lg font-semibold">
      {isEditing ? "Edit Stop" : multipleStopsMode ? "Add Multiple Stops" : "Add New Stop"}
    </h3>
    {!isEditing && (
      <button
        onClick={toggleMultipleStopsMode}
        className="px-3 py-1 text-sm bg-deepOrange text-white rounded-md hover:bg-sunsetOrange"
      >
        {multipleStopsMode ? "Single Stop Mode" : "Multiple Stops Mode"}
      </button>
    )}
  </div>

  {!multipleStopsMode ? (
    /* Single Stop Form */
    <>
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
            disabled={isEditing || loading}
          >
            <option value="">Select Stop</option>
            {isEditing ? (
              <option value={editStopData.stopId}>
                {editStopData.stop?.stopName || editStopData.stopName}
              </option>
            ) : (
              getAvailableStops().map((stop) => (
                <option key={stop._id} value={stop._id}>
                  {stop.stopName} ({stop.status})
                </option>
              ))
            )}
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
          className={`px-4 py-2 bg-deepOrange text-white rounded-md hover:bg-sunsetOrange ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEditing ? "Updating..." : "Adding..."}
            </span>
          ) : (
            isEditing ? "Update Stop" : "Add Stop"
          )}
        </button>
      </div>
    </>
  ) : (
    /* Multiple Stops Form */
    <>
      {stopFields.map((field, index) => (
        <div key={index} className="mb-6 border-b pb-4">
          <div className="flex justify-between mb-2">
            <h4 className="font-medium text-gray-700">Stop #{index + 1}</h4>
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeStopField(index)}
                className="text-red-500 hover:text-red-700 flex items-center"
              >
                <Minus size={16} className="mr-1" /> Remove
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Stop*
              </label>
              <select
                value={field.stopId}
                onChange={(e) => handleStopFieldChange(index, "stopId", e.target.value)}
                className={`w-full p-2 border ${
                  validationErrors[index] && !field.stopId
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md`}
                required
              >
                <option value="">Select Stop</option>
                {getAvailableStops().map((stop) => (
                  <option key={stop._id} value={stop._id}>
                    {stop.stopName} ({stop.status})
                  </option>
                ))}
              </select>
              {validationErrors[index] && !field.stopId && (
                <p className="text-red-500 text-xs mt-1">{validationErrors[index]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Type*
              </label>
              <select
                value={field.stopType}
                onChange={(e) => handleStopFieldChange(index, "stopType", e.target.value)}
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
                value={field.order}
                onChange={(e) => handleStopFieldChange(index, "order", e.target.value)}
                className={`w-full p-2 border ${
                  validationErrors[index] && (!field.order || field.order < 1)
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md`}
                min="1"
                required
              />
              {validationErrors[index] && (!field.order || field.order < 1) && (
                <p className="text-red-500 text-xs mt-1">{validationErrors[index]}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-between mb-6">
        <button
          type="button"
          onClick={addStopField}
          className="text-deepOrange hover:text-sunsetOrange flex items-center"
        >
          <Plus size={16} className="mr-1" /> Add Another Stop
        </button>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={toggleMultipleStopsMode}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={addMultipleStopsHandler}
          className={`px-4 py-2 bg-deepOrange text-white rounded-md hover:bg-sunsetOrange ${
            loading || actionLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading || actionLoading}
        >
          {actionLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding Stops...
            </span>
          ) : (
            `Add ${stopFields.length} Stop${stopFields.length !== 1 ? 's' : ''}`
          )}
        </button>
      </div>
    </>
  )}
</div>

            {/* Current stops */}
            <div className="mb-6 p-4">
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default ManageRouteStops;