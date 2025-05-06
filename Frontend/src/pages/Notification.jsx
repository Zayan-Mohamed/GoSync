import React, { useEffect, useState } from 'react';
import "@fortawesome/fontawesome-free/css/all.min.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Link } from 'react-router-dom';
import "../styles/notification.css"; 
import AdminLayout from '../layouts/AdminLayout';
import { jsPDF } from "jspdf";

const Notification = () => {
    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchDate, setSearchDate] = useState("");

    const API_URI = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URI}/api/notifications`, {
                    withCredentials: true
                });
                console.log(response);
                const activeNotifications = response.data.filter(notif => notif.status !== "archive");
                setNotifications(activeNotifications);
                setFilteredNotifications(activeNotifications);
            } catch (error) {
                console.error("Error fetching notifications:", error);
                alert("Failed to fetch notifications.");
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const handleSearchByDate = () => {
        if (searchDate) {
            const filtered = notifications.filter(notification => {
                const notificationDate = new Date(notification.createdAt).toLocaleDateString();
                return notificationDate === new Date(searchDate).toLocaleDateString();
            });
            setFilteredNotifications(filtered);
        } else {
            setFilteredNotifications(notifications);
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("Notifications", 10, 10);

        doc.setFontSize(10);
        doc.text("Notification ID", 10, 20);
        doc.text("Type", 30, 20);
        doc.text("Sub Type", 50, 20);
        // doc.text("Buses Affected", 80, 20);
        doc.text("Message", 150, 20);
        doc.text("Status", 180, 20);
        doc.text("Expiration Date", 200, 20);
        doc.text("Created At", 220, 20);
        doc.text("Created By", 240, 20);

        let y = 30;
        filteredNotifications.forEach((notif) => {
            doc.text(notif.notificationId, 10, y);
            doc.text(notif.type, 30, y);
            doc.text(notif.subType || "N/A", 50, y);
            // doc.text(notif.busesAffected ? notif.busesAffected.join(", ") : "N/A", 80, y); // Handling busesAffected
            doc.text(notif.message.slice(0, 50), 150, y); // limit msg length
            doc.text(notif.status, 180, y);
            doc.text(notif.expiredAt ? new Date(notif.expiredAt).toLocaleString() : "N/A", 200, y);
            doc.text(new Date(notif.createdAt).toLocaleString(), 220, y);
            doc.text(notif.createdBy || "N/A", 240, y);
            y += 10;
        });

        doc.save("notifications.pdf");
    };

    const handleDelete = async (notificationId) => {
        const notification = notifications.find(n => n.notificationId === notificationId);
        if (notification.status === 'archive') {
            alert("Archived notifications cannot be deleted.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this message?")) return;

        try {
            await axios.delete(`${API_URI}/api/notifications/${notificationId}`);
            alert("Notification deleted successfully!");
            setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
            setFilteredNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
        } catch (error) {
            console.error("Error deleting notification:", error);
            alert("Failed to delete notification.");
        }
    };

    const checkExpiration = (expiredAt) => {
        if (!expiredAt) return false;
        return new Date(expiredAt) <= new Date();
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

                <div className="mb-4 flex justify-end gap-2">
                    <input
                        type="date"
                        className="form-control"
                        style={{ width: "160px" }}
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                    />
                    <button 
                        onClick={handleSearchByDate}
                        className="btn"
                        style={{ backgroundColor: "#ff8400", color: "#fff" }}
                    >
                        Search
                    </button>
                    <button 
                        onClick={generatePDF}
                        className="btn btn-success"
                        style={{ backgroundColor: "#ff8400", color: "#fff" }}
                    >
                        Generate PDF
                    </button>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="table w-full">
                        <thead className="sticky top-0 bg-white shadow-md">
                            <tr>
                                <th>Notification ID</th>
                                <th>Type</th>
                                <th>Sub Type</th>
                                {/* <th>Buses Affected</th> New column added */}
                                <th>Message</th>
                                <th>Status</th>
                                <th>Expiration Date</th>
                                <th>Created At</th>
                                <th>Created By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="10" className="text-center">Loading...</td></tr>
                            ) : notifications.length === 0 ? (
                                <tr><td colSpan="10" className="text-center">No notifications available.</td></tr>
                            ) : (
                                filteredNotifications.map(notification => (
                                    <tr 
                                        key={notification.notificationId} 
                                        className={checkExpiration(notification.expiredAt) ? "bg-gray-300" : ""}
                                    >
                                        <td>{notification.notificationId}</td>
                                        <td>{notification.type}</td>
                                        <td>{notification.subType || 'N/A'}</td>
                                        {/* <td>{notification.busesAffected ? notification.busesAffected.join(", ") : 'N/A'}</td> Display busesAffected */}
                                        <td>{notification.message}</td>
                                        <td>
                                            {checkExpiration(notification.expiredAt) 
                                                ? 'archive' 
                                                : notification.status}
                                        </td>
                                        <td>{notification.expiredAt ? new Date(notification.expiredAt).toLocaleString() : 'N/A'}</td>
                                        <td>{new Date(notification.createdAt).toLocaleString()}</td>
                                        <td>{notification.createdBy || 'N/A'}</td>
                                        <td className="actionButtons">
                                            <Link to={`/update-notification/${notification.notificationId}`} className="btn btn-info">
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </Link>
                                            {notification.status !== 'archive' && (
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleDelete(notification.notificationId)}
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Notification;
