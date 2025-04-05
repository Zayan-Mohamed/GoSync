import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";

const BookingManagement = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [filters, setFilters] = useState({ busId: "", status: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [bookingsRes, busesRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/bookings`, { withCredentials: true }),
          axios.get(`${API_URL}/api/buses/buses`, { withCredentials: true }),
        ]);
        setBookings(bookingsRes.data);
        setBuses(busesRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [API_URL]);

  const filteredBookings = bookings.filter((booking) => {
    return (
      (!filters.busId || booking.busId._id === filters.busId) &&
      (!filters.status || booking.status === filters.status)
    );
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = async (bookingId) => {
    try {
      await axios.post(
        `${API_URL}/api/admin/bookings/cancel`,
        { bookingId },
        { withCredentials: true }
      );
      setBookings(bookings.map((b) => (b.bookingId === bookingId ? { ...b, status: "cancelled" } : b)));
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Current Bookings</h2>
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
            <label className="block text-sm font-medium text-gray-700">Filter by Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="p-2 border rounded"
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Booking ID</th>
              <th className="p-2">Passenger</th>
              <th className="p-2">Route</th>
              <th className="p-2">Bus</th>
              <th className="p-2">Seats</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={booking.bookingId} className="border-t">
                <td className="p-2">{booking.bookingId}</td>
                <td className="p-2">{booking.userId.name}</td>
                <td className="p-2">{`${booking.from} to ${booking.to}`}</td>
                <td className="p-2">{booking.busId.busNumber}</td>
                <td className="p-2">{booking.seatNumbers.join(", ")}</td>
                <td className="p-2">{booking.status}</td>
                <td className="p-2">
                  {booking.status === "confirmed" && (
                    <button
                      onClick={() => handleCancel(booking.bookingId)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default BookingManagement;