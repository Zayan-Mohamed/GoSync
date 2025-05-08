import { useState, useEffect } from "react";
import axios from "axios";
import { FiSearch, FiDownload, FiChevronDown, FiChevronUp, FiBarChart2 } from "react-icons/fi";
import { format, parse, isValid, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import Sidebar from "../components/Sidebar";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const ScheduleArchives = () => {
  const [archiveSchedules, setArchiveSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchMonth, setSearchMonth] = useState("");
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [availableMonths, setAvailableMonths] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchArchiveSchedules = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/schedules`);
        
        // Get today's date at midnight for comparison (without time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter to only include past schedules
        const pastSchedules = response.data.filter(schedule => {
          const scheduleDate = new Date(schedule.departureDate);
          scheduleDate.setHours(0, 0, 0, 0); // Remove time part for fair comparison
          return scheduleDate < today;
        });
        
        // Sort past schedules by departureDate (most recent first)
        const sortedSchedules = [...pastSchedules].sort((a, b) => {
          const dateA = new Date(a.departureDate);
          const dateB = new Date(b.departureDate);
          return dateB - dateA;
        });
        
        setArchiveSchedules(sortedSchedules);
        
        // Group schedules by month to create the month filter options
        const months = {};
        sortedSchedules.forEach(schedule => {
          const date = new Date(schedule.departureDate);
          if (isValid(date)) {
            const monthKey = format(date, "yyyy-MM");
            const monthLabel = format(date, "MMMM yyyy");
            months[monthKey] = monthLabel;
          }
        });
        
        // Convert to array and sort by date (newest first)
        const monthsArray = Object.entries(months)
          .map(([value, label]) => ({ value, label }))
          .sort((a, b) => b.value.localeCompare(a.value));
        
        setAvailableMonths(monthsArray);
        
        // Default to showing all past schedules grouped by month
        groupSchedulesByMonth(sortedSchedules);
        
        // Generate analytics data
        generateAnalyticsData(sortedSchedules);
        
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch archive schedules");
        setLoading(false);
        console.error("Error fetching archive schedules:", err);
      }
    };

    fetchArchiveSchedules();
  }, []);

  const generateAnalyticsData = (schedules) => {
    // If no schedules, return empty data
    if (!schedules || schedules.length === 0) {
      setAnalyticsData([]);
      return;
    }

    // Group schedules by day
    const scheduleCounts = {};
    
    schedules.forEach(schedule => {
      const date = new Date(schedule.departureDate);
      if (isValid(date)) {
        const dateKey = format(date, "yyyy-MM-dd");
        if (!scheduleCounts[dateKey]) {
          scheduleCounts[dateKey] = {
            date: dateKey,
            displayDate: format(date, "MMM dd"),
            count: 0,
            routes: new Set()
          };
        }
        scheduleCounts[dateKey].count += 1;
        
        // Add route info if available
        if (schedule.routeId && schedule.routeId.startLocation && schedule.routeId.endLocation) {
          const routeKey = `${schedule.routeId.startLocation}-${schedule.routeId.endLocation}`;
          scheduleCounts[dateKey].routes.add(routeKey);
        }
      }
    });

    // Convert to array and sort by date
    let analyticsArray = Object.values(scheduleCounts)
      .map(item => ({
        ...item,
        routeCount: item.routes.size,
        routes: undefined  // Remove Set object before using in chart
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Limit to most recent 30 days for better visualization
    analyticsArray = analyticsArray.slice(0, 30);
    
    setAnalyticsData(analyticsArray);
  };

  const groupSchedulesByMonth = (schedules) => {
    const grouped = {};
    
    schedules.forEach(schedule => {
      const date = new Date(schedule.departureDate);
      
      if (isValid(date)) {
        const monthKey = format(date, "yyyy-MM");
        const monthLabel = format(date, "MMMM yyyy");
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = {
            label: monthLabel,
            schedules: []
          };
        }
        
        grouped[monthKey].schedules.push(schedule);
      }
    });
    
    // Convert to array and sort by month (newest first)
    const groupedArray = Object.entries(grouped)
      .map(([key, value]) => ({
        key,
        ...value
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
    
    setFilteredSchedules(groupedArray);
    
    // Initialize all groups as expanded
    const initialExpandedState = {};
    groupedArray.forEach(group => {
      initialExpandedState[group.key] = true;
    });
    setExpandedGroups(initialExpandedState);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchMonth) {
      // Reset to all schedules grouped by month
      groupSchedulesByMonth(archiveSchedules);
      // Reset analytics to include all data
      generateAnalyticsData(archiveSchedules);
      return;
    }

    // Filter schedules by selected month
    const filtered = archiveSchedules.filter(schedule => {
      const date = new Date(schedule.departureDate);
      if (isValid(date)) {
        const scheduleMonth = format(date, "yyyy-MM");
        return scheduleMonth === searchMonth;
      }
      return false;
    });

    // Create a single group for the selected month
    if (filtered.length > 0) {
      const monthDate = parse(searchMonth, "yyyy-MM", new Date());
      const monthLabel = isValid(monthDate) ? format(monthDate, "MMMM yyyy") : searchMonth;
      
      setFilteredSchedules([{
        key: searchMonth,
        label: monthLabel,
        schedules: filtered
      }]);
      
      // Expand the group
      setExpandedGroups({ [searchMonth]: true });
      
      // Update analytics for the selected month
      generateAnalyticsData(filtered);
    } else {
      setFilteredSchedules([]);
      setAnalyticsData([]);
    }
  };

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const toggleAnalytics = () => {
    setShowAnalytics(prevState => !prevState);
  };

  // Replace the existing generatePDF function with this
const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add GoSync logo as header
      const logoImg = new Image();
      logoImg.src = "/assets/GoSync-Logo_Length2.png";
      
      // Wait for image to load before adding to PDF
      logoImg.onload = function() {
        const imgWidth = 80; // Width in mm
        const imgHeight = (logoImg.height * imgWidth) / logoImg.width; // Maintain aspect ratio
        
        doc.addImage(logoImg, 'PNG', 14, 10, imgWidth, imgHeight);
        
        // Add title - positioned below the logo
        doc.setFontSize(18);
        doc.text("Archive Schedules Report", 14, imgHeight + 20);
        doc.setFontSize(11);
        
        // Add filter information
        if (searchMonth) {
          const monthDate = parse(searchMonth, "yyyy-MM", new Date());
          const monthLabel = isValid(monthDate) ? format(monthDate, "MMMM yyyy") : searchMonth;
          doc.text(`Month: ${monthLabel}`, 14, imgHeight + 28);
        } else {
          doc.text(`All Past Schedules - Generated on: ${new Date().toLocaleDateString()}`, 14, imgHeight + 28);
        }
        
        // Define the columns for the table
        const tableColumn = [
          "Route", 
          "Bus Details", 
          "Departure Date", 
          "Departure Time", 
          "Arrival Date", 
          "Arrival Time", 
          "Duration"
        ];
        
        let yPosition = imgHeight + 38; // Position below the title and filter info
        let firstPage = true;
        
        // Rest of your PDF generation code remains the same...
        // For each month group in filtered schedules
        filteredSchedules.forEach(group => {
          // Add month header
          if (!firstPage) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.text(group.label, 14, yPosition);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(11);
          
          yPosition += 10;
          
          // Map the data for this month
          const tableRows = group.schedules.map(schedule => {
            // Safely format route information
            let routeInfo = "Unknown Route";
            if (schedule.routeId && schedule.routeId.startLocation && schedule.routeId.endLocation) {
              routeInfo = `${schedule.routeId.startLocation} → ${schedule.routeId.endLocation}`;
            }
            
            // Safely format bus information
            let busInfo = "Unknown Bus";
            if (schedule.busId && schedule.busId.busNumber) {
              busInfo = schedule.busId.busType 
                ? `${schedule.busId.busNumber} (${schedule.busId.busType})` 
                : schedule.busId.busNumber;
            }
            
            // Safe date formatting
            const safeDateFormat = (dateStr) => {
              try {
                if (!dateStr) return "N/A";
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return "Invalid Date";
                return format(date, "dd-MM-yyyy");
              } catch (error) {
                console.error("Date formatting error:", error);
                return "Invalid Date";
              }
            };
            
            return [
              routeInfo,
              busInfo,
              safeDateFormat(schedule.departureDate),
              schedule.departureTime || "N/A",
              safeDateFormat(schedule.arrivalDate),
              schedule.arrivalTime || "N/A",
              schedule.duration || "N/A"
            ];
          });
          
          // Generate the table for this month
          autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: yPosition,
            styles: {
              fontSize: 9,
              cellPadding: 3,
              overflow: "linebreak",
              halign: "left"
            },
            headStyles: {
              fillColor: [255, 140, 0],
              textColor: [255, 255, 255],
              fontStyle: "bold"
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            columnStyles: {
              1: { cellWidth: 40 }
            }
          });
          
          // Get the final y position after the table is drawn
          yPosition = doc.lastAutoTable.finalY + 15;
          firstPage = false;
        });
        
        // Save the PDF
        doc.save(`GoSync_Archives_${searchMonth || 'All'}_${new Date().toISOString().split('T')[0]}.pdf`);
        console.log("PDF generated successfully");
      };
      
      // Handle error if image fails to load
      logoImg.onerror = function() {
        console.error("Error loading logo image");
        alert("Failed to load logo image. Generating PDF without logo.");
        
        // Generate PDF without logo as fallback
        doc.setFontSize(18);
        doc.text("Archive Schedules Report", 14, 22);
        doc.setFontSize(11);
        
        // Continue with the rest of the PDF generation...
        // [Rest of existing code]
      };
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF report. Please check the console for details.");
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd-MM-yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Replace the existing generateAnalyticsPDF function with this
const generateAnalyticsPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add GoSync logo as header
      const logoImg = new Image();
      logoImg.src = "/assets/GoSync-Logo_Length2.png";
      
      // Wait for image to load before adding to PDF
      logoImg.onload = function() {
        const imgWidth = 80; // Width in mm
        const imgHeight = (logoImg.height * imgWidth) / logoImg.width; // Maintain aspect ratio
        
        doc.addImage(logoImg, 'PNG', 14, 10, imgWidth, imgHeight);
        
        // Add title - positioned below the logo
        doc.setFontSize(18);
        doc.text("Schedule Analytics Report", 14, imgHeight + 20);
        doc.setFontSize(11);
        
        // Add filter information
        if (searchMonth) {
          const monthDate = parse(searchMonth, "yyyy-MM", new Date());
          const monthLabel = isValid(monthDate) ? format(monthDate, "MMMM yyyy") : searchMonth;
          doc.text(`Month: ${monthLabel}`, 14, imgHeight + 28);
        } else {
          doc.text(`All Past Schedule Analytics - Generated on: ${new Date().toLocaleDateString()}`, 14, imgHeight + 28);
        }
        
        // Define the columns for the analytics table
        const tableColumn = ["Date", "Number of Schedules", "Unique Routes"];
        
        // Map the analytics data for table
        const tableRows = analyticsData.map(item => [
          item.displayDate,
          item.count.toString(),
          item.routeCount.toString()
        ]);
        
        // Generate the table
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: imgHeight + 38, // Position below the title and filter info
          styles: {
            fontSize: 10,
            cellPadding: 3,
            overflow: "linebreak",
            halign: "center"
          },
          headStyles: {
            fillColor: [255, 140, 0],
            textColor: [255, 255, 255],
            fontStyle: "bold"
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          }
        });
        
        // Save the PDF
        doc.save(`GoSync_Analytics_${searchMonth || 'All'}_${new Date().toISOString().split('T')[0]}.pdf`);
        console.log("Analytics PDF generated successfully");
      };
      
      // Handle error if image fails to load
      logoImg.onerror = function() {
        console.error("Error loading logo image");
        alert("Failed to load logo image. Generating PDF without logo.");
        
        // Generate PDF without logo as fallback
        doc.setFontSize(18);
        doc.text("Schedule Analytics Report", 14, 22);
        doc.setFontSize(11);
        
        // Continue with the rest of the PDF generation...
        // [Rest of existing code]
      };
    } catch (error) {
      console.error("Analytics PDF generation failed:", error);
      alert("Failed to generate analytics report. Please check the console for details.");
    }
  };


  if (loading) return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-10">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-10">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-10 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Schedule Archives</h1>
        
        <div className="flex justify-between items-center mb-6">
          <form onSubmit={handleSearch} className="flex items-center">
            <select
              value={searchMonth}
              onChange={(e) => setSearchMonth(e.target.value)}
              className="border rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Archives</option>
              {availableMonths.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <button 
              type="submit" 
              className="bg-orange-500 text-white px-4 py-2 rounded-r hover:bg-orange-600"
            >
              <FiSearch className="w-5 h-5" />
            </button>
          </form>
          
          <div className="flex space-x-4">
            <button 
              onClick={toggleAnalytics} 
              className={`${showAnalytics ? 'bg-orange-600' : 'bg-orange-500'} text-white px-6 py-2 rounded hover:bg-orange-600 flex items-center`}
              disabled={analyticsData.length === 0}
            >
              <FiBarChart2 className="mr-2" /> {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </button>
            <button 
              onClick={generatePDF} 
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 flex items-center"
              disabled={filteredSchedules.length === 0}
            >
              <FiDownload className="mr-2" /> Export PDF
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && analyticsData.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-orange-100 px-6 py-3 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-orange-800">Schedule Analytics</h2>
              <button 
                onClick={generateAnalyticsPDF} 
                className="bg-orange-500 text-white px-4 py-1 rounded text-sm hover:bg-orange-600 flex items-center"
              >
                <FiDownload className="mr-1" /> Export Analytics
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600">
                  This chart shows the number of schedules and unique routes for each day.
                </p>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayDate" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === "count") return [`${value} schedules`, "Number of Schedules"];
                        if (name === "routeCount") return [`${value} routes`, "Unique Routes"];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Number of Schedules" fill="#ff8c00" />
                    <Bar dataKey="routeCount" name="Unique Routes" fill="#ffa500" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500 text-sm">Total Schedules</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {analyticsData.reduce((sum, item) => sum + item.count, 0)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500 text-sm">Average Schedules Per Day</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(analyticsData.reduce((sum, item) => sum + item.count, 0) / analyticsData.length).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500 text-sm">Days with Schedules</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {analyticsData.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedules List */}
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map(group => (
            <div key={group.key} className="mb-8 bg-white rounded-lg shadow overflow-hidden">
              <div 
                className="bg-orange-100 px-6 py-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleGroup(group.key)}
              >
                <h2 className="text-xl font-semibold text-orange-800">{group.label}</h2>
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-600">
                    {group.schedules.length} {group.schedules.length === 1 ? 'schedule' : 'schedules'}
                  </span>
                  {expandedGroups[group.key] ? (
                    <FiChevronUp className="w-5 h-5 text-orange-800" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-orange-800" />
                  )}
                </div>
              </div>
              
              {expandedGroups[group.key] && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bus Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Departure
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Arrival
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.schedules.map((schedule) => (
                      <tr key={schedule.scheduleID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {schedule.routeId ? 
                              `${schedule.routeId.startLocation} → ${schedule.routeId.endLocation}` : 
                              "Unknown Route"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {schedule.busId ? 
                              `${schedule.busId.busNumber} (${schedule.busId.busType})` : 
                              "Unknown Bus"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(schedule.departureDate)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {schedule.departureTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(schedule.arrivalDate)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {schedule.arrivalTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {schedule.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">No archive schedules found</p>
            {searchMonth && (
              <p className="text-gray-500 mt-2">
                Try selecting a different month or viewing all archives
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleArchives;