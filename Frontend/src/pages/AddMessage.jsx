import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/AddMessage.css"; // Your custom CSS
import axios from "axios";

const AddMessage = () => {
  const [message, setMessage] = useState("");
  const [shedDate, setShedDate] = useState(new Date()); // Default to today's date
  const [shedTime, setShedTime] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newMessage = {
      message,
      shedDate: shedDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD format
      shedTime,
      status,
    };

    try {
      await axios.post("http://localhost:5000/api/shed/shed", newMessage);
      alert("Message Scheduled Successfully!");
      setMessage("");
      setShedDate(new Date());
      setShedTime("");
      setStatus("pending");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Create Scheduled Message</h2>
      <form onSubmit={handleSubmit} className="message-form">
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
  );
};

export default AddMessage;
