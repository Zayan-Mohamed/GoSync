import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/ShedTable.css";
import AdminLayout from "../layouts/AdminLayout";

const ShedTable = () => {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const API_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${API_URI}/api/shed/messages`);

        const sortedMessages = response.data.data.sort((a, b) => {
          const aDateTime = new Date(`${a.shedDate}T${a.shedTime}:00`);
          const bDateTime = new Date(`${b.shedDate}T${b.shedTime}:00`);
          return bDateTime - aDateTime;
        });

        setMessages(sortedMessages);
      } catch (error) {
        setError("Error fetching messages.");
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, []);

  const handleDelete = async (messageId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this message?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URI}/api/shed/messages/${messageId}`);
      alert("Message deleted successfully!");
      setMessages(messages.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message.");
    }
  };

  const checkIfExpired = (expiredAt) => {
    if (!expiredAt) return false;
    const currentDate = new Date();
    const expirationDate = new Date(expiredAt);
    return expirationDate <= currentDate;
  };

  return (
    <AdminLayout>
      <div className="table-container">
        <h2>Scheduled Messages</h2>
        {error && <div className="error-message">{error}</div>}
        <Link to="/add-message" className="btn btn-primary">
          Schedule <i className="fa-solid fa-plus"></i>
        </Link>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Message</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.length > 0 ? (
              messages.map((msg) => (
                <tr key={msg._id}>
                  <td>{msg.type}</td>
                  <td>{msg.message}</td>
                  <td>{msg.shedDate}</td>
                  <td>{msg.shedTime}</td>
                  <td className={msg.status === "sent" ? "sent" : "pending"}>
                    {msg.status}
                  </td>
                  <td className={checkIfExpired(msg.expiredAt) ? "expired" : ""}>
                    {msg.expiredAt
                      ? new Date(msg.expiredAt).toLocaleString() // Show actual expiry date
                      : "N/A"}
                  </td>
                  <td className="actionButtons">
                    <Link to={`/update-message/${msg._id}`} className="btn btn-info">
                      <i className="fa-solid fa-pen-to-square"></i>
                    </Link>
                    <button className="btn btn-danger" onClick={() => handleDelete(msg._id)}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No messages scheduled</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default ShedTable;
