import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import {
  Save,
  ArrowLeft,
  Trash,
  Plus,
  PlusCircle,
  Info,
  Search,
  Check,
  ChevronRight,
  Bus,
  Calendar,
  Layout,
  Eye,
  Loader,
} from "lucide-react";

const AddSeat = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedBusSeats, setSelectedBusSeats] = useState([]);
  const [formData, setFormData] = useState({
    busId: "",
    scheduleId: "",
    seatNumber: "",
    seatType: "standard",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [batchCreation, setBatchCreation] = useState(false);
  const [batchFormData, setBatchFormData] = useState({
    prefix: "S",
    startNumber: 1,
    endNumber: 10,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [activeStep, setActiveStep] = useState(1);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [busSearch, setBusSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [seatLayoutPreview, setSeatLayoutPreview] = useState({
    totalSeats: 0,
    existingSeats: 0,
    newSeats: 0,
    layout: [],
  });
  const [busDetails, setBusDetails] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [busesRes, schedulesRes] = await Promise.all([
          axios.get(`${API_URL}/api/buses/buses`, { withCredentials: true }),
          axios.get(`${API_URL}/api/schedules`, { withCredentials: true }),
        ]);
        setBuses(busesRes.data);
        setFilteredBuses(busesRes.data);
        setSchedules(schedulesRes.data);
        setFilteredSchedules(schedulesRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load options");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_URL]);

  // Fetch existing seats when bus and schedule are selected
  useEffect(() => {
    const fetchExistingSeats = async () => {
      if (!formData.busId || !formData.scheduleId) {
        setSelectedBusSeats([]);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/admin/seats`, {
          params: { busId: formData.busId, scheduleId: formData.scheduleId },
          withCredentials: true,
        });
        setSelectedBusSeats(response.data);

        // Get bus details
        if (formData.busId) {
          const selectedBus = buses.find((bus) => bus._id === formData.busId);
          if (selectedBus) {
            setBusDetails(selectedBus);
            updateSeatLayoutPreview(selectedBus, response.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch existing seats:", err);
        toast.error("Failed to fetch existing seats");
      }
    };

    fetchExistingSeats();
  }, [formData.busId, formData.scheduleId, API_URL, buses]);

  // Update filtered buses when search changes
  useEffect(() => {
    if (busSearch.trim() === "") {
      setFilteredBuses(buses);
    } else {
      const lowercaseSearch = busSearch.toLowerCase();
      setFilteredBuses(
        buses.filter(
          (bus) =>
            bus.busNumber.toLowerCase().includes(lowercaseSearch) ||
            bus.travelName.toLowerCase().includes(lowercaseSearch) ||
            (bus.busRouteNumber &&
              bus.busRouteNumber.toLowerCase().includes(lowercaseSearch))
        )
      );
    }
  }, [busSearch, buses]);

  // Update filtered schedules when search changes
  useEffect(() => {
    if (scheduleSearch.trim() === "") {
      setFilteredSchedules(schedules);
    } else {
      const lowercaseSearch = scheduleSearch.toLowerCase();
      setFilteredSchedules(
        schedules.filter(
          (schedule) =>
            (schedule.departureTime &&
              schedule.departureTime.toLowerCase().includes(lowercaseSearch)) ||
            (schedule.arrivalTime &&
              schedule.arrivalTime.toLowerCase().includes(lowercaseSearch)) ||
            (schedule.departureDate &&
              new Date(schedule.departureDate)
                .toLocaleDateString()
                .includes(lowercaseSearch))
        )
      );
    }
  }, [scheduleSearch, schedules]);

  // Update seat layout preview
  const updateSeatLayoutPreview = (bus, existingSeats) => {
    if (!bus) return;

    const capacity = bus.capacity || 0;
    const existingSeatCount = existingSeats.length;
    const newSeatsCount = Math.max(0, capacity - existingSeatCount);

    // Create visual layout
    const layout = [];
    const seatsPerRow = 4;
    const totalRows = Math.ceil(capacity / seatsPerRow);

    for (let row = 0; row < totalRows; row++) {
      const rowSeats = [];
      for (let col = 0; col < seatsPerRow; col++) {
        const seatIndex = row * seatsPerRow + col;
        if (seatIndex < capacity) {
          // Determine if it's an existing seat or would be a new one
          const seatNumber = `S${(seatIndex + 1).toString().padStart(2, "0")}`;
          const existingSeat = existingSeats.find(
            (s) => s.seatNumber === seatNumber
          );

          let status = "new"; // default for new seats
          if (existingSeat) {
            status = existingSeat.isBooked
              ? "booked"
              : existingSeat.reservedUntil &&
                  new Date(existingSeat.reservedUntil) > new Date()
                ? "reserved"
                : "available";
          }

          rowSeats.push({
            number: seatNumber,
            status,
          });
        }
      }
      layout.push(rowSeats);
    }

    setSeatLayoutPreview({
      totalSeats: capacity,
      existingSeats: existingSeatCount,
      newSeats: newSeatsCount,
      layout,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation errors when field changes
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBatchChange = (e) => {
    const { name, value } = e.target;
    setBatchFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation errors when field changes
    if (validationErrors[`batch_${name}`]) {
      setValidationErrors((prev) => ({ ...prev, [`batch_${name}`]: "" }));
    }
  };

  const toggleBatchCreation = () => {
    setBatchCreation(!batchCreation);
    // Clear any validation errors when switching modes
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.busId) errors.busId = "Bus selection is required";
    if (!formData.scheduleId)
      errors.scheduleId = "Schedule selection is required";

    if (batchCreation) {
      if (!batchFormData.prefix) errors.batch_prefix = "Prefix is required";
      if (!batchFormData.startNumber)
        errors.batch_startNumber = "Start number is required";
      if (!batchFormData.endNumber)
        errors.batch_endNumber = "End number is required";

      const startNum = parseInt(batchFormData.startNumber);
      const endNum = parseInt(batchFormData.endNumber);

      if (isNaN(startNum) || startNum < 1)
        errors.batch_startNumber = "Start number must be at least 1";
      if (isNaN(endNum) || endNum < startNum)
        errors.batch_endNumber =
          "End number must be greater than or equal to start number";
      if (endNum - startNum > 100)
        errors.batch_endNumber = "Maximum 100 seats can be created at once";
    } else {
      if (!formData.seatNumber) errors.seatNumber = "Seat number is required";

      // Check if seat number already exists
      if (
        selectedBusSeats.some((seat) => seat.seatNumber === formData.seatNumber)
      ) {
        errors.seatNumber =
          "This seat number already exists for this bus and schedule";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      if (!formData.busId) errors.busId = "Bus selection is required";
    } else if (step === 2) {
      if (!formData.scheduleId)
        errors.scheduleId = "Schedule selection is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const moveToNextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(activeStep + 1);
    }
  };

  const moveToPrevStep = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSingleSeatSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/seats`,
        formData,
        {
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        toast.success("Seat added successfully");

        // Reset just the seat number to allow adding more seats
        setFormData((prev) => ({ ...prev, seatNumber: "" }));

        // Update the existing seats list with the newly added seat
        setSelectedBusSeats((prev) => [...prev, response.data.seat]);

        // Update the seat layout preview with the new data
        if (busDetails) {
          updateSeatLayoutPreview(busDetails, [
            ...selectedBusSeats,
            response.data.seat,
          ]);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add seat");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchSeatSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const { prefix, startNumber, endNumber } = batchFormData;
    const startNum = parseInt(startNumber);
    const endNum = parseInt(endNumber);

    try {
      const newSeats = [];
      const promises = [];

      for (let i = startNum; i <= endNum; i++) {
        const paddedNumber = i.toString().padStart(2, "0");
        const seatNumber = `${prefix}${paddedNumber}`;

        // Skip if seat already exists
        if (selectedBusSeats.some((seat) => seat.seatNumber === seatNumber)) {
          continue;
        }

        const promise = axios
          .post(
            `${API_URL}/api/admin/seats`,
            {
              ...formData,
              seatNumber,
            },
            { withCredentials: true }
          )
          .then((response) => {
            // Store each newly created seat
            newSeats.push(response.data.seat);
            return response;
          });

        promises.push(promise);
      }

      if (promises.length === 0) {
        toast.info("No new seats to add - all seat numbers already exist");
      } else {
        await Promise.all(promises);
        toast.success(`${promises.length} seats added successfully`);

        // Update the state with the new seats directly, without a redundant API call
        const updatedSeats = [...selectedBusSeats, ...newSeats];
        setSelectedBusSeats(updatedSeats);
        updateSeatLayoutPreview(busDetails, updatedSeats);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add seats");
    } finally {
      setSubmitting(false);
    }
  };

  const returnToSeatManagement = () => {
    navigate("/seat-management");
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={returnToSeatManagement}
              className="mr-4 p-2 rounded-full hover:bg-gray-200"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-semibold">Add New Seat</h2>
          </div>
          <div>
            <button
              onClick={toggleBatchCreation}
              className={`px-4 py-2 rounded ${batchCreation ? "bg-gray-200 text-gray-700" : "bg-blue-500 text-white hover:bg-blue-600"}`}
            >
              {batchCreation ? "Single Seat Mode" : "Batch Create Mode"}
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div
              className={`flex-1 flex items-center ${activeStep >= 1 ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center mr-2 ${activeStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                {activeStep > 1 ? (
                  <Check size={16} />
                ) : (
                  <span className="text-sm">1</span>
                )}
              </div>
              <span className="font-medium text-sm">Select Bus</span>
            </div>
            <div
              className={`flex-1 border-t-2 ${activeStep >= 2 ? "border-blue-600" : "border-gray-200"} mx-4`}
            />
            <div
              className={`flex-1 flex items-center ${activeStep >= 2 ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center mr-2 ${activeStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                {activeStep > 2 ? (
                  <Check size={16} />
                ) : (
                  <span className="text-sm">2</span>
                )}
              </div>
              <span className="font-medium text-sm">Select Schedule</span>
            </div>
            <div
              className={`flex-1 border-t-2 ${activeStep >= 3 ? "border-blue-600" : "border-gray-200"} mx-4`}
            />
            <div
              className={`flex-1 flex items-center ${activeStep >= 3 ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center mr-2 ${activeStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                <span className="text-sm">3</span>
              </div>
              <span className="font-medium text-sm">Add Seats</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Step 1: Select Bus */}
          {activeStep === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Step 1: Select Bus
              </h3>
              <div className="mb-4 relative">
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 mb-4">
                  <Search size={18} className="text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search buses by number or name..."
                    className="bg-transparent border-none focus:outline-none flex-1"
                    value={busSearch}
                    onChange={(e) => setBusSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {filteredBuses.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">
                      No buses match your search criteria
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredBuses.map((bus) => (
                        <div
                          key={bus._id}
                          className={`border p-4 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${formData.busId === bus._id ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              busId: bus._id,
                            }));
                            if (validationErrors.busId) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                busId: "",
                              }));
                            }
                          }}
                        >
                          <div className="flex items-center">
                            <Bus
                              className={`mr-2 ${formData.busId === bus._id ? "text-blue-500" : "text-gray-400"}`}
                              size={20}
                            />
                            <h4 className="font-medium">{bus.busNumber}</h4>
                            {formData.busId === bus._id && (
                              <Check
                                size={16}
                                className="ml-auto text-blue-500"
                              />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {bus.travelName}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {bus.busType}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                              {bus.capacity} seats
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                bus.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : bus.status === "Inactive"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {bus.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {validationErrors.busId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <Info size={14} className="mr-1" /> {validationErrors.busId}
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={moveToNextStep}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Next Step <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Schedule */}
          {activeStep === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Step 2: Select Schedule
              </h3>
              <div className="mb-4 relative">
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 mb-4">
                  <Search size={18} className="text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search schedules by date or time..."
                    className="bg-transparent border-none focus:outline-none flex-1"
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {filteredSchedules.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">
                      No schedules match your search criteria
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredSchedules.map((schedule) => (
                        <div
                          key={schedule._id}
                          className={`border p-4 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${formData.scheduleId === schedule._id ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              scheduleId: schedule._id,
                            }));
                            if (validationErrors.scheduleId) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                scheduleId: "",
                              }));
                            }
                          }}
                        >
                          <div className="flex items-center">
                            <Calendar
                              className={`mr-2 ${formData.scheduleId === schedule._id ? "text-blue-500" : "text-gray-400"}`}
                              size={18}
                            />
                            <h4 className="font-medium">
                              {new Date(
                                schedule.departureDate
                              ).toLocaleDateString()}
                            </h4>
                            {formData.scheduleId === schedule._id && (
                              <Check
                                size={16}
                                className="ml-auto text-blue-500"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <span>Departure: {schedule.departureTime}</span>
                            <span>•</span>
                            <span>Arrival: {schedule.arrivalTime}</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                              {schedule.duration || "Duration N/A"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {validationErrors.scheduleId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <Info size={14} className="mr-1" />{" "}
                  {validationErrors.scheduleId}
                </p>
              )}

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={moveToPrevStep}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={moveToNextStep}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Next Step <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Add Seats */}
          {activeStep === 3 && (
            <form
              onSubmit={
                batchCreation ? handleBatchSeatSubmit : handleSingleSeatSubmit
              }
            >
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Step 3: Add Seats
              </h3>

              {formData.busId && formData.scheduleId && busDetails && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-1">
                    Selected Bus and Schedule
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Bus Number:</p>
                      <p className="font-medium">
                        {busDetails.busNumber} - {busDetails.travelName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Capacity:</p>
                      <p className="font-medium">{busDetails.capacity} seats</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Schedule:</p>
                      <p className="font-medium">
                        {schedules.find((s) => s._id === formData.scheduleId)
                          ?.departureDate
                          ? new Date(
                              schedules.find(
                                (s) => s._id === formData.scheduleId
                              ).departureDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Times:</p>
                      <p className="font-medium">
                        {schedules.find((s) => s._id === formData.scheduleId)
                          ?.departureTime || "N/A"}{" "}
                        -
                        {schedules.find((s) => s._id === formData.scheduleId)
                          ?.arrivalTime || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seat Type
                  </label>
                  <select
                    name="seatType"
                    value={formData.seatType}
                    onChange={handleChange}
                    className="p-2 border border-gray-300 rounded w-full"
                    disabled={submitting}
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="luxury">Luxury</option>
                    <option value="sleeper">Sleeper</option>
                  </select>
                </div>

                {/* Conditional rendering based on batch creation mode */}
                {batchCreation ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prefix *
                      </label>
                      <input
                        name="prefix"
                        value={batchFormData.prefix}
                        onChange={handleBatchChange}
                        placeholder="e.g., S"
                        className={`p-2 border rounded w-full ${validationErrors.batch_prefix ? "border-red-500" : "border-gray-300"}`}
                        disabled={submitting}
                      />
                      {validationErrors.batch_prefix && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <Info size={14} className="mr-1" />{" "}
                          {validationErrors.batch_prefix}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Number *
                      </label>
                      <input
                        type="number"
                        name="startNumber"
                        value={batchFormData.startNumber}
                        onChange={handleBatchChange}
                        min="1"
                        className={`p-2 border rounded w-full ${validationErrors.batch_startNumber ? "border-red-500" : "border-gray-300"}`}
                        disabled={submitting}
                      />
                      {validationErrors.batch_startNumber && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <Info size={14} className="mr-1" />{" "}
                          {validationErrors.batch_startNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Number *
                      </label>
                      <input
                        type="number"
                        name="endNumber"
                        value={batchFormData.endNumber}
                        onChange={handleBatchChange}
                        min={batchFormData.startNumber}
                        className={`p-2 border rounded w-full ${validationErrors.batch_endNumber ? "border-red-500" : "border-gray-300"}`}
                        disabled={submitting}
                      />
                      {validationErrors.batch_endNumber && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <Info size={14} className="mr-1" />{" "}
                          {validationErrors.batch_endNumber}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seat Number *
                    </label>
                    <input
                      name="seatNumber"
                      value={formData.seatNumber}
                      onChange={handleChange}
                      placeholder="e.g., A1 or S01"
                      className={`p-2 border rounded w-full ${validationErrors.seatNumber ? "border-red-500" : "border-gray-300"}`}
                      disabled={submitting}
                    />
                    {validationErrors.seatNumber && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <Info size={14} className="mr-1" />{" "}
                        {validationErrors.seatNumber}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Seat Layout Visualization */}
              {seatLayoutPreview.layout.length > 0 && (
                <div className="mt-8 p-4 border rounded-lg">
                  <h4 className="flex items-center mb-2 text-lg font-medium">
                    <Layout className="mr-2" size={18} />
                    Seat Layout Preview
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Available:{" "}
                      {
                        selectedBusSeats.filter(
                          (s) =>
                            !s.isBooked &&
                            (!s.reservedUntil ||
                              new Date(s.reservedUntil) <= new Date())
                        ).length
                      }
                    </span>
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                      Booked:{" "}
                      {selectedBusSeats.filter((s) => s.isBooked).length}
                    </span>
                    <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                      Reserved:{" "}
                      {
                        selectedBusSeats.filter(
                          (s) =>
                            !s.isBooked &&
                            s.reservedUntil &&
                            new Date(s.reservedUntil) > new Date()
                        ).length
                      }
                    </span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                      To be created: {seatLayoutPreview.newSeats}
                    </span>
                  </div>

                  <div className="border p-4 rounded-lg bg-gray-50 overflow-x-auto">
                    <div className="relative">
                      <div className="flex justify-center items-center mb-6">
                        <div className="bg-gray-300 rounded-lg p-2 w-32 text-center text-sm font-medium">
                          Driver
                        </div>
                      </div>

                      {seatLayoutPreview.layout.map((row, rowIndex) => (
                        <div
                          key={rowIndex}
                          className="flex justify-center mb-4"
                        >
                          <div className="flex space-x-2">
                            {row.map((seat, seatIndex) => (
                              <div
                                key={`${rowIndex}-${seatIndex}`}
                                className={`
                                  w-12 h-12 flex items-center justify-center rounded-lg border cursor-pointer text-sm
                                  ${
                                    seat.status === "booked"
                                      ? "bg-red-500 text-white border-red-600"
                                      : seat.status === "reserved"
                                        ? "bg-yellow-200 text-yellow-800 border-yellow-300"
                                        : seat.status === "available"
                                          ? "bg-green-100 text-green-800 border-green-300"
                                          : "bg-blue-50 text-blue-800 border-blue-200 border-dashed"
                                  }
                                `}
                                title={`${seat.number} - ${
                                  seat.status === "booked"
                                    ? "Booked"
                                    : seat.status === "reserved"
                                      ? "Reserved"
                                      : seat.status === "available"
                                        ? "Available"
                                        : "Will be created"
                                }`}
                              >
                                {seat.number.replace(/^S0?/, "")}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Batch Preview */}
              {batchCreation && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Batch Creation Preview
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {batchFormData.startNumber &&
                    batchFormData.endNumber &&
                    parseInt(batchFormData.endNumber) >=
                      parseInt(batchFormData.startNumber) ? (
                      Array.from(
                        {
                          length: Math.min(
                            parseInt(batchFormData.endNumber) -
                              parseInt(batchFormData.startNumber) +
                              1,
                            20
                          ),
                        },
                        (_, i) => {
                          const num = parseInt(batchFormData.startNumber) + i;
                          const paddedNumber = num.toString().padStart(2, "0");
                          const seatNumber = `${batchFormData.prefix}${paddedNumber}`;
                          const exists = selectedBusSeats.some(
                            (seat) => seat.seatNumber === seatNumber
                          );
                          return (
                            <span
                              key={seatNumber}
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${exists ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                              title={
                                exists
                                  ? "Seat already exists"
                                  : "Will be created"
                              }
                            >
                              {seatNumber}
                            </span>
                          );
                        }
                      )
                    ) : (
                      <span className="text-sm text-gray-500">
                        Enter valid start and end numbers to preview
                      </span>
                    )}
                    {batchFormData.startNumber &&
                      batchFormData.endNumber &&
                      parseInt(batchFormData.endNumber) >=
                        parseInt(batchFormData.startNumber) &&
                      parseInt(batchFormData.endNumber) -
                        parseInt(batchFormData.startNumber) +
                        1 >
                        20 && (
                        <span className="text-sm text-gray-500">
                          ... and{" "}
                          {parseInt(batchFormData.endNumber) -
                            parseInt(batchFormData.startNumber) +
                            1 -
                            20}{" "}
                          more
                        </span>
                      )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  onClick={moveToPrevStep}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-300"
                >
                  {submitting ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      {batchCreation ? "Adding Seats..." : "Adding Seat..."}
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      {batchCreation ? "Add Seats" : "Add Seat"}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Display existing seats for selected bus and schedule */}
        {formData.busId &&
          formData.scheduleId &&
          selectedBusSeats.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Eye className="mr-2" size={20} />
                Existing Seats for Selected Bus and Schedule
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seat Number
                      </th>
                      <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seat Type
                      </th>
                      <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reserved Until
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedBusSeats.map((seat) => {
                      const isBooked = seat.isBooked;
                      const isReserved =
                        seat.reservedUntil &&
                        new Date(seat.reservedUntil) > new Date();
                      const statusClass = isBooked
                        ? "bg-red-100 text-red-800"
                        : isReserved
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800";
                      const statusText = isBooked
                        ? "Booked"
                        : isReserved
                          ? "Reserved"
                          : "Available";

                      return (
                        <tr key={seat._id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 whitespace-nowrap font-medium">
                            {seat.seatNumber}
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap capitalize">
                            {seat.seatType || "Standard"}
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}
                            >
                              {statusText}
                            </span>
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap">
                            {isReserved
                              ? new Date(seat.reservedUntil).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default AddSeat;
