import { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../layouts/AdminLayout";

const AddStop = () => {
  // State for single stop form
  const [singleStopForm, setSingleStopForm] = useState({
    stopName: "",
    status: "active"
  });
  const [existingSingleStop, setExistingSingleStop] = useState(null);

  // State for multiple stops form
  const [multipleStopsForm, setMultipleStopsForm] = useState({
    stops: [{ stopName: "", status: "active" }]
  });
  const [existingMultipleStops, setExistingMultipleStops] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("single");
  const [allStops, setAllStops] = useState([]);

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
        const response = await axios.get(`${API_URI}/api/stops/get`, {
          withCredentials: true
        });
        if (response.data && Array.isArray(response.data.stops)) {
          setAllStops(response.data.stops);
        }
      } catch (err) {
        console.error("Error fetching stops:", err);
      }
    };
    fetchStops();
  }, []);

  // Check for existing stop (case-insensitive)
  const checkExistingStop = (stopName) => {
    return allStops.find(stop => 
      stop.stopName.toLowerCase() === stopName.trim().toLowerCase()
    );
  };

  // Handle single stop form changes with validation
  const handleSingleStopChange = async (e) => {
    const { name, value } = e.target;
    setSingleStopForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === "stopName" && value.trim() !== "") {
      const existing = checkExistingStop(value);
      setExistingSingleStop(existing);
    } else {
      setExistingSingleStop(null);
    }
  };

  // Handle multiple stops form changes with validation
  const handleMultipleStopChange = (index, e) => {
    const { name, value } = e.target;
    const updatedStops = [...multipleStopsForm.stops];
    updatedStops[index] = {
      ...updatedStops[index],
      [name]: value
    };

    setMultipleStopsForm(prev => ({
      ...prev,
      stops: updatedStops
    }));

    if (name === "stopName") {
      const updatedExisting = [...existingMultipleStops];
      if (value.trim() !== "") {
        updatedExisting[index] = checkExistingStop(value);
      } else {
        updatedExisting[index] = null;
      }
      setExistingMultipleStops(updatedExisting);
    }
  };

  // Add another stop field to multiple stops form
  const addStopField = () => {
    setMultipleStopsForm(prev => ({
      ...prev,
      stops: [...prev.stops, { stopName: "", status: "active" }]
    }));
    setExistingMultipleStops(prev => [...prev, null]);
  };

  // Remove a stop field from multiple stops form
  const removeStopField = (index) => {
    if (multipleStopsForm.stops.length > 1) {
      const updatedStops = [...multipleStopsForm.stops];
      updatedStops.splice(index, 1);
      setMultipleStopsForm(prev => ({
        ...prev,
        stops: updatedStops
      }));

      const updatedExisting = [...existingMultipleStops];
      updatedExisting.splice(index, 1);
      setExistingMultipleStops(updatedExisting);
    }
  };

  // Check if all multiple stops are valid (not empty and not duplicates)
  const areMultipleStopsValid = () => {
    return multipleStopsForm.stops.every((stop, index) => 
      stop.stopName.trim() !== "" && 
      !existingMultipleStops[index]
    );
  };
  

  // Submit single stop form
  const handleSingleStopSubmit = async (e) => {
    e.preventDefault();
    
    if (existingSingleStop) {
      setError(`Stop "${existingSingleStop.stopName}" already exists`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_URI}/api/stops/create`,
        singleStopForm,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      );

      setSuccess("Stop created successfully!");
      setSingleStopForm({
        stopName: "",
        status: "active"
      });
      setExistingSingleStop(null);
      // Refresh stops list after creation
      const stopsResponse = await axios.get(`${API_URI}/api/stops/get`, {
        withCredentials: true
      });
      setAllStops(stopsResponse.data.stops);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create stop");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Submit multiple stops form
  const handleMultipleStopsSubmit = async (e) => {
    e.preventDefault();
    
    if (!areMultipleStopsValid()) {
      setError("Please fill all stop names and ensure no duplicates exist");
      return;
    }
  
    setLoading(true);
    setError(null);
    setSuccess(null);
  
    try {
      // Prepare the data in correct format
      const stopsData = multipleStopsForm.stops.map(stop => ({
        stopName: stop.stopName.trim(),
        status: stop.status
      }));
  
      console.log("Sending stops data:", stopsData); // Debug log
  
      const response = await axios.post(
        `${API_URI}/api/stops/bulk`,
        stopsData,  // Send array directly
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      );
  
      setSuccess(response.data.message || `${stopsData.length} stops created successfully!`);
      setMultipleStopsForm({
        stops: [{ stopName: "", status: "active" }]
      });
      setExistingMultipleStops([]);
      
      // Refresh stops list
      const stopsResponse = await axios.get(`${API_URI}/api/stops/get`, {
        withCredentials: true
      });
      setAllStops(stopsResponse.data.stops);
    } catch (err) {
      const errorDetails = err.response?.data?.details || err.message;
      console.error("Full error:", err);
      setError(`Failed to create stops: ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
     <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Add Stop</h2>

        {/* Tab Navigation */}
      <div className="flex mb-6 border-b">
        <button
          className={`py-2 px-4 font-medium ${activeTab === "single" ? "text-deepOrange border-b-2 border-deepOrange" : "text-gray-500"}`}
          onClick={() => handleTabChange("single")}
        >
          Single Stop
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === "multiple" ? "text-deepOrange border-b-2 border-deepOrange" : "text-gray-500"}`}
          onClick={() => handleTabChange("multiple")}
        >
          Multiple Stops
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

      {/* Single Stop Form */}
      {activeTab === "single" && (
        <form onSubmit={handleSingleStopSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Stop Name
              </label>
              <input
                type="text"
                name="stopName"
                value={singleStopForm.stopName}
                onChange={handleSingleStopChange}
                className={`w-full p-3 border ${existingSingleStop ? "border-red-500" : "border-gray-300"} rounded-md`}
                required
              />
              {existingSingleStop && (
                <p className="text-red-500 text-sm mt-1">
                  Stop "{existingSingleStop.stopName}" already exists
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={singleStopForm.status}
                onChange={handleSingleStopChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-center">
            <button
              type="submit"
              className={`bg-deepOrange text-white px-6 py-2 rounded-md hover:bg-sunsetOrange focus:outline-none ${existingSingleStop ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={loading || existingSingleStop}
            >
              {loading ? "Creating..." : "Create Stop"}
            </button>
          </div>
        </form>
      )}

        {/* Multiple Stops Form */}
        {activeTab === "multiple" && (
        <form onSubmit={handleMultipleStopsSubmit}>
            {multipleStopsForm.stops.map((stop, index) => (
              <div key={index} className="mb-4 p-4 border rounded-lg relative">
                {multipleStopsForm.stops.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStopField(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                )}

                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Stop Name
                  </label>
                  <input
                    type="text"
                    name="stopName"
                    value={stop.stopName}
                    onChange={(e) => handleMultipleStopChange(index, e)}
                    className={`w-full p-3 border ${existingMultipleStops[index] ? "border-red-500" : "border-gray-300"} rounded-md`}
                    required
                  />
                  {existingMultipleStops[index] && (
                    <p className="text-red-500 text-sm mt-1">
                      Stop "{existingMultipleStops[index].stopName}" already exists
                    </p>
                  )}
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={stop.status}
                    onChange={(e) => handleMultipleStopChange(index, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            ))}

          <div className="flex justify-between mb-6">
            <button
              type="button"
              onClick={addStopField}
              className="text-deepOrange hover:text-sunsetOrange"
            >
              + Add Another Stop
            </button>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className={`bg-deepOrange text-white px-6 py-2 rounded-md hover:bg-sunsetOrange focus:outline-none ${!areMultipleStopsValid() ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={loading || !areMultipleStopsValid()}
            >
              {loading ? "Creating..." : "Create Stops"}
            </button>
          </div>
        </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AddStop;