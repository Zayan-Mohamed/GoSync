import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/ShedTable.css";
import AdminLayout from "../layouts/AdminLayout";
import io from "socket.io-client";

const ShedTable = () => {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  const API_URI = import.meta.env.VITE_API_URL;

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(API_URI, {
      withCredentials: true,
      transports: ["websocket"]
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [API_URI]);

  // Fetch messages and set up polling
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${API_URI}/api/shed/messages`, {
          withCredentials: true,
        });

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
    const intervalId = setInterval(fetchMessages, 60000); // Fallback polling every minute

    return () => clearInterval(intervalId);
  }, [API_URI]);

  // Listen for WebSocket notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg._id === notification._id) {
            return { ...msg, status: notification.status || msg.status };
          }
          return msg;
        });
      });
    };

    socket.on("newNotification", handleNotification);

    return () => {
      socket.off("newNotification", handleNotification);
    };
  }, [socket]);

  const handleDelete = async (messageId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URI}/api/shed/messages/${messageId}`, {
        withCredentials: true,
      });
      setMessages(messages.filter((msg) => msg._id !== messageId));
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
              <th>SubType</th> 
               <th>Message</th>
              <th>Date</th>
              <th>Time</th>
              <th>CreatedBy</th>
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
                  <td>{msg.subType || "N/A"}</td>
                  <td>{msg.message}</td>
                  <td>{msg.shedDate}</td>
                  <td>{msg.shedTime}</td>
                  <td>{msg.createdBy || "N/A"}</td>
                  <td className={msg.status === "sent" ? "sent" : "pending"}>
                    {msg.status}
                  </td>
                  <td className={checkIfExpired(msg.expiredAt) ? "expired" : ""}>
                    {msg.expiredAt
                      ? new Date(msg.expiredAt).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="actionButtons">
                    <Link
                      to={`/update-message/${msg._id}`}
                      className="btn btn-info"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </Link>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(msg._id)}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">No messages scheduled</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default ShedTable;