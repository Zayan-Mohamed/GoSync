import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";
import GoSyncLoader from "../components/Loader";
import { FiMapPin, FiActivity, FiList } from "react-icons/fi";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const StopAnalytics = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [analytics, setAnalytics] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [filter, setFilter] = useState({ routeId: "", status: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, routesRes] = await Promise.all([
          axios.get(`${API_URL}/api/stops/stop-analytics`, { params: filter }),
          axios.get(`${API_URL}/api/routes/routes`),
        ]);
        setAnalytics(analyticsRes.data);
        setRoutes(routesRes.data.routes || []);
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch stop analytics");
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
        <div className="p-6">No stop data available</div>
      </AdminLayout>
    );
  }

  const statusPieData = {
    labels: ["Active", "Inactive"],
    datasets: [
      {
        data: [analytics.activeStops || 0, analytics.inactiveStops || 0],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#FF6384"],
      },
    ],
  };

  const stopsByRouteBarData = {
    labels: analytics.stopsByRoute.length ? analytics.stopsByRoute.map((r) => r.routeName) : ["No Data"],
    datasets: [
      {
        label: "Number of Stops",
        data: analytics.stopsByRoute.length ? analytics.stopsByRoute.map((r) => r.stopCount) : [0],
        backgroundColor: "#4BC0C0",
      },
    ],
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Stop Analytics</h2>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row sm:space-x-4 bg-white p-4 rounded-lg shadow">
          <div className="mb-4 sm:mb-0">
            <label className="block text-sm font-medium text-gray-700">Filter by Route</label>
            <select
              name="routeId"
              value={filter.routeId}
              onChange={handleFilterChange}
              className="mt-1 p-2 border rounded-md w-full sm:w-auto focus:ring-deepOrange focus:border-deepOrange"
            >
              <option value="">All Routes</option>
              {routes.map((route) => (
                <option key={route._id} value={route._id}>
                  {route.routeName} ({route.startLocation} to {route.endLocation})
                </option>
              ))}
            </select>
          </div>
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
              <FiMapPin className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Stops</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalStops}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500">
              <FiActivity className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Stops</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.activeStops}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500">
              <FiList className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Most Used Stop</p>
              <p className="text-lg font-bold text-gray-800 truncate">
                {analytics.mostUsedStop?.stopName || "No data"}
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-800">Stop Status Distribution</h3>
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
            <h3 className="text-lg font-medium mb-4 text-gray-800">Stops by Route</h3>
            <div className="h-64">
              <Bar
                data={stopsByRouteBarData}
                options={{
                  responsive: true,
                  scales: { y: { beginAtZero: true } },
                  plugins: { tooltip: { backgroundColor: "#2D3748" } },
                }}
              />
            </div>
          </div>
        </div>

        {/* Top Stops Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4 text-gray-800">Top Stops by Usage</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stop Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Routes Using
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topStops.slice(0, 5).map((stop, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stop.stopName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          stop.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {stop.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stop.routeCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stop.bookingCount}
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

export default StopAnalytics;