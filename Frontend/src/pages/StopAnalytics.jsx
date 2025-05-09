import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer,toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";
import GoSyncLoader from "../components/Loader";
import { FiMapPin, FiActivity, FiList } from "react-icons/fi";
import * as XLSX from "xlsx";
import ImportExportCard from "../components/ImportExportCard"; // Adjust the import path as needed

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const StopAnalytics = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [analytics, setAnalytics] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [filter, setFilter] = useState({ routeId: "", status: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter, API_URL]);

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

 // Function to handle file import
 const handleImport = async (file, fileExtension) => {
  if (!file) {
    toast.error('Please select a file first', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
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
    toast.error('Please upload a valid Excel, CSV, or JSON file', {
      position: "top-right",
      autoClose: 5000,
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
          toast.error('No valid stop data found in file', {
            position: "top-right",
            autoClose: 5000,
          });
          throw new Error('No valid stop data found in file');
        }

        // Send to backend
        const response = await axios.post(`${API_URL}/api/stops/bulk`, formattedData);
        
        // Use direct DOM call for toast as a fallback
        console.log('Import successful:', response.data);
        
        toast.success(`Successfully imported ${response.data.createdCount} stops`, {
          position: "top-right",
          autoClose: 5000,
        });
        
        // Show duplicates message if any
        if (response.data.duplicates && response.data.duplicates.length > 0) {
          setTimeout(() => {
            toast.warning(`${response.data.duplicates.length} stops already exist and were skipped`, {
              position: "top-right",
              autoClose: 5000,
            });
          }, 300);
        }
        
        // Refresh data
        fetchData();
      } catch (error) {
        console.error('Import error:', error);
        
        if (error.response?.data?.duplicates) {
          toast.warning(`Some stops already exist: ${error.response.data.duplicates.join(', ')}`, {
            position: "top-right",
            autoClose: 5000,
          });
        } else {
          toast.error(error.response?.data?.error || error.message || 'Failed to import stops', {
            position: "top-right",
            autoClose: 5000,
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
    toast.error('Failed to process file', {
      position: "top-right",
      autoClose: 5000,
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
        toast.warning('No stops data to export', {
          position: "top-right",
          autoClose: 5000,
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
          toast.error('Unsupported export format', {
            position: "top-right",
            autoClose: 5000,
          });
          setExportLoading(false);
          return;
      }
      
      toast.success(`Successfully exported stops data as ${format.toUpperCase()}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export stops data', {
        position: "top-right",
        autoClose: 5000,
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

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Stop Analytics</h2>
        </div>
        
        {/* Import/Export Card */}
        <div className="mb-6">
          <ImportExportCard 
            onImport={handleImport}
            onExport={handleExport}
            importLoading={importLoading}
            exportLoading={exportLoading}
          />
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