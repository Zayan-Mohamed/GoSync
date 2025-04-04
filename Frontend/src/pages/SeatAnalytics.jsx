import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import Loader from "../components/Loader";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const SeatAnalytics = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [analytics, setAnalytics] = useState(null);
  const [buses, setBuses] = useState([]);
  const [filter, setFilter] = useState({ busId: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, busesRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/seat-analytics`, { params: filter, withCredentials: true }),
          axios.get(`${API_URL}/api/buses/buses`, { withCredentials: true }),
        ]);
        setAnalytics(analyticsRes.data);
        setBuses(busesRes.data);
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch analytics");
        setLoading(false);
      }
    };
    fetchData();
  }, [filter, API_URL]);

  const handleFilterChange = (e) => {
    setFilter({ busId: e.target.value });
    setLoading(true);
  };

  if (loading) return <AdminLayout><div className="p-6">Loading...</div></AdminLayout>;
  if (!analytics) return <AdminLayout><div className="p-6">No data available</div></AdminLayout>;

  const pieData = {
    labels: ["Booked", "Reserved", "Available"],
    datasets: [
      {
        data: [analytics.bookedSeats || 0, analytics.reservedSeats || 0, analytics.availableSeats || 0],
        backgroundColor: ["#FF6384", "#FFCE56", "#36A2EB"],
        hoverBackgroundColor: ["#FF6384", "#FFCE56", "#36A2EB"],
      },
    ],
  };

  const barData = {
    labels: analytics.byBus.length ? analytics.byBus.map((b) => b.busNumber) : ["No Data"],
    datasets: [
      {
        label: "Booked Seats",
        data: analytics.byBus.length ? analytics.byBus.map((b) => b.booked) : [0],
        backgroundColor: "#FF6384",
      },
      {
        label: "Available Seats",
        data: analytics.byBus.length ? analytics.byBus.map((b) => b.available) : [0],
        backgroundColor: "#36A2EB",
      },
    ],
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Seat Analytics</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Filter by Bus</label>
          <select value={filter.busId} onChange={handleFilterChange} className="p-2 border rounded">
            <option value="">All Buses</option>
            {buses.map((bus) => (
              <option key={bus._id} value={bus._id}>
                {bus.busNumber} - {bus.travelName}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded shadow">
            <p className="text-lg font-semibold">Total Seats</p>
            <p className="text-2xl">{analytics.totalSeats}</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <p className="text-lg font-semibold">Occupancy Rate</p>
            <p className="text-2xl">{analytics.occupancyRate}</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <p className="text-lg font-semibold">Avg. Reservation Time</p>
            <p className="text-2xl">{analytics.avgReservationTime} mins</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Seat Status Distribution</h3>
            <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Seats by Bus</h3>
            <Bar data={barData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SeatAnalytics;