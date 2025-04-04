import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";

const SeatManagement = () => {
    const API_URL = import.meta.env.VITE_API_URL;

  const [seats, setSeats] = useState([]);
  const [filters, setFilters] = useState({ busId: "", scheduleId: "" });

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/seats`, {
          params: filters,
          withCredentials: true,
        });
        setSeats(response.data);
      } catch (err) {
        console.error("Fetch seats error:", err.response); // Debug log
        toast.error(err.response?.data?.message || "Failed to fetch seats");
      }
    };
    fetchSeats();
  }, [filters]);

  return (
    <AdminLayout>
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Current Seats</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by Bus ID"
          value={filters.busId}
          onChange={(e) => setFilters({ ...filters, busId: e.target.value })}
          className="p-2 border rounded mr-2"
        />
        <input
          type="text"
          placeholder="Filter by Schedule ID"
          value={filters.scheduleId}
          onChange={(e) => setFilters({ ...filters, scheduleId: e.target.value })}
          className="p-2 border rounded"
        />
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