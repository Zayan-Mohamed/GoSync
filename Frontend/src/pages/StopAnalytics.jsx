import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminLayout from "../layouts/AdminLayout";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";
import GoSyncLoader from "../components/Loader";
import { FiMapPin, FiActivity, FiList, FiFilter, FiDownload, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ImportExportCard from "../components/ImportExportCard";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const Message = ({ type, children }) => {
  const bgColor = type === 'success' ? 'bg-green-50' : type === 'warning' ? 'bg-yellow-50' : 'bg-red-50';
  const textColor = type === 'success' ? 'text-green-800' : type === 'warning' ? 'text-yellow-800' : 'text-red-800';
  const borderColor = type === 'success' ? 'border-green-200' : type === 'warning' ? 'border-yellow-200' : 'border-red-200';

  return (
    <div className={`${bgColor} ${textColor} border ${borderColor} rounded-lg p-4 mb-4`}>
      {children}
    </div>
  );
};

const StopAnalytics = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [analytics, setAnalytics] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [filter, setFilter] = useState({ routeId: "", status: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [message, setMessage] = useState(null); // { type: 'success' | 'warning' | 'error', text: string }

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [filter, API_URL]);

  useEffect(() => {
    if (analytics?.inactiveStopsList?.length > 0) {
      const timer = setInterval(() => {
        setCurrentStopIndex(current => 
          current === analytics.inactiveStopsList.length - 1 ? 0 : current + 1
        );
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [analytics?.inactiveStopsList]);

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
      setMessage({
        type: 'error',
        text: err.response?.data?.message || "Failed to fetch stop analytics"
      });
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  // Function to handle file import
  const handleImport = async (file, fileExtension) => {
    if (!file) {
      setMessage({
        type: 'warning',
        text: 'Please select a file first'
      });
      return;
    }

    const allowedTypes = {
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      csv: 'text/csv',
      json: 'application/json'
    };
    
    // Check if file type is allowed
    const isValidType = Object.values(allowedTypes).includes(file.type) || 
                      (fileExtension === 'json' && file.type === 'application/json') ||
                      (fileExtension === 'csv' && file.type === 'text/csv');
    
    if (!isValidType) {
      setMessage({
        type: 'error',
        text: 'Please upload a valid Excel, CSV, or JSON file'
      });
      return;
    }

    setImportLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let formattedData = [];
          
          // Process based on file type
          if (fileExtension === 'json') {
            const jsonData = JSON.parse(e.target.result);
            formattedData = Array.isArray(jsonData) ? jsonData : [jsonData];
          } else {
            // For Excel and CSV
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Keep the original column names intact
            formattedData = jsonData;
          }

          if (formattedData.length === 0) {
            setMessage({
              type: 'warning',
              text: 'No valid stop data found in file'
            });
            return;
          }

          // Format the data to match the expected structure
          const processedData = formattedData.map(item => ({
            stopName: item.stopName || item["Stop Name"] || item.name || item.Name || "",
            status: (item.status || item.Status || 'active').toLowerCase()
          })).filter(item => item.stopName && item.stopName.trim() !== "");

          if (processedData.length === 0) {
            setMessage({
              type: 'warning',
              text: 'No valid stop data found after processing'
            });
            return;
          }

          const response = await axios.post(`${API_URL}/api/stops/bulk`, processedData);
          
          let messageText = '';
          if (response.data.createdCount > 0) {
            messageText = `Successfully imported ${response.data.createdCount} stops. `;
          }
          
          if (response.data.duplicates?.length > 0) {
            messageText += `${response.data.duplicates.length} stops were skipped (already exist): ${response.data.duplicates.join(', ')}`;
          }

          setMessage({
            type: response.data.createdCount > 0 ? 'success' : 'warning',
            text: messageText
          });
          
          // Refresh data
          fetchData();
        } catch (error) {
          console.error('Import error:', error);
          
          if (error.response?.status === 409) {
            setMessage({
              type: 'warning',
              text: `${error.response.data.error}${error.response.data.duplicates ? `: ${error.response.data.duplicates.join(', ')}` : ''}`
            });
          } else {
            setMessage({
              type: 'error',
              text: error.response?.data?.message || error.message || 'Failed to import stops'
            });
          }
        }
      };
      
      if (fileExtension === 'json') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      console.error('File processing error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to process file'
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Function to handle data export
  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      // Fetch all stops data
      const response = await axios.get(`${API_URL}/api/stops/get`);
      const stops = response.data.stops || [];
      
      if (stops.length === 0) {
        setMessage({
          type: 'warning',
          text: 'No stops data to export'
        });
        setExportLoading(false);
        return;
      }
      
      // Format the data for export - only include stopName and status
      // Use the same column names as expected by the import function
      const formattedData = stops.map(stop => ({
        "Stop Name": stop.stopName,
        "Status": stop.status
      }));
      
      // Export based on selected format
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `stops_export_${timestamp}`;
      
      switch (format) {
        case 'xlsx':
          const workbook = XLSX.utils.book_new();
          const worksheet = XLSX.utils.json_to_sheet(formattedData);
          XLSX.utils.book_append_sheet(workbook, worksheet, "Stops");
          XLSX.writeFile(workbook, `${filename}.xlsx`);
          break;
          
        case 'csv':
          const csvWorkbook = XLSX.utils.book_new();
          const csvWorksheet = XLSX.utils.json_to_sheet(formattedData);
          XLSX.utils.book_append_sheet(csvWorkbook, csvWorksheet, "Stops");
          XLSX.writeFile(csvWorkbook, `${filename}.csv`, { bookType: 'csv' });
          break;
          
        case 'json':
          const jsonBlob = new Blob([JSON.stringify(formattedData, null, 2)], { type: 'application/json' });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const link = document.createElement('a');
          link.href = jsonUrl;
          link.download = `${filename}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(jsonUrl);
          break;
          
        default:
          setMessage({
            type: 'error',
            text: 'Unsupported export format'
          });
          setExportLoading(false);
          return;
      }
      
      setMessage({
        type: 'success',
        text: `Successfully exported stops data as ${format.toUpperCase()}`
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to export stops data'
      });
    } finally {
      setExportLoading(false);
    }
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

  // Pagination calculation
  const indexOfLastStop = currentPage * itemsPerPage;
  const indexOfFirstStop = indexOfLastStop - itemsPerPage;
  const currentStops = analytics.stopsData?.slice(indexOfFirstStop, indexOfLastStop) || [];
  const totalPages = Math.ceil((analytics.stopsData?.length || 0) / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 max-w-7xl mx-auto"
      >
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Message type={message.type}>{message.text}</Message>
          </motion.div>
        )}

        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#FFE082] to-[#FFC107] rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-[#E65100] mb-2">Stop Analytics</h2>
          <p className="text-gray-700">Monitor and analyze stop performance and statistics</p>
        </div>
        
        {/* Import/Export Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <ImportExportCard 
            onImport={handleImport}
            onExport={handleExport}
            importLoading={importLoading}
            exportLoading={exportLoading}
          />
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
                <FiMapPin className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Stops</p>
                <p className="text-2xl font-bold text-gray-800">{analytics.totalStops}</p>
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
                <FiActivity className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Stops</p>
                <p className="text-2xl font-bold text-gray-800">{analytics.activeStops}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <FiList className="w-6 h-6" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Inactive Stops</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStopIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg font-bold text-gray-800 truncate"
                  >
                    {analytics?.inactiveStopsList?.[currentStopIndex]?.stopName || "No inactive stops"}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mb-8 bg-white p-6 rounded-lg shadow-lg"
        >
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Route</label>
              <select
                name="routeId"
                value={filter.routeId}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-deepOrange transition-all duration-200"
              >
                <option value="">All Routes</option>
                {routes.map((route) => (
                  <option key={route._id} value={route._id}>
                    {route.routeName} ({route.startLocation} to {route.endLocation})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
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

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  name="startDate"
                  value={filter.startDate}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-deepOrange transition-all duration-200"
                />
                <input
                  type="date"
                  name="endDate"
                  value={filter.endDate}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-deepOrange focus:border-deepOrange transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-102 transition-all duration-300"
          >
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Stop Status Distribution</h3>
            <div className="h-64">
              <Pie
                data={statusPieData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                    tooltip: { 
                      backgroundColor: "#2D3748",
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 13 },
                      padding: 12,
                      displayColors: true,
                      callbacks: {
                        label: (context) => {
                          const value = context.parsed;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = ((value * 100) / total).toFixed(1);
                          return `${context.label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  },
                  animation: {
                    animateScale: true,
                    animateRotate: true
                  }
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
            <h3 className="text-lg font-medium mb-4 text-gray-800 border-b pb-2">Stops by Route</h3>
            <div className="h-64">
              <Bar
                data={stopsByRouteBarData}
                options={{
                  responsive: true,
                  scales: { 
                    y: { 
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  },
                  plugins: {
                    tooltip: { 
                      backgroundColor: "#2D3748",
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 13 },
                      padding: 12
                    }
                  },
                  animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                  }
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Stops Overview Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-800">Top Connected Stops</h3>
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstStop + 1} to {Math.min(indexOfLastStop, analytics.stopsData?.length || 0)} of {analytics.stopsData?.length || 0} stops
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gradient-to-r from-[#FFE082] to-[#FFC107]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Stop Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Routes Connected
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentStops.map((stop, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stop.stopName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        stop.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {stop.status.charAt(0).toUpperCase() + stop.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{stop.routeCount} routes</span>
                        {stop.routeCount > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {stop.routes.slice(0, 3).map(route => route.routeName).join(', ')}
                            {stop.routes.length > 3 && ' ...'}
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4 py-3 border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                    ${currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                    ${currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium
                        ${currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300'
                        }`}
                    >
                      <span className="sr-only">Previous</span>
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      const isCurrentPage = pageNumber === currentPage;
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                            ${isCurrentPage
                              ? 'z-10 bg-gradient-to-r from-[#FFE082] to-[#FFC107] text-gray-700 border-[#FFC107]'
                              : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300'
                            }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium
                        ${currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300'
                        }`}
                    >
                      <span className="sr-only">Next</span>
                      <FiChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
};

export default StopAnalytics;