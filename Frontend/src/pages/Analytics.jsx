import React, { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiArrowUp,
  FiArrowDown,
  FiUsers,
  FiCalendar,
  FiBell,
  FiTruck,
  FiActivity,
  FiMap,
  FiDollarSign,
  FiRefreshCw,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
} from "react-icons/fi";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

const StatCard = ({ title, value, icon, change, changeType, color }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {changeType === 'increase' ? (
                <FiArrowUp className="text-green-500 mr-1" />
              ) : (
                <FiArrowDown className="text-red-500 mr-1" />
              )}
              <span
                className={`text-sm ${
                  changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {change}% from last month
              </span>
            </div>
          )}
        </div>
        <div
          className={`h-12 w-12 rounded-full flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: { total: 0, change: 5.2, changeType: 'increase' },
    bookings: { total: 0, change: 12.5, changeType: 'increase' },
    revenue: { total: 0, change: 8.7, changeType: 'increase' },
    routes: { total: 0, change: 2.3, changeType: 'increase' },
    notices: { total: 0, change: 14.2, changeType: 'increase' },
    buses: { total: 0, change: 3.1, changeType: 'increase' },
  });
  const [noticeStats, setNoticeStats] = useState({
    categoryStats: [],
    importanceStats: [],
    statusCounts: { active: 0, expired: 0, inactive: 0 },
    mostViewed: [],
    noticesByMonth: []
  });
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    bookingsByDay: [],
    topRoutes: []
  });
  const [periodFilter, setPeriodFilter] = useState("month");

  const API_URI = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchData();
  }, [periodFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch statistics from various endpoints
      const [dashboardResponse, noticeResponse] = await Promise.all([
        axios.get(`${API_URI}/api/dashboard?period=${periodFilter}`, {
          withCredentials: true,
        }),
        axios.get(`${API_URI}/api/notices/stats`, {
          withCredentials: true,
        }),
      ]);

      if (dashboardResponse.data) {
        const dashData = dashboardResponse.data;
        
        // Update main statistics
        setStats({
          users: { 
            total: dashData.totalUsers || 0, 
            change: 5.2, 
            changeType: 'increase' 
          },
          bookings: { 
            total: dashData.totalBookings || 0, 
            change: 12.5, 
            changeType: 'increase' 
          },
          revenue: { 
            total: dashData.totalRevenue ? `₹${dashData.totalRevenue.toLocaleString()}` : '₹0', 
            change: 8.7, 
            changeType: 'increase' 
          },
          routes: { 
            total: dashData.routesCount || 0, 
            change: 2.3, 
            changeType: 'increase' 
          },
          notices: { 
            total: noticeResponse.data?.data?.total || 0, 
            change: 14.2, 
            changeType: 'increase' 
          },
          buses: { 
            total: dashData.fleetCount || 0, 
            change: 3.1, 
            changeType: 'increase' 
          },
        });

        // Update booking stats
        setBookingStats({
          totalBookings: dashData.totalBookings || 0,
          confirmedBookings: dashData.confirmedBookings || 0,
          cancelledBookings: dashData.cancelledBookings || 0,
          pendingBookings: dashData.pendingPayments || 0,
          totalRevenue: dashData.totalRevenue || 0,
          bookingsByDay: dashData.bookingsByDay || [],
          topRoutes: dashData.topRoutes || []
        });
      }

      if (noticeResponse.data && noticeResponse.data.data) {
        const noticeData = noticeResponse.data.data;
        setNoticeStats({
          categoryStats: noticeData.categoryStats || [],
          importanceStats: noticeData.importanceStats || [],
          statusCounts: noticeData.statusCounts || { active: 0, expired: 0, inactive: 0 },
          mostViewed: noticeData.mostViewed || [],
          noticesByMonth: noticeData.noticesByMonth || []
        });
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Chart data for notices by category
  const noticeCategoryChartData = {
    labels: noticeStats.categoryStats.map(item => 
      item._id === "service_change" ? "Service Change" : 
      item._id.charAt(0).toUpperCase() + item._id.slice(1)
    ),
    datasets: [
      {
        label: 'Notices by Category',
        data: noticeStats.categoryStats.map(item => item.count),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for notice status
  const noticeStatusChartData = {
    labels: ['Active', 'Expired', 'Inactive'],
    datasets: [
      {
        label: 'Notice Status',
        data: [
          noticeStats.statusCounts.active || 0,
          noticeStats.statusCounts.expired || 0,
          noticeStats.statusCounts.inactive || 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Format months for the chart
  const formatMonth = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
  };

  // Chart data for notices by month
  const noticesByMonthChartData = {
    labels: noticeStats.noticesByMonth.map(item => 
      `${formatMonth(item._id.month)} ${item._id.year}`
    ),
    datasets: [
      {
        label: 'Notices Published',
        data: noticeStats.noticesByMonth.map(item => item.count),
        fill: false,
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 2,
        tension: 0.1
      },
    ],
  };

  // Chart data for bookings by day
  const bookingsByDayChartData = {
    labels: bookingStats.bookingsByDay?.map(item => item._id || 'N/A') || [],
    datasets: [
      {
        label: 'Number of Bookings',
        data: bookingStats.bookingsByDay?.map(item => item.count || 0) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  // Chart data for bookings status
  const bookingStatusChartData = {
    labels: ['Confirmed', 'Cancelled', 'Pending Payment'],
    datasets: [
      {
        label: 'Booking Status',
        data: [
          bookingStats.confirmedBookings || 0,
          bookingStats.cancelledBookings || 0,
          bookingStats.pendingBookings || 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart data for top routes
  const topRoutesChartData = {
    labels: bookingStats.topRoutes?.map(route => route._id || 'Unknown') || [],
    datasets: [
      {
        label: 'Bookings per Route',
        data: bookingStats.topRoutes?.map(route => route.count || 0) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Period:</label>
              <select
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <button
              onClick={fetchData}
              className="flex items-center px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <StatCard
                title="Total Users"
                value={stats.users.total}
                icon={<FiUsers className="text-white" size={24} />}
                change={stats.users.change}
                changeType={stats.users.changeType}
                color="bg-blue-500"
              />
              <StatCard
                title="Total Bookings"
                value={stats.bookings.total}
                icon={<FiCalendar className="text-white" size={24} />}
                change={stats.bookings.change}
                changeType={stats.bookings.changeType}
                color="bg-green-500"
              />
              <StatCard
                title="Total Revenue"
                value={stats.revenue.total}
                icon={<FiDollarSign className="text-white" size={24} />}
                change={stats.revenue.change}
                changeType={stats.revenue.changeType}
                color="bg-purple-500"
              />
              <StatCard
                title="Active Routes"
                value={stats.routes.total}
                icon={<FiMap className="text-white" size={24} />}
                change={stats.routes.change}
                changeType={stats.routes.changeType}
                color="bg-yellow-500"
              />
              <StatCard
                title="Notice Count"
                value={stats.notices.total}
                icon={<FiBell className="text-white" size={24} />}
                change={stats.notices.change}
                changeType={stats.notices.changeType}
                color="bg-red-500"
              />
              <StatCard
                title="Fleet Size"
                value={stats.buses.total}
                icon={<FiTruck className="text-white" size={24} />}
                change={stats.buses.change}
                changeType={stats.buses.changeType}
                color="bg-indigo-500"
              />
            </div>

            {/* Notices Analytics Section */}
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <FiBell className="mr-2" />
                Notice Analytics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FiPieChart className="mr-2" />
                    Notices by Category
                  </h3>
                  <div className="h-64">
                    <Pie data={noticeCategoryChartData} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FiActivity className="mr-2" />
                    Notice Status
                  </h3>
                  <div className="h-64">
                    <Pie data={noticeStatusChartData} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FiBarChart2 className="mr-2" />
                    Notices by Month
                  </h3>
                  <div className="h-64">
                    <Bar data={noticesByMonthChartData} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-3">
                  <h3 className="text-lg font-semibold mb-4">Most Viewed Notices</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Views
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Published
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {noticeStats.mostViewed.length > 0 ? (
                          noticeStats.mostViewed.map((notice, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {notice.title}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {notice.category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {notice.viewCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(notice.publishDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                              No data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Analytics Section */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <FiTrendingUp className="mr-2" />
                Booking Analytics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Booking Status</h3>
                  <div className="h-64">
                    <Pie data={bookingStatusChartData} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Top Routes</h3>
                  <div className="h-64">
                    <Bar data={topRoutesChartData} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Recent Booking Trends</h3>
                  <div className="h-64">
                    <Line data={bookingsByDayChartData} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <ToastContainer />
    </AdminLayout>
  );
};

export default Analytics;