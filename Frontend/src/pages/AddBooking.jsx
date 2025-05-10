import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import {
  User,
  Bus,
  Calendar,
  Clock,
  DollarSign,
  Loader,
  Coffee,
  Search,
  HelpCircle,
  AlertCircle,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";

const AddBooking = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; // Fallback
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busDetails, setBusDetails] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [busSearch, setBusSearch] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    userId: "",
    busId: "",
    scheduleId: "",
    seatNumbers: [],
    fareTotal: "",
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, busesRes, schedulesRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/users`, { withCredentials: true }),
          axios.get(`${API_URL}/api/buses/buses`, { withCredentials: true }),
          axios.get(`${API_URL}/api/schedules/`, { withCredentials: true }),
        ]);
        setUsers(usersRes.data);
        setBuses(busesRes.data);
        setSchedules(schedulesRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load options");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_URL]);

  // Fetch available seats when bus and schedule are selected
  useEffect(() => {
    if (formData.busId && formData.scheduleId) {
      const fetchSeats = async () => {
        setLoadingSeats(true);
        try {
          const response = await axios.get(`${API_URL}/api/admin/seats`, {
            params: { busId: formData.busId, scheduleId: formData.scheduleId },
            withCredentials: true,
          });
          setSeats(
            response.data.filter(
              (seat) =>
                !seat.isBooked &&
                (!seat.reservedUntil ||
                  new Date(seat.reservedUntil) <= new Date())
            )
          );

          // Get bus details for fare calculation
          const busDetails = buses.find((bus) => bus._id === formData.busId);
          setBusDetails(busDetails);
          
          // If no available seats, show notification
          if (response.data.filter(
              (seat) =>
                !seat.isBooked &&
                (!seat.reservedUntil ||
                  new Date(seat.reservedUntil) <= new Date())
            ).length === 0) {
            toast.info("No available seats for this selection");
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to fetch seats");
        } finally {
          setLoadingSeats(false);
        }
      };
      fetchSeats();
    }
  }, [formData.busId, formData.scheduleId, API_URL, buses]);

  // Auto-calculate fare when seats are selected
  useEffect(() => {
    if (busDetails && formData.seatNumbers.length > 0) {
      const calculatedFare =
        formData.seatNumbers.length * (busDetails.fareAmount || 0);
      setFormData((prev) => ({ ...prev, fareTotal: calculatedFare }));
    }
  }, [formData.seatNumbers, busDetails]);

  // Functions for step progress
  const validateStep = (step) => {
    let stepErrors = {};
    let isValid = true;

    switch (step) {
      case 1:
        if (!formData.userId) {
          stepErrors.userId = "Please select a passenger";
          isValid = false;
        }
        break;
      case 2:
        if (!formData.busId) {
          stepErrors.busId = "Please select a bus";
          isValid = false;
        }
        if (!formData.scheduleId) {
          stepErrors.scheduleId = "Please select a schedule";
          isValid = false;
        }
        break;
      case 3:
        if (!formData.seatNumbers.length) {
          stepErrors.seatNumbers = "Please select at least one seat";
          isValid = false;
        }
        break;
      default:
        break;
    }

    setErrors(stepErrors);
    return isValid;
  };

  const moveToNextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(activeStep + 1);
    }
  };

  const moveToPrevStep = () => {
    setActiveStep(activeStep - 1);
  };

  // Enhanced handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when field changes
    if (errors[name]) {
      setErrors({...errors, [name]: ""});
    }
  };

  const handleSeatChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, seatNumbers: selectedOptions }));
    if (errors.seatNumbers) {
      setErrors({...errors, seatNumbers: ""});
    }
  };

  const toggleSeatSelection = (seatNumber) => {
    setFormData((prev) => {
      const newSeatNumbers = prev.seatNumbers.includes(seatNumber)
        ? prev.seatNumbers.filter((num) => num !== seatNumber)
        : [...prev.seatNumbers, seatNumber];
      
      // Clear errors if seats are selected
      if (newSeatNumbers.length > 0 && errors.seatNumbers) {
        setErrors({...errors, seatNumbers: ""});
      }
      
      return {
        ...prev,
        seatNumbers: newSeatNumbers,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Final validation
    if (formData.seatNumbers.length === 0) {
      setErrors({...errors, seatNumbers: "Please select at least one seat"});
      toast.error("Please select at least one seat");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/admin/bookings`, formData, {
        withCredentials: true,
      });
      toast.success("Booking added successfully");
      navigate("/booking-management");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add booking");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered lists based on search
  const filteredUsers = userSearch
    ? users.filter(user => 
        user.name.toLowerCase().includes(userSearch.toLowerCase()) || 
        user.email.toLowerCase().includes(userSearch.toLowerCase())
      )
    : users;

  const filteredBuses = busSearch
    ? buses.filter(bus => 
        bus.busNumber.toLowerCase().includes(busSearch.toLowerCase()) || 
        bus.travelName.toLowerCase().includes(busSearch.toLowerCase())
      )
    : buses;

  // Format schedule display
  const formatSchedule = (schedule) => {
    const depDate = new Date(schedule.departureDate).toLocaleDateString();
    return `${depDate} | ${schedule.departureTime} - ${schedule.arrivalTime}`;
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="animate-spin h-12 w-12 mx-auto text-blue-500" />
            <p className="mt-4 text-gray-600">Loading booking options...</p>
          </div>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Add New Booking</h2>
          <p className="text-gray-600">
            Create a new booking for a passenger by selecting user, bus,
            schedule and seats.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className={`flex-1 flex items-center ${activeStep >= 1 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`rounded-full h-10 w-10 flex items-center justify-center mr-2 ${activeStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                {activeStep > 1 ? <Check size={16} /> : <span className="text-sm">1</span>}
              </div>
              <span className="font-medium text-sm">Select Passenger</span>
            </div>
            <div className={`flex-1 border-t-2 ${activeStep >= 2 ? "border-blue-600" : "border-gray-200"} mx-4`} />
            <div className={`flex-1 flex items-center ${activeStep >= 2 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`rounded-full h-10 w-10 flex items-center justify-center mr-2 ${activeStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                {activeStep > 2 ? <Check size={16} /> : <span className="text-sm">2</span>}
              </div>
              <span className="font-medium text-sm">Select Bus & Schedule</span>
            </div>
            <div className={`flex-1 border-t-2 ${activeStep >= 3 ? "border-blue-600" : "border-gray-200"} mx-4`} />
            <div className={`flex-1 flex items-center ${activeStep >= 3 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`rounded-full h-10 w-10 flex items-center justify-center mr-2 ${activeStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                {activeStep > 3 ? <Check size={16} /> : <span className="text-sm">3</span>}
              </div>
              <span className="font-medium text-sm">Select Seats</span>
            </div>
            <div className={`flex-1 border-t-2 ${activeStep >= 4 ? "border-blue-600" : "border-gray-200"} mx-4`} />
            <div className={`flex-1 flex items-center ${activeStep >= 4 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`rounded-full h-10 w-10 flex items-center justify-center mr-2 ${activeStep >= 4 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                <span className="text-sm">4</span>
              </div>
              <span className="font-medium text-sm">Confirm Booking</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Passenger */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Step 1: Select Passenger</h3>
                
                <div className="relative mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search by name or email" 
                      className="pl-9 p-2.5 bg-gray-50 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Passenger <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <select
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      className={`pl-9 p-2.5 bg-gray-50 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.userId ? "border-red-500" : "border-gray-300"}`}
                      required
                    >
                      <option value="">Select a passenger</option>
                      {filteredUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.userId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" /> {errors.userId}
                    </p>
                  )}
                  {filteredUsers.length === 0 && userSearch && (
                    <p className="mt-1 text-sm text-amber-600 flex items-center">
                      <Info size={14} className="mr-1" /> No passengers found matching "{userSearch}"
                    </p>
                  )}
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <Info size={14} className="mr-1" /> Select the passenger for whom you're creating this booking
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={moveToNextStep}
                    className="px-5 py-2 bg-blue-600 text-sm text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
                  >
                    Next <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Bus and Schedule */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Step 2: Select Bus & Schedule</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="relative mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="Search by bus number or travel name" 
                          className="pl-9 p-2.5 bg-gray-50 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={busSearch}
                          onChange={(e) => setBusSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Bus <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Bus
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <select
                        name="busId"
                        value={formData.busId}
                        onChange={handleChange}
                        className={`pl-9 p-2.5 bg-gray-50 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.busId ? "border-red-500" : "border-gray-300"}`}
                        required
                      >
                        <option value="">Select a bus</option>
                        {filteredBuses.map((bus) => (
                          <option key={bus._id} value={bus._id}>
                            {bus.busNumber} - {bus.travelName}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.busId && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle size={14} className="mr-1" /> {errors.busId}
                      </p>
                    )}
                    {filteredBuses.length === 0 && busSearch && (
                      <p className="mt-1 text-sm text-amber-600 flex items-center">
                        <Info size={14} className="mr-1" /> No buses found matching "{busSearch}"
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Schedule <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <select
                        name="scheduleId"
                        value={formData.scheduleId}
                        onChange={handleChange}
                        className={`pl-9 p-2.5 bg-gray-50 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.scheduleId ? "border-red-500" : "border-gray-300"}`}
                        required
                      >
                        <option value="">Select a schedule</option>
                        {schedules.map((schedule) => (
                          <option key={schedule._id} value={schedule._id}>
                            {formatSchedule(schedule)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.scheduleId && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle size={14} className="mr-1" /> {errors.scheduleId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={moveToPrevStep}
                    className="px-5 py-2 bg-gray-200 text-sm text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={moveToNextStep}
                    className="px-5 py-2 bg-blue-600 text-sm text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
                  >
                    Next <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Select Seats */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Step 3: Select Seats</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select Seats <span className="text-red-500">*</span>
                  </label>
                  <div className={`p-4 border rounded-lg ${errors.seatNumbers ? "border-red-500" : "border-gray-200"} bg-gray-50`}>
                    {loadingSeats ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader className="animate-spin h-6 w-6 text-blue-500 mr-3" />
                        <span className="text-sm">Loading available seats...</span>
                      </div>
                    ) : (
                      formData.busId && formData.scheduleId ? (
                        seats.length > 0 ? (
                          <div>
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center">
                                <div className="w-4 h-4 bg-white border border-gray-400 mr-2"></div>
                                <span className="text-xs">Available</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-200 mr-2"></div>
                                <span className="text-xs">Selected</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-4">
                              {seats.map((seat) => (
                                <button
                                  key={seat._id}
                                  type="button"
                                  onClick={() => toggleSeatSelection(seat.seatNumber)}
                                  className={`p-1.5 rounded-md text-center text-sm ${
                                    formData.seatNumbers.includes(seat.seatNumber)
                                      ? "bg-blue-200 border-2 border-blue-500"
                                      : "bg-white border border-gray-300 hover:bg-gray-100"
                                  }`}
                                >
                                  {seat.seatNumber}
                                </button>
                              ))}
                            </div>

                            {formData.seatNumbers.length > 0 && (
                              <div className="mt-2 p-2 bg-blue-50 rounded">
                                <p className="text-sm font-medium">
                                  Selected: {formData.seatNumbers.sort().join(", ")}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Coffee className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                            <p>No available seats for this bus and schedule.</p>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Please select both a bus and schedule to see available seats
                        </div>
                      )
                    )}
                  </div>
                  {errors.seatNumbers && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" /> {errors.seatNumbers}
                    </p>
                  )}
                </div>

                {formData.seatNumbers.length > 0 && busDetails && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Fare Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600">Number of seats:</div>
                      <div className="font-medium">{formData.seatNumbers.length}</div>
                      <div className="text-gray-600">Fare per seat:</div>
                      <div className="font-medium">Rs. {busDetails.fareAmount}</div>
                      <div className="text-gray-600 font-medium">Total fare:</div>
                      <div className="font-medium">Rs. {formData.fareTotal}</div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={moveToPrevStep}
                    className="px-5 py-2 bg-gray-200 text-sm text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={moveToNextStep}
                    className="px-5 py-2 bg-blue-600 text-sm text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
                    disabled={formData.seatNumbers.length === 0}
                  >
                    Next <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirm Booking */}
            {activeStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Step 4: Confirm Booking</h3>
                
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-lg mb-4 text-blue-700">Booking Summary</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-2 border-b pb-1">Passenger Information</h5>
                      <div className="space-y-1.5">
                        {users.find(u => u._id === formData.userId) && (
                          <>
                            <p className="flex justify-between text-sm">
                              <span className="text-gray-500">Name:</span> 
                              <span className="font-medium">{users.find(u => u._id === formData.userId).name}</span>
                            </p>
                            <p className="flex justify-between text-sm">
                              <span className="text-gray-500">Email:</span> 
                              <span className="font-medium">{users.find(u => u._id === formData.userId).email}</span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-2 border-b pb-1">Bus Information</h5>
                      <div className="space-y-1.5">
                        {busDetails && (
                          <>
                            <p className="flex justify-between text-sm">
                              <span className="text-gray-500">Bus Number:</span> 
                              <span className="font-medium">{busDetails.busNumber}</span>
                            </p>
                            <p className="flex justify-between text-sm">
                              <span className="text-gray-500">Travel Name:</span> 
                              <span className="font-medium">{busDetails.travelName}</span>
                            </p>
                          </>
                        )}
                        {schedules.find(s => s._id === formData.scheduleId) && (
                          <p className="flex justify-between text-sm">
                            <span className="text-gray-500">Schedule:</span> 
                            <span className="font-medium">{formatSchedule(schedules.find(s => s._id === formData.scheduleId))}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-2 border-b pb-1">Seat Information</h5>
                      <div className="space-y-1.5">
                        <p className="flex justify-between text-sm">
                          <span className="text-gray-500">Selected Seats:</span> 
                          <span className="font-medium">{formData.seatNumbers.sort().join(", ")}</span>
                        </p>
                        <p className="flex justify-between text-sm">
                          <span className="text-gray-500">Number of Seats:</span> 
                          <span className="font-medium">{formData.seatNumbers.length}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-2 border-b pb-1">Payment Information</h5>
                      <div className="space-y-1.5">
                        {busDetails && (
                          <>
                            <p className="flex justify-between text-sm">
                              <span className="text-gray-500">Fare per Seat:</span> 
                              <span className="font-medium">Rs. {busDetails.fareAmount}</span>
                            </p>
                            <p className="flex justify-between font-medium">
                              <span className="text-gray-800">Total Fare:</span> 
                              <span className="text-blue-600">Rs. {formData.fareTotal}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Payment status will be set to pending initially.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <Info className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-xs text-yellow-700">
                        Please review all details before confirming the booking. Once a booking is confirmed, 
                        the seats will be marked as booked and will no longer be available for other passengers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={moveToPrevStep}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                      submitting ? "bg-gray-400 cursor-not-allowed text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
        
        {/* Keyboard shortcuts help */}
        <div className="mt-6 text-sm text-gray-500">
          <p className="flex items-center">
            <HelpCircle size={14} className="mr-2" /> Tips: 
            <span className="ml-1">You can use the Tab key to navigate between fields and the Enter key to proceed to the next step.</span>
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddBooking;
