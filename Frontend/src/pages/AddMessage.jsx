import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/AddMessage.css";
import axios from "axios";
import AdminLayout from "../layouts/AdminLayout";
import { useNavigate } from "react-router-dom";

const AddMessage = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [shedDate, setShedDate] = useState(new Date());
  const [shedTime, setShedTime] = useState("");
  const [status, setStatus] = useState("pending");
  const [type, setType] = useState("");
  const [subType, setSubType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Travel disruption related states
  const [breakdownDate, setBreakdownDate] = useState("");
  const [maintenanceStartDate, setMaintenanceStartDate] = useState("");
  const [maintenanceEndDate, setMaintenanceEndDate] = useState("");
  const [disruptionStartDate, setDisruptionStartDate] = useState("");
  const [disruptionEndDate, setDisruptionEndDate] = useState("");
  const [selectedBus, setSelectedBus] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [allBuses, setAllBuses] = useState([]);
  const [routes, setRoutes] = useState([]);

  // Fetch buses and routes when needed
  useEffect(() => {
    if (type === "travel disruption" && subType !== "route disruption") {
      axios
        .get(`${API_URL}/api/buses/buses`, { withCredentials: true })
        .then((res) => setAllBuses(res.data))
        .catch((err) => console.error("Failed to fetch buses", err));
    }
  }, [type, subType]);

  useEffect(() => {
    if (subType === "route disruption") {
      const fetchRoutes = async () => {
        try {
          const response = await axios.get(`${API_URL}/api/routes/routes`, {
            withCredentials: true,
          });
          if (Array.isArray(response.data.routes)) {
            setRoutes(response.data.routes);
          } else {
            console.error("Unexpected API response:", response.data);
            setRoutes([]);
          }
        } catch (err) {
          console.error("Error fetching routes:", err);
          setRoutes([]);
        }
      };
      fetchRoutes();
    }
  }, [subType]);

  useEffect(() => {
    if ((subType === "bus delay" || subType === "bus breakdown") && selectedRoute) {
      axios
        .get(`${API_URL}/api/buses/route/${selectedRoute}`, { withCredentials: true })
        .then((res) => {
          if (Array.isArray(res.data.buses)) {
            setAllBuses(res.data.buses);
          } else {
            setAllBuses([]);
          }
        })
        .catch((err) => console.error("Failed to fetch buses by route", err));
    }
  }, [selectedRoute, subType]);

  // Auto-generate message based on selected options
  useEffect(() => {
    if (type === "promotions") {
      setMessage("🎉 GoSync Offer: Enjoy exciting travel promotions! Book now and save more on your journey.");
    } else if (type === "discounts") {
        setMessage("🚌 GoSync Discount: Get up to 25% off on your next ticket booking! Limited time offer.");}
    if (subType && selectedBus) {
      if (subType === "bus breakdown" && breakdownDate) {
        const readableDate = new Date(breakdownDate).toLocaleDateString();
        setMessage(`Bus ${selectedBus} broke down on ${readableDate}. We apologize for the inconvenience.`);
      } else if (subType === "bus delay") {
        setMessage(`Bus ${selectedBus} is currently delayed. We apologize for any inconvenience caused.`);
      } else if (subType === "bus maintenance" && maintenanceStartDate && maintenanceEndDate) {
        const start = new Date(maintenanceStartDate).toLocaleDateString();
        const end = new Date(maintenanceEndDate).toLocaleDateString();
        setMessage(`Bus ${selectedBus} will be under maintenance from ${start} to ${end}. Sorry for the inconvenience.`);
      }
    } else if (subType === "route disruption" && selectedRoute && disruptionStartDate && disruptionEndDate) {
      const start = new Date(disruptionStartDate).toLocaleDateString();
      const end = new Date(disruptionEndDate).toLocaleDateString();
      const routeName = routes.find(r => r._id === selectedRoute)?.routeName || "the route";
      setMessage(`Route ${routeName} will be disrupted from ${start} to ${end} due to maintenance work. Please plan accordingly.`);
    }
  }, [type,subType, selectedBus, breakdownDate, maintenanceStartDate, maintenanceEndDate, selectedRoute, disruptionStartDate, disruptionEndDate]);
//  useEffect(() => {
//         if (type === "promotions") {
//           setMessage("🎉 GoSync Offer: Enjoy exciting travel promotions! Book now and save more on your journey.");
//         } else if (type === "discounts") {
//           setMessage("🚌 GoSync Discount: Get up to 25% off on your next ticket booking! Limited time offer.");
//         }
//       }, [type]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Form validation
    if (!message || !shedDate || !shedTime || !type) {
      alert("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    // Check if expiry date is valid
    if (expiryDate && new Date(expiryDate) <= new Date()) {
      alert("Expiry date must be in the future.");
      setLoading(false);
      return;
    }

    const newMessage = {
      message,
      shedDate: shedDate.toISOString().split("T")[0],
      shedTime,
      status,
      type,
      subType: type === "travel disruption" ? subType : undefined,
      busesAffected: type === "travel disruption" && subType !== "route disruption" && selectedBus ? [selectedBus] : [],
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      breakdownDate: breakdownDate || null,
      maintenancePeriod: maintenanceStartDate && maintenanceEndDate
        ? { from: maintenanceStartDate, to: maintenanceEndDate }
        : null,
      disruptionPeriod: disruptionStartDate && disruptionEndDate
        ? { from: disruptionStartDate, to: disruptionEndDate }
        : null,
      affectedRoute: subType === "route disruption" ? selectedRoute : null,
    };

    try {
      await axios.post(`${API_URL}/api/shed/shed`, newMessage, { withCredentials: true });
      alert("Message Scheduled Successfully!");
      // Reset form fields
      setMessage("");
      setShedDate(new Date());
      setShedTime("");
      setType("");
      setSubType("");
      setSelectedBus("");
      setSelectedRoute("");
      setExpiryDate("");
      setBreakdownDate("");
      setMaintenanceStartDate("");
      setMaintenanceEndDate("");
      setDisruptionStartDate("");
      setDisruptionEndDate("");
      navigate("/Schedule-notification");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to schedule message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="form-container">
        <h2 className="form-title">Create Scheduled Message</h2>
        <form onSubmit={handleSubmit} className="message-form">
          {/* Notification Type */}
          <div className="form-group">
            <label>Notification Type</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setSubType("");
                setSelectedBus("");
                setSelectedRoute("");
              }}
              required
            >
              <option value="">Select Type</option>
              <option value="travel disruption">Travel Disruption</option>
              <option value="promotions">Promotions</option>
              <option value="discounts">Discounts</option>
              <option value="alert">Alert</option>
              <option value="reminders">Reminders</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Sub Type for Travel Disruption */}
          {type === "travel disruption" && (
            <div className="form-group">
              <label>Sub Type</label>
              <select
                value={subType}
                onChange={(e) => {
                  setSubType(e.target.value);
                  setSelectedBus("");
                  setSelectedRoute("");
                }}
                required
              >
                <option value="">Select Sub Type</option>
                <option value="bus maintenance">Bus Maintenance</option>
                <option value="bus delay">Bus Delay</option>
                <option value="bus breakdown">Bus Breakdown</option>
                <option value="route disruption">Route Disruption</option>
              </select>
            </div>
          )}

          {/* Bus Selection */}
          {type === "travel disruption" && subType && subType !== "route disruption" && (
            <div className="form-group">
              <label>Select Affected Bus</label>
              <select
                value={selectedBus}
                onChange={(e) => setSelectedBus(e.target.value)}
                required
              >
                <option value="">Select a Bus</option>
                {[...allBuses]
                  .sort((a, b) => a.busNumber.localeCompare(b.busNumber))
                  .map((bus) => (
                    <option key={bus.busNumber} value={bus.busNumber}>
                      {bus.busNumber}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Breakdown Date */}
          {subType === "bus breakdown" && (
            <div className="form-group">
              <label>Breakdown Date</label>
              <input
                type="date"
                value={breakdownDate}
                onChange={(e) => setBreakdownDate(e.target.value)}
                required
              />
            </div>
          )}

          {/* Maintenance Dates */}
          {subType === "bus maintenance" && (
            <>
              <div className="form-group">
                <label>Maintenance Start Date</label>
                <input
                  type="date"
                  value={maintenanceStartDate}
                  onChange={(e) => setMaintenanceStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Maintenance End Date</label>
                <input
                  type="date"
                  value={maintenanceEndDate}
                  onChange={(e) => setMaintenanceEndDate(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {/* Route Disruption Fields */}
          {subType === "route disruption" && (
            <>
              <div className="form-group">
                <label>Select Affected Route</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  required
                >
                  <option value="">Select a Route</option>
                  {routes.map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.routeName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Disruption Start Date</label>
                <input
                  type="date"
                  value={disruptionStartDate}
                  onChange={(e) => setDisruptionStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Disruption End Date</label>
                <input
                  type="date"
                  value={disruptionEndDate}
                  onChange={(e) => setDisruptionEndDate(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {/* Message */}
          <div className="form-group">
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              required
              rows="5"
            />
          </div>

          {/* Scheduled Date */}
          <div className="form-group">
            <label>Scheduled Date</label>
            <DatePicker
              selected={shedDate}
              onChange={(date) => setShedDate(date)}
              dateFormat="yyyy-MM-dd"
              className="form-control"
              required
            />
          </div>

          {/* Scheduled Time */}
          <div className="form-group">
            <label>Scheduled Time</label>
            <input
              type="time"
              value={shedTime}
              onChange={(e) => setShedTime(e.target.value)}
              required
            />
          </div>

          {/* Expiry Date */}
          <div className="form-group">
            <label>Expiration Date (Optional)</label>
            <input
              type="datetime-local"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Scheduling..." : "Schedule Message"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddMessage;