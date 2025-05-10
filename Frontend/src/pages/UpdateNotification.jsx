import React, { useState, useEffect } from "react"; 
import axios from "axios";
import "../styles/addNoti.css";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";

const UpdateNotification = () => {
  const { id } = useParams();
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
  const [departureTime, setDepartureTime] = useState("");
  const [allBuses, setAllBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status] = useState("sent");

  const navigate = useNavigate();
  const API_URI = import.meta.env.VITE_API_URL;

  // Fetch existing notification
  useEffect(() => {
    axios.get(`${API_URI}/api/notifications/${id}`, { withCredentials: true })
      .then((res) => {
        const data = res.data;
        setType(data.type);
        setSubType(data.subType || "");
        setMessage(data.message || "");
        setExpirationDate(data.expiredAt ? data.expiredAt.slice(0, 16) : "");
        setBreakdownDate(data.breakdownDate || "");
        setMaintenanceStartDate(data.maintenancePeriod?.from || "");
        setMaintenanceEndDate(data.maintenancePeriod?.to || "");
        setDisruptionStartDate(data.disruptionPeriod?.from || "");
        setDisruptionEndDate(data.disruptionPeriod?.to || "");
        setSelectedBus(data.busesAffected?.[0] || "");
        setSelectedRoute(data.affectedRoute || "");
        setDepartureTime(data.departureTime || "");
      })
      .catch((err) => {
        console.error("Error fetching notification:", err);
        alert("Failed to load notification data.");
      });
  }, [id]);

  useEffect(() => {
    if (type === "travel disruption" && subType !== "route disruption") {
      axios.get(`${API_URI}/api/buses/buses`, { withCredentials: true })
        .then((res) => setAllBuses(res.data))
        .catch((err) => console.error("Failed to fetch buses", err));
    }
  }, [type, subType]);

  useEffect(() => {
    if (subType === "route disruption") {
      axios.get(`${API_URI}/api/routes/routes`, { withCredentials: true })
        .then((res) => {
          if (Array.isArray(res.data.routes)) setRoutes(res.data.routes);
          else setRoutes([]);
        })
        .catch((err) => {
          console.error("Failed to fetch routes", err);
          setRoutes([]);
        });
    }
  }, [subType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updatedNotification = {
      type,
      subType: type === "travel disruption" ? subType : undefined,
      busesAffected:
        type === "travel disruption"
          ? (subType === "route disruption" ? [] : selectedBus ? [selectedBus] : [])
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
      affectedRoute: subType === "route disruption" ? selectedRoute : null,
      departureTime: subType === "bus delay" ? departureTime : null,
    };

    try {
      await axios.put(`${API_URI}/api/notifications/${id}`, updatedNotification, {
        withCredentials: true,
      });
      alert("Notification Updated Successfully!");
      navigate("/notification-management");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="notification-form-container">
        <h2>Update Notification</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Notification Type</label>
            <select value={type} disabled>
              <option value="">Select Type</option>
              <option value="travel disruption">Travel Disruption</option>
              <option value="promotions">Promotions</option>
              <option value="discounts">Discounts</option>
              <option value="alert">Alert</option>
              <option value="reminders">Reminders</option>
              <option value="info">Info</option>
            </select>
          </div>

          {type === "travel disruption" && (
            <div className="form-group">
              <label>Sub Type</label>
              <select value={subType} disabled>
                <option value="">Select Sub Type</option>
                <option value="bus maintenance">Bus Maintenance</option>
                <option value="bus delay">Bus Delay</option>
                <option value="bus breakdown">Bus Breakdown</option>
                <option value="route disruption">Route Disruption</option>
              </select>
            </div>
          )}

          {type === "travel disruption" && subType && subType !== "route disruption" && (
            <div className="form-group">
              <label>Select Affected Bus</label>
              <select value={selectedBus} disabled>
                <option value="">Select a Bus</option>
                {allBuses.map((bus) => (
                  <option key={bus.busNumber} value={bus.busNumber}>
                    {bus.busNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          {subType === "bus breakdown" && (
            <div className="form-group">
              <label>Breakdown Date</label>
              <input type="date" value={breakdownDate} disabled />
            </div>
          )}

          {subType === "bus delay" && (
            <div className="form-group">
              <label>Expected Departure Time</label>
              <input type="datetime-local" value={departureTime} disabled />
            </div>
          )}

          {subType === "bus maintenance" && (
            <>
              <div className="form-group">
                <label>Maintenance Start Date</label>
                <input type="date" value={maintenanceStartDate} disabled />
              </div>
              <div className="form-group">
                <label>Maintenance End Date</label>
                <input type="date" value={maintenanceEndDate} disabled />
              </div>
            </>
          )}

          {subType === "route disruption" && (
            <>
              <div className="form-group">
                <label>Select Affected Route</label>
                <select value={selectedRoute} disabled>
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
                <input type="date" value={disruptionStartDate} disabled />
              </div>
              <div className="form-group">
                <label>Disruption End Date</label>
                <input type="date" value={disruptionEndDate} disabled />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Expiration Date</label>
            <input type="datetime-local" value={expirationDate} disabled />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Notification"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default UpdateNotification;
