import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import { Pie, Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement } from "chart.js";
import GoSyncLoader from "../components/Loader";
import { FiMapPin, FiTrendingUp, FiGlobe } from "react-icons/fi";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement);

const RouteAnalytics = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", startDate: "", endDate: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const analyticsRes = await axios.get(`${API_URL}/api/routes/route-analytics`, {
          params: filter,
        });
        setAnalytics(analyticsRes.data);
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch route analytics");
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <GoSyncLoader />
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="p-6">No route data available</div>
      </AdminLayout>
    );
  }

  const statusPieData = {
    labels: ["Active", "Inactive"],
    datasets: [
      {
        data: [analytics.activeRoutes || 0, analytics.inactiveRoutes || 0],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#FF6384"],
      },
    ],
  };

  const bookingsByRouteBarData = {
    labels: analytics.bookingsByRoute.length ? analytics.bookingsByRoute.map((r) => r.routeName) : ["No Data"],
    datasets: [
      {
        label: "Bookings",
        data: analytics.bookingsByRoute.length ? analytics.bookingsByRoute.map((r) => r.bookingCount) : [0],
        backgroundColor: "#4BC0C0",
      },
    ],
  };

  const bookingsOverTimeLineData = {
    labels: analytics.bookingsOverTime.length ? analytics.bookingsOverTime.map((d) => d._id) : ["No Data"],
    datasets: [
      {
        label: "Bookings",
        data: analytics.bookingsOverTime.length ? analytics.bookingsOverTime.map((d) => d.count) : [0],
        fill: false,
        borderColor: "#FF6384",
        tension: 0.1,
      },
    ],
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Route Analytics</h2>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row sm:space-x-4 bg-white p-4 rounded-lg shadow">
          <div className="mb-4 sm:mb-0">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="mt-1 p-2 border rounded-md w-full sm:w-auto focus:ring-deepOrange focus:border-deepOrange"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="mb-4 sm:mb-0">
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              className="mt-1 p-2 border rounded-md w-full sm:w-auto focus:ring-deepOrange focus:border-deepOrange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              className="mt-1 p-2 border rounded-md w-full sm:w-auto focus:ring-deepOrange focus:border-deepOrange"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500">
              <FiGlobe className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Routes</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalRoutes}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500">
              <FiMapPin className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Most Popular Route</p>
              <p className="text-lg font-bold text-gray-800 truncate">
                {analytics.mostPopularRoute?.routeName || "No data"}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500">
              <FiTrendingUp className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Stops per Route</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.avgStopsPerRoute.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-800">Route Status Distribution</h3>
            <div className="h-64">
              <Pie
                data={statusPieData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                    tooltip: { backgroundColor: "#2D3748" },
                  },
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-800">Bookings by Route</h3>
            <div className="h-64">
              <Bar
                data={bookingsByRouteBarData}
                options={{
                  responsive: true,
                  scales: { y: { beginAtZero: true } },
                  plugins: { tooltip: { backgroundColor: "#2D3748" } },
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 col-span-1 lg:col-span-2">
            <h3 className="text-lg font-medium mb-4 text-gray-800">Bookings Over Time</h3>
            <div className="h-64">
              <Line
                data={bookingsOverTimeLineData}
                options={{
                  responsive: true,
                  scales: { y: { beginAtZero: true } },
                  plugins: { tooltip: { backgroundColor: "#2D3748" } },
                }}
              />
            </div>
          </div>
        </div>

        {/* Top Routes Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4 text-gray-800">Top Routes by Bookings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stops
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topRoutes.slice(0, 5).map((route, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {route.routeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          route.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {route.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {route.stopCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {route.bookingCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RouteAnalytics;