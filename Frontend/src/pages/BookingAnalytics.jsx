import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
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
  Filler,
} from "chart.js";
import GoSyncLoader from "../components/Loader";
import API from "../services/authService";
import {
  Download,
  RefreshCw,
  Filter,
  Calendar,
  X,
  DollarSign,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  FilePlus,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Register all required Chart.js components including the Filler plugin
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
  Filler
);

const BookingAnalytics = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [analytics, setAnalytics] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [filter, setFilter] = useState({
    busId: "",
    routeId: "",
    startDate: "",
    endDate: "",
    paymentStatus: "",
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [showDetails, setShowDetails] = useState({
    paymentMethods: false,
    bookingsByHour: false,
    recentBookings: false,
  });
  const analyticsRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, busesRes, routesRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/booking-analytics`, {
            params: filter,
            withCredentials: true,
          }),
          axios.get(`${API_URL}/api/buses/buses`, { withCredentials: true }),
          axios.get(`${API_URL}/api/routes/routes`, { withCredentials: true }),
        ]);
        setAnalytics(analyticsRes.data);
        setBuses(busesRes.data);
        // Make sure routes is an array before setting state
        setRoutes(
          Array.isArray(routesRes.data.routes) ? routesRes.data.routes : []
        );
        toast.success("Analytics data refreshed successfully");
        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch analytics");
        setLoading(false);
      }
    };
    fetchData();
  }, [filter, API_URL]);

  // Fetch comparison data when period changes
  useEffect(() => {
    if (!comparisonPeriod || !filter.startDate || !filter.endDate) return;

    const fetchComparisonData = async () => {
      try {
        // Calculate comparison date range
        const startDate = new Date(filter.startDate);
        const endDate = new Date(filter.endDate);
        const diffDays =
          Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        let compStartDate = new Date(startDate);
        let compEndDate = new Date(endDate);

        if (comparisonPeriod === "previous") {
          compStartDate.setDate(compStartDate.getDate() - diffDays);
          compEndDate.setDate(endDate.getDate() - diffDays);
        } else if (comparisonPeriod === "lastYear") {
          compStartDate.setFullYear(compStartDate.getFullYear() - 1);
          compEndDate.setFullYear(compEndDate.getFullYear() - 1);
        }

        const compFilter = {
          ...filter,
          startDate: compStartDate.toISOString().split("T")[0],
          endDate: compEndDate.toISOString().split("T")[0],
        };

        const response = await axios.get(
          `${API_URL}/api/admin/booking-analytics`,
          { params: compFilter, withCredentials: true }
        );
        setComparisonData(response.data);
        toast.success("Comparison data loaded");
      } catch (err) {
        toast.error(err.message || "Failed to fetch comparison data");
        setComparisonData(null);
      }
    };

    fetchComparisonData();
  }, [comparisonPeriod, filter, API_URL]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
    // Set loading only when user clicks apply rather than on every change
  };

  const applyFilters = () => {
    setLoading(true);
    // Clear comparison data when applying new filters
    setComparisonPeriod(null);
    setComparisonData(null);
  };

  const handleDateRangeSelect = (range) => {
    const today = new Date();
    let startDate = new Date();

    switch (range) {
      case "today":
        startDate = new Date(today);
        break;
      case "yesterday":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case "week":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "quarter":
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "year":
        startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        break;
    }

    setFilter({
      ...filter,
      startDate: startDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    });
    // Don't set loading here, wait for apply button
  };

  const clearFilters = () => {
    setFilter({
      busId: "",
      routeId: "",
      startDate: "",
      endDate: "",
      paymentStatus: "",
    });
    setComparisonPeriod(null);
    setComparisonData(null);
    setLoading(true);
  };

  const handleExportPDF = async () => {
    if (!analyticsRef.current) return;
    if (!analytics) {
      toast.error("No analytics data available to export");
      return;
    }

    try {
      toast.info("Preparing PDF export...");
      const canvas = await html2canvas(analyticsRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.setFontSize(18);
      pdf.text("GoSync Booking Analytics Report", pdfWidth / 2, 15, {
        align: "center",
      });
      pdf.setFontSize(12);

      // Add filter information
      let filterText = `Period: ${filter.startDate || "All time"} to ${filter.endDate || "Present"}`;
      if (filter.busId) {
        const selectedBus = buses.find((b) => b._id === filter.busId);
        filterText += ` | Bus: ${selectedBus ? selectedBus.busNumber : filter.busId}`;
      }
      if (filter.routeId) {
        const selectedRoute = routes.find((r) => r._id === filter.routeId);
        filterText += ` | Route: ${selectedRoute ? `${selectedRoute.startLocation} to ${selectedRoute.endLocation}` : filter.routeId}`;
      }

      pdf.text(filterText, pdfWidth / 2, 22, { align: "center" });
      const dateText = `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      pdf.text(dateText, pdfWidth / 2, 29, { align: "center" });

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      // Add a table with summary data, with fallback values
      autoTable(pdf, {
        startY: imgY + imgHeight * ratio + 10,
        head: [["Metric", "Value"]],
        body: [
          ["Total Bookings", analytics.totalBookings ?? 0],
          ["Confirmed Bookings", analytics.confirmedBookings ?? 0],
          ["Cancelled Bookings", analytics.cancelledBookings ?? 0],
          ["Cancellation Rate", analytics.cancellationRate ?? "0%"],
          [
            "Total Revenue",
            `Rs. ${(analytics.totalRevenue ?? 0).toLocaleString()}`,
          ],
          [
            "Average Booking Value",
            `Rs. ${(analytics.avgBookingValue ?? 0).toLocaleString()}`,
          ],
        ],
      });

      pdf.save("gosync-booking-analytics.pdf");

      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleExportExcel = () => {
    if (!analytics) return;

    try {
      toast.info("Preparing Excel export...");

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ["GoSync Booking Analytics Report", ""],
        [
          `Period: ${filter.startDate || "All time"} to ${filter.endDate || "Present"}`,
          "",
        ],
        [
          `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          "",
        ],
        ["", ""],
        ["Key Metrics", "Value"],
        ["Total Bookings", analytics.totalBookings ?? 0],
        ["Confirmed Bookings", analytics.confirmedBookings ?? 0],
        ["Cancelled Bookings", analytics.cancelledBookings ?? 0],
        ["Cancellation Rate", analytics.cancellationRate ?? "0%"],
        [
          "Total Revenue",
          `Rs. ${(analytics.totalRevenue ?? 0).toLocaleString()}`,
        ],
        [
          "Average Booking Value",
          `Rs. ${(analytics.avgBookingValue ?? 0).toLocaleString()}`,
        ],
      ];

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

      // Routes Sheet
      const routesHeaders = ["Route", "Bookings", "% of Total"];
      const routesData = [routesHeaders];

      (analytics.topRoutes ?? []).forEach((route) => {
        const percentage = (
          (route.count / (analytics.totalBookings ?? 1)) *
          100
        ).toFixed(1);
        routesData.push([route._id, route.count, `${percentage}%`]);
      });

      const routesWs = XLSX.utils.aoa_to_sheet(routesData);
      XLSX.utils.book_append_sheet(wb, routesWs, "Routes");

      // Buses Sheet
      const busesHeaders = ["Bus Number", "Revenue", "Bookings"];
      const busesData = [busesHeaders];

      (analytics.revenueByBus ?? []).forEach((bus) => {
        busesData.push([
          bus.busNumber,
          bus.totalRevenue ?? 0,
          bus.bookingCount ?? 0,
        ]);
      });

      const busesWs = XLSX.utils.aoa_to_sheet(busesData);
      XLSX.utils.book_append_sheet(wb, busesWs, "Buses");

      // Daily bookings Sheet
      const dailyHeaders = ["Date", "Bookings"];
      const dailyData = [dailyHeaders];

      (analytics.bookingsByDay ?? []).forEach((day) => {
        dailyData.push([day._id, day.count]);
      });

      const dailyWs = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Bookings");

      // Export file
      XLSX.writeFile(wb, "gosync-booking-analytics.xlsx");
      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel file");
    }
  };

  const toggleDetails = (section) => {
    setShowDetails((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="p-6">
          <GoSyncLoader />
        </div>
      </AdminLayout>
    );
  if (!analytics)
    return (
      <AdminLayout>
        <div className="p-6">No data available</div>
      </AdminLayout>
    );

  // Calculate percentage changes for comparison
  const calculateChange = (current, previous) => {
    if (!previous) return { value: 0, percentage: "0%" };
    const diff = current - previous;
    const percentage =
      previous !== 0 ? ((diff / previous) * 100).toFixed(1) : 0;
    return {
      value: diff,
      percentage: `${percentage}%`,
      isPositive: diff >= 0,
    };
  };

  const comparisonStats = comparisonData
    ? {
        bookings: calculateChange(
          analytics.totalBookings ?? 0,
          comparisonData.totalBookings ?? 0
        ),
        revenue: calculateChange(
          analytics.totalRevenue ?? 0,
          comparisonData.totalRevenue ?? 0
        ),
        cancellations: calculateChange(
          analytics.cancelledBookings ?? 0,
          comparisonData.cancelledBookings ?? 0
        ),
      }
    : null;

  const revenueBarData = {
    labels: (analytics.revenueByBus ?? []).length
      ? analytics.revenueByBus.map((b) => b.busNumber)
      : ["No Data"],
    datasets: [
      {
        label: "Revenue (Rs.)",
        data: (analytics.revenueByBus ?? []).length
          ? analytics.revenueByBus.map((b) => b.totalRevenue ?? 0)
          : [0],
        backgroundColor: "#36A2EB",
      },
      {
        label: "Bookings",
        data: (analytics.revenueByBus ?? []).length
          ? analytics.revenueByBus.map((b) => b.bookingCount ?? 0)
          : [0],
        backgroundColor: "#FF9F40",
        type: "line",
        borderColor: "#FF9F40",
        borderWidth: 2,
        fill: false,
        yAxisID: "bookings",
      },
    ],
  };

  const bookingsLineData = {
    labels: (analytics.bookingsByDay ?? []).length
      ? analytics.bookingsByDay.map((d) => d._id)
      : ["No Data"],
    datasets: [
      {
        label: "Bookings",
        data: (analytics.bookingsByDay ?? []).length
          ? analytics.bookingsByDay.map((d) => d.count)
          : [0],
        fill: true,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "#FF6384",
        tension: 0.4,
      },
      ...(comparisonData?.bookingsByDay?.length
        ? [
            {
              label: `Bookings (${comparisonPeriod === "previous" ? "Previous Period" : "Last Year"})`,
              data: comparisonData.bookingsByDay.map((d) => d.count),
              fill: false,
              borderColor: "#4BC0C0",
              borderDash: [5, 5],
              tension: 0.4,
            },
          ]
        : []),
    ],
  };

  const routesPieData = {
    labels: (analytics.topRoutes ?? []).length
      ? analytics.topRoutes.map((r) => r._id)
      : ["No Data"],
    datasets: [
      {
        data: (analytics.topRoutes ?? []).length
          ? analytics.topRoutes.map((r) => r.count)
          : [0],
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
        hoverBackgroundColor: [
          "#FF4567",
          "#2490D9",
          "#EDBC45",
          "#3BA9A9",
          "#8855EE",
        ],
      },
    ],
  };

  const paymentMethodsData = {
    labels: (analytics.paymentMethods ?? []).map((p) => p._id) || ["No Data"],
    datasets: [
      {
        data: (analytics.paymentMethods ?? []).map((p) => p.count) || [0],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
      },
    ],
  };

  const bookingsByHourData = {
    labels:
      (analytics.bookingsByHour ?? []).map((h) => `${h._id}:00`) ||
      Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: "Bookings",
        data:
          (analytics.bookingsByHour ?? []).map((h) => h.count) ||
          Array(24).fill(0),
        backgroundColor: "#36A2EB",
      },
    ],
  };

  return (
    <AdminLayout>
      <div className="p-3 max-w-[1600px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b pb-3">
          <h2 className="text-xl font-semibold flex items-center">
            <FileText className="mr-1 text-blue-500" size={20} />
            Booking Analytics Dashboard
          </h2>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-2 py-1 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
            >
              <Filter size={14} className="mr-1" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={() => {
                setLoading(true);
                setFilter(filter); // Trigger re-fetch
              }}
              className="flex items-center px-2 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
            >
              <RefreshCw size={14} className="mr-1" /> Refresh
            </button>
            <div className="relative group">
              <button className="flex items-center px-2 py-1 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors">
                <Download size={14} className="mr-1" /> Export
              </button>
              <div className="absolute right-0 z-10 hidden w-40 mt-1 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg group-hover:block">
                <button
                  onClick={handleExportPDF}
                  className="block w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 text-left transition-colors"
                >
                  Export as PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  className="block w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 text-left transition-colors"
                >
                  Export as Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section - More compact */}
        {showFilters && (
          <div className="mb-4 p-3 bg-gray-50 border rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-2 pb-1 border-b">
              Filter Analytics Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Bus
                </label>
                <select
                  name="busId"
                  value={filter.busId}
                  onChange={handleFilterChange}
                  className="p-1 text-sm border rounded w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Buses</option>
                  {buses.map((bus) => (
                    <option key={bus._id} value={bus._id}>
                      {bus.busNumber} - {bus.travelName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Route
                </label>
                <select
                  name="routeId"
                  value={filter.routeId}
                  onChange={handleFilterChange}
                  className="p-1 text-sm border rounded w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Routes</option>
                  {routes.map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.startLocation} to {route.endLocation}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  value={filter.paymentStatus}
                  onChange={handleFilterChange}
                  className="p-1 text-sm border rounded w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filter.startDate}
                  onChange={handleFilterChange}
                  className="p-1 text-sm border rounded w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filter.endDate}
                  onChange={handleFilterChange}
                  className="p-1 text-sm border rounded w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {filter.startDate && filter.endDate && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Compare With
                  </label>
                  <select
                    value={comparisonPeriod || ""}
                    onChange={(e) =>
                      setComparisonPeriod(e.target.value || null)
                    }
                    className="p-1 text-sm border rounded w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Comparison</option>
                    <option value="previous">Previous Period</option>
                    <option value="lastYear">Same Period Last Year</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-between border-t pt-2 mt-2">
              <div className="flex gap-1 items-center">
                <span className="text-xs font-medium text-gray-700 flex items-center">
                  <Calendar size={12} className="mr-1" /> Quick:
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => handleDateRangeSelect("today")}
                    className="px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleDateRangeSelect("yesterday")}
                    className="px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => handleDateRangeSelect("week")}
                    className="px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => handleDateRangeSelect("month")}
                    className="px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    30 Days
                  </button>
                </div>
              </div>
              <div className="flex gap-1 mt-2 sm:mt-0">
                <button
                  onClick={applyFilters}
                  className="flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Apply
                </button>
                <button
                  onClick={clearFilters}
                  className="flex items-center px-2 py-1 text-xs font-medium text-white bg-gray-600 rounded hover:bg-gray-700"
                >
                  <X size={12} className="mr-1" /> Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Content - Made more compact */}
        <div id="analytics-section" ref={analyticsRef}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-white rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Total Bookings
                  </p>
                  <p className="text-xl font-bold text-blue-600 mt-0.5">
                    {(analytics.totalBookings ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.confirmedBookings ?? 0} confirmed,{" "}
                    {analytics.cancelledBookings ?? 0} cancelled
                  </p>
                </div>
                <div className="p-2 rounded-full bg-blue-100 h-fit">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              {comparisonStats && (
                <div
                  className={`mt-2 pt-2 border-t ${comparisonStats.bookings.isPositive ? "text-green-600" : "text-red-600"}`}
                >
                  <p className="text-xs font-medium flex items-center">
                    {comparisonStats.bookings.isPositive ? (
                      <ChevronUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ChevronDown className="h-3 w-3 mr-0.5" />
                    )}
                    {comparisonStats.bookings.percentage} (
                    {comparisonStats.bookings.value > 0 ? "+" : ""}
                    {comparisonStats.bookings.value})
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-white rounded-lg shadow border-l-4 border-green-500">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-xl font-bold text-green-600 mt-0.5">
                    Rs. {(analytics.totalRevenue ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg: Rs. {(analytics.avgBookingValue ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-green-100 h-fit">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </div>
              {comparisonStats && (
                <div
                  className={`mt-2 pt-2 border-t ${comparisonStats.revenue.isPositive ? "text-green-600" : "text-red-600"}`}
                >
                  <p className="text-xs font-medium flex items-center">
                    {comparisonStats.revenue.isPositive ? (
                      <ChevronUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ChevronDown className="h-3 w-3 mr-0.5" />
                    )}
                    {comparisonStats.revenue.percentage}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-white rounded-lg shadow border-l-4 border-red-500">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Cancellation Rate
                  </p>
                  <p className="text-xl font-bold text-red-600 mt-0.5">
                    {analytics.cancellationRate ?? "0%"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.cancelledBookings ?? 0} cancelled bookings
                  </p>
                </div>
                <div className="p-2 rounded-full bg-red-100 h-fit">
                  <X className="h-5 w-5 text-red-500" />
                </div>
              </div>
              {comparisonStats && (
                <div
                  className={`mt-2 pt-2 border-t ${!comparisonStats.cancellations.isPositive ? "text-green-600" : "text-red-600"}`}
                >
                  <p className="text-xs font-medium flex items-center">
                    {!comparisonStats.cancellations.isPositive ? (
                      <ChevronDown className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ChevronUp className="h-3 w-3 mr-0.5" />
                    )}
                    {comparisonStats.cancellations.percentage}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-white rounded-lg shadow border-l-4 border-purple-500">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    Avg. Booking Time
                  </p>
                  <p className="text-xl font-bold text-purple-600 mt-0.5">
                    {analytics.avgBookingTime ?? "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Before departure</p>
                </div>
                <div className="p-2 rounded-full bg-purple-100 h-fit">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts with reduced padding */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg shadow">
              <h3 className="text-sm font-medium mb-2 text-gray-700 flex items-center border-b pb-1">
                <DollarSign className="h-4 w-4 mr-1 text-blue-500" /> Revenue by
                Bus
              </h3>
              <div className="h-[250px]">
                <Bar
                  data={revenueBarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                        labels: { font: { size: 10 } },
                      },
                      title: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            if (context.dataset.label === "Revenue (Rs.)") {
                              return `Rs. ${context.parsed.y.toLocaleString()}`;
                            } else {
                              return `${context.parsed.y} bookings`;
                            }
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        position: "left",
                        title: {
                          display: true,
                          text: "Revenue (Rs.)",
                          font: { size: 10 },
                        },
                        ticks: {
                          callback: (value) => `Rs. ${value}`,
                          font: { size: 9 },
                        },
                      },
                      bookings: {
                        position: "right",
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Bookings",
                          font: { size: 10 },
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                        ticks: { font: { size: 9 } },
                      },
                      x: {
                        ticks: { font: { size: 9 } },
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow">
              <h3 className="text-sm font-medium mb-2 text-gray-700 flex items-center border-b pb-1">
                <FileText className="h-4 w-4 mr-1 text-blue-500" /> Bookings
                Over Time
              </h3>
              <div className="h-[250px]">
                <Line
                  data={bookingsLineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                        labels: { font: { size: 10 } },
                      },
                      title: { display: false },
                      tooltip: {
                        mode: "index",
                        intersect: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { precision: 0, font: { size: 9 } },
                      },
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                          font: { size: 8 },
                        },
                      },
                    },
                    interaction: {
                      mode: "index",
                      intersect: false,
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* More charts with reduced padding */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg shadow">
              <h3 className="text-sm font-medium mb-2 text-gray-700 flex items-center border-b pb-1">
                <Users className="h-4 w-4 mr-1 text-blue-500" /> Top Routes
              </h3>
              <div className="h-[250px] flex justify-center items-center">
                <div style={{ maxWidth: "300px", width: "100%" }}>
                  <Doughnut
                    data={routesPieData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "right",
                          labels: { font: { size: 9 } },
                        },
                        title: { display: false },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const label = context.label || "";
                              const value = context.raw || 0;
                              const total =
                                context.chart.data.datasets[0].data.reduce(
                                  (a, b) => a + b,
                                  0
                                );
                              const percentage = (
                                (value / total) *
                                100
                              ).toFixed(1);
                              return `${label}: ${value} (${percentage}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg shadow">
              <div className="flex justify-between items-center mb-2 border-b pb-1">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-blue-500" /> Payment
                  Methods
                </h3>
                <button
                  className="text-xs text-blue-600 flex items-center hover:text-blue-800"
                  onClick={() => toggleDetails("paymentMethods")}
                >
                  {showDetails.paymentMethods ? "Hide" : "Show"}
                  {showDetails.paymentMethods ? (
                    <ChevronUp size={14} className="ml-0.5" />
                  ) : (
                    <ChevronDown size={14} className="ml-0.5" />
                  )}
                </button>
              </div>

              <div className="h-[250px] flex justify-center items-center">
                <div style={{ maxWidth: "250px", width: "100%" }}>
                  <Pie
                    data={paymentMethodsData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "right",
                          labels: { font: { size: 9 } },
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const label = context.label || "";
                              const value = context.raw || 0;
                              const total =
                                context.chart.data.datasets[0].data.reduce(
                                  (a, b) => a + b,
                                  0
                                );
                              const percentage = (
                                (value / total) *
                                100
                              ).toFixed(1);
                              return `${label}: ${value} (${percentage}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {showDetails.paymentMethods &&
                (analytics.paymentMethods ?? []).length > 0 && (
                  <div className="mt-2 overflow-auto max-h-[150px] bg-gray-50 rounded-md p-2">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                            Method
                          </th>
                          <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">
                            Count
                          </th>
                          <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">
                            Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {(analytics.paymentMethods ?? []).map((method) => {
                          const percentage = (
                            (method.count / (analytics.totalBookings ?? 1)) *
                            100
                          ).toFixed(1);
                          return (
                            <tr key={method._id} className="hover:bg-gray-50">
                              <td className="px-2 py-1 text-xs text-gray-900">
                                {method._id}
                              </td>
                              <td className="px-2 py-1 text-xs text-gray-900 text-right">
                                {method.count}
                              </td>
                              <td className="px-2 py-1 text-xs text-gray-900 text-right">
                                Rs. {(method.revenue ?? 0).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </div>

          {/* Final row with reduced padding */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg shadow">
              <div className="flex justify-between items-center mb-2 border-b pb-1">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-blue-500" /> Bookings by
                  Hour
                </h3>
                <button
                  className="text-xs text-blue-600 flex items-center hover:text-blue-800"
                  onClick={() => toggleDetails("bookingsByHour")}
                >
                  {showDetails.bookingsByHour ? "Hide" : "Show"}
                  {showDetails.bookingsByHour ? (
                    <ChevronUp size={14} className="ml-0.5" />
                  ) : (
                    <ChevronDown size={14} className="ml-0.5" />
                  )}
                </button>
              </div>
              <div className="h-[250px]">
                <Bar
                  data={bookingsByHourData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          title: (tooltipItems) => {
                            return `${tooltipItems[0].label} - ${parseInt(tooltipItems[0].label) + 1}:00`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Number of Bookings",
                          font: { size: 10 },
                        },
                        ticks: { precision: 0, font: { size: 9 } },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Hour of Day",
                          font: { size: 10 },
                        },
                        ticks: { font: { size: 8 } },
                      },
                    },
                  }}
                />
              </div>

              {showDetails.bookingsByHour &&
                (analytics.bookingsByHour ?? []).length > 0 && (
                  <div className="mt-2 grid grid-cols-6 gap-1 text-center bg-gray-50 p-2 rounded-md">
                    {(analytics.bookingsByHour ?? []).map((hour) => (
                      <div
                        key={hour._id}
                        className="p-1 bg-blue-50 rounded shadow-sm text-xs"
                      >
                        <p className="font-medium text-blue-800">
                          {hour._id}:00
                        </p>
                        <p className="font-bold text-blue-600">{hour.count}</p>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="bg-white p-3 rounded-lg shadow">
              <div className="flex justify-between items-center mb-2 border-b pb-1">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <FileText className="h-4 w-4 mr-1 text-blue-500" /> Booking
                  Summary
                </h3>
                <button
                  className="text-xs text-blue-600 flex items-center hover:text-blue-800"
                  onClick={() => toggleDetails("recentBookings")}
                >
                  {showDetails.recentBookings ? "Hide" : "Show"}
                  {showDetails.recentBookings ? (
                    <ChevronUp size={14} className="ml-0.5" />
                  ) : (
                    <ChevronDown size={14} className="ml-0.5" />
                  )}
                </button>
              </div>
              <div className="overflow-auto max-h-[250px] bg-gray-50 rounded-md p-2">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-600">
                        Route
                      </th>
                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">
                        Bookings
                      </th>
                      <th className="px-2 py-1 text-right text-xs font-medium text-gray-600">
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {(analytics.topRoutes ?? []).map((route) => {
                      const percentage = (
                        (route.count / (analytics.totalBookings ?? 1)) *
                        100
                      ).toFixed(1);
                      return (
                        <tr key={route._id} className="hover:bg-gray-50">
                          <td className="px-2 py-1 text-xs text-gray-900">
                            {route._id}
                          </td>
                          <td className="px-2 py-1 text-xs text-gray-900 text-right">
                            {route.count}
                          </td>
                          <td className="px-2 py-1 text-xs text-gray-900 text-right">
                            {percentage}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {showDetails.recentBookings &&
                (analytics.recentBookings ?? []).length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-medium mb-1 text-gray-700 border-b pb-1 flex items-center">
                      <FileText className="h-3 w-3 mr-1 text-blue-500" /> Recent
                      Bookings
                    </h4>
                    <div className="overflow-auto max-h-[150px] bg-gray-50 rounded-md p-2">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-1 py-1 text-left text-xs font-medium text-gray-600">
                              ID
                            </th>
                            <th className="px-1 py-1 text-left text-xs font-medium text-gray-600">
                              User
                            </th>
                            <th className="px-1 py-1 text-right text-xs font-medium text-gray-600">
                              Amount
                            </th>
                            <th className="px-1 py-1 text-center text-xs font-medium text-gray-600">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {(analytics.recentBookings ?? []).map((booking) => (
                            <tr
                              key={booking.bookingId}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-1 py-0.5 text-xs text-gray-900">
                                {booking.bookingId}
                              </td>
                              <td className="px-1 py-0.5 text-xs text-gray-900">
                                {booking.userName}
                              </td>
                              <td className="px-1 py-0.5 text-xs text-gray-900 text-right">
                                Rs. {(booking.amount ?? 0).toLocaleString()}
                              </td>
                              <td className="px-1 py-0.5 text-xs text-center">
                                <span
                                  className={`px-1 py-0.5 inline-flex text-xs leading-none font-semibold rounded-full 
                                ${
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BookingAnalytics;
