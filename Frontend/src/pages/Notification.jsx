import React, { useEffect, useState } from 'react'; 
import "@fortawesome/fontawesome-free/css/all.min.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Link } from 'react-router-dom';
import "../styles/notification.css"; // Ensure you have your correct path here

const Notification = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/notifications");
                setNotifications(response.data);
            } catch (error) {
                console.error("Error fetching notifications:", error);
                alert("Failed to fetch notifications.");
            }
        };

        fetchNotifications();
    }, []);

    const handleDelete = async (notificationId) => {
        // Show confirmation dialog
        const confirmDelete = window.confirm("Are you sure you want to delete this message?");
        
        // If the user clicks "Cancel", do nothing
        if (!confirmDelete) return;

        // If the user clicks "OK", proceed with the delete
        try {
            await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`);
            alert("Notification deleted successfully!");

            // Update the state to remove the deleted notification from the list
            setNotifications(notifications.filter(notification => notification.notificationId !== notificationId));
        } catch (error) {
            console.error("Error deleting notification:", error);
            alert("Failed to delete notification.");
        }
    };

    return (
        <div className="notificationTable">
            <Link to="/add-notification" type="button" className="btn btn-primary">
                Create <i className="fa-regular fa-bell"></i>
            </Link>
        
            <table className="table">
                <thead>
                    <tr>
                        <th>Notification ID</th>
                        <th>Type</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {notifications.map((notification) => (
                        <tr key={notification.notificationId}>
                            <td>{notification.notificationId}</td>
                            <td>{notification.type}</td>
                            <td>{notification.message}</td>
                            <td>{notification.status}</td>
                            <td>{notification.createdAt}</td>
                            <td className="actionButtons">
                                <Link to={`/update-notification/${notification.notificationId}`} type="button" className="btn btn-info">
                                    <i className="fa-solid fa-pen-to-square"></i>
                                </Link>
                                <button
                                    type="button"
                                    className="approve"
                                    onClick={() => handleDelete(notification.notificationId)} 
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Notification;
