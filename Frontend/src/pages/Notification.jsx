import React, { useEffect, useState } from 'react'; 
import "@fortawesome/fontawesome-free/css/all.min.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Link } from 'react-router-dom';
import "../styles/notification.css"; 
import AdminLayout from '../layouts/AdminLayout';

const Notification = () => {
    const [notifications, setNotifications] = useState([]);

    const API_URI = import.meta.env.VITE_API_URL

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axios.get(`${API_URI}/api/notifications`);
                setNotifications(response.data);
            } catch (error) {
                console.error("Error fetching notifications:", error);
                alert("Failed to fetch notifications.");
            }
        };

        fetchNotifications();
    }, []);

    const handleDelete = async (notificationId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this message?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`${API_URI}/api/notifications/${notificationId}`);
            alert("Notification deleted successfully!");
            setNotifications(notifications.filter(notification => notification.notificationId !== notificationId));
        } catch (error) {
            console.error("Error deleting notification:", error);
            alert("Failed to delete notification.");
        }
    };

    return (
        <AdminLayout>
            <div className="notificationTable h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Notifications</h2>
                    <Link to="/add-notification" className="btn btn-primary">
                        Create <i className="fa-regular fa-bell"></i>
                    </Link>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="table w-full">
                        <thead className="sticky top-0 bg-white shadow-md">
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
                                        <Link to={`/update-notification/${notification.notificationId}`} className="btn btn-info">
                                            <i className="fa-solid fa-pen-to-square"></i>
                                        </Link>
                                        <button
                                            className="btn btn-danger"
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
            </div>
        </AdminLayout>
    );
};

export default Notification;
