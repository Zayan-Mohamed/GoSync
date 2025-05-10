import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import Loader from "../components/Loader";
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
} from "chart.js";
import {
  Download,
  RefreshCw,
  Filter,
  Calendar,
  X,
  FileText,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title
);

const SeatAnalytics = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [analytics, setAnalytics] = useState(null);
  const [buses, setBuses] = useState([]);
  const [filter, setFilter] = useState({
    busId: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const analyticsRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, busesRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/seat-analytics`, {
            params: filter,
            withCredentials: true,
          }),
          axios.get(`${API_URL}/api/buses/buses`, { withCredentials: true }),
        ]);
        setAnalytics(analyticsRes.data);
        setBuses(busesRes.data);
        toast.success("Seat analytics data refreshed");
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
      default:
        break;
    }

    setFilter({
      ...filter,
      startDate: startDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    });
    setLoading(true);
  };

  const clearFilters = () => {
    setFilter({ busId: "", startDate: "", endDate: "" });
    setLoading(true);
  };

  const handleExportPDF = async () => {
    if (!analyticsRef.current) return;

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
      pdf.text("GoSync Seat Analytics Report", pdfWidth / 2, 15, {
        align: "center",
      });
      pdf.setFontSize(12);
      const dateText = `Generated on: ${new Date().toLocaleDateString()}`;
      pdf.text(dateText, pdfWidth / 2, 22, { align: "center" });

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );
      pdf.save("gosync-seat-analytics.pdf");

      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleAdvancedExportPDF = async () => {
    try {
      toast.info("Preparing advanced PDF export...");

      // Create PDF document
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Header
      pdf.setFillColor(35, 47, 62);
      pdf.rect(0, 0, pageWidth, 25, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text("GoSync Seat Analytics - Detailed Report", pageWidth / 2, 15, {
        align: "center",
      });

      // Reset text color
      pdf.setTextColor(0, 0, 0);

      // Report metadata
      yPos += 30;
      pdf.setFontSize(12);
      pdf.text(
        `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        margin,
        yPos
      );

      let filterText = "Filters: ";
      if (filter.busId) {
        const selectedBus = buses.find((b) => b._id === filter.busId);
        filterText += `Bus: ${selectedBus ? selectedBus.busNumber : filter.busId}`;
      } else {
        filterText += "All buses";
      }

      if (filter.startDate || filter.endDate) {
        filterText += filter.startDate ? `, From: ${filter.startDate}` : "";
        filterText += filter.endDate ? `, To: ${filter.endDate}` : "";
      }

      yPos += 8;
      pdf.text(filterText, margin, yPos);

      // Summary section
      yPos += 15;
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text("1. Summary Statistics", margin, yPos);
      pdf.setFont(undefined, "normal");

      yPos += 10;
      const summaryData = [
        ["Total Seats", analytics.totalSeats.toString()],
        ["Booked Seats", analytics.bookedSeats.toString()],
        ["Reserved Seats", analytics.reservedSeats.toString()],
        ["Available Seats", analytics.availableSeats.toString()],
        ["Occupancy Rate", analytics.occupancyRate],
        ["Avg. Reservation Time", `${analytics.avgReservationTime} minutes`],
      ];

      autoTable(pdf, {
        startY: yPos,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        margin: { top: yPos, right: margin, bottom: 0, left: margin },
      });

      // Bus occupancy section
      yPos = pdf.lastAutoTable.finalY + 15;
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text("2. Bus Occupancy Breakdown", margin, yPos);
      pdf.setFont(undefined, "normal");

      yPos += 10;
      autoTable(pdf, {
        startY: yPos,
        head: [
          [
            "Bus Number",
            "Total Seats",
            "Booked",
            "Available",
            "Occupancy Rate",
          ],
        ],
        body: analytics.byBus.map((bus) => [
          bus.busNumber,
          bus.total.toString(),
          bus.booked.toString(),
          bus.available.toString(),
          `${((bus.booked / bus.total) * 100).toFixed(1)}%`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [46, 204, 113], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: {
          0: { cellWidth: 40 },
          4: { halign: "center" },
        },
        margin: { top: yPos, right: margin, bottom: 0, left: margin },
      });

      // Check if we need a new page for distribution chart
      if (pdf.lastAutoTable.finalY > pageHeight - 100) {
        pdf.addPage();
        yPos = margin;
      } else {
        yPos = pdf.lastAutoTable.finalY + 15;
      }

      // Seat distribution section
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text("3. Seat Status Distribution", margin, yPos);
      pdf.setFont(undefined, "normal");

      yPos += 10;
      // Create distribution table
      const totalSeats = analytics.totalSeats || 0;
      const bookedPercentage =
        totalSeats > 0
          ? (((analytics.bookedSeats || 0) / totalSeats) * 100).toFixed(1)
          : 0;
      const reservedPercentage =
        totalSeats > 0
          ? (((analytics.reservedSeats || 0) / totalSeats) * 100).toFixed(1)
          : 0;
      const availablePercentage =
        totalSeats > 0
          ? (((analytics.availableSeats || 0) / totalSeats) * 100).toFixed(1)
          : 0;

      const distributionData = [
        ["Booked", analytics.bookedSeats.toString(), `${bookedPercentage}%`],
        [
          "Reserved",
          analytics.reservedSeats.toString(),
          `${reservedPercentage}%`,
        ],
        [
          "Available",
          analytics.availableSeats.toString(),
          `${availablePercentage}%`,
        ],
        ["Total", totalSeats.toString(), "100%"],
      ];

      autoTable(pdf, {
        startY: yPos,
        head: [["Status", "Seats", "Percentage"]],
        body: distributionData,
        theme: "striped",
        headStyles: { fillColor: [211, 84, 0], textColor: [255, 255, 255] },
        margin: { top: yPos, right: margin, bottom: 0, left: margin },
      });

      // Risk assessment section
      yPos = pdf.lastAutoTable.finalY + 15;

      if (yPos > pageHeight - 80) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text("4. Occupancy Risk Assessment", margin, yPos);
      pdf.setFont(undefined, "normal");

      yPos += 10;
      // Count buses by occupancy level
      const highOccupancy = analytics.byBus.filter(
        (bus) => (bus.booked / bus.total) * 100 > 80
      ).length;
      const mediumOccupancy = analytics.byBus.filter(
        (bus) =>
          (bus.booked / bus.total) * 100 <= 80 &&
          (bus.booked / bus.total) * 100 > 50
      ).length;
      const lowOccupancy = analytics.byBus.filter(
        (bus) => (bus.booked / bus.total) * 100 <= 50
      ).length;

      const riskData = [
        ["High (>80%)", highOccupancy.toString(), "Limited seat availability"],
        [
          "Medium (50%-80%)",
          mediumOccupancy.toString(),
          "Moderate seat availability",
        ],
        ["Low (<50%)", lowOccupancy.toString(), "Good seat availability"],
      ];

      autoTable(pdf, {
        startY: yPos,
        head: [["Risk Level", "# of Buses", "Status"]],
        body: riskData,
        theme: "striped",
        headStyles: { fillColor: [142, 68, 173], textColor: [255, 255, 255] },
        margin: { top: yPos, right: margin, bottom: 0, left: margin },
        styles: { halign: "center" },
        columnStyles: {
          2: { halign: "left" },
        },
      });

      // Add footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `GoSync Bus System - Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      pdf.save("gosync-seat-analytics-detailed.pdf");
      toast.success("Advanced PDF report exported successfully!");
    } catch (error) {
      console.error("Advanced PDF export error:", error);
      toast.error("Failed to export advanced PDF report");
    }
  };

  const refreshData = () => {
    setLoading(true);
    setFilter({ ...filter }); // Trigger a re-fetch
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="p-6">
          <Loader />
        </div>
      </AdminLayout>
    );
  if (!analytics)
    return (
      <AdminLayout>
        <div className="p-6">No data available</div>
      </AdminLayout>
    );

  const pieData = {
    labels: ["Booked", "Reserved", "Available"],
    datasets: [
      {
        data: [
          analytics.bookedSeats || 0,
          analytics.reservedSeats || 0,
          analytics.availableSeats || 0,
        ],
        backgroundColor: ["#FF6384", "#FFCE56", "#36A2EB"],
        hoverBackgroundColor: ["#FF4567", "#EDBC45", "#2490D9"],
        borderWidth: 1,
        borderColor: "#fff",
      },
    ],
  };

  const barData = {
    labels: analytics.byBus.length
      ? analytics.byBus.map((b) => b.busNumber)
      : ["No Data"],
    datasets: [
      {
        label: "Booked Seats",
        data: analytics.byBus.length
          ? analytics.byBus.map((b) => b.booked)
          : [0],
        backgroundColor: "#FF6384",
      },
      {
        label: "Available Seats",
        data: analytics.byBus.length
          ? analytics.byBus.map((b) => b.available)
          : [0],
        backgroundColor: "#36A2EB",
      },
    ],
  };

  // Calculate percentages for the occupancy stats
  const totalSeats = analytics.totalSeats || 0;
  const bookedPercentage =
    totalSeats > 0
      ? (((analytics.bookedSeats || 0) / totalSeats) * 100).toFixed(1)
      : 0;
  const reservedPercentage =
    totalSeats > 0
      ? (((analytics.reservedSeats || 0) / totalSeats) * 100).toFixed(1)
      : 0;
  const availablePercentage =
    totalSeats > 0
      ? (((analytics.availableSeats || 0) / totalSeats) * 100).toFixed(1)
      : 0;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold">Seat Analytics Dashboard</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              <Filter size={16} className="mr-1" />{" "}
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={refreshData}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
            >
              <RefreshCw size={16} className="mr-1" /> Refresh Data
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
            >
              <Download size={16} className="mr-1" /> Export PDF
            </button>
            <button
              onClick={handleAdvancedExportPDF}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              <FileText size={16} className="mr-1" /> Advanced Export
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
            <div className="flex flex-wrap items-end gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bus
                </label>
                <select
                  name="busId"
                  value={filter.busId}
                  onChange={handleFilterChange}
                  className="p-2 border rounded min-w-[200px]"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filter.startDate}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filter.endDate}
                  onChange={handleFilterChange}
                  className="p-2 border rounded"
                />
              </div>
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-gray-600 rounded hover:bg-gray-700 h-fit"
              >
                <X size={16} className="mr-1" /> Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-sm font-medium text-gray-700 mr-2 flex items-center">
                <Calendar size={14} className="mr-1" /> Quick Select:
              </span>
              <button
                onClick={() => handleDateRangeSelect("today")}
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                Today
              </button>
              <button
                onClick={() => handleDateRangeSelect("yesterday")}
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                Yesterday
              </button>
              <button
                onClick={() => handleDateRangeSelect("week")}
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => handleDateRangeSelect("month")}
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                Last 30 Days
              </button>
            </div>
          </div>
        )}

        {/* Analytics Content */}
        <div id="analytics-section" ref={analyticsRef}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-6 bg-white rounded-lg shadow transition-transform hover:scale-[1.02] border-l-4 border-blue-500">
              <p className="text-lg font-semibold text-gray-600">Total Seats</p>
              <p className="text-3xl font-bold text-blue-600">
                {analytics.totalSeats.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Current capacity in the system
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow transition-transform hover:scale-[1.02] border-l-4 border-green-500">
              <p className="text-lg font-semibold text-gray-600">
                Occupancy Rate
              </p>
              <p className="text-3xl font-bold text-green-600">
                {analytics.occupancyRate}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Booked: {bookedPercentage}%, Reserved: {reservedPercentage}%
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow transition-transform hover:scale-[1.02] border-l-4 border-amber-500">
              <p className="text-lg font-semibold text-gray-600">
                Avg. Reservation Time
              </p>
              <p className="text-3xl font-bold text-amber-600">
                {analytics.avgReservationTime} mins
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Before confirming booking
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4 text-gray-700">
                Seat Status Distribution
              </h3>
              <div className="h-[300px] flex justify-center">
                <div style={{ maxWidth: "300px", width: "100%" }}>
                  <Doughnut
                    data={pieData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "right" },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              const label = context.label || "";
                              const value = context.raw || 0;
                              const percentage =
                                totalSeats > 0
                                  ? ((value / totalSeats) * 100).toFixed(1) +
                                    "%"
                                  : "0%";
                              return `${label}: ${value} (${percentage})`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50">
                  <span className="text-xl font-bold text-red-500">
                    {analytics.bookedSeats}
                  </span>
                  <span className="text-xs text-gray-500">Booked</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50">
                  <span className="text-xl font-bold text-yellow-500">
                    {analytics.reservedSeats}
                  </span>
                  <span className="text-xs text-gray-500">Reserved</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50">
                  <span className="text-xl font-bold text-blue-500">
                    {analytics.availableSeats}
                  </span>
                  <span className="text-xs text-gray-500">Available</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4 text-gray-700">
                Seats by Bus
              </h3>
              <div className="h-[300px]">
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "top" },
                      title: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        stacked: false,
                        ticks: { precision: 0 },
                      },
                      x: {
                        stacked: false,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-700">
              Bus Seat Details
            </h3>
            <div className="overflow-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-500">
                      Bus
                    </th>
                    <th className="py-2 px-4 text-center text-sm font-medium text-gray-500">
                      Total Seats
                    </th>
                    <th className="py-2 px-4 text-center text-sm font-medium text-gray-500">
                      Booked
                    </th>
                    <th className="py-2 px-4 text-center text-sm font-medium text-gray-500">
                      Available
                    </th>
                    <th className="py-2 px-4 text-center text-sm font-medium text-gray-500">
                      Occupancy
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.byBus.map((bus) => {
                    const occupancyRate = (
                      (bus.booked / bus.total) *
                      100
                    ).toFixed(1);
                    return (
                      <tr key={bus._id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 text-sm text-gray-900">
                          {bus.busNumber}
                        </td>
                        <td className="py-2 px-4 text-center text-sm text-gray-900">
                          {bus.total}
                        </td>
                        <td className="py-2 px-4 text-center text-sm text-gray-900">
                          {bus.booked}
                        </td>
                        <td className="py-2 px-4 text-center text-sm text-gray-900">
                          {bus.available}
                        </td>
                        <td className="py-2 px-4 text-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                occupancyRate > 80
                                  ? "bg-red-600"
                                  : occupancyRate > 50
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${occupancyRate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {occupancyRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SeatAnalytics;
