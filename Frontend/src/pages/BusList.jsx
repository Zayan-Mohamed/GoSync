import React, { useState, useEffect } from "react";
import { getBuses, addBus, updateBus, deleteBus } from "../services/busService";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { toast } from 'react-toastify';
import { Select, MenuItem } from "@mui/material";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import { Edit, Delete, Save, PictureAsPdf } from "@mui/icons-material";

function BusList() {
  const [buses, setBuses] = useState([]);
  const [newBus, setNewBus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    active: false,
    inactive: false,
    ac: false,
    semiLuxury: false,
    nonAC: false
  });
  const [editingBus, setEditingBus] = useState({
    id: null,
    busNumber: "",
    busRouteNumber: "",
    busType: "",
    capacity: "", // Ensures it's treated as a string
    status: "",
    fareAmount: "", // Ensures it's treated as a string
  });

  useEffect(() => {
    getBuses()
      .then((data) => {
        console.log("Fetched buses:", data);
        setBuses(data);
      })
      .catch((error) => console.error("Error fetching buses:", error));
  }, []);

  // Handle adding a new bus
  const handleAddBus = () => {
    if (!newBus.trim()) return;
    addBus({ bus_number: newBus })
      .then((data) => {
        setBuses((prevBuses) => [...prevBuses, data]);
        setNewBus("");
      })
      .catch((error) => console.error("Error adding bus:", error));
  };

  // Handle deleting a bus
  const handleDeleteBus = (id) => {
    deleteBus(id)
      .then(() => {
        setBuses((prevBuses) => prevBuses.filter((bus) => bus._id !== id));
      })
      .catch((error) => console.error("Error deleting bus:", error));
  };

  // Handle editing a bus
  const handleEditBus = (bus) => {
    setEditingBus({
      id: bus._id,
      busNumber: String(bus.busNumber), // Ensure busNumber is a string
      busRouteNumber: String(bus.busRouteNumber), // Ensure busRouteNumber is a string
      busType: String(bus.busType), // Ensure busType is a string
      capacity: String(bus.capacity || ""), // Ensure capacity is a string or fallback to an empty string
      status: String(bus.status || ""), // Ensure status is a string
      fareAmount: String(bus.fareAmount || ""), // Ensure fareAmount is a string
    });
  };

  // Handle updating a bus
  const handleUpdateBus = (id) => {
    // Ensure all values are strings before trimming
    if (
      !String(editingBus.busNumber).trim() ||
      !String(editingBus.busRouteNumber).trim() ||
      !String(editingBus.busType).trim() ||
      !String(editingBus.capacity).trim() ||
      !String(editingBus.status).trim() ||
      !String(editingBus.fareAmount).trim()
    ) {
      return; // Return if any required field is empty
    }    // Proceed to update the bus
    updateBus(id, {
      busNumber: editingBus.busNumber,
      busRouteNumber: editingBus.busRouteNumber,
      busType: editingBus.busType,
      capacity: editingBus.capacity,
      status: editingBus.status,
      fareAmount: editingBus.fareAmount,
    })
      .then((data) => {
        setBuses((prevBuses) =>
          prevBuses.map((bus) => (bus._id === id ? data : bus))
        );
        setEditingBus({
          id: null,
          busNumber: "",
          busRouteNumber: "",
          busType: "",
          capacity: "",
          status: "",
          fareAmount: "",
        });
      })
      .catch((error) => console.error("Error updating bus:", error));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };
  const filteredBuses = buses.filter((bus) => {
    const searchStr = searchQuery.toLowerCase();
    // Search match
    const searchMatch = (
      String(bus.busNumber).toLowerCase().includes(searchStr) ||
      String(bus.busRouteNumber).toLowerCase().includes(searchStr) ||
      String(bus.busType).toLowerCase().includes(searchStr)
    );

    // Status filter
    const statusMatch = 
      (!filters.active && !filters.inactive) ||
      (filters.active && bus.status === "Active") ||
      (filters.inactive && bus.status === "Inactive");

    // Bus type filter
    const typeMatch = 
      (!filters.ac && !filters.semiLuxury && !filters.nonAC) ||
      (filters.ac && bus.busType === "AC") ||
      (filters.semiLuxury && bus.busType === "Semi-Luxury") ||
      (filters.nonAC && bus.busType === "Non-AC");

    return searchMatch && statusMatch && typeMatch;
  });

  const sortedBuses = [...filteredBuses].sort((a, b) => {
    if (!sortBy) return 0;

    const aValue = a[sortBy] || "";
    const bValue = b[sortBy] || "";

    const comparison = String(aValue).localeCompare(String(bValue));
    return sortDirection === "asc" ? comparison : -comparison;
  });  
  
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString();
      
      let reportTitle = 'GoSync Bus Management System - Bus Report';
      
      // Add title and date with styling
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text(reportTitle, 14, 15);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generated on: ${currentDate}`, 14, 25);
      
      const tableColumn = [
        "Bus Number",
        "Route Number",
        "Type",
        "Capacity",
        "Status",
        "Fare Amount",
      ];
      const tableRows = filteredBuses.map((bus) => [
        bus.busNumber,
        bus.busRouteNumber,
        bus.busType,
        bus.capacity,
        bus.status,
        bus.fareAmount,
      ]);

      // Add filter summary with styling
      const activeFilters = [];
      if (filters.active) activeFilters.push('Active');
      if (filters.inactive) activeFilters.push('Inactive');
      if (filters.ac) activeFilters.push('AC');
      if (filters.semiLuxury) activeFilters.push('Semi-Luxury');
      if (filters.nonAC) activeFilters.push('Non-AC');

      doc.setFontSize(10);
      doc.text(`Filters Applied: ${activeFilters.length ? activeFilters.join(', ') : 'None'}`, 14, 35);
      doc.setFontSize(11);
      doc.setTextColor(41, 128, 185);
      doc.text(`Total Buses: ${filteredBuses.length}`, 14, 42);

      // Generate table with enhanced styling
      autoTable(doc, {
        startY: 50,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: { 
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: { 
          fillColor: [41, 128, 185], 
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
      });

      // Save the PDF with formatted name
      const fileName = `gosync_bus_report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('Bus report exported successfully');
    } catch (error) {
      console.error('PDF Export error:', error);
      toast.error('Failed to export bus report');
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const headers = [
        "Bus Number",
        "Route Number",
        "Type",
        "Capacity",
        "Status",
        "Fare Amount"
      ];

      // Format data for CSV
      const data = filteredBuses.map(bus => [
        bus.busNumber,
        bus.busRouteNumber,
        bus.busType,
        bus.capacity,
        bus.status,
        bus.fareAmount
      ]);

      // Combine headers and data
      const csvArray = [headers, ...data];

      // Convert to CSV string with improved formatting
      const csvContent = csvArray
        .map(row => row
          .map(cell => {
            const stringCell = String(cell || "");
            return stringCell.includes(",") || stringCell.includes('"') || stringCell.includes("\n")
              ? `"${stringCell.replace(/"/g, '""')}"`
              : stringCell;
          })
          .join(",")
        )
        .join("\n");

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;bom" });
      const fileName = `gosync_bus_list_${new Date().toISOString().split('T')[0]}.csv`;
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Bus data exported to CSV successfully");
    } catch (error) {
      console.error("CSV Export error:", error);
      toast.error("Failed to export bus data to CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 bg-[#F5F5F5] overflow-auto p-6">
          <h2 className="text-xl font-bold mb-4">Bus List</h2>

          {/* Search and Filter Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by bus number or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {searchQuery && (
                <div className="mt-2 text-sm text-gray-600">
                  Found {filteredBuses.length} matching buses
                </div>
              )}
            </div>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Filters */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Filter by Status</h3>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.active}
                      onChange={(e) => setFilters({ ...filters, active: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-green-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">Active</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inactive}
                      onChange={(e) => setFilters({ ...filters, inactive: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-red-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Bus Type Filters */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Filter by Type</h3>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.ac}
                      onChange={(e) => setFilters({ ...filters, ac: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">AC</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.semiLuxury}
                      onChange={(e) => setFilters({ ...filters, semiLuxury: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-yellow-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">Semi-Luxury</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.nonAC}
                      onChange={(e) => setFilters({ ...filters, nonAC: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-purple-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">Non-AC</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Export Button with Counter */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                {filteredBuses.length} buses selected
              </div>              <div className="flex space-x-4">
                <button
                  onClick={generatePDF}
                  disabled={isExporting}
                  className={`${
                    isExporting ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'
                  } text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2`}
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Exporting PDF...</span>
                    </>
                  ) : (
                    <>
                      <PictureAsPdf />
                      <span>Export Filtered PDF</span>
                    </>
                  )}
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={isExporting}
                  className={`${
                    isExporting ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2`}
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Exporting CSV...</span>
                    </>
                  ) : (
                    <span>Export Filtered CSV</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bus Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => handleSort("busNumber")} style={{ cursor: "pointer" }}>
                    Bus Number {sortBy === "busNumber" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell onClick={() => handleSort("busRouteNumber")} style={{ cursor: "pointer" }}>
                    Route Number {sortBy === "busRouteNumber" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell onClick={() => handleSort("busType")} style={{ cursor: "pointer" }}>
                    Bus Type {sortBy === "busType" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell onClick={() => handleSort("capacity")} style={{ cursor: "pointer" }}>
                    Capacity {sortBy === "capacity" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                    Status {sortBy === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell onClick={() => handleSort("fareAmount")} style={{ cursor: "pointer" }}>
                    Fare Amount {sortBy === "fareAmount" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(sortedBuses) &&
                  sortedBuses.map((bus) => (
                    <TableRow key={bus._id}>
                      <TableCell>
                        {editingBus.id === bus._id ? (
                          <TextField
                            value={editingBus.busNumber}
                            onChange={(e) =>
                              setEditingBus({
                                ...editingBus,
                                busNumber: e.target.value,
                              })
                            }
                            variant="outlined"
                            size="small"
                          />
                        ) : (
                          bus.busNumber
                        )}
                      </TableCell>
                      <TableCell>
                        {editingBus.id === bus._id ? (
                          <TextField
                            value={editingBus.busRouteNumber}
                            onChange={(e) =>
                              setEditingBus({
                                ...editingBus,
                                busRouteNumber: e.target.value,
                              })
                            }
                            variant="outlined"
                            size="small"
                          />
                        ) : (
                          bus.busRouteNumber
                        )}
                      </TableCell>
                      <TableCell>
                        {editingBus.id === bus._id ? (
                          <Select
                            value={editingBus.busType}
                            onChange={(e) =>
                              setEditingBus((prev) => ({
                                ...prev,
                                busType: e.target.value,
                              }))
                            }
                            variant="outlined"
                            size="small"
                            fullWidth
                          >                            <MenuItem value="AC">AC</MenuItem>
                            <MenuItem value="Non-AC">Non-AC</MenuItem>
                            <MenuItem value="Semi-Luxury">Semi-Luxury</MenuItem>
                          </Select>
                        ) : (
                          bus.busType
                        )}
                      </TableCell>
                      <TableCell>
                        {editingBus.id === bus._id ? (
                          <TextField
                            value={String(editingBus.capacity)}
                            onChange={(e) =>
                              setEditingBus({
                                ...editingBus,
                                capacity: e.target.value,
                              })
                            }
                            variant="outlined"
                            size="small"
                          />
                        ) : (
                          String(bus.capacity)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingBus.id === bus._id ? (
                          <Select
                            value={editingBus.status}
                            onChange={(e) =>
                              setEditingBus({ ...editingBus, status: e.target.value })
                            }
                            variant="outlined"
                            size="small"
                            fullWidth
                          >
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="Inactive">Inactive</MenuItem>
                          </Select>
                        ) : (
                          bus.status
                        )}
                      </TableCell>
                      <TableCell>
                        {editingBus.id === bus._id ? (
                          <TextField
                            value={String(editingBus.fareAmount)}
                            onChange={(e) =>
                              setEditingBus({
                                ...editingBus,
                                fareAmount: e.target.value,
                              })
                            }
                            variant="outlined"
                            size="small"
                          />
                        ) : (
                          String(bus.fareAmount)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingBus.id === bus._id ? (
                          <IconButton
                            onClick={() => handleUpdateBus(bus._id)}
                            disabled={
                              !editingBus.busNumber.trim() ||
                              !editingBus.busRouteNumber.trim() ||
                              !editingBus.busType.trim() ||
                              !editingBus.capacity.trim() ||
                              !editingBus.status.trim() ||
                              !editingBus.fareAmount.trim()
                            }
                          >
                            <Save color="primary" />
                          </IconButton>
                        ) : (
                          <>
                            <IconButton onClick={() => handleEditBus(bus)}>
                              <Edit color="primary" />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteBus(bus._id)}>
                              <Delete color="secondary" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </div>
  );
}

export default BusList;
