import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import {
  Search,
  Calendar,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
  CreditCard,
  FileText,
  Trash2,
  XSquare,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Settings,
} from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";
import Chart from "chart.js/auto";
import { format } from "date-fns";
import * as XLSX from "xlsx";

const BookingManagement = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Enhanced state variables
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [routes, setRoutes] = useState([]);

  // Advanced Report Generation
  const [exportFormat, setExportFormat] = useState("pdf");
  const [exportDetailLevel, setExportDetailLevel] = useState("summary");
  const [exportLayout, setExportLayout] = useState("table");
  const [includeCharts, setIncludeCharts] = useState(false);
  const [reportTitle, setReportTitle] = useState("GoSync Booking Report");
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [selectedChartTypes, setSelectedChartTypes] = useState([
    "status",
    "payment",
  ]);

  // Chart references
  const statusChartRef = useRef(null);
  const paymentChartRef = useRef(null);
  const routeChartRef = useRef(null);
  const dailyBookingsChartRef = useRef(null);
  const revenueChartRef = useRef(null);

  // Export options
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  // Add new state variables for seat cancellation
  const [showSeatCancelModal, setShowSeatCancelModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isCancellingSeat, setIsCancellingSeat] = useState(false);

  // Enhanced filters
  const [filters, setFilters] = useState({
    busId: "",
    status: "",
    paymentStatus: "",
    routeId: "",
    startDate: "",
    endDate: "",
  });

  // Enhanced filtering functionality
  const filteredBookings = bookings.filter((booking) => {
    // Check if the search term matches booking ID or passenger name
    const searchMatch =
      searchTerm === "" ||
      booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.userId &&
        booking.userId.name &&
        booking.userId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.userId &&
        booking.userId.email &&
        booking.userId.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // Check if the booking matches all selected filters
    const busMatch = !filters.busId || booking.busId._id === filters.busId;
    const statusMatch = !filters.status || booking.status === filters.status;
    const paymentMatch =
      !filters.paymentStatus || booking.paymentStatus === filters.paymentStatus;

    // Route matching - check if the booking's from/to matches the selected route
    const routeMatch =
      !filters.routeId ||
      (booking.busId && booking.busId.routeId === filters.routeId);

    // Date range matching
    let dateMatch = true;
    if (filters.startDate && booking.createdAt) {
      dateMatch =
        dateMatch && new Date(booking.createdAt) >= new Date(filters.startDate);
    }
    if (filters.endDate && booking.createdAt) {
      dateMatch =
        dateMatch && new Date(booking.createdAt) <= new Date(filters.endDate);
    }

    return (
      searchMatch &&
      busMatch &&
      statusMatch &&
      paymentMatch &&
      routeMatch &&
      dateMatch
    );
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, busesRes, routesRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/bookings`, { withCredentials: true }),
          axios.get(`${API_URL}/api/buses/buses`, { withCredentials: true }),
          axios.get(`${API_URL}/api/routes/routes`, { withCredentials: true }),
        ]);

        // Process and set bookings data
        setBookings(bookingsRes.data);
        setBuses(busesRes.data);

        // Process and set routes data
        if (Array.isArray(routesRes.data.routes)) {
          setRoutes(routesRes.data.routes);
        } else if (routesRes.data && Array.isArray(routesRes.data)) {
          setRoutes(routesRes.data);
        } else {
          setRoutes([]);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [API_URL]);

  // Initialize charts when the advanced export modal opens
  useEffect(() => {
    if (showExportModal && includeCharts) {
      initializeCharts();
    }
  }, [showExportModal, includeCharts, selectedChartTypes, filteredBookings]);

  // Function to initialize all selected chart types
  const initializeCharts = () => {
    // Clear any existing charts first
    if (statusChartRef.current && statusChartRef.current.chart) {
      statusChartRef.current.chart.destroy();
    }
    if (paymentChartRef.current && paymentChartRef.current.chart) {
      paymentChartRef.current.chart.destroy();
    }
    if (routeChartRef.current && routeChartRef.current.chart) {
      routeChartRef.current.chart.destroy();
    }
    if (dailyBookingsChartRef.current && dailyBookingsChartRef.current.chart) {
      dailyBookingsChartRef.current.chart.destroy();
    }
    if (revenueChartRef.current && revenueChartRef.current.chart) {
      revenueChartRef.current.chart.destroy();
    }

    // Initialize requested charts
    if (selectedChartTypes.includes("status") && statusChartRef.current) {
      createStatusChart();
    }
    if (selectedChartTypes.includes("payment") && paymentChartRef.current) {
      createPaymentChart();
    }
    if (selectedChartTypes.includes("route") && routeChartRef.current) {
      createRouteChart();
    }
    if (selectedChartTypes.includes("daily") && dailyBookingsChartRef.current) {
      createDailyBookingsChart();
    }
    if (selectedChartTypes.includes("revenue") && revenueChartRef.current) {
      createRevenueChart();
    }
  };

  // Create booking status distribution chart
  const createStatusChart = () => {
    // Count bookings by status
    const statusCounts = {
      confirmed: 0,
      cancelled: 0,
      pending: 0,
    };

    filteredBookings.forEach((booking) => {
      if (statusCounts.hasOwnProperty(booking.status)) {
        statusCounts[booking.status]++;
      }
    });

    const ctx = statusChartRef.current.getContext("2d");
    statusChartRef.current.chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Confirmed", "Cancelled", "Pending"],
        datasets: [
          {
            data: [
              statusCounts.confirmed,
              statusCounts.cancelled,
              statusCounts.pending,
            ],
            backgroundColor: ["#10b981", "#ef4444", "#f59e0b"],
            borderColor: ["#ffffff", "#ffffff", "#ffffff"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              font: {
                size: 10,
              },
            },
          },
          title: {
            display: true,
            text: "Booking Status Distribution",
            font: {
              size: 12,
            },
          },
        },
      },
    });
  };

  // Create payment status chart
  const createPaymentChart = () => {
    // Count bookings by payment status
    const paymentCounts = {
      paid: 0,
      pending: 0,
      failed: 0,
    };

    filteredBookings.forEach((booking) => {
      if (paymentCounts.hasOwnProperty(booking.paymentStatus)) {
        paymentCounts[booking.paymentStatus]++;
      }
    });

    const ctx = paymentChartRef.current.getContext("2d");
    paymentChartRef.current.chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Paid", "Pending", "Failed"],
        datasets: [
          {
            data: [
              paymentCounts.paid,
              paymentCounts.pending,
              paymentCounts.failed,
            ],
            backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
            borderColor: ["#ffffff", "#ffffff", "#ffffff"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              font: {
                size: 10,
              },
            },
          },
          title: {
            display: true,
            text: "Payment Status Distribution",
            font: {
              size: 12,
            },
          },
        },
      },
    });
  };

  // Create top routes chart
  const createRouteChart = () => {
    // Group bookings by route
    const routeCounts = {};

    filteredBookings.forEach((booking) => {
      const route = `${booking.from || "Unknown"} to ${booking.to || "Unknown"}`;
      if (routeCounts[route]) {
        routeCounts[route]++;
      } else {
        routeCounts[route] = 1;
      }
    });

    // Get top 5 routes
    const topRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const ctx = routeChartRef.current.getContext("2d");
    routeChartRef.current.chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: topRoutes.map(([route]) => route),
        datasets: [
          {
            label: "Bookings",
            data: topRoutes.map(([, count]) => count),
            backgroundColor: "#3b82f6",
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Top Routes",
            font: {
              size: 12,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
          x: {
            ticks: {
              font: {
                size: 9,
              },
            },
          },
        },
      },
    });
  };

  // Create daily bookings chart (shows bookings per day for recent days)
  const createDailyBookingsChart = () => {
    // Group bookings by date
    const bookingsByDate = {};
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    // Set up last 7 days with zero counts
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      bookingsByDate[dateString] = 0;
    }

    // Count bookings by date
    filteredBookings.forEach((booking) => {
      const bookingDate = new Date(booking.createdAt || booking.bookedAt);
      if (bookingDate >= oneWeekAgo) {
        const dateString = bookingDate.toISOString().split("T")[0];
        if (bookingsByDate.hasOwnProperty(dateString)) {
          bookingsByDate[dateString]++;
        } else {
          bookingsByDate[dateString] = 1;
        }
      }
    });

    // Sort dates chronologically
    const sortedDates = Object.entries(bookingsByDate).sort(
      ([dateA], [dateB]) => new Date(dateA) - new Date(dateB)
    );

    const ctx = dailyBookingsChartRef.current.getContext("2d");
    dailyBookingsChartRef.current.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: sortedDates.map(([date]) => {
          const d = new Date(date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        }),
        datasets: [
          {
            label: "Bookings",
            data: sortedDates.map(([, count]) => count),
            backgroundColor: "rgba(99, 102, 241, 0.2)",
            borderColor: "rgba(99, 102, 241, 1)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Daily Bookings (Last 7 Days)",
            font: {
              size: 12,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  };

  // Create revenue chart
  const createRevenueChart = () => {
    // Group bookings by date and calculate daily revenue
    const revenueByDate = {};
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    // Set up last 7 days with zero revenue
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      revenueByDate[dateString] = 0;
    }

    // Calculate revenue by date
    filteredBookings.forEach((booking) => {
      if (booking.paymentStatus === "paid") {
        const bookingDate = new Date(booking.createdAt || booking.bookedAt);
        if (bookingDate >= oneWeekAgo) {
          const dateString = bookingDate.toISOString().split("T")[0];
          if (revenueByDate.hasOwnProperty(dateString)) {
            revenueByDate[dateString] += booking.fareTotal || 0;
          } else {
            revenueByDate[dateString] = booking.fareTotal || 0;
          }
        }
      }
    });

    // Sort dates chronologically
    const sortedDates = Object.entries(revenueByDate).sort(
      ([dateA], [dateB]) => new Date(dateA) - new Date(dateB)
    );

    const ctx = revenueChartRef.current.getContext("2d");
    revenueChartRef.current.chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sortedDates.map(([date]) => {
          const d = new Date(date);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        }),
        datasets: [
          {
            label: "Revenue (Rs.)",
            data: sortedDates.map(([, revenue]) => revenue),
            backgroundColor: "rgba(16, 185, 129, 0.6)",
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Daily Revenue (Last 7 Days)",
            font: {
              size: 12,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Handle pagination change
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      await axios.post(
        `${API_URL}/api/admin/bookings/cancel`,
        { bookingId },
        { withCredentials: true }
      );

      setBookings(
        bookings.map((b) =>
          b.bookingId === bookingId ? { ...b, status: "cancelled" } : b
        )
      );

      toast.success("Booking cancelled successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  const handleUpdatePayment = async (bookingId, newStatus) => {
    try {
      await axios.post(
        `${API_URL}/api/admin/bookings/update-payment`,
        {
          bookingId,
          paymentStatus: newStatus,
        },
        { withCredentials: true }
      );

      setBookings(
        bookings.map((b) =>
          b.bookingId === bookingId ? { ...b, paymentStatus: newStatus } : b
        )
      );

      toast.success(`Payment status updated to ${newStatus}`);
      setShowDetailsModal(false);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update payment status"
      );
    }
  };

  const showBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const clearFilters = () => {
    setFilters({
      busId: "",
      status: "",
      paymentStatus: "",
      routeId: "",
      startDate: "",
      endDate: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const exportToPDF = () => {
    setIsExporting(true);

    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text("GoSync - Booking Report", 14, 22);

      // Add date range if filters applied
      if (filters.startDate || filters.endDate) {
        doc.setFontSize(12);
        doc.text(
          `Date Range: ${filters.startDate || "All past"} to ${filters.endDate || "Present"}`,
          14,
          32
        );
      }

      // Table headers and data
      const headers = [
        [
          "Booking ID",
          "Passenger",
          "Route",
          "Seats",
          "Status",
          "Payment",
          "Date",
        ],
      ];

      const data = filteredBookings.map((b) => [
        b.bookingId,
        b.userId?.name || "N/A",
        `${b.from || "Unknown"} to ${b.to || "Unknown"}`,
        b.seatNumbers?.join(", ") || "N/A",
        b.status,
        b.paymentStatus,
        formatDate(b.createdAt || b.bookedAt),
      ]);

      // Use autoTable as a standalone function imported by the plugin
      import("jspdf-autotable")
        .then((autoTable) => {
          autoTable.default(doc, {
            head: headers,
            body: data,
            startY: 40,
            theme: "grid",
            styles: {
              fontSize: 8,
              cellPadding: 3,
            },
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
            },
          });

          // Add summary at the bottom
          doc.setFontSize(10);
          doc.text(
            `Total Bookings: ${filteredBookings.length}`,
            14,
            doc.lastAutoTable.finalY + 10
          );

          const filename = `GoSync_Bookings_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
          doc.save(filename);
          toast.success(`Exported to ${filename}`);
          setIsExporting(false);
        })
        .catch((err) => {
          console.error("AutoTable import error:", err);
          toast.error("Failed to export bookings report");
          setIsExporting(false);
        });
    } catch (err) {
      console.error("PDF Export error:", err);
      toast.error("Failed to export bookings report");
      setIsExporting(false);
    }
  };

  // Function to export bookings to CSV
  const exportToCSV = () => {
    setIsExporting(true);
    try {
      // CSV Headers
      const headers = [
        "Booking ID",
        "Passenger Name",
        "Passenger Email",
        "Route",
        "Seats",
        "Status",
        "Payment Status",
        "Fare Total",
        "Booking Date",
      ];

      // Format data for CSV
      const data = filteredBookings.map((booking) => [
        booking.bookingId,
        booking.userId?.name || "N/A",
        booking.userId?.email || "N/A",
        `${booking.from || "Unknown"} to ${booking.to || "Unknown"}`,
        booking.seatNumbers?.join(", ") || "N/A",
        booking.status,
        booking.paymentStatus,
        `Rs. ${booking.fareTotal}`,
        formatDate(booking.createdAt || booking.bookedAt),
      ]);

      // Combine headers and data
      const csvArray = [headers, ...data];

      // Convert to CSV string
      const csvContent = csvArray.map((row) => row.join(",")).join("\n");

      // Create blob and save file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      saveAs(
        blob,
        `GoSync_Bookings_${new Date().toISOString().slice(0, 10)}.csv`
      );

      toast.success("Bookings data exported to CSV successfully");
    } catch (err) {
      console.error("CSV Export error:", err);
      toast.error("Failed to export bookings data to CSV");
    } finally {
      setIsExporting(false);
    }
  };

  // Function to generate advanced CSV report with more details
  const generateAdvancedCsvReport = () => {
    setIsExporting(true);
    try {
      // Determine fields based on detail level
      let headers = [];

      if (exportDetailLevel === "summary") {
        headers = [
          "Booking ID",
          "Passenger Name",
          "Route",
          "Status",
          "Payment Status",
          "Date",
        ];
      } else {
        // Detailed or analytics mode includes more fields
        headers = [
          "Booking ID",
          "Passenger Name",
          "Passenger Email",
          "Passenger Phone",
          "Route",
          "From",
          "To",
          "Bus Number",
          "Seats",
          "Number of Seats",
          "Status",
          "Payment Status",
          "Fare Total",
          "Booking Date",
          "Journey Date",
        ];
      }

      // Format data for CSV
      const data = filteredBookings.map((booking) => {
        if (exportDetailLevel === "summary") {
          return [
            booking.bookingId,
            booking.userId?.name || "N/A",
            `${booking.from || "Unknown"} to ${booking.to || "Unknown"}`,
            booking.status,
            booking.paymentStatus,
            formatDate(booking.createdAt || booking.bookedAt),
          ];
        } else {
          // More detailed information for detailed/analytics export
          return [
            booking.bookingId,
            booking.userId?.name || "N/A",
            booking.userId?.email || "N/A",
            booking.userId?.phone || "N/A",
            `${booking.from || "Unknown"} to ${booking.to || "Unknown"}`,
            booking.from || "Unknown",
            booking.to || "Unknown",
            booking.busId?.busNumber || booking.busNumber || "N/A",
            booking.seatNumbers?.join(", ") || "N/A",
            booking.seatNumbers?.length || 0,
            booking.status,
            booking.paymentStatus,
            `Rs. ${booking.fareTotal || 0}`,
            formatDate(booking.createdAt || booking.bookedAt),
            booking.journeyDate ? formatDate(booking.journeyDate) : "N/A",
          ];
        }
      });

      // If it's an analytics report, add summary statistics at the beginning
      if (exportDetailLevel === "analytics") {
        // Calculate statistics
        const confirmedBookings = filteredBookings.filter(
          (b) => b.status === "confirmed"
        ).length;
        const cancelledBookings = filteredBookings.filter(
          (b) => b.status === "cancelled"
        ).length;
        const pendingBookings = filteredBookings.filter(
          (b) => b.status === "pending"
        ).length;

        const paidBookings = filteredBookings.filter(
          (b) => b.paymentStatus === "paid"
        ).length;
        const pendingPayments = filteredBookings.filter(
          (b) => b.paymentStatus === "pending"
        ).length;

        const totalRevenue = filteredBookings
          .filter((b) => b.paymentStatus === "paid")
          .reduce((sum, booking) => sum + (booking.fareTotal || 0), 0);

        const avgBookingValue =
          paidBookings > 0 ? (totalRevenue / paidBookings).toFixed(2) : 0;

        const summaryRows = [
          [
            "",
            "GoSync Booking Analytics Report",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
          [
            "",
            `Generated on: ${format(new Date(), "PPpp")}`,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          [
            "",
            "SUMMARY STATISTICS",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
          [
            "",
            `Total Bookings: ${filteredBookings.length}`,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
          [
            "",
            `Confirmed: ${confirmedBookings}`,
            `Cancelled: ${cancelledBookings}`,
            `Pending: ${pendingBookings}`,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
          [
            "",
            `Paid Bookings: ${paidBookings}`,
            `Pending Payments: ${pendingPayments}`,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
          [
            "",
            `Total Revenue: Rs. ${totalRevenue.toFixed(2)}`,
            `Average Booking Value: Rs. ${avgBookingValue}`,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
          ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          [
            "",
            "BOOKING DETAILS",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ],
        ];

        // Insert summary at the start
        data.unshift(...summaryRows);
      }

      // Combine headers and data
      const csvArray = [headers, ...data];

      // Convert to CSV string
      const csvContent = csvArray
        .map((row) => {
          // Wrap each field in quotes and escape any quotes inside fields
          return row
            .map((field) => {
              const stringField = String(field);
              return `"${stringField.replace(/"/g, '""')}"`;
            })
            .join(",");
        })
        .join("\n");

      // Create blob and save file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const filename = `${reportTitle.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.csv`;
      saveAs(blob, filename);

      toast.success(`Advanced CSV report saved as ${filename}`);
    } catch (err) {
      console.error("CSV Export error:", err);
      toast.error("Failed to export bookings data to CSV");
    } finally {
      setIsExporting(false);
    }
  };

  // Function to generate Excel report with multiple sheets
  const generateExcelReport = () => {
    setIsExporting(true);
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Create a summary sheet first
      const summaryData = [
        [`${reportTitle}`],
        [`Generated on: ${format(new Date(), "PPpp")}`],
        [],
        ["Summary Statistics"],
      ];

      // Calculate summary statistics
      const confirmedBookings = filteredBookings.filter(
        (b) => b.status === "confirmed"
      ).length;
      const cancelledBookings = filteredBookings.filter(
        (b) => b.status === "cancelled"
      ).length;
      const pendingBookings = filteredBookings.filter(
        (b) => b.status === "pending"
      ).length;

      const paidBookings = filteredBookings.filter(
        (b) => b.paymentStatus === "paid"
      ).length;
      const pendingPayments = filteredBookings.filter(
        (b) => b.paymentStatus === "pending"
      ).length;

      const totalRevenue = filteredBookings
        .filter((b) => b.paymentStatus === "paid")
        .reduce((sum, booking) => sum + (booking.fareTotal || 0), 0);

      const avgBookingValue =
        paidBookings > 0 ? (totalRevenue / paidBookings).toFixed(2) : 0;

      // Add statistics to summary sheet
      summaryData.push(
        ["Total Bookings", filteredBookings.length],
        ["Confirmed Bookings", confirmedBookings],
        ["Cancelled Bookings", cancelledBookings],
        ["Pending Bookings", pendingBookings],
        [],
        ["Paid Bookings", paidBookings],
        ["Pending Payments", pendingPayments],
        [],
        ["Total Revenue", `Rs. ${totalRevenue.toFixed(2)}`],
        ["Average Booking Value", `Rs. ${avgBookingValue}`]
      );

      // Add filter information if any filters are applied
      if (
        filters.busId ||
        filters.routeId ||
        filters.status ||
        filters.paymentStatus ||
        filters.startDate ||
        filters.endDate
      ) {
        summaryData.push([], ["Applied Filters"]);

        if (filters.busId) {
          const selectedBus = buses.find((b) => b._id === filters.busId);
          summaryData.push([
            "Bus",
            selectedBus ? selectedBus.busNumber : "Unknown",
          ]);
        }

        if (filters.routeId) {
          const selectedRoute = routes.find(
            (r) => (r.routeId || r._id) === filters.routeId
          );
          if (selectedRoute) {
            summaryData.push([
              "Route",
              `${selectedRoute.startLocation} to ${selectedRoute.endLocation}`,
            ]);
          }
        }

        if (filters.status) {
          summaryData.push(["Status", filters.status]);
        }

        if (filters.paymentStatus) {
          summaryData.push(["Payment Status", filters.paymentStatus]);
        }

        if (filters.startDate || filters.endDate) {
          summaryData.push([
            "Date Range",
            `${filters.startDate || "All past"} to ${filters.endDate || "Present"}`,
          ]);
        }
      }

      // Create summary worksheet
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

      // Create detailed bookings sheet
      let headers = [];
      if (exportDetailLevel === "summary") {
        headers = [
          "Booking ID",
          "Passenger Name",
          "Route",
          "Status",
          "Payment Status",
          "Date",
        ];
      } else {
        // Detailed or analytics mode includes more fields
        headers = [
          "Booking ID",
          "Passenger Name",
          "Passenger Email",
          "Passenger Phone",
          "Route",
          "From",
          "To",
          "Bus Number",
          "Seats",
          "Number of Seats",
          "Status",
          "Payment Status",
          "Fare Total",
          "Booking Date",
          "Journey Date",
        ];
      }

      // Format data for bookings sheet
      const bookingsData = filteredBookings.map((booking) => {
        if (exportDetailLevel === "summary") {
          return [
            booking.bookingId,
            booking.userId?.name || "N/A",
            `${booking.from || "Unknown"} to ${booking.to || "Unknown"}`,
            booking.status,
            booking.paymentStatus,
            formatDate(booking.createdAt || booking.bookedAt),
          ];
        } else {
          return [
            booking.bookingId,
            booking.userId?.name || "N/A",
            booking.userId?.email || "N/A",
            booking.userId?.phone || "N/A",
            `${booking.from || "Unknown"} to ${booking.to || "Unknown"}`,
            booking.from || "Unknown",
            booking.to || "Unknown",
            booking.busId?.busNumber || booking.busNumber || "N/A",
            booking.seatNumbers?.join(", ") || "N/A",
            booking.seatNumbers?.length || 0,
            booking.status,
            booking.paymentStatus,
            booking.fareTotal || 0,
            formatDate(booking.createdAt || booking.bookedAt),
            booking.journeyDate ? formatDate(booking.journeyDate) : "N/A",
          ];
        }
      });

      // Combine headers with data
      const bookingsSheetData = [headers, ...bookingsData];
      const bookingsWs = XLSX.utils.aoa_to_sheet(bookingsSheetData);
      XLSX.utils.book_append_sheet(wb, bookingsWs, "Bookings");

      // If analytics detail level, add additional analysis sheets
      if (exportDetailLevel === "analytics") {
        // Status distribution sheet
        const statusData = [
          ["Status", "Count", "Percentage"],
          [
            "Confirmed",
            confirmedBookings,
            ((confirmedBookings / filteredBookings.length) * 100).toFixed(1) +
              "%",
          ],
          [
            "Cancelled",
            cancelledBookings,
            ((cancelledBookings / filteredBookings.length) * 100).toFixed(1) +
              "%",
          ],
          [
            "Pending",
            pendingBookings,
            ((pendingBookings / filteredBookings.length) * 100).toFixed(1) +
              "%",
          ],
        ];
        const statusWs = XLSX.utils.aoa_to_sheet(statusData);
        XLSX.utils.book_append_sheet(wb, statusWs, "Status Distribution");

        // Payment status sheet
        const paymentData = [
          ["Payment Status", "Count", "Percentage"],
          [
            "Paid",
            paidBookings,
            ((paidBookings / filteredBookings.length) * 100).toFixed(1) + "%",
          ],
          [
            "Pending",
            pendingPayments,
            ((pendingPayments / filteredBookings.length) * 100).toFixed(1) +
              "%",
          ],
          [
            "Failed",
            filteredBookings.filter((b) => b.paymentStatus === "failed").length,
            (
              (filteredBookings.filter((b) => b.paymentStatus === "failed")
                .length /
                filteredBookings.length) *
              100
            ).toFixed(1) + "%",
          ],
        ];
        const paymentWs = XLSX.utils.aoa_to_sheet(paymentData);
        XLSX.utils.book_append_sheet(wb, paymentWs, "Payment Analysis");

        // Top routes analysis
        const routeCounts = {};
        filteredBookings.forEach((booking) => {
          const route = `${booking.from || "Unknown"} to ${booking.to || "Unknown"}`;
          routeCounts[route] = (routeCounts[route] || 0) + 1;
        });

        const topRoutes = Object.entries(routeCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([route, count]) => [
            route,
            count,
            ((count / filteredBookings.length) * 100).toFixed(1) + "%",
          ]);

        const routesData = [["Route", "Bookings", "Percentage"], ...topRoutes];
        const routesWs = XLSX.utils.aoa_to_sheet(routesData);
        XLSX.utils.book_append_sheet(wb, routesWs, "Top Routes");
      }

      // Generate Excel file
      const filename = `${reportTitle.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`Excel report saved as ${filename}`);
    } catch (err) {
      console.error("Excel Export error:", err);
      toast.error("Failed to export bookings data to Excel");
    } finally {
      setIsExporting(false);
    }
  };

  // Function to generate advanced PDF report
  const generateAdvancedPdfReport = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 15;

      // Add header with background color
      if (exportLayout === "detailed" || exportLayout === "table") {
        doc.setFillColor(41, 128, 185); // Blue header
        doc.rect(0, 0, pageWidth, 30, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text(reportTitle, pageWidth / 2, 15, { align: "center" });

        // Reset text color for the rest of the document
        doc.setTextColor(0, 0, 0);
        yPos = 25; // Reduced from 40 to 25
      } else {
        doc.setFontSize(18); // Reduced from 20
        doc.text(reportTitle, pageWidth / 2, yPos, { align: "center" });
        yPos += 10; // Reduced from 15 to 10
      }

      // Add logo if selected
      if (includeLogo) {
        try {
          const logoImg = new Image();
          logoImg.src = "/assets/GoSync-Logo.png";
          doc.addImage(logoImg, "PNG", 10, 5, 20, 10); // Made logo smaller and adjusted position
        } catch (logoErr) {
          console.error("Error adding logo:", logoErr);
        }
      }

      // Add metadata section with condensed spacing
      doc.setFontSize(9); // Reduced from 10
      doc.text(`Generated on: ${format(new Date(), "PPpp")}`, 15, yPos);
      yPos += 5; // Reduced from 7

      // Add filter information with more condensed spacing
      if (
        filters.busId ||
        filters.routeId ||
        filters.status ||
        filters.paymentStatus ||
        filters.startDate ||
        filters.endDate
      ) {
        doc.text("Applied Filters:", 15, yPos);
        yPos += 4; // Reduced from 5

        if (filters.busId) {
          const selectedBus = buses.find((b) => b._id === filters.busId);
          doc.text(
            `• Bus: ${selectedBus ? selectedBus.busNumber : "Unknown"}`,
            20,
            yPos
          );
          yPos += 4; // Reduced from 5
        }

        // Continue with other filters...
        // Keep same pattern of reducing vertical spacing

        yPos += 3; // Reduced from 5 for extra space after filters
      }

      // Summary statistics with reduced spacing
      doc.setFontSize(11); // Reduced from 12
      doc.setFont(undefined, "bold");
      doc.text("Summary Statistics", 15, yPos);
      doc.setFont(undefined, "normal");
      yPos += 5; // Reduced from 7

      // Calculate statistics
      const confirmedBookings = filteredBookings.filter(
        (b) => b.status === "confirmed"
      ).length;
      const cancelledBookings = filteredBookings.filter(
        (b) => b.status === "cancelled"
      ).length;
      const pendingBookings = filteredBookings.filter(
        (b) => b.status === "pending"
      ).length;

      const paidBookings = filteredBookings.filter(
        (b) => b.paymentStatus === "paid"
      ).length;
      const pendingPayments = filteredBookings.filter(
        (b) => b.paymentStatus === "pending"
      ).length;

      const totalRevenue = filteredBookings
        .filter((b) => b.paymentStatus === "paid")
        .reduce((sum, booking) => sum + (booking.fareTotal || 0), 0);

      const avgBookingValue =
        paidBookings > 0 ? (totalRevenue / paidBookings).toFixed(2) : 0;

      doc.setFontSize(9); // Reduced from 10
      doc.text(`Total Bookings: ${filteredBookings.length}`, 20, yPos);
      yPos += 4; // Reduced from 5
      doc.text(
        `Confirmed: ${confirmedBookings} | Cancelled: ${cancelledBookings} | Pending: ${pendingBookings}`,
        20,
        yPos
      );
      yPos += 4; // Reduced from 5
      doc.text(
        `Paid Bookings: ${paidBookings} | Pending Payments: ${pendingPayments}`,
        20,
        yPos
      );
      yPos += 4; // Reduced from 5
      doc.text(
        `Total Revenue: Rs. ${totalRevenue.toFixed(2)} | Average Booking Value: Rs. ${avgBookingValue}`,
        20,
        yPos
      );
      yPos += 6; // Reduced from 10

      // Add charts if enabled with more compact sizing
      if (includeCharts && selectedChartTypes.length > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("Analytics Charts", 15, yPos);
        doc.setFont(undefined, "normal");
        yPos += 6; // Reduced from 10

        // Make charts smaller and adjust positioning
        // Status and Payment charts side by side with reduced height
        if (selectedChartTypes.includes("status") && statusChartRef.current) {
          const statusCanvas = statusChartRef.current;
          const statusImgData = statusCanvas.toDataURL("image/png");
          doc.addImage(statusImgData, "PNG", 15, yPos, 70, 50); // Reduced from 80x60

          // Payment chart side by side if both selected
          if (
            selectedChartTypes.includes("payment") &&
            paymentChartRef.current
          ) {
            const paymentCanvas = paymentChartRef.current;
            const paymentImgData = paymentCanvas.toDataURL("image/png");
            doc.addImage(paymentImgData, "PNG", pageWidth - 85, yPos, 70, 50); // Reduced from 80x60
            yPos += 55; // Reduced from 70
          } else {
            yPos += 55; // Reduced from 70
          }
        }
        // If only payment chart is selected
        else if (
          selectedChartTypes.includes("payment") &&
          paymentChartRef.current
        ) {
          const paymentCanvas = paymentChartRef.current;
          const paymentImgData = paymentCanvas.toDataURL("image/png");
          doc.addImage(paymentImgData, "PNG", 15, yPos, 70, 50);
          yPos += 55;
        }

        // Route Chart
        if (selectedChartTypes.includes("route") && routeChartRef.current) {
          const routeCanvas = routeChartRef.current;
          const routeImgData = routeCanvas.toDataURL("image/png");
          doc.addImage(routeImgData, "PNG", 15, yPos, 160, 50); // Reduced from 180x60
          yPos += 55; // Reduced from 70
        }

        // Check page space more aggressively
        if (
          yPos > pageHeight - 80 &&
          (selectedChartTypes.includes("daily") ||
            selectedChartTypes.includes("revenue"))
        ) {
          doc.addPage();
          yPos = 15; // Start new page higher
        }

        // Daily Bookings Chart
        if (
          selectedChartTypes.includes("daily") &&
          dailyBookingsChartRef.current
        ) {
          const dailyCanvas = dailyBookingsChartRef.current;
          const dailyImgData = dailyCanvas.toDataURL("image/png");
          doc.addImage(dailyImgData, "PNG", 15, yPos, 160, 50); // Reduced from 180x60
          yPos += 55; // Reduced from 70
        }

        // Revenue Chart
        if (selectedChartTypes.includes("revenue") && revenueChartRef.current) {
          if (yPos > pageHeight - 70) {
            // More aggressive check
            doc.addPage();
            yPos = 15;
          }
          const revenueCanvas = revenueChartRef.current;
          const revenueImgData = revenueCanvas.toDataURL("image/png");
          doc.addImage(revenueImgData, "PNG", 15, yPos, 160, 50); // Reduced from 180x60
          yPos += 55; // Reduced from 70
        }
      }

      // Determine columns and prepare table data as before...
      // Define columns for the table based on export detail level
      let columns = [];
      if (exportDetailLevel === "summary") {
        columns = [
          { header: "Booking ID", dataKey: "bookingId" },
          { header: "Passenger", dataKey: "passengerName" },
          { header: "Route", dataKey: "route" },
          { header: "Seats", dataKey: "seats" },
          { header: "Status", dataKey: "status" },
          { header: "Payment", dataKey: "payment" },
          { header: "Amount", dataKey: "amount" },
        ];
      } else {
        columns = [
          { header: "Booking ID", dataKey: "bookingId" },
          { header: "Passenger", dataKey: "passengerName" },
          { header: "Email", dataKey: "email" },
          { header: "Phone", dataKey: "phone" },
          { header: "Route", dataKey: "route" },
          { header: "From", dataKey: "from" },
          { header: "To", dataKey: "to" },
          { header: "Bus", dataKey: "bus" },
          { header: "Seats", dataKey: "seats" },
          { header: "Seat Count", dataKey: "seatCount" },
          { header: "Status", dataKey: "status" },
          { header: "Payment", dataKey: "payment" },
          { header: "Amount", dataKey: "amount" },
          { header: "Booking Date", dataKey: "bookingDate" },
          { header: "Journey Date", dataKey: "journeyDate" },
        ];
      }
      
      // Prepare table data
      const rows = filteredBookings.map(booking => {
        if (exportDetailLevel === "summary") {
          return {
            bookingId: booking.bookingId,
            passengerName: booking.userId?.name || "N/A",
            route: `${booking.from || "Unknown"} to ${booking.to || "Unknown"}`,
            seats: booking.seatNumbers?.join(", ") || "N/A",
            status: booking.status,
            payment: booking.paymentStatus,
            amount: `Rs. ${booking.fareTotal || 0}`,
          };
        } else {
          return {
            bookingId: booking.bookingId,
            passengerName: booking.userId?.name || "N/A",
            email: booking.userId?.email || "N/A",
            phone: booking.userId?.phoneNumber || "N/A",
            route: `${booking.from || "Unknown"} to ${booking.to || "Unknown"}`,
            from: booking.from || "Unknown",
            to: booking.to || "Unknown",
            bus: booking.busId?.busNumber || booking.busNumber || "N/A",
            seats: booking.seatNumbers?.join(", ") || "N/A",
            seatCount: booking.seatNumbers?.length || 0,
            status: booking.status,
            payment: booking.paymentStatus,
            amount: `Rs. ${booking.fareTotal || 0}`,
            bookingDate: formatDate(booking.createdAt || booking.bookedAt),
            journeyDate: booking.journeyDate ? formatDate(booking.journeyDate) : "N/A",
          };
        }
      });

      // Add bookings table with more aggressive page break check
      if (yPos > pageHeight - 80) {
        // Changed from 100 to 80
        doc.addPage();
        yPos = 15; // Start higher on new page
      }

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Booking Details", 15, yPos);
      doc.setFont(undefined, "normal");
      yPos += 6; // Reduced from 10

      // Create the autotable with adjusted styles
      const tableHeaders = columns.map((column) => column.header);
      const tableData = rows.map((row) =>
        columns.map((column) => row[column.dataKey])
      );

      // Import and use autoTable with optimized settings
      import("jspdf-autotable")
        .then(({ default: autoTable }) => {
          autoTable(doc, {
            head: [tableHeaders],
            body: tableData,
            startY: yPos,
            theme: exportLayout === "compact" ? "plain" : "grid",
            styles: {
              fontSize: exportLayout === "compact" ? 7 : 8,
              cellPadding: exportLayout === "compact" ? 1 : 2, // Reduced from 3
              overflow: "linebreak",
            },
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
              fontStyle: "bold",
            },
            alternateRowStyles: {
              fillColor: [245, 245, 250],
            },
            margin: { top: 10, right: 10, bottom: 10, left: 10 }, // Added explicit margins
            tableWidth: "auto", // Let table use available space
          });

          // Add footer with page numbers if enabled
          if (includePageNumbers) {
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
              doc.setPage(i);
              doc.setFontSize(8);
              doc.setTextColor(100, 100, 100);
              doc.text(
                `Page ${i} of ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: "center" }
              );
              doc.text("GoSync Bus Booking System", 15, pageHeight - 10);
              doc.text(
                `Generated on ${format(new Date(), "PPp")}`,
                pageWidth - 15,
                pageHeight - 10,
                { align: "right" }
              );
            }
          }

          // Save the PDF
          const filename = `${reportTitle.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
          doc.save(filename);
          toast.success(`Advanced PDF report saved as ${filename}`);
          setIsExporting(false);
        })
        .catch((error) => {
          console.error("Error with jspdf-autotable:", error);
          toast.error("Failed to generate PDF report");
          setIsExporting(false);
        });
    } catch (error) {
      console.error("Error generating advanced PDF report:", error);
      toast.error("Failed to generate advanced PDF report");
      setIsExporting(false);
    }
  };

  // Function to open the seat cancellation modal
  const openSeatCancelModal = (booking) => {
    setSelectedBooking(booking);
    setSelectedSeats([]);
    setShowSeatCancelModal(true);
  };

  // Function to close the seat cancellation modal
  const closeSeatCancelModal = () => {
    setSelectedSeats([]);
    setShowSeatCancelModal(false);
  };

  // Handle seat selection for cancellation
  const toggleSeatSelection = (seatNumber) => {
    setSelectedSeats((prevSeats) => {
      if (prevSeats.includes(seatNumber)) {
        return prevSeats.filter((seat) => seat !== seatNumber);
      } else {
        return [...prevSeats, seatNumber];
      }
    });
  };

  // Function to handle individual seat cancellation
  const handleCancelSelectedSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat to cancel");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to cancel ${selectedSeats.length} selected seat(s)?`
      )
    ) {
      return;
    }

    setIsCancellingSeat(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/bookings/cancel-seats`,
        {
          bookingId: selectedBooking.bookingId,
          seatNumbers: selectedSeats,
        },
        { withCredentials: true }
      );

      toast.success(response.data.message || "Seats cancelled successfully");
      closeSeatCancelModal();

      // Update the bookings list
      if (response.data.isFullBookingCancelled) {
        setBookings(
          bookings.map((b) =>
            b.bookingId === selectedBooking.bookingId
              ? { ...b, status: "cancelled" }
              : b
          )
        );
      } else {
        // For partial cancellation, fetch the updated booking data
        const updatedBookingsRes = await axios.get(
          `${API_URL}/api/admin/bookings`,
          { withCredentials: true }
        );
        setBookings(updatedBookingsRes.data);
      }

      setShowDetailsModal(false);
    } catch (err) {
      console.error("Error cancelling seats:", err);
      toast.error(err.response?.data?.message || "Failed to cancel seats");
    } finally {
      setIsCancellingSeat(false);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading booking data...</p>
          </div>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-semibold mb-2 md:mb-0">
            Booking Management
          </h2>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              <Filter size={16} className="mr-1" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              disabled={filteredBookings.length === 0}
              className={`flex items-center px-3 py-2 rounded transition ${
                filteredBookings.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <Settings size={16} className="mr-1" />
              Advanced Export
            </button>

            <button
              onClick={exportToPDF}
              disabled={isExporting || filteredBookings.length === 0}
              className={`flex items-center px-3 py-2 rounded transition ${
                isExporting || filteredBookings.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <Download size={16} className="mr-1" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </button>

            <button
              onClick={exportToCSV}
              disabled={isExporting || filteredBookings.length === 0}
              className={`flex items-center px-3 py-2 rounded transition ${
                isExporting || filteredBookings.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <FileSpreadsheet size={16} className="mr-1" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by booking ID or passenger name"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="pl-10 pr-4 py-2 border rounded w-full md:w-96 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Advanced Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bus
                </label>
                <select
                  name="busId"
                  value={filters.busId}
                  onChange={handleFilterChange}
                  className="p-2 border rounded w-full"
                >
                  <option value="">All Buses</option>
                  {buses.map((bus) => (
                    <option key={bus._id} value={bus._id}>
                      {bus.busNumber} - {bus.travelName || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route
                </label>
                <select
                  name="routeId"
                  value={filters.routeId}
                  onChange={handleFilterChange}
                  className="p-2 border rounded w-full"
                >
                  <option value="">All Routes</option>
                  {routes.map((route) => (
                    <option
                      key={route.routeId || route._id}
                      value={route.routeId || route._id}
                    >
                      {route.startLocation} to {route.endLocation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="p-2 border rounded w-full"
                >
                  <option value="">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  value={filters.paymentStatus}
                  onChange={handleFilterChange}
                  className="p-2 border rounded w-full"
                >
                  <option value="">All Payment Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="pl-9 p-2 border rounded w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="pl-9 p-2 border rounded w-full"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-600 flex items-center">
              <Info size={14} className="mr-1" />
              <span>
                Showing {filteredBookings.length} of {bookings.length} bookings
                with current filters
              </span>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-gray-500 mb-2">No bookings found</div>
            <p className="text-sm text-gray-400">
              {searchTerm || Object.values(filters).some((val) => val !== "")
                ? "Try adjusting your search or filters"
                : "Create a booking to get started"}
            </p>
          </div>
        ) : (
          /* Booking Table */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Booking ID
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Passenger
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Route
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Seats
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Date
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((booking) => (
                    <tr
                      key={booking.bookingId}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {booking.bookingId}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{booking.userId?.name || "N/A"}</div>
                        <div className="text-xs text-gray-500">
                          {booking.userId?.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {booking.from || "Unknown"} to {booking.to || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {booking.seatNumbers?.join(", ") || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
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
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            booking.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : booking.paymentStatus === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(booking.createdAt || booking.bookedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => showBookingDetails(booking)}
                            className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                            title="View Details"
                          >
                            <Info size={14} />
                          </button>

                          {booking.status === "confirmed" && (
                            <button
                              onClick={() => handleCancel(booking.bookingId)}
                              className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                              title="Cancel Booking"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {booking.status === "confirmed" &&
                            booking.paymentStatus === "pending" && (
                              <button
                                onClick={() =>
                                  handleUpdatePayment(booking.bookingId, "paid")
                                }
                                className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                title="Mark as Paid"
                              >
                                <CreditCard size={14} />
                              </button>
                            )}

                          {booking.status === "confirmed" && (
                            <button
                              onClick={() => openSeatCancelModal(booking)}
                              className="p-1 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200"
                              title="Cancel Seats"
                            >
                              <XSquare size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="py-3 px-4 flex flex-col sm:flex-row justify-between items-center bg-gray-50 border-t">
              <div className="text-sm text-gray-500 mb-2 sm:mb-0">
                Showing{" "}
                {Math.min(indexOfFirstItem + 1, filteredBookings.length)} to{" "}
                {Math.min(indexOfLastItem, filteredBookings.length)} of{" "}
                {filteredBookings.length} entries
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => paginate(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  First
                </button>

                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-1 rounded ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-3 py-1 bg-blue-600 text-white rounded">
                  {currentPage}
                </span>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-1 rounded ${
                    currentPage === totalPages || totalPages === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => paginate(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages || totalPages === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Last
                </button>

                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when items per page changes
                  }}
                  className="ml-2 px-2 py-1 border rounded text-sm"
                >
                  <option value={10}>10 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <h3 className="text-lg font-semibold border-b pb-3 mb-4">
                Booking Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Booking Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Booking ID:</span>
                      <span className="font-medium">
                        {selectedBooking.bookingId}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span
                        className={`font-medium ${
                          selectedBooking.status === "confirmed"
                            ? "text-green-600"
                            : selectedBooking.status === "cancelled"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {selectedBooking.status}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Payment Status:</span>
                      <span
                        className={`font-medium ${
                          selectedBooking.paymentStatus === "paid"
                            ? "text-green-600"
                            : selectedBooking.paymentStatus === "failed"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {selectedBooking.paymentStatus}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span>
                        {formatDate(
                          selectedBooking.createdAt || selectedBooking.bookedAt
                        )}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Fare Total:</span>
                      <span className="font-medium">
                        Rs. {selectedBooking.fareTotal}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Passenger Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span>{selectedBooking.userId?.name || "N/A"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span>{selectedBooking.userId?.email || "N/A"}</span>
                    </p>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Journey Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Bus Number:</span>
                      <span>
                        {selectedBooking.busId?.busNumber ||
                          selectedBooking.busNumber ||
                          "N/A"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Route:</span>
                      <span>
                        {selectedBooking.from || "Unknown"} to{" "}
                        {selectedBooking.to || "Unknown"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500">Seats:</span>
                      <span>
                        {selectedBooking.seatNumbers?.join(", ") || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                {selectedBooking.status === "confirmed" &&
                  selectedBooking.paymentStatus === "pending" && (
                    <button
                      onClick={() =>
                        handleUpdatePayment(selectedBooking.bookingId, "paid")
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                    >
                      <CreditCard size={16} className="mr-1" /> Mark as Paid
                    </button>
                  )}

                {selectedBooking.status === "confirmed" && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleCancel(selectedBooking.bookingId);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                  >
                    <Trash2 size={16} className="mr-1" /> Cancel Booking
                  </button>
                )}

                <button
                  onClick={() => {
                    const pdfDoc = new jsPDF();
                    pdfDoc.text(
                      `Booking Details: ${selectedBooking.bookingId}`,
                      20,
                      20
                    );
                    pdfDoc.setFontSize(12);

                    const fields = [
                      ["Booking ID", selectedBooking.bookingId],
                      ["Passenger", selectedBooking.userId?.name || "N/A"],
                      ["Email", selectedBooking.userId?.email || "N/A"],
                      [
                        "Bus Number",
                        selectedBooking.busId?.busNumber ||
                          selectedBooking.busNumber ||
                          "N/A",
                      ],
                      [
                        "Route",
                        `${selectedBooking.from || "Unknown"} to ${selectedBooking.to || "Unknown"}`,
                      ],
                      [
                        "Seats",
                        selectedBooking.seatNumbers?.join(", ") || "N/A",
                      ],
                      ["Status", selectedBooking.status],
                      ["Payment Status", selectedBooking.paymentStatus],
                      ["Fare Total", `Rs. ${selectedBooking.fareTotal}`],
                      [
                        "Booking Date",
                        formatDate(
                          selectedBooking.createdAt || selectedBooking.bookedAt
                        ),
                      ],
                    ];

                    let y = 40;
                    for (const [label, value] of fields) {
                      pdfDoc.text(`${label}: ${value}`, 20, y);
                      y += 10;
                    }

                    pdfDoc.save(`${selectedBooking.bookingId}_details.pdf`);
                    toast.success("Booking details exported to PDF");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                >
                  <FileText size={16} className="mr-1" /> Export Details
                </button>

                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seat Cancellation Modal */}
      {showSeatCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto relative">
            <button
              onClick={closeSeatCancelModal}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <h3 className="text-lg font-semibold border-b pb-3 mb-4">
                Cancel Seats
              </h3>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Select the seats you want to cancel for booking ID{" "}
                  <span className="font-medium">
                    {selectedBooking.bookingId}
                  </span>
                  .
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {selectedBooking.seatNumbers.map((seat) => (
                  <button
                    key={seat}
                    onClick={() => toggleSeatSelection(seat)}
                    className={`p-2 border rounded text-sm ${
                      selectedSeats.includes(seat)
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {seat}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelSelectedSeats}
                  disabled={isCancellingSeat}
                  className={`px-4 py-2 rounded text-white flex items-center ${
                    isCancellingSeat
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isCancellingSeat ? (
                    <AlertCircle size={16} className="mr-1" />
                  ) : (
                    <Check size={16} className="mr-1" />
                  )}
                  {isCancellingSeat ? "Cancelling..." : "Cancel Selected Seats"}
                </button>

                <button
                  onClick={closeSeatCancelModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <h3 className="text-lg font-semibold border-b pb-3 mb-4">
                Advanced Report Generation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Title
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="p-2 border rounded w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        checked={exportFormat === "pdf"}
                        onChange={() => setExportFormat("pdf")}
                        className="mr-1"
                      />
                      <span className="text-sm flex items-center">
                        <FileText size={14} className="mr-1" /> PDF
                      </span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value="csv"
                        checked={exportFormat === "csv"}
                        onChange={() => setExportFormat("csv")}
                        className="mr-1"
                      />
                      <span className="text-sm flex items-center">
                        <FileSpreadsheet size={14} className="mr-1" /> CSV
                      </span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value="excel"
                        checked={exportFormat === "excel"}
                        onChange={() => setExportFormat("excel")}
                        className="mr-1"
                      />
                      <span className="text-sm flex items-center">
                        <FileSpreadsheet size={14} className="mr-1" /> Excel
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Detail Level
                  </label>
                  <select
                    value={exportDetailLevel}
                    onChange={(e) => setExportDetailLevel(e.target.value)}
                    className="p-2 border rounded w-full"
                  >
                    <option value="summary">Summary (Basic Info)</option>
                    <option value="detailed">Detailed (All Fields)</option>
                    <option value="analytics">Analytics (With Stats)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Calendar
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        className="pl-9 p-2 border rounded w-full"
                        placeholder="Start Date"
                      />
                    </div>
                    <div className="relative">
                      <Calendar
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className="pl-9 p-2 border rounded w-full"
                        placeholder="End Date"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {exportFormat === "pdf" && (
                <div className="mb-6 border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-2">
                    PDF Options
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={includeLogo}
                        onChange={() => setIncludeLogo(!includeLogo)}
                        className="mr-1"
                      />
                      <span className="text-sm">Include Company Logo</span>
                    </label>

                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={includePageNumbers}
                        onChange={() =>
                          setIncludePageNumbers(!includePageNumbers)
                        }
                        className="mr-1"
                      />
                      <span className="text-sm">Include Page Numbers</span>
                    </label>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Report Layout
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="layout"
                            value="table"
                            checked={exportLayout === "table"}
                            onChange={() => setExportLayout("table")}
                            className="mr-1"
                          />
                          <span className="text-sm">Table Format</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="layout"
                            value="compact"
                            checked={exportLayout === "compact"}
                            onChange={() => setExportLayout("compact")}
                            className="mr-1"
                          />
                          <span className="text-sm">Compact</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="layout"
                            value="detailed"
                            checked={exportLayout === "detailed"}
                            onChange={() => setExportLayout("detailed")}
                            className="mr-1"
                          />
                          <span className="text-sm">Detailed</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Include Charts</h4>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={() => setIncludeCharts(!includeCharts)}
                      className="mr-1"
                    />
                    <span className="text-sm">Enable Charts</span>
                  </label>
                </div>

                {includeCharts && exportFormat === "pdf" && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value="status"
                        checked={selectedChartTypes.includes("status")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChartTypes([
                              ...selectedChartTypes,
                              "status",
                            ]);
                          } else {
                            setSelectedChartTypes(
                              selectedChartTypes.filter(
                                (type) => type !== "status"
                              )
                            );
                          }
                        }}
                        className="mr-1"
                      />
                      <span className="text-sm">Status Distribution</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value="payment"
                        checked={selectedChartTypes.includes("payment")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChartTypes([
                              ...selectedChartTypes,
                              "payment",
                            ]);
                          } else {
                            setSelectedChartTypes(
                              selectedChartTypes.filter(
                                (type) => type !== "payment"
                              )
                            );
                          }
                        }}
                        className="mr-1"
                      />
                      <span className="text-sm">Payment Status</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value="route"
                        checked={selectedChartTypes.includes("route")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChartTypes([
                              ...selectedChartTypes,
                              "route",
                            ]);
                          } else {
                            setSelectedChartTypes(
                              selectedChartTypes.filter(
                                (type) => type !== "route"
                              )
                            );
                          }
                        }}
                        className="mr-1"
                      />
                      <span className="text-sm">Top Routes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value="daily"
                        checked={selectedChartTypes.includes("daily")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChartTypes([
                              ...selectedChartTypes,
                              "daily",
                            ]);
                          } else {
                            setSelectedChartTypes(
                              selectedChartTypes.filter(
                                (type) => type !== "daily"
                              )
                            );
                          }
                        }}
                        className="mr-1"
                      />
                      <span className="text-sm">Daily Bookings</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        value="revenue"
                        checked={selectedChartTypes.includes("revenue")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChartTypes([
                              ...selectedChartTypes,
                              "revenue",
                            ]);
                          } else {
                            setSelectedChartTypes(
                              selectedChartTypes.filter(
                                (type) => type !== "revenue"
                              )
                            );
                          }
                        }}
                        className="mr-1"
                      />
                      <span className="text-sm">Revenue Analysis</span>
                    </label>
                  </div>
                )}

                {/* Chart Preview Area */}
                {includeCharts && (
                  <div className="mt-4 border rounded p-3 bg-gray-50">
                    <h5 className="text-xs text-gray-500 mb-2">
                      Chart Preview
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedChartTypes.includes("status") && (
                        <div className="bg-white p-2 rounded border">
                          <canvas ref={statusChartRef} height="120"></canvas>
                        </div>
                      )}
                      {selectedChartTypes.includes("payment") && (
                        <div className="bg-white p-2 rounded border">
                          <canvas ref={paymentChartRef} height="120"></canvas>
                        </div>
                      )}
                      {selectedChartTypes.includes("route") && (
                        <div className="bg-white p-2 rounded border">
                          <canvas ref={routeChartRef} height="120"></canvas>
                        </div>
                      )}
                      {selectedChartTypes.includes("daily") && (
                        <div className="bg-white p-2 rounded border">
                          <canvas
                            ref={dailyBookingsChartRef}
                            height="120"
                          ></canvas>
                        </div>
                      )}
                      {selectedChartTypes.includes("revenue") && (
                        <div className="bg-white p-2 rounded border">
                          <canvas ref={revenueChartRef} height="120"></canvas>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-600">
                  <Info size={14} className="inline mr-1" />
                  Report will include {filteredBookings.length} bookings
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      if (exportFormat === "pdf") {
                        generateAdvancedPdfReport();
                      } else if (exportFormat === "csv") {
                        generateAdvancedCsvReport();
                      } else if (exportFormat === "excel") {
                        generateExcelReport();
                      }
                    }}
                    disabled={isExporting || filteredBookings.length === 0}
                    className={`px-4 py-2 rounded flex items-center ${
                      isExporting || filteredBookings.length === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isExporting ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Download size={16} className="mr-1" />
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BookingManagement;
