import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";

const SeatAnalytics = () => {
    const API_URL = import.meta.env.VITE_API_URL;
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/admin/seat-analytics`, {
          withCredentials: true,
        });
        setAnalytics(response.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch analytics");
      }
    };
    fetchAnalytics();
  }, []);

  if (!analytics) return <div>Loading...</div>;

  return (
    <AdminLayout>
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Seat Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-lg font-semibold">Total Seats</p>
          <p className="text-2xl">{analytics.totalSeats}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-lg font-semibold">Booked Seats</p>
          <p className="text-2xl">{analytics.bookedSeats}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-lg font-semibold">Occupancy Rate</p>
          <p className="text-2xl">{analytics.occupancyRate}</p>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default SeatAnalytics;