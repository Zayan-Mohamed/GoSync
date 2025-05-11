import React, { useState, useEffect } from "react";
import {
  getBusOperators,
  addBusOperator,
  updateBusOperator,
  deleteBusOperator,
} from "../services/busOperatorService";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { toast } from 'react-toastify';
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
  Select,
  MenuItem,
} from "@mui/material";
import { Edit, Delete, Save, PictureAsPdf } from "@mui/icons-material";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function BusOperatorsList() {
  const [operators, setOperators] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [newOperator, setNewOperator] = useState({
    operatorName: "",
    operatorPhone: "",
    operatorLicenseNumber: "",
    licenseEndDate: "",
    role: "Driver",
    status: "Active",
  });
  const [editingOperator, setEditingOperator] = useState(null);
  const [filters, setFilters] = useState({
    active: false,
    inactive: false,
    driver: false,
    conductor: false,
    staff: false
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    getBusOperators()
      .then((data) => {
        console.log("Fetched operators:", data);
        setOperators(data);
      })
      .catch((error) => console.error("Error fetching operators:", error));
  }, []);

  const handleAddOperator = () => {
    if (!newOperator.operatorName.trim() || !newOperator.operatorPhone.trim()) return;
    addBusOperator(newOperator)
      .then((data) => {
        setOperators([...operators, data]);
        setNewOperator({
          operatorName: "",
          operatorPhone: "",
          operatorLicenseNumber: "",
          licenseEndDate: "",
          role: "Driver",
          status: "Active",
        });
      })
      .catch((error) => console.error("Error adding operator:", error));
  };

  const handleDeleteOperator = (id) => {
    deleteBusOperator(id)
      .then(() => setOperators(operators.filter((op) => op._id !== id)))
      .catch((error) => console.error("Error deleting operator:", error));
  };

  const handleEditOperator = (operator) => {
    setEditingOperator({ ...operator });
  };

  const handleUpdateOperator = (id) => {
    updateBusOperator(id, editingOperator)
      .then(() => {
        setOperators(operators.map((op) => (op._id === id ? editingOperator : op)));
        setEditingOperator(null);
      })
      .catch((error) => console.error("Error updating operator:", error));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedOperators = React.useMemo(() => {
    let filtered = operators.filter(operator => {
      const searchStr = searchQuery.toLowerCase();
      // Search match
      const searchMatch = 
        operator.operatorName.toLowerCase().includes(searchStr) ||
        (operator.operatorLicenseNumber && operator.operatorLicenseNumber.toLowerCase().includes(searchStr));

      // Status filter
      const statusMatch = 
        (!filters.active && !filters.inactive) ||
        (filters.active && operator.status === "Active") ||
        (filters.inactive && operator.status === "Inactive");

      // Role filter
      const roleMatch = 
        (!filters.driver && !filters.conductor && !filters.staff) ||
        (filters.driver && operator.role === "Driver") ||
        (filters.conductor && operator.role === "Conductor") ||
        (filters.staff && operator.role === "staff");

      return searchMatch && statusMatch && roleMatch;
    });

    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy] || "";
        const bValue = b[sortBy] || "";
        const comparison = String(aValue).localeCompare(String(bValue));
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [operators, searchQuery, filters, sortBy, sortDirection]);

  const generateFilteredPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString();
      
      // Apply filters
      let filteredOperators = filteredAndSortedOperators;      
      let reportTitle = 'GoSync Bus Management System - Operators Report';
      
      // Add title and date with styling
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text(reportTitle, 14, 15);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generated on: ${currentDate}`, 14, 25);
      
      const tableColumn = ["Name", "Phone", "License", "Role", "Status"];
      const tableRows = filteredOperators.map((op) => [
        op.operatorName,
        op.operatorPhone,
        op.operatorLicenseNumber || "N/A",
        op.role,
        op.status,
      ]);

      // Add filter summary
      const activeFilters = [];
      if (filters.active) activeFilters.push('Active');
      if (filters.inactive) activeFilters.push('Inactive');
      if (filters.driver) activeFilters.push('Drivers');
      if (filters.conductor) activeFilters.push('Conductors');
      if (filters.staff) activeFilters.push('Staff');
      
      doc.text(`Filters Applied: ${activeFilters.length ? activeFilters.join(', ') : 'None'}`, 14, 35);
      doc.text(`Total Operators: ${filteredOperators.length}`, 14, 42);

      // Generate table
      autoTable(doc, {
        startY: 50,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 8 },
        headerStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      doc.save('gosync_bus_operators_report.pdf');
      toast.success('Bus operators report exported successfully');
    } catch (error) {
      console.error('PDF Export error:', error);
      toast.error('Failed to export bus operators report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const headers = [
        "Operator Name",
        "Phone Number",
        "License Number",
        "License End Date",
        "Role",
        "Status"
      ];

      const filteredOperators = filteredAndSortedOperators;

      const rows = [headers];

      filteredOperators.forEach(operator => {
        rows.push([
          operator.operatorName,
          operator.operatorPhone,
          operator.operatorLicenseNumber || 'N/A',
          operator.licenseEndDate || 'N/A',
          operator.role,
          operator.status
        ]);
      });

      const csvContent = rows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const currentDate = new Date().toLocaleDateString().replace(/\//g, '-');
      link.href = window.URL.createObjectURL(blob);
      link.download = `gosync_operators_report_${currentDate}.csv`;
      link.click();

      toast.success('Bus operators data exported to CSV successfully');
    } catch (error) {
      console.error('CSV Export error:', error);
      toast.error('Failed to export bus operators data to CSV');
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
          <h2 className="text-xl font-bold mb-4">Bus Operators</h2>
          
          {/* Search and Filter Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by operator name or license number..."
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
                  Found {filteredAndSortedOperators.length} matching operators
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

              {/* Role Filters */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Filter by Role</h3>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.driver}
                      onChange={(e) => setFilters({ ...filters, driver: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">Drivers</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.conductor}
                      onChange={(e) => setFilters({ ...filters, conductor: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-yellow-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">Conductors</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.staff}
                      onChange={(e) => setFilters({ ...filters, staff: e.target.checked })}
                      className="form-checkbox h-5 w-5 text-purple-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">Staff</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Export Button with Counter */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                {filteredAndSortedOperators.length} operators selected
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={generateFilteredPDF}
                  disabled={isExporting}
                  className={`bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <PictureAsPdf />
                  <span>{isExporting ? 'Exporting...' : 'Export Filtered PDF'}</span>
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={isExporting}
                  className={`bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>{isExporting ? 'Exporting...' : 'Export Filtered CSV'}</span>
                </button>
              </div>
            </div>
          </div>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => handleSort("operatorName")} style={{ cursor: "pointer" }}>
                    Name {sortBy === "operatorName" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell onClick={() => handleSort("operatorPhone")} style={{ cursor: "pointer" }}>
                    Phone {sortBy === "operatorPhone" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell onClick={() => handleSort("operatorLicenseNumber")} style={{ cursor: "pointer" }}>
                    License {sortBy === "operatorLicenseNumber" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell onClick={() => handleSort("role")} style={{ cursor: "pointer" }}>
                    Role {sortBy === "role" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                    Status {sortBy === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedOperators.map((op, index) => (
                  <TableRow key={op._id || index}>
                    <TableCell>
                      {editingOperator && editingOperator._id === op._id ? (
                        <TextField
                          value={editingOperator.operatorName}
                          onChange={(e) =>
                            setEditingOperator({
                              ...editingOperator,
                              operatorName: e.target.value,
                            })
                          }
                          size="small"
                        />
                      ) : (
                        op.operatorName
                      )}
                    </TableCell>
                    <TableCell>
                      {editingOperator && editingOperator._id === op._id ? (
                        <TextField
                          value={editingOperator.operatorPhone}
                          onChange={(e) =>
                            setEditingOperator({
                              ...editingOperator,
                              operatorPhone: e.target.value,
                            })
                          }
                          size="small"
                        />
                      ) : (
                        op.operatorPhone
                      )}
                    </TableCell>
                    <TableCell>{op.operatorLicenseNumber}</TableCell>
                    <TableCell>
                      {editingOperator && editingOperator._id === op._id ? (
                        <Select
                          value={editingOperator.role}
                          onChange={(e) =>
                            setEditingOperator({
                              ...editingOperator,
                              role: e.target.value,
                            })
                          }
                          size="small"
                        >
                          <MenuItem value="Driver">Driver</MenuItem>
                          <MenuItem value="Conductor">Conductor</MenuItem>
                          <MenuItem value="staff">Staff</MenuItem>
                        </Select>
                      ) : (
                        op.role
                      )}
                    </TableCell>
                    <TableCell>
                      {editingOperator && editingOperator._id === op._id ? (
                        <Select
                          value={editingOperator.status}
                          onChange={(e) =>
                            setEditingOperator({
                              ...editingOperator,
                              status: e.target.value,
                            })
                          }
                          size="small"
                        >
                          <MenuItem value="Active">Active</MenuItem>
                          <MenuItem value="Inactive">Inactive</MenuItem>
                        </Select>
                      ) : (
                        op.status
                      )}
                    </TableCell>
                    <TableCell>
                      {editingOperator && editingOperator._id === op._id ? (
                        <IconButton onClick={() => handleUpdateOperator(op._id)}>
                          <Save color="primary" />
                        </IconButton>
                      ) : (
                        <>
                          <IconButton onClick={() => handleEditOperator(op)}>
                            <Edit color="primary" />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteOperator(op._id)}>
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

export default BusOperatorsList;
