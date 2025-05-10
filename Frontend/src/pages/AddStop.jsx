import { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../layouts/AdminLayout";
import { toast } from "react-toastify";
import GoSyncLoader from "../components/Loader";
import { motion } from "framer-motion";

const AddStop = () => {
  // State for single stop form
  const [singleStopForm, setSingleStopForm] = useState({
    stopName: "",
    status: "active",
  });
  const [existingSingleStop, setExistingSingleStop] = useState(null);

  // State for multiple stops form
  const [multipleStopsForm, setMultipleStopsForm] = useState({
    stops: [{ stopName: "", status: "active" }],
  });
  const [existingMultipleStops, setExistingMultipleStops] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("single");
  const [allStops, setAllStops] = useState([]);

  const API_URI = import.meta.env.VITE_API_URL;

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
          withCredentials: true,
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
    return allStops.find(
      (stop) => stop.stopName.toLowerCase() === stopName.trim().toLowerCase()
    );
  };

  // Handle single stop form changes with validation
  const handleSingleStopChange = async (e) => {
    const { name, value } = e.target;
    setSingleStopForm((prev) => ({
      ...prev,
      [name]: value,
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
      [name]: value,
    };

    setMultipleStopsForm((prev) => ({
      ...prev,
      stops: updatedStops,
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
    setMultipleStopsForm((prev) => ({
      ...prev,
      stops: [...prev.stops, { stopName: "", status: "active" }],
    }));
    setExistingMultipleStops((prev) => [...prev, null]);
  };

  // Remove a stop field from multiple stops form
  const removeStopField = (index) => {
    if (multipleStopsForm.stops.length > 1) {
      const updatedStops = [...multipleStopsForm.stops];
      updatedStops.splice(index, 1);
      setMultipleStopsForm((prev) => ({
        ...prev,
        stops: updatedStops,
      }));

      const updatedExisting = [...existingMultipleStops];
      updatedExisting.splice(index, 1);
      setExistingMultipleStops(updatedExisting);
    }
  };

  // Check if all multiple stops are valid (not empty and not duplicates)
  const areMultipleStopsValid = () => {
    return multipleStopsForm.stops.every(
      (stop, index) =>
        stop.stopName.trim() !== "" && !existingMultipleStops[index]
    );
  };

  // Enhanced form submission for single stop
  const handleSingleStopSubmit = async (e) => {
    e.preventDefault();

    if (existingSingleStop) {
      toast.error(`Stop "${existingSingleStop.stopName}" already exists`);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URI}/api/stops/create`,
        singleStopForm,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      toast.success("Stop created successfully!");
      setSingleStopForm({
        stopName: "",
        status: "active",
      });
      setExistingSingleStop(null);

      const stopsResponse = await axios.get(`${API_URI}/api/stops/get`, {
        withCredentials: true,
      });
      setAllStops(stopsResponse.data.stops);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create stop");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced form submission for multiple stops
  const handleMultipleStopsSubmit = async (e) => {
    e.preventDefault();

    if (!areMultipleStopsValid()) {
      toast.error("Please fill all stop names and ensure no duplicates exist");
      return;
    }

    setLoading(true);

    try {
      const stopsData = multipleStopsForm.stops.map((stop) => ({
        stopName: stop.stopName.trim(),
        status: stop.status,
      }));

      const response = await axios.post(
        `${API_URI}/api/stops/bulk`,
        stopsData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      toast.success(`${stopsData.length} stops created successfully!`);
      setMultipleStopsForm({
        stops: [{ stopName: "", status: "active" }],
      });
      setExistingMultipleStops([]);

      const stopsResponse = await axios.get(`${API_URI}/api/stops/get`, {
        withCredentials: true,
      });
      setAllStops(stopsResponse.data.stops);
    } catch (err) {
      const errorDetails = err.response?.data?.details || err.message;
      toast.error(`Failed to create stops: ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="p-6">
          {" "}
          <GoSyncLoader />{" "}
        </div>
      </AdminLayout>
    );
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
            Add Bus Stop
          </h2>
          <p className="text-gray-700">
            Create and configure new bus stops in the system
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
                Single Stop
              </button>
              <button
                className={`flex-1 py-3 px-6 rounded-lg transition-all duration-200 font-medium ${
                  activeTab === "multiple"
                    ? "bg-white text-deepOrange shadow-md border border-gray-100"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => handleTabChange("multiple")}
              >
                Multiple Stops
              </button>
            </div>

            <div className="p-8">
              {activeTab === "single" && (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSingleStopSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Stop Name
                    </label>
                    <input
                      type="text"
                      name="stopName"
                      value={singleStopForm.stopName}
                      onChange={handleSingleStopChange}
                      className={`w-full p-4 border ${
                        existingSingleStop ? "border-red-500" : "border-gray-300"
                      } rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm`}
                      placeholder="Enter stop name"
                      required
                    />
                    {existingSingleStop && (
                      <p className="text-red-500 text-sm mt-1">
                        Stop "{existingSingleStop.stopName}" already exists
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Status
                    </label>
                    <select
                      name="status"
                      value={singleStopForm.status}
                      onChange={handleSingleStopChange}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex justify-center pt-6">
                    <button
                      type="submit"
                      className={`w-full md:w-auto px-8 py-4 bg-deepOrange text-white rounded-lg hover:bg-sunsetOrange transform hover:scale-105 transition-all duration-200 shadow-md ${
                        existingSingleStop ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={loading || existingSingleStop}
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
                        "Create Stop"
                      )}
                    </button>
                  </div>
                </motion.form>
              )}

              {activeTab === "multiple" && (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleMultipleStopsSubmit}
                  className="space-y-6"
                >
                  {multipleStopsForm.stops.map((stop, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 bg-gray-50 rounded-lg relative border border-gray-200 hover:shadow-md transition-shadow duration-200"
                    >
                      {multipleStopsForm.stops.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStopField(index)}
                          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors duration-200 shadow-sm"
                        >
                          ×
                        </button>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Stop Name
                          </label>
                          <input
                            type="text"
                            name="stopName"
                            value={stop.stopName}
                            onChange={(e) => handleMultipleStopChange(index, e)}
                            className={`w-full p-4 border ${
                              existingMultipleStops[index]
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm`}
                            placeholder={`Enter stop name #${index + 1}`}
                            required
                          />
                          {existingMultipleStops[index] && (
                            <p className="text-red-500 text-sm mt-1">
                              Stop "{existingMultipleStops[index].stopName}" already exists
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            name="status"
                            value={stop.status}
                            onChange={(e) => handleMultipleStopChange(index, e)}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-transparent transition-all duration-200 shadow-sm bg-white"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <div className="flex justify-between items-center pt-4">
                    <button
                      type="button"
                      onClick={addStopField}
                      className="text-deepOrange hover:text-sunsetOrange flex items-center space-x-2 transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-orange-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      <span>Add Another Stop</span>
                    </button>
                  </div>

                  <div className="flex justify-center pt-6">
                    <button
                      type="submit"
                      className={`w-full md:w-auto px-8 py-4 bg-deepOrange text-white rounded-lg hover:bg-sunsetOrange transform hover:scale-105 transition-all duration-200 shadow-md ${
                        !areMultipleStopsValid()
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={loading || !areMultipleStopsValid()}
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
                        "Create Stops"
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

export default AddStop;
