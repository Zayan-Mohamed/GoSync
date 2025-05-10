import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/AddNoti.css";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";

const AddNotification = () => {
    const [type, setType] = useState("");
    const [subType, setSubType] = useState("");
    const [message, setMessage] = useState("");
    const [expirationDate, setExpirationDate] = useState("");
    const [breakdownDate, setBreakdownDate] = useState("");
    const [maintenanceStartDate, setMaintenanceStartDate] = useState("");
    const [maintenanceEndDate, setMaintenanceEndDate] = useState("");
    const [disruptionStartDate, setDisruptionStartDate] = useState("");
    const [disruptionEndDate, setDisruptionEndDate] = useState("");
    const [selectedBus, setSelectedBus] = useState("");
    const [selectedRoute, setSelectedRoute] = useState("");
    const [allBuses, setAllBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status] = useState("sent");
    const [departureTime, setDepartureTime] = useState("");
    const navigate = useNavigate();
    const API_URI = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (type === "travel disruption" && subType !== "route disruption") {
            axios
                .get(`${API_URI}/api/buses/buses`, { withCredentials: true })
                .then((res) => setAllBuses(res.data))
                .catch((err) => console.error("Failed to fetch buses", err));
        }
    }, [type, subType]);

    useEffect(() => {
        if (subType === "route disruption") {
            const fetchRoutes = async () => {
                try {
                    const response = await axios.get(`${API_URI}/api/routes/routes`, {
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
        if (subType && selectedBus) {
            if (subType === "bus breakdown" && breakdownDate) {
                const readableDate = new Date(breakdownDate).toLocaleDateString();
                setMessage(`Bus ${selectedBus} broke down on ${readableDate}. We apologize for the inconvenience.`);
            } else if (subType === "bus delay" && departureTime) {
                const formattedTime = new Date(departureTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                setMessage(`Bus ${selectedBus} is now expected to depart at ${formattedTime}. We apologize for any inconvenience caused.`);
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
    }, [subType, selectedBus, breakdownDate, maintenanceStartDate, maintenanceEndDate, selectedRoute, disruptionStartDate, disruptionEndDate, departureTime]);

    useEffect(() => {
        if (type === "promotions") {
          setMessage("🎉 GoSync Offer: Enjoy exciting travel promotions! Book now and save more on your journey.");
        } else if (type === "discounts") {
          setMessage("🚌 GoSync Discount: Get up to 25% off on your next ticket booking! Limited time offer.");
        }
      }, [type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (expirationDate) {
            const today = new Date();
            const selected = new Date(expirationDate);
        
            // Set both dates to the same time (midnight) to compare only the date
            today.setHours(0, 0, 0, 0);
            selected.setHours(0, 0, 0, 0);
        
            // Check if the selected date is in the past
            if (selected < today) {
                alert("Expiration date cannot be in the past.");
                setLoading(false);
                return;
            }
        
            // If the selected date is today, ensure the time is in the future
            if (selected.getTime() === today.getTime() && expirationDate <= new Date()) {
                alert("Expiration time cannot be the current or past time.");
                setLoading(false);
                return;
            }
        }
        

        const newNotification = {
            type,
            subType: type === "travel disruption" ? subType : undefined,
            busesAffected:
                type === "travel disruption"
                    ? (subType === "route disruption"
                        ? [] // <-- FIX: do not treat selectedRoute as bus ID
                        : selectedBus ? [selectedBus] : [])
                    : [],
            message,
            status,
            expiredAt: expirationDate ? new Date(expirationDate).toISOString() : null,
            breakdownDate: breakdownDate || null,
            maintenancePeriod: maintenanceStartDate && maintenanceEndDate
                ? { from: maintenanceStartDate, to: maintenanceEndDate }
                : null,
            disruptionPeriod: disruptionStartDate && disruptionEndDate
                ? { from: disruptionStartDate, to: disruptionEndDate }
                : null,
            affectedRoute: subType === "route disruption" ? selectedRoute : null, // Optional: use separate field
            createdBy: "admin123",
            departureTime: subType === "bus delay" ? departureTime : null,
        };

        try {
            await axios.post(`${API_URI}/api/notifications`, newNotification, {
                withCredentials: true,
            });
            alert("Notification Sent Successfully!");
            setType("");
            setSubType("");
            setSelectedBus("");
            setSelectedRoute("");
            setMessage("");
            setExpirationDate("");
            setBreakdownDate("");
            setMaintenanceStartDate("");
            setMaintenanceEndDate("");
            setDisruptionStartDate("");
            setDisruptionEndDate("");
            setDepartureTime("");
            navigate("/notification-management");
        } catch (error) {
            console.error("Error sending notification:", error);
            alert("Failed to send notification.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="notification-form-container">
                <h2>Create Notification</h2>
                <form onSubmit={handleSubmit}>
                    {/* Type */}
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

                    {/* Sub Type */}
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

                    {/* Departure Time for Bus Delay */}
                    {subType === "bus delay" && (
                        <div className="form-group">
                            <label>Expected Departure Time</label>
                            <input
                                type="datetime-local"
                                value={departureTime}
                                onChange={(e) => setDepartureTime(e.target.value)}
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
                            placeholder="Enter notification message..."
                            required
                        />
                    </div>

                    {/* Expiry Date */}
                    <div className="form-group">
                        <label>Expiration Date (Optional)</label>
                        <input
                            type="datetime-local"
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Sending..." : "Send Notification"}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
};

export default AddNotification;