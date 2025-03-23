import React, { useState, useEffect } from "react";  
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/AddNoti.css";

const UpdateNotification = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [type, setType] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchNotification = async () => {
            try {
                console.log("Fetching notification with ID:", id);
                const response = await axios.get(`http://localhost:5000/api/notifications/${id}`);
                const notification = response.data;
                
                // Log the fetched notification for debugging
                console.log("Fetched Notification Data:", notification);

                setType(notification.type);
                setMessage(notification.message);
                setStatus(notification.status);
            } catch (error) {
                console.error("Error fetching notification:", error.response ? error.response.data : error.message);
                alert("Failed to fetch notification.");
            }
        };

        fetchNotification();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Show confirmation dialog before submitting the form
        const confirmUpdate = window.confirm("Are you sure you want to update this notification?");
        
        // If the user clicks "Cancel", do nothing
        if (!confirmUpdate) return;

        setLoading(true);

        const updatedNotification = { type, message, status };

        try {
            console.log("Updating notification:", updatedNotification);

            const response = await axios.put(`http://localhost:5000/api/notifications/${id}`, updatedNotification); // ID corresponds to notificationId
            console.log("Notification update response:", response);

            alert("Notification updated successfully!");

            // After the update, navigate to the notifications page
            navigate('/notification-management');
        } catch (error) {
            console.error("Error updating notification:", error.response ? error.response.data : error.message);
            alert("Failed to update notification.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="notification-form-container">
            <h2>Update Notification</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="type">Type</label>
                    <input
                        type="text"
                        id="type"
                        className="form-control"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                        id="message"
                        className="form-control"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <input
                        type="text"
                        id="status"
                        className="form-control"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    />
                </div>
                <button type="submit" className="send-btn" disabled={loading}>
                    {loading ? "Updating..." : "Update Notification"}
                </button>
            </form>
        </div>
    );
};

export default UpdateNotification;
