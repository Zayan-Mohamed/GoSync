import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";

const AddBooking = () => {
    const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bookingData = {
      ...Object.fromEntries(formData),
      seatNumbers: formData
        .get("seatNumbers")
        .split(",")
        .map((s) => s.trim()),
    };
    try {
      await axios.post(
        `${API_URL}/api/admin/bookings`,
        bookingData,
        {
          withCredentials: true,
        }
      );
      toast.success("Booking added successfully");
      navigate("/booking-management");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add booking");
    }
  };

  return (
    <AdminLayout>
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Add New Booking</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="userId"
          placeholder="User ID"
          className="p-2 border rounded w-full"
          required
        />
        <input
          name="busId"
          placeholder="Bus ID"
          className="p-2 border rounded w-full"
          required
        />
        <input
          name="scheduleId"
          placeholder="Schedule ID"
          className="p-2 border rounded w-full"
          required
        />
        <input
          name="seatNumbers"
          placeholder="Seat Numbers (comma-separated)"
          className="p-2 border rounded w-full"
          required
        />
        <input
          name="fareTotal"
          type="number"
          placeholder="Fare Total"
          className="p-2 border rounded w-full"
          required
        />
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
