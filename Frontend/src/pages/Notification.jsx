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
    const [loading, setLoading] = useState(false); // Add loading state
    const [searchDate, setSearchDate] = useState("");

    const API_URI = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URI}/api/notifications`);
                console.log(response.data); // Debugging: Check the structure of the response data

                // Ensure notifications are being parsed correctly, including the expiredAt field
                const activeNotifications = response.data.filter(
                    (notif) => notif.status !== "archive"
                );
                setNotifications(activeNotifications);
                setFilteredNotifications(activeNotifications); // Ensure the filtered notifications are set initially
            } catch (error) {
                console.error("Error fetching notifications:", error);
                alert("Failed to fetch notifications.");
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    // Handle search by date
    const handleSearchByDate = () => {
        if (searchDate) {
            const filtered = notifications.filter(notification => {
                const notificationDate = new Date(notification.createdAt).toLocaleDateString();
                return notificationDate === new Date(searchDate).toLocaleDateString();
            });
            setFilteredNotifications(filtered);
        } else {
            setFilteredNotifications(notifications); // Show all if no date is selected
        }
    };

    // Handle PDF generation
    const generatePDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text("Notifications", 10, 10);

        // Table Header
        doc.setFontSize(12);
        doc.text("Notification ID", 10, 20);
        doc.text("Type", 40, 20);
        doc.text("Message", 80, 20);
        doc.text("Status", 150, 20);
        doc.text("Expiration Date", 180, 20);
        doc.text("Created At", 220, 20);

        // Table Rows
        let yPosition = 30;
        filteredNotifications.forEach((notif) => {
            doc.text(notif.notificationId.toString(), 10, yPosition);
            doc.text(notif.type, 40, yPosition);
            doc.text(notif.message, 80, yPosition);
            doc.text(notif.status, 150, yPosition);
            doc.text(notif.expiredAt ? new Date(notif.expiredAt).toLocaleString() : "N/A", 180, yPosition);
            doc.text(new Date(notif.createdAt).toLocaleString(), 220, yPosition);
            yPosition += 10;
        });

        // Save the PDF
        doc.save("notifications.pdf");
    };

    const handleDelete = async (notificationId) => {
        const notification = notifications.find(n => n.notificationId === notificationId);

        // Check if the status is 'archive' before confirming the delete
        if (notification.status === 'archive') {
            alert("Archived notifications cannot be deleted.");
            return;
        }

        const confirmDelete = window.confirm("Are you sure you want to delete this message?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`${API_URI}/api/notifications/${notificationId}`);
            alert("Notification deleted successfully!");

            // Remove the deleted notification from the state
            setNotifications((prevNotifications) =>
                prevNotifications.filter((notification) => notification.notificationId !== notificationId)
            );
            setFilteredNotifications((prevNotifications) =>
                prevNotifications.filter((notification) => notification.notificationId !== notificationId)
            );
        } catch (error) {
            console.error("Error deleting notification:", error);
            alert("Failed to delete notification.");
        }
    };

    const checkExpiration = (expiredAt) => {
        if (!expiredAt) {
            return false; // No expiration date means it's not expired
        }

        const currentDate = new Date();
        const expiration = new Date(expiredAt);
        return expiration <= currentDate;
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
                <div className="mb-4 flex justify-end">
                    {/* Date Search Input */}
                    <input
                        type="date"
                        className="form-control"
                        style={{ width: "160px" }}  // Reduced width for search input
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
                        className="btn btn-success ml-3" // Add a button for generating PDF
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
                                <th>Message</th>
                                <th>Status</th>
                                <th>Expiration Date</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        Loading...
                                    </td>
                                </tr>
                            ) : notifications.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center">
                                        No notifications available.
                                    </td>
                                </tr>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <tr 
                                        key={notification.notificationId} 
                                        className={checkExpiration(notification.expiredAt) ? "bg-gray-300" : ""}  // Use expiredAt here
                                    >
                                        <td>{notification.notificationId}</td>
                                        <td>{notification.type}</td>
                                        <td>{notification.message}</td>
                                        <td>
                                            {checkExpiration(notification.expiredAt) 
                                                ? 'archive'  // Use expiredAt here
                                                : notification.status}
                                        </td>
                                        <td>
                                            {notification.expiredAt ? new Date(notification.expiredAt).toLocaleString() : 'N/A'}  {/* Use expiredAt here */}
                                        </td>
                                        <td>{new Date(notification.createdAt).toLocaleString()}</td>
                                        <td className="actionButtons">
                                            <Link to={`/update-notification/${notification.notificationId}`} className="btn btn-info">
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </Link>
                                            {/* Only allow deletion for non-archived notifications */}
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
