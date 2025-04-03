import React, { useState } from "react";
import axios from "axios";
import "../styles/AddNoti.css";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";

const AddNotification = () => {
    const [type, setType] = useState("");
    const [message, setMessage] = useState("");
    const [status] = useState("sent");  // Default status set to 'sent'
    const [expirationDate, setExpirationDate] = useState("");  // New field for expiration date
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Check if expiration date is valid
        if (expirationDate && new Date(expirationDate) <= new Date()) {
            alert("Expiration date must be in the future.");
            setLoading(false);
            return;
        }

        const newNotification = { 
            type, 
            message, 
            status, 
            expiredAt: expirationDate ? new Date(expirationDate).toISOString() : null  // Set expiration date
        };

        try {
            await axios.post("http://localhost:5000/api/notifications", newNotification);
            alert("Notification Sent Successfully!");
            
            setType("");
            setMessage("");
            setExpirationDate("");  // Clear expiration date after sending notification
            navigate('/notification-management');
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
                    <div className="form-group">
                        <label>Notification Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} required>
                            <option value="">Select Type</option>
                            <option value="travel disruption">Travel Disruption</option>
                            <option value="promotions">Promotions</option>
                            <option value="discounts">Discounts</option>
                            <option value="alert">Alert</option>
                            <option value="reminders">Reminders</option>
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
                        <label>Expiration Date (Optional)</label>
                        <input
                            type="datetime-local"
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(e.target.value)}
                        />
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
