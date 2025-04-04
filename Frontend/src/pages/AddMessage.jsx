import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/AddMessage.css";
import axios from "axios";
import AdminLayout from "../layouts/AdminLayout";

const AddMessage = () => {
  const API_URL = import.meta.env.VITE_API_URL

  const [message, setMessage] = useState("");
  const [shedDate, setShedDate] = useState(new Date()); // Default to today's date
  const [shedTime, setShedTime] = useState("");
  const [status, setStatus] = useState("pending");
  const [type, setType] = useState(""); // Add state for notification type
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newMessage = {
      message,
      shedDate: shedDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD format
      shedTime,
      status,
      type, // Add type to the new message object
    };

    try {
      await axios.post(`${API_URL}/api/shed/shed`, newMessage);
      alert("Message Scheduled Successfully!");
      setMessage("");
      setShedDate(new Date());
      setShedTime("");
      setStatus("pending");
      setType(""); // Reset the type field after successful submission
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
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
        <label style={{ fontWeight: 'bold' }}>Notification Type</label>

        <select value={type} onChange={(e) => setType(e.target.value)} required>
          <option value="">Select Type</option>
          <option value="travel disruption">Travel Disruption</option>
          <option value="promotions">Promotions</option>
          <option value="discounts">Discounts</option>
          <option value="alert">Alert</option>
          <option value="reminders">Reminders</option>
          <option value="info">Info</option>
        </select>

        {/* Message */}
        <div className="mb-3">
          <label htmlFor="message" className="form-label">
            Message
          </label>
          <textarea
            id="message"
            className="form-control"
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="Enter your message here..."
          ></textarea>
        </div>

        {/* Scheduled Date */}
        <div className="mb-3">
          <label htmlFor="shedDate" className="form-label">
            Scheduled Date
          </label>
          <DatePicker
            selected={shedDate}
            onChange={(date) => setShedDate(date)}
            dateFormat="yyyy-MM-dd"
            className="form-control"
            required
          />
        </div>

        {/* Scheduled Time */}
        <div className="mb-3">
          <label htmlFor="shedTime" className="form-label">
            Scheduled Time
          </label>
          <input
            type="time"
            id="shedTime"
            className="form-control"
            value={shedTime}
            onChange={(e) => setShedTime(e.target.value)}
            required
          />
        </div>

        {/* Status */}
        <div className="mb-3">
          <label htmlFor="status" className="form-label">
            Status
          </label>
          <select
            id="status"
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Sending..." : "Schedule Message"}
        </button>
      </form>
    </div>
  </AdminLayout>
  );
};

export default AddMessage;

