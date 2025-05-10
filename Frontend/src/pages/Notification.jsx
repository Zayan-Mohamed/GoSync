import React, { useEffect, useState } from 'react';
import "@fortawesome/fontawesome-free/css/all.min.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { FiPlus, FiDownload, FiFileText, FiSearch, FiFilter, FiRefreshCw } from "react-icons/fi";
import "../styles/notification.css";
import AdminLayout from '../layouts/AdminLayout';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchDate, setSearchDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [subTypeFilter, setSubTypeFilter] = useState("all");
  const [availableTypes, setAvailableTypes] = useState([]);
  const [availableSubTypes, setAvailableSubTypes] = useState([]);
  const API_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchDate, statusFilter, typeFilter, subTypeFilter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URI}/api/notifications`, {
        withCredentials: true
      });

      const sortedNotifications = response.data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setNotifications(sortedNotifications);
      
      // Extract unique types and subtypes
      const types = [...new Set(sortedNotifications.map(notif => notif.type))];
      const subTypes = [...new Set(sortedNotifications.flatMap(notif => notif.subType ? [notif.subType] : []))];
      
      setAvailableTypes(types);
      setAvailableSubTypes(subTypes);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let result = [...notifications];

    // Filter by date
    if (searchDate) {
      result = result.filter(notif => new Date(notif.createdAt).toISOString().split('T')[0] === searchDate);
    }

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "archive") {
        result = result.filter(notif => notif.status === "archive" || checkExpiration(notif.expiredAt));
      } else {
        result = result.filter(notif => notif.status === statusFilter && !checkExpiration(notif.expiredAt));
      }
    }

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter(notif => notif.type === typeFilter);
    }

    // Filter by subtype
    if (subTypeFilter !== "all") {
      result = result.filter(notif => notif.subType === subTypeFilter);
    }

    setFilteredNotifications(result);
  };

  const checkExpiration = (expiredAt) => {
    if (!expiredAt) return false;
    return new Date(expiredAt) <= new Date();
  };

  const csvData = filteredNotifications.map((notif) => ({
    "Notification ID": notif.notificationId,
    "Type": notif.type,
    "Sub Type": notif.subType || "N/A",
    "Message": notif.message,
    "Status": checkExpiration(notif.expiredAt) ? "archive" : notif.status,
    "Expiration Date": notif.expiredAt ? new Date(notif.expiredAt).toLocaleString() : "N/A",
    "Created At": new Date(notif.createdAt).toLocaleString(),
    "Created By": notif.createdBy || "N/A"
  }));

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm"
    });

    doc.setProperties({
      title: 'Notifications Report',
      subject: 'System notifications',
      author: 'Your Application Name',
    });

    doc.setFontSize(18);
    doc.text('Notifications Report', 14, 15);

    const headers = [
      "ID", "Type", "Sub Type", "Message", "Status", 
      "Expiration Date", "Created At", "Created By"
    ];

    const data = filteredNotifications.map(notif => [
      notif.notificationId,
      notif.type,
      notif.subType || "N/A",
      notif.message,
      checkExpiration(notif.expiredAt) ? "archive" : notif.status,
      notif.expiredAt ? new Date(notif.expiredAt).toLocaleString() : "N/A",
      new Date(notif.createdAt).toLocaleString(),
      notif.createdBy || "N/A"
    ]);

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 20,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [255, 132, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        2: { cellWidth: 'auto' },
        3: { cellWidth: 50 },
        7: { cellWidth: 20 }
      },
      margin: { top: 20 }
    });

    const date = new Date().toLocaleString();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on: ${date}`, 14, doc.internal.pageSize.height - 10);

    doc.save(`Notifications_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;

    try {
      await axios.delete(`${API_URI}/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Failed to delete notification.");
    }
  };

  return (
    <AdminLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Notifications</h2>
          <button
            onClick={fetchNotifications}
            className="refresh-btn"
            disabled={loading}
          >
            <FiRefreshCw className={loading ? "spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="controls-container">
          <div className="filters">
            <div className="filter-group">
              <FiSearch className="filter-icon" />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="date-filter"
              />
            </div>
            
            <div className="filter-group">
              <FiFilter className="filter-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-filter"
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="archive">Archived</option>
              </select>
            </div>

            <div className="filter-group">
              <FiFilter className="filter-icon" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="type-filter"
              >
                <option value="all">All Types</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <FiFilter className="filter-icon" />
              <select
                value={subTypeFilter}
                onChange={(e) => setSubTypeFilter(e.target.value)}
                className="subtype-filter"
              >
                <option value="all">All SubTypes</option>
                {availableSubTypes.map(subType => (
                  <option key={subType} value={subType}>{subType}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="action-buttons">
            <Link to="/add-notification" className="btn btn-primary">
              <FiPlus /> Create New
            </Link>
            <CSVLink 
              data={csvData} 
              filename="Notifications.csv" 
              className="btn btn-secondary"
            >
              <FiDownload /> Export CSV
            </CSVLink>
            <button className="btn btn-secondary" onClick={generatePDF}>
              <FiFileText /> Export PDF
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="messages-table">
            <thead>
              <tr>
                <th>Notification ID</th>
                <th>Type</th>
                <th>Sub Type</th>
                <th>Message</th>
                <th>Status</th>
                <th>Expiration Date</th>
                <th>Created At</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => (
                  <tr 
                    key={notif.notificationId} 
                    className={checkExpiration(notif.expiredAt) ? "expired-row" : ""}
                  >
                    <td>{notif.notificationId}</td>
                    <td>{notif.type}</td>
                    <td>{notif.subType || "N/A"}</td>
                    <td className="message-cell">{notif.message}</td>
                    <td className={checkExpiration(notif.expiredAt) ? "archive" : notif.status}>
                      {checkExpiration(notif.expiredAt) ? "archive" : notif.status}
                    </td>
                    <td>
                      {notif.expiredAt ? new Date(notif.expiredAt).toLocaleString() : "N/A"}
                    </td>
                    <td>{new Date(notif.createdAt).toLocaleString()}</td>
                    <td>{notif.createdBy || "N/A"}</td>
                    <td className="action-buttons-cell">
                      <Link 
                        to={`/update-notification/${notif.notificationId}`} 
                        className="btn-icon btn-edit"
                        title="Edit"
                      >
                        <i className="fas fa-pen"></i>
                      </Link>
                      <button 
                        onClick={() => handleDelete(notif.notificationId)}
                        className="btn-icon btn-delete"
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="no-results">
                    {loading ? "Loading notifications..." : "No notifications found matching your criteria"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Notification;