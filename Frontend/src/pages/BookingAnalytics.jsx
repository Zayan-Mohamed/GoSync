import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement } from "chart.js";
import GoSyncLoader from "../components/Loader";
import API from "../services/authService";
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement);

const BookingAnalytics = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [analytics, setAnalytics] = useState(null);
  const [buses, setBuses] = useState([]);
  const [filter, setFilter] = useState({ busId: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, busesRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/booking-analytics`, { params: filter, withCredentials: true }),
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
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
    setLoading(true);
  };

  if (loading) return <AdminLayout><div className="p-6"> <GoSyncLoader/> </div></AdminLayout>;
  if (!analytics) return <AdminLayout><div className="p-6">No data available</div></AdminLayout>;

  const revenueBarData = {
    labels: analytics.revenueByBus.length ? analytics.revenueByBus.map((b) => b.busNumber) : ["No Data"],
    datasets: [
      {
        label: "Revenue (Rs.)",
        data: analytics.revenueByBus.length ? analytics.revenueByBus.map((b) => b.totalRevenue) : [0],
        backgroundColor: "#36A2EB",
      },
    ],
  };

  const bookingsLineData = {
    labels: analytics.bookingsByDay.length ? analytics.bookingsByDay.map((d) => d._id) : ["No Data"],
    datasets: [
      {
        label: "Bookings",
        data: analytics.bookingsByDay.length ? analytics.bookingsByDay.map((d) => d.count) : [0],
        fill: false,
        borderColor: "#FF6384",
        tension: 0.1,
      },
    ],
  };

  const routesPieData = {
    labels: analytics.topRoutes.length ? analytics.topRoutes.map((r) => r._id) : ["No Data"],
    datasets: [
      {
        data: analytics.topRoutes.length ? analytics.topRoutes.map((r) => r.count) : [0],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      },
    ],
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Booking Analytics</h2>
        <div className="mb-4 flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Bus</label>
            <select name="busId" value={filter.busId} onChange={handleFilterChange} className="p-2 border rounded">
              <option value="">All Buses</option>
              {buses.map((bus) => (
                <option key={bus._id} value={bus._id}>
                  {bus.busNumber} - {bus.travelName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" name="startDate" value={filter.startDate} onChange={handleFilterChange} className="p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" name="endDate" value={filter.endDate} onChange={handleFilterChange} className="p-2 border rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded shadow">
            <p className="text-lg font-semibold">Total Bookings</p>
            <p className="text-2xl">{analytics.totalBookings}</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <p className="text-lg font-semibold">Total Revenue</p>
            <p className="text-2xl">Rs. {analytics.totalRevenue}</p>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <p className="text-lg font-semibold">Cancellation Rate</p>
            <p className="text-2xl">{analytics.cancellationRate}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Revenue by Bus</h3>
            <Bar data={revenueBarData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Bookings Over Time</h3>
            <Line data={bookingsLineData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Top Routes</h3>
            <Pie data={routesPieData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BookingAnalytics;