import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiPlus, FiDownload, FiFileText, FiSearch, FiFilter, FiRefreshCw } from "react-icons/fi";
import "../styles/ShedTable.css";
import AdminLayout from "../layouts/AdminLayout";
import 'bootstrap/dist/css/bootstrap.min.css';


const ShedTable = () => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [error, setError] = useState(null);
  const [searchDate, setSearchDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [subTypeFilter, setSubTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [availableSubTypes, setAvailableSubTypes] = useState([]);
  const API_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 30000);
    return () => clearInterval(intervalId);
  }, [API_URI]);

  useEffect(() => {
    filterMessages();
  }, [messages, searchDate, statusFilter, typeFilter, subTypeFilter]);

  const fetchMessages = async () => {
    setIsLoading(true);
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
      
      // Extract unique types and subtypes
      const types = [...new Set(sortedMessages.map(msg => msg.type))];
      const subTypes = [...new Set(sortedMessages.flatMap(msg => msg.subType ? [msg.subType] : []))];
      
      setAvailableTypes(types);
      setAvailableSubTypes(subTypes);
    } catch (error) {
      setError("Error fetching messages.");
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMessages = () => {
    let result = [...messages];
    
    // Filter by date
    if (searchDate) {
      result = result.filter(msg => msg.shedDate === searchDate);
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter(msg => msg.status === statusFilter);
    }
    
    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter(msg => msg.type === typeFilter);
    }
    
    // Filter by subtype
    if (subTypeFilter !== "all") {
      result = result.filter(msg => msg.subType === subTypeFilter);
    }
    
    setFilteredMessages(result);
  };

  const handleDelete = async (messageId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this message?");
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
    return new Date(expiredAt) <= new Date();
  };

  const csvData = filteredMessages.map((msg) => ({
    Type: msg.type,
    SubType: msg.subType || "N/A",
    Message: msg.message,
    Date: msg.shedDate,
    Time: msg.shedTime,
    CreatedBy: msg.createdBy || "N/A",
    Status: msg.status,
    Expiry: msg.expiredAt ? new Date(msg.expiredAt).toLocaleString() : "N/A",
  }));

  const generatePDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm"
      });

      doc.setProperties({
        title: 'Scheduled Messages Report',
        subject: 'Messages scheduled for sending',
        author: 'Your Application Name',
      });

      doc.setFontSize(18);
      doc.text('Scheduled Messages Report', 14, 15);

      const headers = [
        "Type", "SubType", "Message", "Date", "Time", 
        "Created By", "Status", "Expiry"
      ];

      const data = filteredMessages.map(msg => [
        msg.type,
        msg.subType || "N/A",
        msg.message,
        msg.shedDate,
        msg.shedTime,
        msg.createdBy || "N/A",
        msg.status,
        msg.expiredAt ? new Date(msg.expiredAt).toLocaleString() : "N/A"
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
          7: { cellWidth: 30 }
        },
        margin: { top: 20 }
      });

      const date = new Date().toLocaleString();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated on: ${date}`, 14, doc.internal.pageSize.height - 10);

      doc.save(`ScheduledMessages_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <AdminLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Scheduled Messages</h2>
          <button 
            onClick={fetchMessages} 
            className="refresh-btn"
            disabled={isLoading}
          >
            <FiRefreshCw className={isLoading ? "spin" : ""} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

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
                <option value="pending">Pending</option>
                <option value="archived">Archived</option>
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
            <Link to="/add-message" className="btn btn-primary">
              <FiPlus /> Schedule New
            </Link>
            <CSVLink 
              data={csvData} 
              filename="ScheduledMessages.csv" 
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
                <th>Type</th>
                <th>SubType</th>
                <th>Message</th>
                <th>Date</th>
                <th>Time</th>
                <th>Created By</th>
                <th>Status</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => (
                  <tr key={msg._id} className={checkIfExpired(msg.expiredAt) ? "expired-row" : ""}>
                    <td>{msg.type}</td>
                    <td>{msg.subType || "N/A"}</td>
                    <td className="message-cell">{msg.message}</td>
                    <td>{msg.shedDate}</td>
                    <td>{msg.shedTime}</td>
                    <td>{msg.createdBy || "N/A"}</td>
                    <td className={msg.status}>
                      {msg.status}
                    </td>
                    <td>
                      {msg.expiredAt ? new Date(msg.expiredAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="action-buttons-cell">
                      <Link 
                        to={`/update-message/${msg._id}`} 
                        className="btn-icon btn-edit"
                        title="Edit"
                      >
                        <i className="fas fa-pen"></i>
                      </Link>
                      <button 
                        onClick={() => handleDelete(msg._id)}
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
                    {isLoading ? "Loading messages..." : "No messages found matching your criteria"}
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

export default ShedTable;