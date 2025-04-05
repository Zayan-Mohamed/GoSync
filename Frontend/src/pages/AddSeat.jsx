import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";

const AddSeat = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [formData, setFormData] = useState({ busId: "", scheduleId: "", seatNumber: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, [API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/admin/seats`, formData, { withCredentials: true });
      toast.success("Seat added successfully");
      navigate("/seat-management");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add seat");
    }
  };

  if (loading) return <div className="p-6">Loading options...</div>;

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Add New Seat</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bus</label>
            <select
              name="busId"
              value={formData.busId}
              onChange={handleChange}
              className="p-2 border rounded w-full"
              required
            >
              <option value="">Select a bus</option>
              {buses.map((bus) => (
                <option key={bus._id} value={bus._id}>
                  {bus.busNumber} - {bus.travelName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Schedule</label>
            <select
              name="scheduleId"
              value={formData.scheduleId}
              onChange={handleChange}
              className="p-2 border rounded w-full"
              required
            >
              <option value="">Select a schedule</option>
              {schedules.map((schedule) => (
                <option key={schedule._id} value={schedule._id}>
                  {schedule.departureDate} {schedule.departureTime}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Seat Number</label>
            <input
              name="seatNumber"
              value={formData.seatNumber}
              onChange={handleChange}
              placeholder="e.g., S1"
              className="p-2 border rounded w-full"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Seat
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddSeat;