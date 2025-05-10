import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "../layouts/AdminLayout";
import useAuthStore from "../store/authStore";
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
  FiRefreshCw,
  FiDownload,
  FiAlertTriangle,
  FiAlertCircle,
  FiBell,
  FiFileText,
  FiCheck,
  FiFilter,
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../components/Loader";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

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
  const [refreshing, setRefreshing] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("month");
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const dashboardRef = useRef(null);
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
      revenue: {
        total: 0,
        byBus: [],
        change: 0,
        changeType: "increase",
      },
      seats: {
        total: 0,
        booked: 0,
        available: 0,
        reserved: 0,
        occupancyRate: "0%",
      },
      fleet: { buses: 0, routes: 0, schedules: 0, operators: 0 },
      notifications: 0,
      notices: { total: 0, active: 0, expired: 0 },
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

  console.log("Using API URL:", API_URL); // Log the API URL being used

  const fetchDashboardData = async (period = periodFilter) => {
    try {
      setRefreshing(true);
      console.log(`Fetching dashboard data for period: ${period}...`);

      // Fetch all dashboard data with the period filter
      const [statsResponse, healthResponse, noticeStatsResponse] =
        await Promise.all([
          axios.get(`${API_URL}/api/dashboard?period=${period}`, {
            withCredentials: true,
          }),
          axios.get(`${API_URL}/api/dashboard/health`, {
            withCredentials: true,
          }),
          axios.get(`${API_URL}/api/notices/stats`, {
            withCredentials: true,
          }),
        ]);

      console.log("Dashboard data received:", statsResponse.data);
      console.log("System health data received:", healthResponse.data);
      console.log("Notice stats received:", noticeStatsResponse.data);

      // Map the API response to our dashboard data structure
      const apiData = statsResponse.data;

      // Extract notice stats from the response
      const noticeStats = noticeStatsResponse.data.data || {};
      const noticeStatusCounts = noticeStats.statusCounts || {
        active: 0,
        expired: 0,
        inactive: 0,
      };

      const mappedData = {
        summary: {
          users: {
            total: apiData.totalUsers || 0,
            active: 0, // Not provided in API response
            new: apiData.newUsers || 0,
          },
          bookings: {
            total: apiData.totalBookings || 0,
            confirmed: apiData.confirmedBookings || 0,
            cancelled: apiData.cancelledBookings || 0,
            pendingPayment: apiData.pendingPayments || 0,
            cancellationRate:
              (
                ((apiData.cancelledBookings || 0) /
                  (apiData.totalBookings || 1)) *
                100
              ).toFixed(2) + "%",
          },
          revenue: {
            total: apiData.totalRevenue || 0,
            byBus: apiData.revenueByBus || [],
            change: 0, // Not provided in API response
            changeType: "increase",
          },
          seats: {
            total: apiData.seatStats?.total || 0,
            booked: apiData.seatStats?.booked || 0,
            available: apiData.seatStats?.available || 0,
            reserved: apiData.seatStats?.reserved || 0,
            occupancyRate: apiData.seatStats?.occupancyRate || "0%",
          },
          fleet: {
            buses: apiData.fleetCount || 0,
            routes: apiData.routesCount || 0,
            schedules: apiData.schedulesCount || 0, // Now provided from API
            operators: apiData.operatorsCount || 0, // Now provided from API
          },
          notifications: 0,
          notices: {
            total: noticeStats.total || 0,
            active: noticeStatusCounts.active || 0,
            expired: noticeStatusCounts.expired || 0,
            inactive: noticeStatusCounts.inactive || 0,
          },
        },
        charts: {
          bookingsByDay: apiData.bookingsByDay || [],
          revenueByBus: apiData.revenueByBus || [],
          topRoutes: apiData.topRoutes || [],
          busUtilization: [],
        },
        recentData: {
          bookings: apiData.recentBookings || [], // Now provided from API
          schedules: apiData.recentSchedules || [], // Now provided from API
        },
      };

      setDashboardData(mappedData);
      setSystemHealth(healthResponse.data);
      if (!loading) toast.success("Dashboard data refreshed!");
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // More detailed error logging
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        toast.error(
          `API Error: ${error.response.status} - ${error.response.data.message || "Unknown error"}`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        toast.error("No response from server. Check if backend is running.");
      } else {
        console.error("Error details:", error.message);
        toast.error(`Request error: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return <Navigate to="/login" replace />;
    }

    fetchDashboardData();

    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 300000); // 5 minutes in milliseconds

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, user, API_URL]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handlePeriodChange = (period) => {
    setPeriodFilter(period);
    fetchDashboardData(period);
    setShowPeriodPicker(false);
  };

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      toast.info("Preparing PDF export...");

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 1,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      pdf.setFontSize(18);
      pdf.text("GoSync Admin Dashboard Report", pdfWidth / 2, 10, {
        align: "center",
      });
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pdfWidth / 2, 18, {
        align: "center",
      });
      pdf.text(`Period: ${periodFilter}`, pdfWidth / 2, 25, {
        align: "center",
      });

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        30,
        imgWidth * ratio,
        imgHeight * ratio
      );

      pdf.save(
        `gosync-dashboard-${new Date().toISOString().split("T")[0]}.pdf`
      );
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  const exportToExcel = () => {
    try {
      toast.info("Preparing Excel export...");

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["GoSync Dashboard Summary", ""],
        ["Generated", new Date().toLocaleString()],
        ["Period", periodFilter],
        ["", ""],
        ["Users", ""],
        ["Total Users", dashboardData?.summary?.users?.total || 0],
        ["New Users", dashboardData?.summary?.users?.new || 0],
        ["", ""],
        ["Bookings", ""],
        ["Total Bookings", dashboardData?.summary?.bookings?.total || 0],
        [
          "Confirmed Bookings",
          dashboardData?.summary?.bookings?.confirmed || 0,
        ],
        [
          "Cancelled Bookings",
          dashboardData?.summary?.bookings?.cancelled || 0,
        ],
        [
          "Cancellation Rate",
          dashboardData?.summary?.bookings?.cancellationRate || "0%",
        ],
        ["", ""],
        ["Revenue", ""],
        [
          "Total Revenue",
          `Rs. ${(dashboardData?.summary?.revenue?.total || 0).toLocaleString()}`,
        ],
        ["", ""],
        ["Seat Occupancy", ""],
        ["Total Seats", dashboardData?.summary?.seats?.total || 0],
        ["Booked Seats", dashboardData?.summary?.seats?.booked || 0],
        ["Available Seats", dashboardData?.summary?.seats?.available || 0],
        ["Reserved Seats", dashboardData?.summary?.seats?.reserved || 0],
        [
          "Occupancy Rate",
          dashboardData?.summary?.seats?.occupancyRate || "0%",
        ],
        ["", ""],
        ["Fleet", ""],
        ["Total Buses", dashboardData?.summary?.fleet?.buses || 0],
        ["Total Routes", dashboardData?.summary?.fleet?.routes || 0],
        ["Total Schedules", dashboardData?.summary?.fleet?.schedules || 0],
        ["Total Operators", dashboardData?.summary?.fleet?.operators || 0],
      ];

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

      // Revenue By Bus sheet
      const revenueHeaders = ["Bus Number", "Total Revenue (Rs)"];
      const revenueData = [revenueHeaders];
      dashboardData?.charts?.revenueByBus?.forEach((bus) => {
        revenueData.push([bus.busNumber, bus.totalRevenue]);
      });
      const revenueWs = XLSX.utils.aoa_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(wb, revenueWs, "Revenue By Bus");

      // Top Routes sheet
      const routesHeaders = ["Route", "Number of Bookings"];
      const routesData = [routesHeaders];
      dashboardData?.charts?.topRoutes?.forEach((route) => {
        routesData.push([route._id, route.count]);
      });
      const routesWs = XLSX.utils.aoa_to_sheet(routesData);
      XLSX.utils.book_append_sheet(wb, routesWs, "Top Routes");

      // Bookings By Day sheet
      const bookingsHeaders = ["Date", "Number of Bookings"];
      const bookingsData = [bookingsHeaders];
      dashboardData?.charts?.bookingsByDay?.forEach((day) => {
        bookingsData.push([day._id, day.count]);
      });
      const bookingsWs = XLSX.utils.aoa_to_sheet(bookingsData);
      XLSX.utils.book_append_sheet(wb, bookingsWs, "Daily Bookings");

      // Recent Bookings sheet
      if (dashboardData?.recentData?.bookings?.length > 0) {
        const bookingListHeaders = [
          "Booking ID",
          "Passenger",
          "Route",
          "Seats",
          "Status",
          "Amount",
        ];
        const bookingListData = [bookingListHeaders];
        dashboardData?.recentData?.bookings?.forEach((booking) => {
          bookingListData.push([
            booking.bookingId,
            booking.userId?.name || "N/A",
            `${booking.from || "N/A"} to ${booking.to || "N/A"}`,
            booking.seatNumbers?.join(", ") || "N/A",
            booking.status || "N/A",
            `Rs. ${booking.fareTotal || 0}`,
          ]);
        });
        const bookingListWs = XLSX.utils.aoa_to_sheet(bookingListData);
        XLSX.utils.book_append_sheet(wb, bookingListWs, "Recent Bookings");
      }

      XLSX.writeFile(
        wb,
        `gosync-dashboard-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel file");
    }
  };

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
      <div ref={dashboardRef}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold mr-4">
                Welcome, {user.name}
              </h1>
              {systemHealth.status === "operational" ? (
                <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
                  <FiCheck className="mr-1" /> System Operational
                </span>
              ) : (
                <span className="text-sm px-2 py-1 bg-red-100 text-red-800 rounded-full flex items-center">
                  <FiAlertCircle className="mr-1" /> System Issue
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Period filter dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodPicker(!showPeriodPicker)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                <FiFilter className="mr-2" />
                {periodFilter === "day" && "Today"}
                {periodFilter === "week" && "This Week"}
                {periodFilter === "month" && "This Month"}
                {periodFilter === "year" && "This Year"}
              </button>

              {showPeriodPicker && (
                <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button
                      onClick={() => handlePeriodChange("day")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => handlePeriodChange("week")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => handlePeriodChange("month")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => handlePeriodChange("year")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      This Year
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center px-3 py-2 text-sm font-medium text-white ${refreshing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} rounded`}
            >
              <FiRefreshCw
                className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>

            <div className="relative inline-block">
              <button
                onClick={exportToPDF}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600"
              >
                <FiDownload className="mr-2" />
                Export PDF
              </button>
            </div>

            <div className="relative inline-block">
              <button
                onClick={exportToExcel}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
              >
                <FiDownload className="mr-2" />
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Header with Title */}
        <div className="flex items-center justify-center mb-6 bg-gradient-to-r from-[#FFE082]  to-[#FFC107] text-black p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <FiUsers className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-xl font-bold">
                  {dashboardData?.summary?.users?.total || 0}
                </p>
                <p className="text-sm text-green-500 flex items-center">
                  <FiRefreshCw className="mr-1" />
                  {dashboardData?.summary?.users?.new || 0} new this period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500">
                <FiDollarSign className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">
                  Total Revenue
                </p>
                <p className="text-xl font-bold">
                  Rs.{" "}
                  {(
                    dashboardData?.summary?.revenue?.total || 0
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                <FiCalendar className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Bookings</p>
                <p className="text-xl font-bold">
                  {dashboardData?.summary?.bookings?.confirmed || 0}
                </p>
                <p className="text-sm text-gray-500">
                  Cancellation:{" "}
                  {dashboardData?.summary?.bookings?.cancellationRate || "0%"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500">
                <FiTruck className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">
                  Seat Occupancy
                </p>
                <p className="text-xl font-bold">
                  {dashboardData?.summary?.seats?.occupancyRate}
                </p>
                <p className="text-sm text-gray-500">
                  {dashboardData?.summary?.seats?.booked}/
                  {dashboardData?.summary?.seats?.total} seats booked
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg transform hover:scale-105">
            <div className="text-blue-600 mb-2">
              <FiTruck className="w-10 h-10" />
            </div>
            <p className="text-2xl font-bold">
              {dashboardData?.summary?.fleet?.buses}
            </p>
            <p className="text-sm text-gray-600">Buses</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-4 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg transform hover:scale-105">
            <div className="text-green-600 mb-2">
              <FiMapPin className="w-10 h-10" />
            </div>
            <p className="text-2xl font-bold">
              {dashboardData?.summary?.fleet?.routes}
            </p>
            <p className="text-sm text-gray-600">Routes</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg transform hover:scale-105">
            <div className="text-purple-600 mb-2">
              <FiClock className="w-10 h-10" />
            </div>
            <p className="text-2xl font-bold">
              {dashboardData?.summary?.fleet?.schedules}
            </p>
            <p className="text-sm text-gray-600">Schedules</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow p-4 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg transform hover:scale-105">
            <div className="text-amber-600 mb-2">
              <FiActivity className="w-10 h-10" />
            </div>
            <p className="text-2xl font-bold">
              {dashboardData?.summary?.fleet?.operators}
            </p>
            <p className="text-sm text-gray-600">Operators</p>
          </div>
        </div>

        {/* Notice & Payment Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center mb-2">
              <FiAlertCircle className="text-amber-600 w-6 h-6 mr-2" />
              <h2 className="text-lg font-semibold">Notice Status</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center">
                <p className="text-xl font-bold text-amber-600">
                  {dashboardData?.summary?.notices?.total || 0}
                </p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center">
                <p className="text-xl font-bold text-green-600">
                  {dashboardData?.summary?.notices?.active || 0}
                </p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center">
                <p className="text-xl font-bold text-red-600">
                  {dashboardData?.summary?.notices?.expired || 0}
                </p>
                <p className="text-xs text-gray-500">Expired</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center mb-2">
              <FiDollarSign className="text-blue-600 w-6 h-6 mr-2" />
              <h2 className="text-lg font-semibold">Payment Status</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center">
                <p className="text-xl font-bold text-blue-600">
                  {dashboardData?.summary?.bookings?.total || 0}
                </p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center">
                <p className="text-xl font-bold text-green-600">
                  {dashboardData?.summary?.bookings?.confirmed || 0}
                </p>
                <p className="text-xs text-gray-500">Paid</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center justify-center">
                <p className="text-xl font-bold text-orange-600">
                  {dashboardData?.summary?.bookings?.pendingPayment || 0}
                </p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Revenue by Bus</h2>
            {dashboardData?.charts?.revenueByBus?.length > 0 ? (
              <div className="h-80">
                <Bar
                  data={{
                    labels: dashboardData?.charts?.revenueByBus?.map(
                      (item) => item.busNumber
                    ),
                    datasets: [
                      {
                        label: "Revenue (Rs)",
                        data: dashboardData?.charts?.revenueByBus?.map(
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
            {dashboardData?.charts?.bookingsByDay?.length > 0 ? (
              <div className="h-80">
                <Line
                  data={{
                    labels: dashboardData?.charts?.bookingsByDay?.map(
                      (item) => item._id
                    ),
                    datasets: [
                      {
                        label: "Bookings",
                        data: dashboardData?.charts?.bookingsByDay?.map(
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
            {dashboardData?.charts?.topRoutes?.length > 0 ? (
              <div className="h-80 flex justify-center">
                <div className="w-80">
                  <Pie
                    data={{
                      labels: dashboardData?.charts?.topRoutes?.map(
                        (route) => route._id
                      ),
                      datasets: [
                        {
                          data: dashboardData?.charts?.topRoutes?.map(
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
                          dashboardData?.summary?.seats?.booked,
                          dashboardData?.summary?.seats?.available,
                          dashboardData?.summary?.seats?.reserved,
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
            {dashboardData?.recentData?.bookings?.length > 0 ? (
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
                    {dashboardData?.recentData?.bookings?.map((booking) => (
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
            {dashboardData?.recentData?.schedules?.length > 0 ? (
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
                    {dashboardData?.recentData?.schedules?.map(
                      (schedule, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {schedule.busId?.busNumber} (
                            {schedule.busId?.busType})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {schedule.routeId?.startLocation} to{" "}
                            {schedule.routeId?.endLocation}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(
                              schedule.departureDate
                            ).toLocaleDateString()}{" "}
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
                      )
                    )}
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
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AdminLayout>
  );
};

export default AdminDashboard;
