import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { saveAs } from "file-saver";

const BusMaintenance = () => {
  const [maintenances, setMaintenances] = useState([]);
  const [buses, setBuses] = useState([]);
  const [formData, setFormData] = useState({
    busId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchMaintenances = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/maintenance`, {
        withCredentials: true,
      });
      setMaintenances(res.data && Array.isArray(res.data) ? res.data : []);
      toast.success("Maintenance records fetched successfully");
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching maintenances:", error.message);
      toast.error("Error fetching maintenance records");
      setErrorMessage("Error fetching maintenance records.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBuses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/buses/buses`, {
        withCredentials: true,
      });
      setBuses(res.data && Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setErrorMessage("Start date must be earlier than end date.");
      return;
    }
    try {
      await axios.post(`${API_URL}/api/maintenance`, formData, {
        withCredentials: true,
      });
      fetchMaintenances();
      setFormData({ busId: "", startDate: "", endDate: "", reason: "" });
      setErrorMessage("");
    } catch (error) {
      console.error("Error adding maintenance:", error.message);
      setErrorMessage("Failed to add maintenance.");
    }
  };

  const markAsCompleted = async (id) => {
    try {
      await axios.put(`${API_URL}/api/maintenance/${id}`, {
        withCredentials: true,
        status: "completed",
      });
      fetchMaintenances();
    } catch (error) {
      console.error("Failed to mark as completed:", error.message);
      setErrorMessage("Failed to mark maintenance as completed.");
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Bus Maintenance Report", 14, 10);
    autoTable(doc, {
      startY: 20,
      head: [["Bus Number", "Start Date", "End Date", "Reason", "Status"]],
      body: filteredMaintenances.map((entry) => [
        entry.busId?.busNumber || `Bus ${entry.busId}`,
        new Date(entry.startDate).toLocaleDateString(),
        entry.endDate ? new Date(entry.endDate).toLocaleDateString() : "N/A",
        entry.reason,
        entry.status,
      ]),
    });
    doc.save("maintenance_report.pdf");
  };

  const exportToCSV = () => {
    const csvData = filteredMaintenances.map((entry) => ({
      BusNumber: entry.busId?.busNumber || `Bus ${entry.busId}`,
      StartDate: new Date(entry.startDate).toLocaleDateString(),
      EndDate: entry.endDate
        ? new Date(entry.endDate).toLocaleDateString()
        : "N/A",
      Reason: entry.reason,
      Status: entry.status,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "maintenance_report.csv");
  };

  useEffect(() => {
    fetchBuses();
    fetchMaintenances();
  }, []);

  // Filter the maintenance records based on status and search query
  const filteredMaintenances = maintenances.filter((entry) => {
    const statusMatch =
      statusFilter === "all" || entry.status === statusFilter;
    const searchMatch =
      entry.busId?.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Bus Maintenance Management</h2>

          {errorMessage && (
            <div className="text-red-600 mb-4">{errorMessage}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 mb-6">
            <select
              value={formData.busId}
              onChange={(e) =>
                setFormData({ ...formData, busId: e.target.value })
              }
              className="border p-2 w-full"
              required
            >
              <option value="">Select Bus</option>
              {Array.isArray(buses) && buses.length > 0 ? (
                buses.map((bus) => (
                  <option key={bus._id} value={bus._id}>
                    {bus.busNumber || `Bus ${bus._id.slice(-4)}`}
                  </option>
                ))
              ) : (
                <option disabled>No buses available</option>
              )}
            </select>

            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="border p-2 w-full"
              required
            />
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="border p-2 w-full"
            />
            <textarea
              placeholder="Reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              className="border p-2 w-full"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add Maintenance
            </button>
          </form>

          {loading && (
            <div className="text-center text-blue-500 mb-4">Loading...</div>
          )}

          <div className="mb-4">
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border p-2"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <input
                type="text"
                placeholder="Search by bus number or reason"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border p-2"
              />
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={exportToPDF}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Export PDF
              </button>
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">All Maintenance Records</h3>
            {filteredMaintenances.length > 0 ? (
              filteredMaintenances.map((entry) => (
                <div key={entry._id} className="border p-3 mb-3 rounded shadow">
                  <p>
                    <strong>Bus:</strong> {entry.busId?.busNumber || `Bus ${entry.busId}`}
                  </p>
                  <p>
                    <strong>From:</strong> {new Date(entry.startDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>To:</strong> {entry.endDate ? new Date(entry.endDate).toLocaleDateString() : "N/A"}
                  </p>
                  <p>
                    <strong>Reason:</strong> {entry.reason}
                  </p>
                  <p>
                    <strong>Status:</strong> {entry.status}
                  </p>
                  {entry.status !== "completed" ? (
                    <button
                      className="bg-green-600 text-white px-3 py-1 mt-2 rounded"
                      onClick={() => markAsCompleted(entry._id)}
                    >
                      Mark as Completed
                    </button>
                  ) : (
                    <p className="text-green-600">Completed</p>
                  )}
                </div>
              ))
            ) : (
              <div>No maintenance records found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusMaintenance;
