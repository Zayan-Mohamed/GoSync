import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminLayout from "../layouts/AdminLayout";
import GoSyncLoader from "../components/Loader";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Trash,
  Edit,
  MoreHorizontal,
  AlertCircle,
  Eye,
  ArrowRight,
  Clock,
  Calendar,
  Bus,
} from "lucide-react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const SeatManagement = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [buses, setBuses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filters, setFilters] = useState({
    busId: "",
    scheduleId: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table', 'grid', or 'chart'
  const [seatDetails, setSeatDetails] = useState(null);
  const [showSeatDetailsModal, setShowSeatDetailsModal] = useState(false);
  const [showBulkActionMenu, setShowBulkActionMenu] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const itemsPerPage = 10;

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [busesRes, schedulesRes] = await Promise.all([
          axios.get(`${API_URL}/api/buses/buses`, { withCredentials: true }),
          axios.get(`${API_URL}/api/schedules`, { withCredentials: true }),
        ]);
        setBuses(busesRes.data);
        setSchedules(schedulesRes.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load options");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [API_URL]);

  // Fetch seats data when filters change
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/admin/seats`, {
          params: filters,
          withCredentials: true,
        });
        setSeats(response.data);
        setCurrentPage(1); // Reset page when filters change
        setSelectedSeats([]);
      } catch (err) {
        console.error("Fetch seats error:", err.response);
        toast.error(err.response?.data?.message || "Failed to fetch seats");
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [filters, API_URL]);

  // Filter seats based on search term and filters
  const filteredSeats = seats.filter((seat) => {
    const searchFilter = searchTerm.toLowerCase();
    const seatNumber = (seat.seatNumber || "").toLowerCase();
    const busNumber = (seat.busId?.busNumber || "").toLowerCase();
    const searchMatch =
      searchTerm === "" ||
      seatNumber.includes(searchFilter) ||
      busNumber.includes(searchFilter);

    const statusFilter =
      filters.status === "" ||
      (filters.status === "booked"
        ? seat.isBooked
        : filters.status === "reserved"
          ? seat.reservedUntil && new Date(seat.reservedUntil) > new Date()
          : filters.status === "available"
            ? !seat.isBooked &&
              !seat.isDisabled &&
              (!seat.reservedUntil ||
                new Date(seat.reservedUntil) <= new Date())
            : filters.status === "disabled"
              ? seat.isDisabled
              : true);

    return searchMatch && statusFilter;
  });

  // Calculate statistics for charts
  const seatStats = {
    available: filteredSeats.filter(
      (seat) =>
        !seat.isBooked &&
        !seat.isDisabled &&
        (!seat.reservedUntil || new Date(seat.reservedUntil) <= new Date())
    ).length,
    booked: filteredSeats.filter((seat) => seat.isBooked).length,
    reserved: filteredSeats.filter(
      (seat) =>
        !seat.isBooked &&
        !seat.isDisabled &&
        seat.reservedUntil &&
        new Date(seat.reservedUntil) > new Date()
    ).length,
    disabled: filteredSeats.filter((seat) => seat.isDisabled).length,
  };

  // Group seats by bus for visualization
  const seatsByBus = filteredSeats.reduce((acc, seat) => {
    const busId = seat.busId?._id || "unknown";
    const busName = seat.busId?.busNumber || "Unknown Bus";

    if (!acc[busId]) {
      acc[busId] = {
        busName,
        total: 0,
        available: 0,
        booked: 0,
        reserved: 0,
        disabled: 0,
      };
    }

    acc[busId].total += 1;

    if (seat.isBooked) {
      acc[busId].booked += 1;
    } else if (
      seat.reservedUntil &&
      new Date(seat.reservedUntil) > new Date()
    ) {
      acc[busId].reserved += 1;
    } else if (seat.isDisabled) {
      acc[busId].disabled += 1;
    } else {
      acc[busId].available += 1;
    }

    return acc;
  }, {});

  // Pagination
  const totalPages = Math.ceil(filteredSeats.length / itemsPerPage);
  const currentSeats = filteredSeats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Event handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ busId: "", scheduleId: "", status: "" });
    setSearchTerm("");
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleSelectSeat = (seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const handleSelectAllInPage = () => {
    const visibleSeatIds = currentSeats.map((seat) => seat._id);

    if (visibleSeatIds.every((id) => selectedSeats.includes(id))) {
      // If all are selected, deselect all
      setSelectedSeats((prev) =>
        prev.filter((id) => !visibleSeatIds.includes(id))
      );
    } else {
      // Otherwise select all visible seats
      const newSelected = [...selectedSeats];
      visibleSeatIds.forEach((id) => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      setSelectedSeats(newSelected);
    }
  };

  const viewSeatDetails = (seat) => {
    setSeatDetails(seat);
    setShowSeatDetailsModal(true);
  };

  const exportToCSV = () => {
    // Create data for export
    const dataToExport = filteredSeats.map((seat) => ({
      "Seat Number": seat.seatNumber,
      "Bus Number": seat.busId?.busNumber || "N/A",
      Status: seat.isBooked
        ? "Booked"
        : seat.reservedUntil && new Date(seat.reservedUntil) > new Date()
          ? "Reserved"
          : "Available",
      "Reserved Until":
        seat.reservedUntil && new Date(seat.reservedUntil) > new Date()
          ? new Date(seat.reservedUntil).toLocaleString()
          : "N/A",
      "Seat Type": seat.seatType || "Standard",
    }));

    // Convert to CSV
    const headers = Object.keys(dataToExport[0]).join(",");
    const rows = dataToExport
      .map((seat) => Object.values(seat).join(","))
      .join("\n");
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "seat_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Seat data exported to CSV");
  };

  const addNewSeat = () => {
    navigate("/add-seat");
  };

  const handleBulkAction = async (action) => {
    if (selectedSeats.length === 0) {
      toast.error("Please select seats to perform this action");
      return;
    }

    setBulkActionLoading(true);

    try {
      if (action === "delete") {
        // Confirm deletion with user
        if (
          !window.confirm(
            `Are you sure you want to delete ${selectedSeats.length} seats?`
          )
        ) {
          setBulkActionLoading(false);
          return;
        }

        // Call the API to delete the selected seats
        const response = await axios.post(
          `${API_URL}/api/admin/seats/bulk-delete`,
          { seatIds: selectedSeats },
          { withCredentials: true }
        );

        // Remove the deleted seats from the state
        setSeats((prev) =>
          prev.filter((seat) => !selectedSeats.includes(seat._id))
        );

        // Clear selection
        setSelectedSeats([]);

        toast.success(`Successfully deleted ${response.data.count} seats`);
      } else if (action === "edit") {
        // For bulk edit, we'll handle in the EditSelectedSeats component
        // which we'll navigate to with the selected seat IDs
        navigate("/bulk-edit-seats", { state: { seatIds: selectedSeats } });
        return;
      } else if (action === "disable") {
        // Call the API to disable the selected seats
        const response = await axios.post(
          `${API_URL}/api/admin/seats/bulk-update`,
          {
            seatIds: selectedSeats,
            updates: { isDisabled: true },
          },
          { withCredentials: true }
        );

        // Update the seats in the state
        setSeats((prev) =>
          prev.map((seat) =>
            selectedSeats.includes(seat._id)
              ? { ...seat, isDisabled: true }
              : seat
          )
        );

        toast.success(`Successfully disabled ${response.data.count} seats`);
      } else if (action === "enable") {
        // Call the API to enable the selected seats
        const response = await axios.post(
          `${API_URL}/api/admin/seats/bulk-update`,
          {
            seatIds: selectedSeats,
            updates: { isDisabled: false },
          },
          { withCredentials: true }
        );

        // Update the seats in the state
        setSeats((prev) =>
          prev.map((seat) =>
            selectedSeats.includes(seat._id)
              ? { ...seat, isDisabled: false }
              : seat
          )
        );

        toast.success(`Successfully enabled ${response.data.count} seats`);
      }
    } catch (err) {
      console.error("Bulk action error:", err);
      toast.error(
        err.response?.data?.message || "Failed to perform bulk action"
      );
    } finally {
      setShowBulkActionMenu(false);
      setBulkActionLoading(false);
    }
  };

  const toggleSeatDisabled = async (seatId, currentStatus) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/seats/${seatId}/status`,
        { isDisabled: !currentStatus },
        { withCredentials: true }
      );

      // Update the seat in the state
      setSeats((prev) =>
        prev.map((seat) =>
          seat._id === seatId ? { ...seat, isDisabled: !currentStatus } : seat
        )
      );

      // If this seat is being viewed in the modal, update it too
      if (seatDetails && seatDetails._id === seatId) {
        setSeatDetails((prev) => ({ ...prev, isDisabled: !currentStatus }));
      }

      toast.success(
        `Seat ${currentStatus ? "enabled" : "disabled"} successfully`
      );
    } catch (err) {
      console.error("Error toggling seat status:", err);
      toast.error(
        err.response?.data?.message || "Failed to update seat status"
      );
    }
  };

  const deleteSeat = async (seatId) => {
    try {
      await axios.delete(`${API_URL}/api/admin/seats/${seatId}`, {
        withCredentials: true,
      });

      // Remove the seat from the state
      setSeats((prev) => prev.filter((seat) => seat._id !== seatId));

      // If this seat is being viewed in the modal, close the modal
      if (seatDetails && seatDetails._id === seatId) {
        setShowSeatDetailsModal(false);
      }

      // If this seat was selected, remove it from selection
      if (selectedSeats.includes(seatId)) {
        setSelectedSeats((prev) => prev.filter((id) => id !== seatId));
      }

      toast.success("Seat deleted successfully");
    } catch (err) {
      console.error("Error deleting seat:", err);
      toast.error(err.response?.data?.message || "Failed to delete seat");
    }
  };

  // Pagination controls
  const paginationControls = () => (
    <div className="flex items-center justify-between mt-4 px-4 py-2">
      <div className="text-sm text-gray-500">
        Showing{" "}
        {Math.min(filteredSeats.length, 1 + (currentPage - 1) * itemsPerPage)}-
        {Math.min(filteredSeats.length, currentPage * itemsPerPage)} of{" "}
        {filteredSeats.length} seats
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`p-1 rounded ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          // Show page numbers around current page
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 rounded ${currentPage === pageNum ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
              aria-label={`Page ${pageNum}`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages || totalPages === 0}
          className={`p-1 rounded ${currentPage === totalPages || totalPages === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // Loading state
  if (loading)
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <GoSyncLoader />
          </div>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header with title and actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Seat Management</h2>
            <p className="text-gray-600 text-sm mt-1">
              Manage all seats across your buses and schedules
            </p>
          </div>

          <div className="flex space-x-2">
            {/* View mode toggle */}
            <div className="flex rounded-md shadow-sm overflow-hidden mr-2">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-sm ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                title="Table view"
              >
                List
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 text-sm ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                title="Grid view"
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("chart")}
                className={`px-3 py-2 text-sm ${viewMode === "chart" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                title="Chart view"
              >
                Analytics
              </button>
            </div>

            {/* Main action buttons */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
              title={showFilters ? "Hide filters" : "Show filters"}
            >
              <Filter size={16} className="mr-1" />{" "}
              {showFilters ? "Hide Filters" : "Filters"}
            </button>

            {selectedSeats.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBulkActionMenu(!showBulkActionMenu)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
                  title="Perform actions on selected seats"
                >
                  <MoreHorizontal size={16} className="mr-1" />
                  Actions ({selectedSeats.length})
                </button>

                {/* Bulk action dropdown menu */}
                {showBulkActionMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleBulkAction("edit")}
                        disabled={bulkActionLoading}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Edit size={16} className="mr-2" />
                        Edit Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction("delete")}
                        disabled={bulkActionLoading}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                      >
                        <Trash size={16} className="mr-2" />
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setFilters({ ...filters })} // Re-fetch data
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
              title="Refresh data"
            >
              <RefreshCw size={16} className="mr-1" /> Refresh
            </button>

            {filteredSeats.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
                title="Export seats to CSV"
              >
                <Download size={16} className="mr-1" /> Export
              </button>
            )}

            <button
              onClick={addNewSeat}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600"
              title="Add new seat"
            >
              <Plus size={16} className="mr-1" /> Add Seat
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search seats by seat number or bus number..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-9 p-2.5 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 border rounded-lg shadow-sm animate-fadeIn">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Filter className="mr-1 text-blue-500" size={16} /> Filter Seats
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilters({ ...filters })}
                  className="flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <RefreshCw className="mr-1" size={12} />
                  Apply
                </button>
                <button
                  onClick={clearFilters}
                  className="flex items-center px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="transition-all duration-200 hover:shadow-sm hover:bg-white p-2 rounded-lg">
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-2 h-2 inline-block bg-blue-500 rounded-full mr-1"></span>
                  Bus
                </label>
                <div className="relative">
                  <Bus
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <select
                    name="busId"
                    value={filters.busId}
                    onChange={handleFilterChange}
                    className="pl-10 p-2.5 border border-gray-300 rounded-lg w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">All Buses</option>
                    {buses.map((bus) => (
                      <option key={bus._id} value={bus._id}>
                        {bus.busNumber} - {bus.travelName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="transition-all duration-200 hover:shadow-sm hover:bg-white p-2 rounded-lg">
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-2 h-2 inline-block bg-green-500 rounded-full mr-1"></span>
                  Schedule
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <select
                    name="scheduleId"
                    value={filters.scheduleId}
                    onChange={handleFilterChange}
                    className="pl-10 p-2.5 border border-gray-300 rounded-lg w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">All Schedules</option>
                    {schedules.map((schedule) => (
                      <option key={schedule._id} value={schedule._id}>
                        {new Date(schedule.departureDate).toLocaleDateString()}{" "}
                        {schedule.departureTime}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="transition-all duration-200 hover:shadow-sm hover:bg-white p-2 rounded-lg">
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <span className="w-2 h-2 inline-block bg-red-500 rounded-full mr-1"></span>
                  Status
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Clock size={16} />
                  </div>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="pl-10 p-2.5 border border-gray-300 rounded-lg w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="reserved">Reserved</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search bar within filters */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search seats by seat number or bus number..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Active filters display */}
            {(filters.busId ||
              filters.scheduleId ||
              filters.status ||
              searchTerm) && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Active filters:</span>
                {filters.busId && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
                    Bus:{" "}
                    {buses.find((b) => b._id === filters.busId)?.busNumber ||
                      "Selected"}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, busId: "" }))
                      }
                      className="ml-1 text-blue-800 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.scheduleId && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                    Schedule:{" "}
                    {new Date(
                      schedules.find((s) => s._id === filters.scheduleId)
                        ?.departureDate || new Date()
                    ).toLocaleDateString()}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, scheduleId: "" }))
                      }
                      className="ml-1 text-green-800 hover:text-green-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                    Status: {filters.status}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, status: "" }))
                      }
                      className="ml-1 text-red-800 hover:text-red-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-1 text-purple-800 hover:text-purple-900"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Status summary cards */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="px-3 py-2 bg-green-50 text-green-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-sm font-medium">Available</span>
                </div>
                <span className="text-lg font-bold">{seatStats.available}</span>
              </div>
              <div className="px-3 py-2 bg-red-50 text-red-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <span className="text-sm font-medium">Booked</span>
                </div>
                <span className="text-lg font-bold">{seatStats.booked}</span>
              </div>
              <div className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  <span className="text-sm font-medium">Reserved</span>
                </div>
                <span className="text-lg font-bold">{seatStats.reserved}</span>
              </div>
              <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  <span className="text-sm font-medium">Total</span>
                </div>
                <span className="text-lg font-bold">
                  {filteredSeats.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* No results message */}
        {filteredSeats.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow p-8">
            <AlertCircle className="text-gray-400 w-12 h-12 mb-4" />
            <p className="text-lg text-gray-600 mb-4">
              No seats found matching your criteria
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Table View */}
            {viewMode === "table" && (
              <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all duration-200"
                              onChange={handleSelectAllInPage}
                              checked={
                                currentSeats.length > 0 &&
                                currentSeats.every((seat) =>
                                  selectedSeats.includes(seat._id)
                                )
                              }
                            />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                            Seat Number
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                            Bus Number
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-1.5"></span>
                            Status
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mr-1.5"></span>
                            Reserved Until
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
                            Seat Type
                          </div>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {currentSeats.map((seat) => {
                        const isBooked = seat.isBooked;
                        const isReserved =
                          seat.reservedUntil &&
                          new Date(seat.reservedUntil) > new Date();
                        const isDisabled = seat.isDisabled;

                        const statusClass = isBooked
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : isReserved
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : isDisabled
                              ? "bg-gray-100 text-gray-800 border border-gray-200"
                              : "bg-green-100 text-green-800 border border-green-200";

                        const statusText = isBooked
                          ? "Booked"
                          : isReserved
                            ? "Reserved"
                            : isDisabled
                              ? "Disabled"
                              : "Available";

                        return (
                          <tr 
                            key={seat._id} 
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-shadow"
                                  checked={selectedSeats.includes(seat._id)}
                                  onChange={() => toggleSelectSeat(seat._id)}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{seat.seatNumber}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-gray-700">{seat.busId?.busNumber || "N/A"}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full shadow-sm ${statusClass}`}
                              >
                                {statusText}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                              {isReserved ? (
                                <div className="flex items-center">
                                  <Clock size={12} className="text-gray-400 mr-1" />
                                  <span>{new Date(seat.reservedUntil).toLocaleString()}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                              <span className="capitalize bg-blue-50 px-2 py-0.5 rounded text-blue-700 text-xs">
                                {seat.seatType || "Standard"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => viewSeatDetails(seat)}
                                  className="p-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                  title="View details"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => navigate(`/edit-seat/${seat._id}`)}
                                  className="p-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                                  title="Edit seat"
                                >
                                  <Edit size={16} />
                                </button>
                                {!isBooked && (
                                  <button
                                    onClick={() => deleteSeat(seat._id)}
                                    className="p-1 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title="Delete seat"
                                  >
                                    <Trash size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleSeatDisabled(seat._id, seat.isDisabled)}
                                  className={`p-1 rounded transition-colors ${
                                    seat.isDisabled
                                      ? "bg-green-50 text-green-600 hover:bg-green-100"
                                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                  }`}
                                  title={seat.isDisabled ? "Enable seat" : "Disable seat"}
                                >
                                  {seat.isDisabled ? (
                                    <span className="text-xs font-medium">Enable</span>
                                  ) : (
                                    <span className="text-xs font-medium">Disable</span>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Enhanced pagination controls */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium text-gray-700 bg-white px-2 py-1 rounded-md shadow-sm">
                      {Math.min(filteredSeats.length, 1 + (currentPage - 1) * itemsPerPage)}-
                      {Math.min(filteredSeats.length, currentPage * itemsPerPage)}
                    </span>{" "}
                    <span className="ml-1">of {filteredSeats.length} seats</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center p-1.5 rounded ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      }`}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <div className="hidden md:flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Show page numbers around current page
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm transition-all duration-200 ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white font-medium shadow"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                            }`}
                            aria-label={`Page ${pageNum}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="md:hidden">
                      <span className="bg-white border border-gray-300 px-2 py-1 rounded-md text-sm text-gray-700">
                        {currentPage} / {totalPages}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`flex items-center p-1.5 rounded ${
                        currentPage === totalPages || totalPages === 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      }`}
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {currentSeats.map((seat) => {
                    const isBooked = seat.isBooked;
                    const isReserved =
                      seat.reservedUntil &&
                      new Date(seat.reservedUntil) > new Date();
                    const isDisabled = seat.isDisabled;

                    const statusClass = isBooked
                      ? "bg-red-100 border-red-300"
                      : isReserved
                        ? "bg-yellow-100 border-yellow-300"
                        : isDisabled
                          ? "bg-gray-100 border-gray-300"
                          : "bg-green-100 border-green-300";

                    const statusText = isBooked
                      ? "Booked"
                      : isReserved
                        ? "Reserved"
                        : isDisabled
                          ? "Disabled"
                          : "Available";

                    return (
                      <div
                        key={seat._id}
                        className={`border rounded-lg p-3 ${statusClass} relative`}
                      >
                        <div className="absolute top-2 right-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                            checked={selectedSeats.includes(seat._id)}
                            onChange={() => toggleSelectSeat(seat._id)}
                          />
                        </div>
                        <div className="text-center pt-3 pb-2">
                          <h3 className="text-xl font-bold mb-1">
                            {seat.seatNumber}
                          </h3>
                          <p className="text-sm text-gray-700">
                            {seat.busId?.busNumber || "N/A"}
                          </p>
                          <div className="mt-2">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${
                                isBooked
                                  ? "bg-red-200 text-red-800"
                                  : isReserved
                                    ? "bg-yellow-200 text-yellow-800"
                                    : isDisabled
                                      ? "bg-gray-200 text-gray-800"
                                      : "bg-green-200 text-green-800"
                              }`}
                            >
                              {statusText}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-center space-x-2">
                          <button
                            onClick={() => viewSeatDetails(seat)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/edit-seat/${seat._id}`)}
                            className="p-1 text-indigo-600 hover:text-indigo-800"
                            title="Edit seat"
                          >
                            <Edit size={16} />
                          </button>
                          {!isBooked && (
                            <button
                              onClick={() => deleteSeat(seat._id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete seat"
                            >
                              <Trash size={16} />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              toggleSeatDisabled(seat._id, seat.isDisabled)
                            }
                            className={`${
                              seat.isDisabled
                                ? "text-green-600 hover:text-green-900"
                                : "text-gray-600 hover:text-gray-900"
                            } p-1`}
                            title={
                              seat.isDisabled ? "Enable seat" : "Disable seat"
                            }
                          >
                            {seat.isDisabled ? "Enable" : "Disable"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {paginationControls()}
              </div>
            )}

            {/* Chart View */}
            {viewMode === "chart" && (
              <div className="space-y-8">
                {/* Status overview chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">
                    Seat Status Overview
                  </h3>
                  <div className="flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-1/3">
                      <Pie
                        data={{
                          labels: ["Available", "Booked", "Reserved"],
                          datasets: [
                            {
                              data: [
                                seatStats.available,
                                seatStats.booked,
                                seatStats.reserved,
                              ],
                              backgroundColor: [
                                "#10B981",
                                "#EF4444",
                                "#F59E0B",
                              ],
                              borderColor: ["#065F46", "#B91C1C", "#B45309"],
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: function (context) {
                                  const label = context.label || "";
                                  const value = context.raw || 0;
                                  const total = context.dataset.data.reduce(
                                    (a, b) => a + b,
                                    0
                                  );
                                  const percentage = Math.round(
                                    (value / total) * 100
                                  );
                                  return `${label}: ${value} (${percentage}%)`;
                                },
                              },
                            },
                          },
                        }}
                      />
                    </div>
                    <div className="w-full md:w-2/3 md:pl-8 mt-6 md:mt-0">
                      <h4 className="font-medium mb-2">Status Breakdown</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="font-medium">Available</span>
                          </div>
                          <p className="text-2xl font-bold mt-2">
                            {seatStats.available}
                          </p>
                          <p className="text-sm text-gray-500">
                            {Math.round(
                              (seatStats.available / filteredSeats.length) * 100
                            )}
                            % of total
                          </p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className="font-medium">Booked</span>
                          </div>
                          <p className="text-2xl font-bold mt-2">
                            {seatStats.booked}
                          </p>
                          <p className="text-sm text-gray-500">
                            {Math.round(
                              (seatStats.booked / filteredSeats.length) * 100
                            )}
                            % of total
                          </p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            <span className="font-medium">Reserved</span>
                          </div>
                          <p className="text-2xl font-bold mt-2">
                            {seatStats.reserved}
                          </p>
                          <p className="text-sm text-gray-500">
                            {Math.round(
                              (seatStats.reserved / filteredSeats.length) * 100
                            )}
                            % of total
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bus-specific breakdown */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">
                    Seat Status by Bus
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bus Number
                          </th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Seats
                          </th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Available
                          </th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Booked
                          </th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reserved
                          </th>
                          <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Occupancy
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Object.values(seatsByBus).map((bus, index) => {
                          const occupancyRate = Math.round(
                            ((bus.booked + bus.reserved) / bus.total) * 100
                          );

                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm">
                                {bus.busName}
                              </td>
                              <td className="py-3 px-4 text-center text-sm">
                                {bus.total}
                              </td>
                              <td className="py-3 px-4 text-center text-sm">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                  {bus.available}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-sm">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                  {bus.booked}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-sm">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                  {bus.reserved}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center">
                                  <div className="flex-1 mr-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          occupancyRate > 80
                                            ? "bg-red-500"
                                            : occupancyRate > 60
                                              ? "bg-orange-500"
                                              : occupancyRate > 40
                                                ? "bg-yellow-500"
                                                : "bg-green-500"
                                        }`}
                                        style={{ width: `${occupancyRate}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {occupancyRate}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Seat Details Modal */}
      {showSeatDetailsModal && seatDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Seat Details</h3>
              <button
                onClick={() => setShowSeatDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div
                  className={`w-20 h-20 flex items-center justify-center rounded-full text-2xl font-bold ${
                    seatDetails.isBooked
                      ? "bg-red-100 text-red-800"
                      : seatDetails.reservedUntil &&
                          new Date(seatDetails.reservedUntil) > new Date()
                        ? "bg-yellow-100 text-yellow-800"
                        : seatDetails.isDisabled
                          ? "bg-gray-100 text-gray-800"
                          : "bg-green-100 text-green-800"
                  }`}
                >
                  {seatDetails.seatNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Bus Number</p>
                  <p className="font-medium">
                    {seatDetails.busId?.busNumber || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Seat Type</p>
                  <p className="font-medium capitalize">
                    {seatDetails.seatType || "Standard"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        seatDetails.isBooked
                          ? "bg-red-100 text-red-800"
                          : seatDetails.reservedUntil &&
                              new Date(seatDetails.reservedUntil) > new Date()
                            ? "bg-yellow-100 text-yellow-800"
                            : seatDetails.isDisabled
                              ? "bg-gray-100 text-gray-800"
                              : "bg-green-100 text-green-800"
                      }`}
                    >
                      {seatDetails.isBooked
                        ? "Booked"
                        : seatDetails.reservedUntil &&
                            new Date(seatDetails.reservedUntil) > new Date()
                          ? "Reserved"
                          : seatDetails.isDisabled
                            ? "Disabled"
                            : "Available"}
                    </span>
                  </p>
                </div>

                {seatDetails.reservedUntil &&
                  new Date(seatDetails.reservedUntil) > new Date() && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Reserved Until</p>
                      <p className="font-medium">
                        {new Date(seatDetails.reservedUntil).toLocaleString()}
                      </p>
                    </div>
                  )}
              </div>

              {/* Additional information or actions */}
              <div className="mt-4 space-y-4">
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <button
                      onClick={() => navigate(`/edit-seat/${seatDetails._id}`)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit Seat
                    </button>

                    {!seatDetails.isBooked && (
                      <>
                        <button
                          onClick={() => {
                            toggleSeatDisabled(
                              seatDetails._id,
                              seatDetails.isDisabled
                            );
                            setShowSeatDetailsModal(false);
                          }}
                          className={`px-4 py-2 rounded ${
                            seatDetails.isDisabled
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "bg-gray-500 text-white hover:bg-gray-600"
                          }`}
                        >
                          {seatDetails.isDisabled
                            ? "Enable Seat"
                            : "Disable Seat"}
                        </button>

                        <button
                          onClick={() => {
                            deleteSeat(seatDetails._id);
                            setShowSeatDetailsModal(false);
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete Seat
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SeatManagement;
