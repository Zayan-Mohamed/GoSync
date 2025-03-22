import React, { useState } from "react";
import axios from "axios";
import "../styles/AddNoti.css";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
const AddNotification = () => {
    const [type, setType] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("sent"); // Default status is 'sent'
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const newNotification = { type, message, status };

        try {
            await axios.post("http://localhost:5000/api/notifications", newNotification);
            alert("Notification Sent Successfully!");
            
            setType("");
            setMessage("");
            setStatus("sent"); // Reset status to 'sent' after submission
            navigate('/notification-management');
        } catch (error) {
            console.error("Error sending notification:", error);
            alert("Failed to send notification.");
        } finally {
            setLoading(false);
        }
    };
      
    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/notifications/${id}`);
            setNotifications(notifications.filter(notification => notification._id !== id)); // Update state to remove deleted notification
            alert("Notification deleted successfully!");
        } catch (error) {
            console.error("Error deleting notification", error);
            alert("Failed to delete notification.");
        }
    };
    return (
        <AdminLayout>
        <div className="notification-form-container">
            <h2>Create Notification</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Notification Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} required>
                        <option value="">Select Type</option>
                        <option value="travel disruption">Travel Disruption</option>
                        <option value="promotions">Promotions</option>
                        <option value="discounts">Discounts</option>
                        <option value="alert">Alert</option>
                        <option value="info">Info</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter notification message..."
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} required>
                        <option value="sent">Sent</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
                <button type="submit" className="send-btn" disabled={loading}>
                    {loading ? "Sending..." : "Send Notification"}
                </button>
            </form>
        </div>
        </AdminLayout>
    );
};

export default AddNotification;

