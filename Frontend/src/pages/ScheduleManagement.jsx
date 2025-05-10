import { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiSearch } from "react-icons/fi";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { FiDownload } from "react-icons/fi";
import Navbar from "../components/Navbar";

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchDate, setSearchDate] = useState("");
  const [filteredSchedules, setFilteredSchedules] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL

  // Function to notify other components about schedule changes
  const notifyScheduleChange = () => {
    const timestamp = Date.now().toString();
    localStorage.setItem('schedulesLastUpdated', timestamp);
    console.log('Schedule change notified:', timestamp);
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/schedules`);
        
        // Get today's date at midnight for comparison (without time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter out past schedules - only keep present and future schedules
        const currentAndFutureSchedules = response.data.filter(schedule => {
          const scheduleDate = new Date(schedule.departureDate);
          scheduleDate.setHours(0, 0, 0, 0); // Remove time part for fair comparison
          return scheduleDate >= today;
        });
        
        // Sort filtered schedules by createdAt timestamp (newest first)
        const sortedSchedules = [...currentAndFutureSchedules].sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        
        setSchedules(sortedSchedules);
        setFilteredSchedules(sortedSchedules);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch schedules");
        setLoading(false);
        console.error("Error fetching schedules:", err);
      }
    };

    fetchSchedules();
  }, []);

  // Notify when schedules are first loaded
  useEffect(() => {
    if (schedules.length > 0) {
      notifyScheduleChange();
    }
  }, [schedules.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchDate) {
      // Reset to all current and future schedules, maintaining the sort order
      setFilteredSchedules(schedules);
      return;
    }

    // Make sure the search date is not in the past
    const searchDateObj = new Date(searchDate);
    searchDateObj.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (searchDateObj < today) {
      alert("Please select current or future dates only.");
      setSearchDate(""); // Clear the invalid date
      setFilteredSchedules(schedules); // Reset to all valid schedules
      return;
    }

    const filtered = schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.departureDate).toISOString().split('T')[0];
      return scheduleDate === searchDate;
    });

    // Maintain the sort order (newest first by createdAt) for filtered results
    const sortedFiltered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });
    
    setFilteredSchedules(sortedFiltered);
  };

  const handleDelete = async (scheduleID) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await axios.delete(`${API_URL}/api/schedules/${scheduleID}`);
        // Remove the deleted schedule from both arrays
        const updatedSchedules = schedules.filter((schedule) => schedule.scheduleID !== scheduleID);
        const updatedFilteredSchedules = filteredSchedules.filter((schedule) => schedule.scheduleID !== scheduleID);
        
        // Apply the same sorting to maintain the newest-first order
        setSchedules(updatedSchedules);
        setFilteredSchedules(updatedFilteredSchedules);

        // Notify other components about this change
        notifyScheduleChange();
      } catch (err) {
        console.error("Error deleting schedule:", err);
        alert("Failed to delete schedule");
      }
    }
  };

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
      doc.text("Schedule Report", 14, imgHeight + 20);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, imgHeight + 28);
      
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
      
      // Map the data to match the columns with safer data handling
      const tableRows = filteredSchedules.map(schedule => {
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
            return date.toLocaleDateString();
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
      
      // Generate the table
      autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: imgHeight + 38, // Position the table below the logo and title
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
              1: { cellWidth: 40 } // Auto-size based on content
          }
      });
      
      // Save the PDF
      doc.save(`GoSync_Schedules_${new Date().toISOString().split('T')[0]}.pdf`);
      console.log("PDF generated successfully");
    };
    
    // Handle error if image fails to load
    logoImg.onerror = function() {
      console.error("Error loading logo image");
      alert("Failed to load logo image. Generating PDF without logo.");
      
      // Generate PDF without logo as fallback
      doc.setFontSize(18);
      doc.text("Schedule Report", 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Generate the table without the logo
      autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 40,
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
      
      // Save the PDF
      doc.save(`GoSync_Schedules_${new Date().toISOString().split('T')[0]}.pdf`);
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
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
      <Navbar />
      <div className="flex-1 p-10 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Current Schedules</h1>
        
        <div className="flex justify-between items-center mb-6">
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="border rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Search by date"
            />
            <button 
              type="submit" 
              className="bg-orange-500 text-white px-4 py-2 rounded-r hover:bg-orange-600"
            >
              <FiSearch className="w-5 h-5" />
            </button>
          </form>
          
          <div className="flex space-x-4">
            <button 
              onClick={generatePDF} 
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 flex items-center"
            >
              <FiDownload className="mr-2" /> Export PDF
            </button>
            <Link 
              to="/add-schedule" 
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
            >
              Add New Schedule
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map((schedule) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link 
                          to={`/edit-schedule/${schedule.scheduleID}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <FiEdit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(schedule.scheduleID)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No schedules found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
     </div>
    </div>
  );
};

export default ScheduleManagement;