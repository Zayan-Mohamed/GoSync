import AdminLayout from "../layouts/AdminLayout";
import useAuthStore from "../store/authStore";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  RadialLinearScale,
} from "chart.js";
import {
  FiUsers,
  FiTruck,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiActivity,
} from "react-icons/fi";
import Loader from "../components/Loader";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  RadialLinearScale
);

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({ status: "loading" });
  const [dashboardData, setDashboardData] = useState({
    summary: {
      users: { total: 0, active: 0, new: 0 },
      bookings: {
        total: 0,
        confirmed: 0,
        cancelled: 0,
        pendingPayment: 0,
        cancellationRate: "0%",
      },
      revenue: { total: 0, byBus: [] },
      seats: {
        total: 0,
        booked: 0,
        available: 0,
        reserved: 0,
        occupancyRate: "0%",
      },
      fleet: { buses: 0, routes: 0, schedules: 0, operators: 0 },
      notifications: 0,
    },
    charts: {
      bookingsByDay: [],
      revenueByBus: [],
      topRoutes: [],
      busUtilization: [],
    },
    recentData: {
      bookings: [],
      schedules: [],
    },
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return <Navigate to="/login" replace />;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all dashboard data from the new consolidated endpoint
        const [statsResponse, healthResponse] = await Promise.all([
          axios.get(`${API_URL}/api/dashboard/stats`, {
            withCredentials: true,
          }),
          axios.get(`${API_URL}/api/dashboard/health`, {
            withCredentials: true,
          }),
        ]);

        setDashboardData(statsResponse.data);
        setSystemHealth(healthResponse.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user, API_URL]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      </div>
      <div className="flex items-center justify-center mb-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500">
              <FiUsers className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Total Users</p>
              <p className="text-xl font-bold">
                {dashboardData.summary.users.total}
              </p>
              <p className="text-sm text-green-500">
                {dashboardData.summary.users.new} new this week
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500">
              <FiDollarSign className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
              <p className="text-xl font-bold">
                Rs. {dashboardData.summary.revenue.total.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-500">
              <FiCalendar className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Bookings</p>
              <p className="text-xl font-bold">
                {dashboardData.summary.bookings.confirmed}
              </p>
              <p className="text-sm text-gray-500">
                Cancellation: {dashboardData.summary.bookings.cancellationRate}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500">
              <FiTruck className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">
                Seat Occupancy
              </p>
              <p className="text-xl font-bold">
                {dashboardData.summary.seats.occupancyRate}
              </p>
              <p className="text-sm text-gray-500">
                {dashboardData.summary.seats.booked}/
                {dashboardData.summary.seats.total} seats booked
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <div className="text-blue-600 mb-2">
            <FiTruck className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold">
            {dashboardData.summary.fleet.buses}
          </p>
          <p className="text-sm text-gray-600">Buses</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <div className="text-green-600 mb-2">
            <FiMapPin className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold">
            {dashboardData.summary.fleet.routes}
          </p>
          <p className="text-sm text-gray-600">Routes</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <div className="text-purple-600 mb-2">
            <FiClock className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold">
            {dashboardData.summary.fleet.schedules}
          </p>
          <p className="text-sm text-gray-600">Schedules</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <div className="text-amber-600 mb-2">
            <FiActivity className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold">
            {dashboardData.summary.fleet.operators}
          </p>
          <p className="text-sm text-gray-600">Operators</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Revenue by Bus</h2>
          {dashboardData.charts.revenueByBus.length > 0 ? (
            <div className="h-80">
              <Bar
                data={{
                  labels: dashboardData.charts.revenueByBus.map(
                    (item) => item.busNumber
                  ),
                  datasets: [
                    {
                      label: "Revenue (Rs)",
                      data: dashboardData.charts.revenueByBus.map(
                        (item) => item.totalRevenue
                      ),
                      backgroundColor: "#4F46E5",
                      borderColor: "#4338CA",
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: false,
                    },
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Revenue (Rs)",
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: "Bus Number",
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center h-80 text-gray-500">
              No revenue data available
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Booking Trends</h2>
          {dashboardData.charts.bookingsByDay.length > 0 ? (
            <div className="h-80">
              <Line
                data={{
                  labels: dashboardData.charts.bookingsByDay.map(
                    (item) => item._id
                  ),
                  datasets: [
                    {
                      label: "Bookings",
                      data: dashboardData.charts.bookingsByDay.map(
                        (item) => item.count
                      ),
                      fill: false,
                      borderColor: "#10B981",
                      tension: 0.1,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Number of Bookings",
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: "Date",
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center h-80 text-gray-500">
              No booking trend data available
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Popular Routes</h2>
          {dashboardData.charts.topRoutes.length > 0 ? (
            <div className="h-80 flex justify-center">
              <div className="w-80">
                <Pie
                  data={{
                    labels: dashboardData.charts.topRoutes.map(
                      (route) => route._id
                    ),
                    datasets: [
                      {
                        data: dashboardData.charts.topRoutes.map(
                          (route) => route.count
                        ),
                        backgroundColor: [
                          "#FF6384",
                          "#36A2EB",
                          "#FFCE56",
                          "#4BC0C0",
                          "#9966FF",
                        ],
                        hoverBackgroundColor: [
                          "#FF6384",
                          "#36A2EB",
                          "#FFCE56",
                          "#4BC0C0",
                          "#9966FF",
                        ],
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right",
                      },
                    },
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-80 text-gray-500">
              No route data available
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Seat Allocation</h2>
          <div className="h-80 flex justify-center">
            <div className="w-80">
              <Pie
                data={{
                  labels: ["Booked", "Available", "Reserved"],
                  datasets: [
                    {
                      data: [
                        dashboardData.summary.seats.booked,
                        dashboardData.summary.seats.available,
                        dashboardData.summary.seats.reserved,
                      ],
                      backgroundColor: ["#EF4444", "#10B981", "#F59E0B"],
                      hoverBackgroundColor: ["#DC2626", "#059669", "#D97706"],
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
          {dashboardData.recentData.bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Passenger
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentData.bookings.map((booking) => (
                    <tr key={booking.bookingId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.bookingId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.userId?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.from} to {booking.to}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.seatNumbers?.join(", ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Rs. {booking.fareTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No recent bookings
            </div>
          )}
        </div>

        {/* Recent Schedules */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Schedules</h2>
          {dashboardData.recentData.schedules.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentData.schedules.map((schedule, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {schedule.busId?.busNumber} ({schedule.busId?.busType})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.routeId?.startLocation} to{" "}
                        {schedule.routeId?.endLocation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(schedule.departureDate).toLocaleDateString()}{" "}
                        {schedule.departureTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            new Date(schedule.departureDate) > new Date()
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {new Date(schedule.departureDate) > new Date()
                            ? "Upcoming"
                            : "Past"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No recent schedules
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
