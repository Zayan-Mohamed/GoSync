import { useState, useEffect } from "react";
import axios from "axios";
import { FiCalendar, FiClock, FiMapPin, FiTruck } from "react-icons/fi";
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import Sidebar from "../components/Sidebar";

const ScheduleAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalSchedules: 0,
    routeDistribution: {},
    busUtilization: {},
    weekdayDistribution: {},
    averageDuration: 0,
  });
  const [lastUpdated, setLastUpdated] = useState(0); // Initialize to 0 instead of current time

  const API_URL = import.meta.env.VITE_API_URL;

  // Move fetchSchedules outside useEffect so it can be called from multiple places
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/schedules`, {
        withCredentials: true,
      });
      
      // Filter out past schedules - only keep present and future schedules
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const currentAndFutureSchedules = response.data.filter(schedule => {
        const scheduleDate = new Date(schedule.departureDate);
        scheduleDate.setHours(0, 0, 0, 0); // Remove time part for fair comparison
        return scheduleDate >= today;
      });
      
      setSchedules(currentAndFutureSchedules);
      processAnalytics(currentAndFutureSchedules);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError("Failed to fetch schedule data");
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSchedules();
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchSchedules();
    
    // On mount, also check if there's already a timestamp in localStorage
    const storedLastUpdated = localStorage.getItem('schedulesLastUpdated');
    if (storedLastUpdated) {
      setLastUpdated(parseInt(storedLastUpdated));
    }
  }, []);

  // Listen for schedule changes via localStorage
  useEffect(() => {
    // Function to check local storage for updates
    const checkForUpdates = () => {
      const storedLastUpdated = localStorage.getItem('schedulesLastUpdated');
      if (storedLastUpdated && parseInt(storedLastUpdated) > lastUpdated) {
        console.log('Analytics detected update:', parseInt(storedLastUpdated), '>', lastUpdated);
        setLastUpdated(parseInt(storedLastUpdated));
        fetchSchedules();
      }
    };
    
    // Check for updates every 2 seconds (reduced from 5 for more responsive updates)
    const intervalId = setInterval(checkForUpdates, 2000);
    
    // Also check when the component becomes visible
    window.addEventListener('focus', checkForUpdates);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', checkForUpdates);
    };
  }, [lastUpdated]);


  const processAnalytics = (scheduleData) => {
    // Initialize analytics object
    const routeDist = {};
    const busDist = {};
    const weekdayDist = {
      "Sunday": 0,
      "Monday": 0,
      "Tuesday": 0, 
      "Wednesday": 0,
      "Thursday": 0,
      "Friday": 0,
      "Saturday": 0
    };
    let totalDurationMinutes = 0;

    scheduleData.forEach(schedule => {
      // Route distribution
      const routeName = schedule.routeId ? 
        `${schedule.routeId.startLocation} → ${schedule.routeId.endLocation}` : 
        "Unknown Route";
      
      routeDist[routeName] = (routeDist[routeName] || 0) + 1;
      
      // Bus utilization
      const busInfo = schedule.busId ? 
        `${schedule.busId.busNumber} (${schedule.busId.busType})` : 
        "Unknown Bus";
      
      busDist[busInfo] = (busDist[busInfo] || 0) + 1;
      
      // Weekday distribution
      if (schedule.departureDate) {
        const day = format(new Date(schedule.departureDate), 'EEEE');
        weekdayDist[day] += 1;
      }
      
      // Calculate duration in minutes
      if (schedule.duration) {
        const durationParts = schedule.duration.split(' ');
        const hours = parseInt(durationParts[0]) || 0;
        const minutes = parseInt(durationParts[1]) || 0;
        totalDurationMinutes += (hours * 60) + minutes;
      }
    });
    
    // Calculate average duration
    const avgDuration = scheduleData.length > 0 ? 
      Math.round(totalDurationMinutes / scheduleData.length) : 0;
    
    const avgHours = Math.floor(avgDuration / 60);
    const avgMinutes = avgDuration % 60;
    
    setAnalytics({
      totalSchedules: scheduleData.length,
      routeDistribution: routeDist,
      busUtilization: busDist,
      weekdayDistribution: weekdayDist,
      averageDuration: `${avgHours}h ${avgMinutes}m`,
    });
  };

  const getSortedDataForChart = (dataObj) => {
    return Object.entries(dataObj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Get top 5
  };

  // Helper function to generate chart colors
  const getChartColors = (count) => {
    const colors = [
      '#FF9800', '#F57C00', '#FB8C00', '#FF9800', '#FFA726', 
      '#FFB74D', '#FFCC80', '#FFE0B2', '#FFF3E0'
    ];
    return colors.slice(0, count);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-10">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-10">
          <div className="text-red-500 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Schedule Analytics</h1>
          <button 
          onClick={handleRefresh}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
          Refresh Data
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Schedules */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                <FiCalendar className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Total Schedules</p>
                <p className="text-xl font-bold">{analytics.totalSchedules}</p>
              </div>
            </div>
          </div>
          
          {/* Average Trip Duration */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <FiClock className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Average Trip Duration</p>
                <p className="text-xl font-bold">{analytics.averageDuration}</p>
              </div>
            </div>
          </div>
          
          {/* Most Used Route */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500">
                <FiMapPin className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Most Used Route</p>
                <p className="text-xl font-bold">
                  {Object.entries(analytics.routeDistribution).length > 0 
                    ? Object.entries(analytics.routeDistribution)
                        .sort((a, b) => b[1] - a[1])[0][0]
                    : "No data"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Most Used Bus */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500">
                <FiTruck className="w-6 h-6 " />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Most Used Bus</p>
                <p className="text-xl font-bold">
                  {Object.entries(analytics.busUtilization).length > 0 
                    ? Object.entries(analytics.busUtilization)
                        .sort((a, b) => b[1] - a[1])[0][0]
                    : "No data"}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Route Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Route Distribution</h2>
            <div className="h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(analytics.routeDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([route, count], index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {route}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((count / analytics.totalSchedules) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Bus Utilization */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Bus Utilization</h2>
            <div className="h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(analytics.busUtilization)
                    .sort((a, b) => b[1] - a[1])
                    .map(([bus, count], index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bus}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((count / analytics.totalSchedules) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Weekly Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Weekly Distribution</h2>
          <div className="h-32">
            <div className="flex items-end h-full">
              {Object.entries(analytics.weekdayDistribution).map(([day, count], index) => {
                const percentage = analytics.totalSchedules > 0 ? 
                  (count / analytics.totalSchedules) * 100 : 0;
                const height = percentage > 0 ? `${Math.max(percentage * 2, 5)}%` : '5%';
                
                return (
                  <div key={day} className="flex flex-col items-center flex-1">
                    <div className="flex-1 w-full flex flex-col justify-end">
                      <div 
                        className="bg-orange-500 rounded-t w-full transition-all duration-500 ease-in-out" 
                        style={{ height }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">{day.slice(0, 3)}</div>
                    <div className="text-xs font-semibold">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Recent Schedules */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Schedules</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.slice(0, 5).map((schedule, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {schedule.routeId ? 
                        `${schedule.routeId.startLocation} → ${schedule.routeId.endLocation}` : 
                        "Unknown Route"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.busId ? 
                        `${schedule.busId.busNumber}` : 
                        "Unknown Bus"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.departureDate && schedule.departureTime ? 
                        `${format(new Date(schedule.departureDate), 'dd-MM-yyyy')} ${schedule.departureTime}` : 
                        "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.duration || "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleAnalytics;