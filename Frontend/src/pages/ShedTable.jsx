import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/ShedTable.css";
import AdminLayout from '../layouts/AdminLayout';

const ShedTable = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/shed/messages");
        setMessages(response.data.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, []);

  const handleDelete = async (messageId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this message?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/shed/messages/${messageId}`);
      alert("Message deleted successfully!");
      setMessages(messages.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message.");
    }
  };

  return (
         <AdminLayout>
    <div className="table-container">
      <h2>Scheduled Messages</h2>
      <Link to="/add-message" className="btn btn-primary">
        Schedule <i className="fa-solid fa-plus"></i>
      </Link>
      <table>
        <thead>
          <tr>
            <th>Message</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {messages.length > 0 ? (
            messages.map((msg) => (
              <tr key={msg._id}>
                <td>{msg.message}</td>
                <td>{msg.shedDate}</td>
                <td>{msg.shedTime}</td>
                <td className={msg.status === "sent" ? "sent" : "pending"}>{msg.status}</td>
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
              <td colSpan="5">No messages scheduled</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </AdminLayout>
  );
};

export default ShedTable;