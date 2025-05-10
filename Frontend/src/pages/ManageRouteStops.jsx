import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Pencil, Trash2, ArrowLeft, Plus, Minus, MapPin } from "lucide-react";
import AdminLayout from "../layouts/AdminLayout";
import useRouteStore from "../store/routeStore";
import axios from "axios";
import { toast } from "react-toastify";
import GoSyncLoader from "../components/Loader";
import SortableRouteStops from "../components/SortableRouteStops";

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
    stop: { _id: "", stopName: "" },
  });
  const [newStop, setNewStop] = useState({
    stopId: "",
    stopType: "boarding",
    order: 1,
  });
  const [selectedRouteId, setSelectedRouteId] = useState("");

  // Add new state for pending deletions
  const [pendingDeletions, setPendingDeletions] = useState({});

  // Add state for pending edits
  const [pendingEdits, setPendingEdits] = useState({});

  // Add view mode state
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'

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
    setNewStop((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditStopChange = (e) => {
    const { name, value } = e.target;
    setEditStopData((prev) => ({ ...prev, [name]: value }));
  };

  // API request debugging
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      console.log("Request:", config.method?.toUpperCase(), config.url);
      return config;
    });

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API Error:", {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
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
        const routeId = params.get("routeId");
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
        stop: { _id: "", stopName: "" },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || `Failed to load route ${routeId}`
      );
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
        stop: { _id: "", stopName: "" },
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
      routeStops.map(
        (stop) => stop.stop?._id?.toString() || stop.stop?.toString()
      )
    );

    return allStops.filter((stop) => !existingStopIds.has(stop._id.toString()));
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
      const orderConflict = routeStops.some(
        (stop) => stop.order === parseInt(newStop.order)
      );

      if (orderConflict) {
        throw new Error(`Order ${newStop.order} is already taken`);
      }

      // Prepare the stop data for the route
      const stopData = {
        stopId: newStop.stopId,
        order: parseInt(newStop.order),
        stopType: newStop.stopType,
      };

      // Use the store action
      await addStopToRoute(currentRoute._id || currentRoute.routeId, stopData);

      // Explicit toast call
      toast.success("Stop added successfully!", {
        position: "top-right",
        autoClose: 3000,
      });

      // Refresh route data
      await refreshRouteData(currentRoute._id || currentRoute.routeId);
    } catch (err) {
      console.error("Add stop error:", err);
      // Explicit toast call
      toast.error(
        err.response?.data?.message || err.message || "Failed to add stop",
        {
          position: "top-right",
        }
      );
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
      stopName: stop.stopName || stop.stop?.stopName,
    });
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditStopData({
      stopId: "",
      stopType: "boarding",
      order: 1,
      stop: { _id: "", stopName: "" },
    });
  };

  const updateStopHandler = async () => {
    if (!editStopData?.stopId) {
      toast.error("Please select a stop", { position: "top-right" });
      return;
    }

    try {
      const routeIdToUse = currentRoute._id || currentRoute.routeId;
      const editKey = `edit-${routeIdToUse}-${editStopData.stopId}`;
      
      // Store the original data
      const originalData = routeStops.find(
        stop => stop.stop?._id === editStopData.stopId || stop._id === editStopData.stopId
      );

      const timeoutId = setTimeout(async () => {
        try {
          setActionLoading(true);
          
          await useRouteStore.getState().updateRouteStop(
            routeIdToUse,
            editStopData.stopId,
            {
              stopType: editStopData.stopType,
              order: parseInt(editStopData.order),
            }
          );

          await refreshRouteData(routeIdToUse);
          
          setPendingEdits(prev => {
            const { [editKey]: _, ...rest } = prev;
            return rest;
          });

          setIsEditing(false);
          setEditStopData({
            stopId: "",
            stopType: "boarding",
            order: 1,
            stop: { _id: "", stopName: "" },
          });
          
          toast.success("Stop updated successfully!", {
            position: "top-right",
            autoClose: 3000,
          });
        } catch (err) {
          console.error("Update stop error:", err);
          toast.error(err.message || "Failed to update stop", {
            position: "top-right",
          });
        } finally {
          setActionLoading(false);
        }
      }, 3000); // Using 3 seconds timeout

      setPendingEdits(prev => ({
        ...prev,
        [editKey]: { timeoutId, originalData }
      }));

      toast.info(
        <div className="flex items-center justify-between w-full gap-4">
          <span>Stop updating in 3 seconds...</span>
          <button
            onClick={() => {
              clearTimeout(timeoutId);
              setPendingEdits(prev => {
                const { [editKey]: _, ...rest } = prev;
                return rest;
              });
              toast.success("Update operation cancelled", {
                position: "top-right",
                autoClose: 2000,
              });
            }}
            className="px-3 py-1 bg-white text-deepOrange rounded hover:bg-gray-100 whitespace-nowrap"
          >
            Undo
          </button>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          closeOnClick: false,
        }
      );
    } catch (err) {
      console.error("Update stop error:", err);
      toast.error(err.message || "Failed to update stop", {
        position: "top-right",
      });
    }
  };

  // Updated deleteStopHandler with 3 second timeout
  const deleteStopHandler = async (stopId) => {
    if (!window.confirm("Are you sure you want to delete this stop?")) return;

    try {
      const stopToDelete = routeStops.find(
        (s) => s.stop?._id === stopId || s._id === stopId
      );

      if (!stopToDelete) {
        throw new Error("Stop not found in current route");
      }

      const mongoStopId = stopToDelete.stop?._id || stopToDelete._id;
      const routeIdToUse = currentRoute._id || currentRoute.routeId;
      const deletionKey = `${routeIdToUse}-${mongoStopId}`;

      const timeoutId = setTimeout(async () => {
        try {
          setActionLoading(true);
          await useRouteStore.getState().deleteStopFromRoute(routeIdToUse, mongoStopId);
          await refreshRouteData(routeIdToUse);
          
          setPendingDeletions(prev => {
            const { [deletionKey]: _, ...rest } = prev;
            return rest;
          });
          
          toast.success("Stop deleted successfully!", {
            position: "top-right",
            autoClose: 3000,
          });
        } catch (err) {
          console.error("Delete stop failed:", err);
          toast.error(err.message || "Failed to delete stop", {
            position: "top-right",
          });
        } finally {
          setActionLoading(false);
        }
      }, 3000); // 3 second delay

      setPendingDeletions(prev => ({
        ...prev,
        [deletionKey]: { timeoutId, stopToDelete }
      }));

      toast.info(
        <div className="flex items-center justify-between w-full gap-4">
          <span>Stop deleting in 3 seconds...</span>
          <button
            onClick={() => {
              clearTimeout(timeoutId);
              setPendingDeletions(prev => {
                const { [deletionKey]: _, ...rest } = prev;
                return rest;
              });
              toast.success("Delete operation cancelled", {
                position: "top-right",
                autoClose: 2000,
              });
            }}
            className="px-3 py-1 bg-white text-deepOrange rounded hover:bg-gray-100 whitespace-nowrap"
          >
            Undo
          </button>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          closeOnClick: false,
        }
      );
    } catch (err) {
      console.error("Delete stop failed:", err);
      toast.error(err.message || "Failed to delete stop", {
        position: "top-right",
      });
    }
  };

  // Updated cleanup useEffect to handle both pending deletions and edits
  useEffect(() => {
    return () => {
      // Clear all pending deletion timeouts
      Object.values(pendingDeletions).forEach(({ timeoutId }) => {
        clearTimeout(timeoutId);
      });
      // Clear all pending edit timeouts
      Object.values(pendingEdits).forEach(({ timeoutId }) => {
        clearTimeout(timeoutId);
      });
    };
  }, [pendingDeletions, pendingEdits]);

  // Add these states to your component's state declarations
  const [multipleStopsMode, setMultipleStopsMode] = useState(false);
  const [stopFields, setStopFields] = useState([
    { stopId: "", stopType: "boarding", order: 1 },
  ]);
  const [validationErrors, setValidationErrors] = useState([]);

  // Add these functions to handle multiple stops
  const toggleMultipleStopsMode = () => {
    // Reset fields when toggling
    setStopFields([
      { stopId: "", stopType: "boarding", order: routeStops.length + 1 },
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
        order: routeStops.length + stopFields.length + 1,
      },
    ]);
  };

  const removeStopField = (index) => {
    if (stopFields.length === 1) {
      toast.warning("You need at least one stop", {
        position: "top-right",
      });
      return;
    }

    const updatedFields = stopFields.filter((_, i) => i !== index);

    // Reorder stops after removal
    const reorderedFields = updatedFields.map((field, idx) => ({
      ...field,
      order: routeStops.length + idx + 1,
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
    const errors = stopFields.map((field) => {
      if (!field.stopId) return "Stop is required";
      if (!field.stopType) return "Stop type is required";
      if (!field.order || field.order < 1) return "Valid order is required";
      return "";
    });

    setValidationErrors(errors);
    return errors.every((error) => !error);
  };

  const addMultipleStopsHandler = async () => {
    // Validate first
    if (!validateStops()) {
      toast.error("Please fix the validation errors", {
        position: "top-right",
      });
      return;
    }

    // Check for duplicate orders
    const orders = stopFields.map((field) => parseInt(field.order));
    const existingOrders = routeStops.map((stop) => parseInt(stop.order));
    const allOrders = [...orders, ...existingOrders];
    const hasDuplicates = allOrders.length !== new Set(allOrders).size;

    if (hasDuplicates) {
      toast.error("Order numbers must be unique", {
        position: "top-right",
      });
      return;
    }

    try {
      setActionLoading(true);

      // Ensure routeId is taken from currentRoute.routeId if available, otherwise fallback to _id
      const routeIdToUse = currentRoute.routeId || currentRoute._id;
      if (!routeIdToUse) {
        throw new Error("Route ID is not available");
      }

      const stopsData = {
        routeId: routeIdToUse, // Use the correct routeId
        stops: stopFields.map((field) => ({
          stopId: field.stopId,
          stopType: field.stopType,
          order: parseInt(field.order),
        })),
      };

      console.log("Submitting multiple stops:", stopsData);

      // Use the store action
      const response = await useRouteStore
        .getState()
        .addMultipleStops(stopsData);
      console.log("Response from API:", response);

      // Explicit toast call with longer duration
      toast.success(`${stopFields.length} stops added successfully!`, {
        position: "top-right",
        autoClose: 5000,
      });

      // Reset the form
      setMultipleStopsMode(false);
      setStopFields([
        { stopId: "", stopType: "boarding", order: routeStops.length + 1 },
      ]);
      setValidationErrors([]);

      // Refresh route data
      await refreshRouteData(currentRoute._id || currentRoute.routeId);
    } catch (err) {
      console.error("Add multiple stops failed:", err);
      // Explicit toast call
      toast.error(
        err.response?.data?.message || err.message || "Failed to add stops",
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div ref={topRef} className="max-w-5xl mx-auto">
          {/* Header and route selection */}
          <div className="bg-gradient-to-r from-[#FFE082] to-[#FFC107] rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center mb-2">
              {/* <button
                onClick={() => navigate(-1)}
                className="mr-4 text-gray-600 hover:text-deepOrange transition-colors duration-200"
              >
                <ArrowLeft size={24} />
              </button> */}
              <h2 className="text-3xl font-bold text-[#E65100]">Manage Route Stops</h2>
            </div>
            <p className="text-gray-700">Add and configure stops for each bus route</p>
          </div>

          {/* Route selection */}
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Route
              </label>
              <select
                onChange={(e) => handleRouteSelect(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-deepOrange transition-shadow duration-200"
                disabled={loading}
                value={selectedRouteId}
              >
                <option value="">-- Select a Route --</option>
                {routes.map((route) => (
                  <option key={route._id} value={route._id}>
                    {route.routeName} ({route.startLocation} to{" "}
                    {route.endLocation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentRoute && selectedRouteId && (
            <>
              {/* Route info card */}
              <div className="bg-white rounded-lg shadow-sm mb-6 p-6 border-l-4 border-deepOrange">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {currentRoute.routeName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-50 rounded-full mr-3">
                      <MapPin className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Start Location</p>
                      <p className="font-medium">{currentRoute.startLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-50 rounded-full mr-3">
                      <MapPin className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Location</p>
                      <p className="font-medium">{currentRoute.endLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="p-2 bg-green-50 rounded-full mr-3">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Distance</p>
                      <p className="font-medium">{currentRoute.totalDistance} km</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-50 rounded-full mr-3">
                      <svg
                        className="w-5 h-5 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium capitalize">{currentRoute.status}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add/Edit form */}
              <div ref={formRef} className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">
                      {isEditing
                        ? "Edit Stop"
                        : multipleStopsMode
                        ? "Add Multiple Stops"
                        : "Add New Stop"}
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={toggleMultipleStopsMode}
                        className="px-4 py-2 bg-deepOrange text-white rounded-lg hover:bg-sunsetOrange transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-deepOrange"
                      >
                        {multipleStopsMode
                          ? "Single Stop Mode"
                          : "Multiple Stops Mode"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-gray-50">
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
                            onChange={
                              isEditing ? handleEditStopChange : handleNewStopChange
                            }
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
                                <option key={stop._id} value={stop.stopId || stop._id}>
                                  {stop.stopName} ({stop.status})
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Type select */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Type*
                          </label>
                          <select
                            name="stopType"
                            value={
                              isEditing ? editStopData.stopType : newStop.stopType
                            }
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

                        {/* Order input */}
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
                            required
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
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
                          onClick={
                            isEditing ? updateStopHandler : addStopToRouteHandler
                          }
                          className={`px-4 py-2 bg-deepOrange text-white rounded-md hover:bg-sunsetOrange ${
                            loading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="flex items-center justify-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              {isEditing ? "Updating..." : "Adding..."}
                            </span>
                          ) : isEditing ? (
                            "Update Stop"
                          ) : (
                            "Add Stop"
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
                            <h4 className="font-medium text-gray-700">
                              Stop #{index + 1}
                            </h4>
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
                                onChange={(e) =>
                                  handleStopFieldChange(
                                    index,
                                    "stopId",
                                    e.target.value
                                  )
                                }
                                className={`w-full p-2 border ${
                                  validationErrors[index] && !field.stopId
                                    ? "border-red-500"
                                    : "border-gray-300"
                                } rounded-md`}
                                required
                              >
                                <option value="">Select Stop</option>
                                {getAvailableStops().map((stop) => (
                                  <option
                                    key={stop._id}
                                    value={stop.stopId || stop._id}
                                  >
                                    {stop.stopName} ({stop.status})
                                  </option>
                                ))}
                              </select>
                              {validationErrors[index] && !field.stopId && (
                                <p className="text-red-500 text-xs mt-1">
                                  {validationErrors[index]}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Type*
                              </label>
                              <select
                                value={field.stopType}
                                onChange={(e) =>
                                  handleStopFieldChange(
                                    index,
                                    "stopType",
                                    e.target.value
                                  )
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
                                value={field.order}
                                onChange={(e) =>
                                  handleStopFieldChange(
                                    index,
                                    "order",
                                    e.target.value
                                  )
                                }
                                className={`w-full p-2 border ${
                                  validationErrors[index] &&
                                  (!field.order || field.order < 1)
                                    ? "border-red-500"
                                    : "border-gray-300"
                                } rounded-md`}
                                min="1"
                                required
                              />
                              {validationErrors[index] &&
                                (!field.order || field.order < 1) && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {validationErrors[index]}
                                  </p>
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
                            loading || actionLoading
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={loading || actionLoading}
                        >
                          {actionLoading ? (
                            <span className="flex items-center justify-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Adding Stops...
                            </span>
                          ) : (
                            `Add ${stopFields.length} Stop${
                              stopFields.length !== 1 ? "s" : ""
                            }`
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Current stops section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Current Stops</h3>
                  <div className="flex items-center gap-4">
                    {/* View toggle buttons */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-md transition-all ${
                          viewMode === "list"
                            ? "bg-white text-deepOrange shadow"
                            : "text-gray-600 hover:text-deepOrange"
                        }`}
                        title="List view"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                      </button>
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-md transition-all ${
                          viewMode === "grid"
                            ? "bg-white text-deepOrange shadow"
                            : "text-gray-600 hover:text-deepOrange"
                        }`}
                        title="Grid view"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      {routeStops.length}{" "}
                      {routeStops.length === 1 ? "stop" : "stops"}
                    </div>
                  </div>
                </div>

                {routeStops.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      {loading
                        ? "Loading stops..."
                        : "No stops found for this route"}
                    </p>
                    {!loading && (
                      <button
                        onClick={() => handleRouteSelect(currentRoute._id)}
                        className="mt-4 text-sm text-deepOrange hover:text-sunsetOrange transition-colors duration-200"
                      >
                        Retry loading stops
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <SortableRouteStops
                      stops={routeStops}
                      routeId={selectedRouteId}
                      onEdit={startEditingStop}
                      onDelete={deleteStopHandler}
                      viewMode={viewMode}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default ManageRouteStops;
