import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";

const AddSeat = () => {
    const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const seatData = Object.fromEntries(formData);
    try {
      await axios.post(`${API_URL}/api/admin/seats`, seatData, {
        withCredentials: true,
      });
      toast.success("Seat added successfully");
      navigate("/seat-management");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add seat");
    }
  };

  return (
    <AdminLayout>
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Add New Seat</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="busId" placeholder="Bus ID" className="p-2 border rounded w-full" required />
        <input name="scheduleId" placeholder="Schedule ID" className="p-2 border rounded w-full" required />
        <input name="seatNumber" placeholder="Seat Number" className="p-2 border rounded w-full" required />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Add Seat
        </button>
      </form>
    </div>
    </AdminLayout>
  );
};

export default AddSeat;