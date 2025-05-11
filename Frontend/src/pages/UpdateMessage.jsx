import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import "../styles/addNoti.css";
import AdminLayout from "../layouts/AdminLayout";

const UpdateMessage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [shedDate, setShedDate] = useState(new Date());
  const [shedTime, setShedTime] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("");
  const [expiryDate, setExpiryDate] = useState(""); // Initialize expiryDate state
  const API_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await axios.get(`${API_URI}/api/shed/messages/${id}`);
        const { message, shedDate, shedTime, status, expiredAt } = response.data.data;
        setMessage(message);
        setShedDate(new Date(shedDate));
        setShedTime(shedTime);
        setStatus(status);
        setExpiryDate(expiredAt ? new Date(expiredAt).toISOString().slice(0, 16) : ""); // Set the expiry date if available
      } catch (error) {
        console.error("Error fetching message details:", error);
        alert("Failed to fetch message details.");
      }
    };
    fetchMessage();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updatedMessage = {
      type,
      message,
      shedDate: shedDate.toISOString().split("T")[0],
      shedTime,
      status,
      expiredAt: expiryDate ? new Date(expiryDate).toISOString() : null, // Convert expiry date to ISO format if present
    };

    try {
      await axios.put(`${API_URI}/api/shed/messages/${id}`, updatedMessage);
      alert("Message updated successfully!");
      navigate("/Schedule-notification");
    } catch (error) {
      console.error("Error updating message:", error);
      alert("Failed to update message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="form-container">
        <h2 className="form-title">Update Scheduled Message</h2>
        <form onSubmit={handleSubmit} className="message-form">

          {/* Notification Type */}
          <label style={{ fontWeight: "bold" }}>Notification Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="">Select Type</option>
            <option value="travel disruption">Travel Disruption</option>
            <option value="promotions">Promotions</option>
            <option value="discounts">Discounts</option>
            <option value="alert">Alert</option>
            <option value="reminders">Reminders</option>
            <option value="info">Info</option>
          </select>

          <div className="mb-3">
            <label htmlFor="message" className="form-label">Message</label>
            <textarea
              id="message"
              className="form-control"
              rows="3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="mb-3">
            <label htmlFor="shedDate" className="form-label">Scheduled Date</label>
            <DatePicker
              selected={shedDate}
              onChange={(date) => setShedDate(date)}
              dateFormat="yyyy-MM-dd"
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="shedTime" className="form-label">Scheduled Time</label>
            <input
              type="time"
              id="shedTime"
              className="form-control"
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
            {loading ? "Updating..." : "Update Message"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default UpdateMessage;

