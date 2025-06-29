import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import { Pie, Bar, Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title
} from "chart.js";
import GoSyncLoader from "../components/Loader";
import { FiMapPin, FiTrendingUp, FiGlobe, FiDownload } from "react-icons/fi";
import EmbeddedRouteMap from "../components/EmbeddedRouteMap";
import { motion } from "framer-motion";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  Title
);

const RouteAnalytics = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ status: "", startDate: "", endDate: "" });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [reportFilter, setReportFilter] = useState({
    reportType: "route_modification",
    routeId: "",
    startDate: "",
    endDate: "",
    format: "pdf",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching route analytics...");
        const response = await axios.get(`${API_URL}/api/routes/route-analytics`, {
          params: filter,
          withCredentials: true
        });
        console.log("Analytics data received:", response.data);
        setAnalytics(response.data);
      } catch (err) {
        console.error("Error fetching route analytics:", err);
        setError(err.response?.data?.message || "Failed to fetch route analytics");
        toast.error(err.response?.data?.message || "Failed to fetch route analytics");
      } finally {
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

  const handleRouteChange = (e) => {
    const routeId = e.target.value;
    if (routeId === "") {
      setSelectedRoute(null);
    } else {
      const route = analytics.routes.find((r) => r._id === routeId);
      setSelectedRoute(route);
    }
  };

  const handleReportFilterChange = (e) => {
    const { name, value } = e.target;
    setReportFilter((prev) => ({ ...prev, [name]: value }));
  };

  const generateReport = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/reports/generate`,
        reportFilter,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportFilter.reportType}_${new Date().toISOString().split('T')[0]}.${reportFilter.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report generated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    }
  };

  const getMapCenter = (route) => {
    if (!route) return [20.5937, 78.9629];

    const points = [];
    const startCoords =
      route.startLocationCoordinates &&
      route.startLocationCoordinates.latitude &&
      route.startLocationCoordinates.longitude
        ? [route.startLocationCoordinates.latitude, route.startLocationCoordinates.longitude]
        : null;

    const endCoords =
      route.endLocationCoordinates &&
      route.endLocationCoordinates.latitude &&
      route.endLocationCoordinates.longitude
        ? [route.endLocationCoordinates.latitude, route.endLocationCoordinates.longitude]
        : null;

    if (startCoords) points.push(startCoords);
    if (endCoords) points.push(endCoords);

    if (route.stops && route.stops.length > 0) {
      route.stops.forEach((stop) => {
        if (stop.stop && stop.stop.latitude && stop.stop.longitude) {
          points.push([stop.stop.latitude, stop.stop.longitude]);
        }
      });
    }

    if (points.length === 0) return [20.5937, 78.9629];
    if (points.length === 1) return points[0];

    const latSum = points.reduce((sum, point) => sum + point[0], 0);
    const lngSum = points.reduce((sum, point) => sum + point[1], 0);
    return [latSum / points.length, lngSum / points.length];
  };

  const renderRouteOnMap = (route) => {
    const points = [];
    const startCoords =
      route.startLocationCoordinates &&
      route.startLocationCoordinates.latitude &&
      route.startLocationCoordinates.longitude
        ? [route.startLocationCoordinates.latitude, route.startLocationCoordinates.longitude]
        : null;

    const endCoords =
      route.endLocationCoordinates &&
      route.endLocationCoordinates.latitude &&
      route.endLocationCoordinates.longitude
        ? [route.endLocationCoordinates.latitude, route.endLocationCoordinates.longitude]
        : null;

    if (startCoords) points.push(startCoords);

    if (route.stops && route.stops.length > 0) {
      const sortedStops = [...route.stops].sort((a, b) => a.order - b.order);
      sortedStops.forEach((stop) => {
        if (stop.stop && stop.stop.latitude && stop.stop.longitude) {
          points.push([stop.stop.latitude, stop.stop.longitude]);
        }
      });
    }

    if (endCoords) points.push(endCoords);

    return (
      <>
        {startCoords && (
          <Marker position={startCoords}>
            <Popup>
              <div>
                <strong>Start:</strong> {route.startLocation || "Starting Point"}
              </div>
            </Popup>
          </Marker>
        )}
        {route.stops &&
          route.stops
            .sort((a, b) => a.order - b.order)
            .map((stop, index) =>
              stop.stop && stop.stop.latitude && stop.stop.longitude ? (
                <Marker
                  key={stop.stopId}
                  position={[stop.stop.latitude, stop.stop.longitude]}
                >
                  <Popup>
                    <div>
                      <strong>Stop {index + 1}:</strong> {stop.stopName || `Stop ${index + 1}`}
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}
        {endCoords && (
          <Marker position={endCoords}>
            <Popup>
              <div>
                <strong>End:</strong> {route.endLocation || "Ending Point"}
              </div>
            </Popup>
          </Marker>
        )}
        {points.length > 1 && (
          <Polyline positions={points} color="blue" weight={4} opacity={0.7} />
        )}
      </>
    );
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex justify-center items-center min-h-screen">
          <GoSyncLoader />
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded relative">
            No route data available
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Add default values and null checks for the chart data
  const statusPieData = {
    labels: ["Active", "Inactive"],
    datasets: [
      {
        data: [analytics?.activeRoutes || 0, analytics?.inactiveRoutes || 0],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#FF6384"],
      },
    ],
  };

  const bookingsByRouteBarData = {
    labels: analytics?.bookingsByRoute?.map((r) => r.routeName) || ["No Data"],
    datasets: [
      {
        label: "Bookings",
        data: analytics?.bookingsByRoute?.map((r) => r.bookingCount) || [0],
        backgroundColor: "#4BC0C0",
      },
    ],
  };

  const distanceBins = [
    { label: "0-100 km", min: 0, max: 100, count: 0 },
    { label: "100-500 km", min: 100, max: 500, count: 0 },
    { label: "500-1000 km", min: 500, max: 1000, count: 0 },
    { label: ">1000 km", min: 1000, max: Infinity, count: 0 },
  ];

  // Add null check for routes
  (analytics?.routes || []).forEach((route) => {
    const distance = route.totalDistance || 0;
    const bin = distanceBins.find((bin) => distance >= bin.min && distance < bin.max);
    if (bin) bin.count += 1;
  });

  const distanceDistributionData = {
    labels: distanceBins.map((bin) => bin.label),
    datasets: [
      {
        label: "Number of Routes",
        data: distanceBins.map((bin) => bin.count),
        backgroundColor: "#FFCE56",
      },
    ],
  };

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 max-w-7xl mx-auto"
      >
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#FFE082] to-[#FFC107] rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-[#E65100] mb-2">Route Analytics</h2>
          <p className="text-gray-700">Monitor and analyze route performance and statistics</p>
        </div>

        {/* Report Generation Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Generate Report</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Report Type</label>
              <select
                name="reportType"
                value={reportFilter.reportType}
                onChange={handleReportFilterChange}
                className="mt-1 p-2 border rounded-md w-full focus:ring-deepOrange focus:border-deepOrange"
              >
                <option value="route_modification">Route Modification Report</option>
                <option value="route_performance">Route Performance Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Route</label>
              <select
                name="routeId"
                value={reportFilter.routeId}
                onChange={handleReportFilterChange}
                className="mt-1 p-2 border rounded-md w-full focus:ring-deepOrange focus:border-deepOrange"
              >
                <option value="">All Routes</option>
                {analytics.routes.map((route) => (
                  <option key={route._id} value={route._id}>
                    {route.routeName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={reportFilter.startDate}
                onChange={handleReportFilterChange}
                className="mt-1 p-2 border rounded-md w-full focus:ring-deepOrange focus:border-deepOrange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                name="endDate"
                value={reportFilter.endDate}
                onChange={handleReportFilterChange}
                className="mt-1 p-2 border rounded-md w-full focus:ring-deepOrange focus:border-deepOrange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Format</label>
              <select
                name="format"
                value={reportFilter.format}
                onChange={handleReportFilterChange}
                className="mt-1 p-2 border rounded-md w-full focus:ring-deepOrange focus:border-deepOrange"
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={generateReport}
                className="w-full p-2 bg-deepOrange text-white rounded-md hover:bg-orange-600 flex items-center justify-center"
              >
                <FiDownload className="mr-2" /> Generate Report
              </button>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FiGlobe className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Routes</p>
                <p className="text-2xl font-bold text-gray-800">{analytics?.totalRoutes || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FiMapPin className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Most Popular Route</p>
                <p className="text-lg font-bold text-gray-800 truncate">
                  {analytics?.mostPopularRoute?.routeName || "No data"}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <FiTrendingUp className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Stops per Route</p>
                <p className="text-2xl font-bold text-gray-800">
                  {analytics?.avgStopsPerRoute ? analytics.avgStopsPerRoute.toFixed(1) : "0.0"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mb-8 bg-white rounded-lg shadow-lg p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={filter.status}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-deepOrange transition-all duration-200"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filter.startDate}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-deepOrange transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filter.endDate}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-deepOrange transition-all duration-200"
              />
            </div>
          </div>
        </motion.div>

        {/* Charts - First Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-102 transition-all duration-300"
          >
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Route Status Distribution</h3>
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
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-102 transition-all duration-300"
          >
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Bookings by Route</h3>
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
          </motion.div>
        </div>

        {/* Charts - Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-102 transition-all duration-300"
          >
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Route Distance Distribution</h3>
            <div className="h-64">
              <Bar
                data={distanceDistributionData}
                options={{
                  responsive: true,
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: "Number of Routes" } },
                    x: { title: { display: true, text: "Distance (km)" } },
                  },
                  plugins: { tooltip: { backgroundColor: "#2D3748" } },
                }}
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-102 transition-all duration-300"
          >
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Route Map</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Route</label>
              <select
                value={selectedRoute?._id || ""}
                onChange={handleRouteChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-deepOrange transition-all duration-200"
              >
                <option value="">Select a route</option>
                {analytics.routes.map((route) => (
                  <option key={route._id} value={route._id}>
                    {route.routeName}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative h-64">
              <EmbeddedRouteMap route={selectedRoute} />
            </div>
          </motion.div>
        </div>

        {/* Top Routes Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-medium mb-6 text-gray-800">Top Routes by Bookings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gradient-to-r from-[#FFE082] to-[#FFC107]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Route Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Stops
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Booking Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(analytics?.topRoutes || []).slice(0, 5).map((route, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
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
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
};

export default RouteAnalytics;