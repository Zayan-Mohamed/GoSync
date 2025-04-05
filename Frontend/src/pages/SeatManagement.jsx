import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";

const SeatManagement = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [seats, setSeats] = useState([]);
  const [buses, setBuses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filters, setFilters] = useState({ busId: "", scheduleId: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [busesRes, schedulesRes] = await Promise.all([
          axios.get(`${API_URL}/api/buses/buses`, { withCredentials: true }),
          axios.get(`${API_URL}/api/schedules`, { withCredentials: true }),
        ]);
        setBuses(busesRes.data);
        setSchedules(schedulesRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load options");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [API_URL]);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/seats`, {
          params: filters,
          withCredentials: true,
        });
        setSeats(response.data);
      } catch (err) {
        console.error("Fetch seats error:", err.response);
        toast.error(err.response?.data?.message || "Failed to fetch seats");
      }
    };
    if (!loading) fetchSeats();
  }, [filters, loading, API_URL]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Current Seats</h2>
        <div className="mb-4 flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Bus</label>
            <select
              name="busId"
              value={filters.busId}
              onChange={handleFilterChange}
              className="p-2 border rounded"
            >
              <option value="">All Buses</option>
              {buses.map((bus) => (
                <option key={bus._id} value={bus._id}>
                  {bus.busNumber} - {bus.travelName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Schedule</label>
            <select
              name="scheduleId"
              value={filters.scheduleId}
              onChange={handleFilterChange}
              className="p-2 border rounded"
            >
              <option value="">All Schedules</option>
              {schedules.map((schedule) => (
                <option key={schedule._id} value={schedule._id}>
                  {schedule.departureDate} {schedule.departureTime}
                </option>
              ))}
            </select>
          </div>
        </div>
        {seats.length === 0 ? (
          <p>No seats found</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Seat Number</th>
                <th className="p-2">Bus Number</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {seats.map((seat) => (
                <tr key={seat._id} className="border-t">
                  <td className="p-2">{seat.seatNumber}</td>
                  <td className="p-2">{seat.busId?.busNumber || "N/A"}</td>
                  <td className="p-2">
                    {seat.isBooked
                      ? "Booked"
                      : seat.reservedUntil && new Date(seat.reservedUntil) > new Date()
                      ? "Reserved"
                      : "Available"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default SeatManagement;