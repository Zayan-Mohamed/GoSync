import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";

const AddBooking = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; // Fallback
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    userId: "",
    busId: "",
    scheduleId: "",
    seatNumbers: [],
    fareTotal: "",
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, busesRes, schedulesRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/users`, { withCredentials: true }),
          axios.get(`${API_URL}/api/buses/buses`, { withCredentials: true }),
          axios.get(`${API_URL}/api/schedules/`, { withCredentials: true }), // New endpoint
        ]);
        setUsers(usersRes.data);
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

  // Fetch available seats when bus and schedule are selected
  useEffect(() => {
    if (formData.busId && formData.scheduleId) {
      const fetchSeats = async () => {
        try {
          const response = await axios.get(`${API_URL}/api/admin/seats`, {
            params: { busId: formData.busId, scheduleId: formData.scheduleId },
            withCredentials: true,
          });
          setSeats(response.data.filter((seat) => !seat.isBooked && (!seat.reservedUntil || new Date(seat.reservedUntil) <= new Date())));
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to fetch seats");
        }
      };
      fetchSeats();
    }
  }, [formData.busId, formData.scheduleId, API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSeatChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, seatNumbers: selectedOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.seatNumbers.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }
    try {
      await axios.post(`${API_URL}/api/admin/bookings`, formData, {
        withCredentials: true,
      });
      toast.success("Booking added successfully");
      navigate("/booking-management");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add booking");
    }
  };

  if (loading) return <div className="p-6">Loading options...</div>;

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Add New Booking</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Passenger</label>
            <select
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              className="p-2 border rounded w-full"
              required
            >
              <option value="">Select a passenger</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

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
                  {schedule.departureDate} {schedule.departureTime} - {schedule.arrivalTime}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Seats (Hold Ctrl/Cmd for multiple)</label>
            <select
              name="seatNumbers"
              multiple
              value={formData.seatNumbers}
              onChange={handleSeatChange}
              className="p-2 border rounded w-full h-32"
              disabled={!formData.busId || !formData.scheduleId}
            >
              {seats.map((seat) => (
                <option key={seat._id} value={seat.seatNumber}>
                  {seat.seatNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fare Total</label>
            <input
              name="fareTotal"
              type="number"
              value={formData.fareTotal}
              onChange={handleChange}
              placeholder="Fare Total"
              className="p-2 border rounded w-full"
              required
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Booking
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddBooking;