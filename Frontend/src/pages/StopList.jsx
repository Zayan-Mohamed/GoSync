import React, { useState, useEffect } from "react";
import { 
  getAllStops, 
  updateStop, 
  deleteStop,
  toggleStopStatus
} from "../services/stopService";
import AdminLayout from "../layouts/AdminLayout";
import {
  TextField,
  MenuItem,
  Select,
  Paper,
  Typography,
  Box,
  Pagination,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  alpha
} from "@mui/material";
import { Edit, Delete, Save, Sync, PictureAsPdf, Search, ErrorOutline } from "@mui/icons-material";
import { toast } from 'react-toastify';
import Table from "../components/Table";
import Button from '../components/Button';
import { jsPDF } from "jspdf";
import autoTable from  "jspdf-autotable";
import Loader from "../components/Loader";
import { motion } from "framer-motion";

// Add custom styles
const styles = {
  pageContainer: {
    p: 3,
    backgroundColor: '#F8FAFC',
    minHeight: 'calc(100vh - 64px)',
    transition: 'all 0.3s ease'
  },
  mainPaper: {
    p: 4,
    borderRadius: '16px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
    overflow: 'hidden'
  },
  searchContainer: {
    display: 'flex',
    gap: 2,
    mb: 4,
    alignItems: 'center',
    flexWrap: 'wrap',
    transition: 'all 0.3s ease'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    p: '8px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    backgroundColor: '#F8FAFC',
    transition: 'all 0.2s ease',
    minWidth: '280px',
    '&:hover': {
      borderColor: '#E65100',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
    },
    '&:focus-within': {
      borderColor: '#E65100',
      boxShadow: '0 2px 12px rgba(230, 81, 0, 0.1)'
    }
  },
  actionButton: {
    backgroundColor: '#FFF',
    color: '#E65100',
    borderRadius: '10px',
    minWidth: '40px',
    border: '2px solid #E65100',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#FFF3E0',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(230, 81, 0, 0.1)'
    }
  },
  editButton: {
    backgroundColor: '#E65100',
    color: 'white',
    borderRadius: '10px',
    minWidth: '40px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#FF8F00',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(230, 81, 0, 0.2)'
    }
  },
  deleteButton: {
    backgroundColor: '#FFF',
    color: '#DC2626',
    borderRadius: '10px',
    minWidth: '40px',
    border: '2px solid #DC2626',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#FEE2E2',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.1)'
    }
  },
  exportButton: {
    backgroundColor: '#FFF',
    color: '#E65100',
    borderRadius: '12px',
    border: '2px solid #E65100',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '&:hover': {
      backgroundColor: '#FFF3E0',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(230, 81, 0, 0.1)'
    },
    '&.Mui-disabled': {
      backgroundColor: '#F1F5F9',
      borderColor: '#CBD5E1',
      color: '#94A3B8'
    }
  },
  statusChip: (status) => ({
    px: 2,
    py: 1,
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'capitalize',
    backgroundColor: status === 'active' 
      ? '#DCFCE7'
      : '#FEE2E2',
    color: status === 'active' ? '#166534' : '#991B1B',
    border: `1px solid ${status === 'active' ? '#BBF7D0' : '#FECACA'}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: status === 'active' 
        ? '#BBF7D0'
        : '#FECACA'
    }
  }),
  tableContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
    transition: 'all 0.3s ease',
    backgroundColor: '#FFF',
    border: '1px solid #E2E8F0',
    '& .MuiTableCell-root': {
      borderColor: '#E2E8F0',
      padding: '16px',
    },
    '& .MuiTableHead-root': {
      backgroundColor: '#F8FAFC',
      '& .MuiTableCell-root': {
        fontWeight: 600,
        color: '#475569',
        borderBottom: '2px solid #E2E8F0'
      }
    },
    '& .MuiTableBody-root .MuiTableRow-root:hover': {
      backgroundColor: '#F8FAFC'
    }
  },
  pageHeader: {
    mb: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    '& h5': {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#1E293B',
      display: 'flex',
      alignItems: 'center',
      gap: 1
    },
    '& .description': {
      color: '#64748B',
      fontSize: '0.875rem'
    }
  },
  noDataContainer: {
    p: 6,
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '2px dashed #CBD5E1',
    '& .MuiTypography-root': {
      color: '#64748B',
      fontSize: '0.875rem'
    }
  }
};

function StopList() {
    const [stops, setStops] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingStop, setEditingStop] = useState({
        id: null,
        stopId: "",
        stopName: "",
        status: "active"
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);

    // Fetch stops on component mount
    useEffect(() => {
        fetchStops();
    }, []);

    const fetchStops = async () => {
        try {
            setLoading(true);
            const data = await getAllStops();
            const stopsData = Array.isArray(data) 
                ? data 
                : (Array.isArray(data?.stops) 
                    ? data.stops 
                    : []);
            
            setStops(stopsData.reverse());
            setError(null);
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message || "Failed to load stops");
            setStops([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter stops based on search term
    const filteredStops = Array.isArray(stops) 
        ? stops.filter(stop => 
            stop?.stopName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    // Toast notification helper
    const showToast = (message, type = "success") => {
        toast[type](message);
    };

    // Handle delete action
    const handleDeleteStop = async (stopId) => {
        if (!window.confirm("Are you sure you want to delete this stop?")) return;
        
        try {
            await deleteStop(stopId);
            setStops(prev => prev.filter(stop => stop._id !== stopId));
            showToast("Stop deleted successfully!", "success");
        } catch (err) {
            showToast(err.message || "Delete failed", "error");
        }
    };

    // Handle edit initiation
    const handleEditStop = (stop) => {
        setEditingStop({
            id: stop._id,
            stopId: stop.stopId,
            stopName: stop.stopName,
            status: stop.status
        });
    };

    // Handle update action
    const handleUpdateStop = async () => {
        if (!editingStop.stopName.trim()) {
            showToast("Stop name cannot be empty", "error");
            return;
        }

        try {
            const updatedStop = await updateStop(editingStop.id, {
                stopName: editingStop.stopName.trim(),
                status: editingStop.status
            });

            setStops(prev => prev.map(stop =>
                stop._id === editingStop.id ? {...stop, ...updatedStop} : stop
            ));

            setEditingStop({
                id: null,
                stopId: "",
                stopName: "",
                status: "active"
            });

            showToast("Stop updated successfully", "success");
        } catch (err) {
            console.error("Update failed:", err);
            showToast(err.message || "Update failed", "error");
        }
    };

    // Handle toggle status action
    const handleToggleStatus = async (stopId) => {
        try {
            const updatedStop = await toggleStopStatus(stopId);
            setStops(prev => prev.map(stop =>
                stop._id === stopId ? {...stop, ...updatedStop} : stop
            ));
            showToast(`Status changed to ${updatedStop.status}`, "success");
        } catch (err) {
            console.error("Toggle status failed:", err);
            showToast(err.message || "Status change failed", "error");
        }
    };

    const handleCancelEdit = () => {
        setEditingStop({
            id: null,
            stopId: "",
            stopName: "",
            status: "active"
        });
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    const getPaginatedStops = () => {
        const startIndex = (page - 1) * rowsPerPage;
        return filteredStops.slice(startIndex, startIndex + rowsPerPage);
    };

    const generatePDF = () => {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Stops List', 14, 15);
      
      // Prepare data for PDF (only first two columns)
      const pdfData = filteredStops.map(stop => [
        stop.stopName,
        stop.status
      ]);
      
      // Generate table using autoTable plugin
      autoTable(doc, {
        head: [['Stop Name', 'Status']],
        body: pdfData,
        startY: 25,
        styles: {
          fontSize: 10,
          cellPadding: 2,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 40 }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const status = data.cell.raw;
            doc.setFillColor(status === 'active' ? '#d1fae5' : '#fee2e2');
            doc.setDrawColor(status === 'active' ? '#10b981' : '#ef4444');
            doc.rect(
              data.cell.x,
              data.cell.y,
              data.cell.width,
              data.cell.height,
              'FD' // Fill and draw
            );
            doc.setTextColor(status === 'active' ? '#065f46' : '#991b1b');
            doc.text(
              status,
              data.cell.x + data.cell.width / 2,
              data.cell.y + data.cell.height / 2 + 2,
              { align: 'center' }
            );
          }
        }
      });
      
      // Save the PDF
      doc.save('stops-list.pdf');
    };

    if (loading) {
      return (
        <AdminLayout>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
            <Loader />
          </Box>
        </AdminLayout>
      );
    }

    return (
      <AdminLayout>
        <Box sx={styles.pageContainer}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Page Header */}
            <div className="bg-gradient-to-r from-[#FFE082] to-[#FFC107] rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-3xl font-bold text-[#E65100] mb-2">Current Stops</h2>
              <p className="text-gray-700">View and manage all bus stops in the system</p>
            </div>

            <Paper sx={styles.mainPaper}>
              <Box sx={{ mb: 4 }}>
                             

                <Box sx={styles.searchContainer}>
                  <Paper
                    elevation={0}
                    sx={styles.searchBox}
                  >
                    <IconButton sx={{ p: '10px' }}>
                      <Search />
                    </IconButton>
                    <TextField
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                      placeholder="Search stops by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      variant="standard"
                      InputProps={{
                        disableUnderline: true
                      }}
                    />
                  </Paper>

                  <Tooltip title="Export to PDF" arrow>
                    <Button
                      variant="secondary"
                      onClick={generatePDF}
                      disabled={filteredStops.length === 0}
                      className="flex items-center gap-2"
                    >
                      <PictureAsPdf /> Export PDF
                    </Button>
                  </Tooltip>
                </Box>

                {error && (
                  <Fade in={true}>
                    <Box sx={{
                      p: 2,
                      mb: 3,
                      borderRadius: 2,
                      backgroundColor: alpha('#F44336', 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <ErrorOutline sx={{ color: '#D32F2F' }} />
                      <Typography sx={{ color: '#D32F2F', flex: 1 }}>{error}</Typography>
                      <Button
                        variant="primary"
                        onClick={() => fetchStops()}
                        className="min-w-[40px] p-2"
                      >
                        Retry
                      </Button>
                    </Box>
                  </Fade>
                )}

                <Box sx={styles.tableContainer}>
                  {filteredStops.length === 0 ? (
                    <Fade in={true}>
                      <Box sx={{
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: '#fff'
                      }}>
                        <Typography color="textSecondary">
                          {searchTerm ? "No matching stops found" : "No stops available"}
                        </Typography>
                      </Box>
                    </Fade>
                  ) : (
                    <>
                      <Table
                        columns={[
                          {
                            header: "Stop Name",
                            accessor: "stopName", 
                            render: (stop) => {
                              const isEditing = editingStop.id === stop._id;
                              
                              return (
                                <Box>
                                  {isEditing ? (
                                    <TextField
                                      value={editingStop.stopName}
                                      onChange={(e) => setEditingStop({
                                        ...editingStop,
                                        stopName: e.target.value
                                      })}
                                      variant="outlined"
                                      size="small"
                                      fullWidth
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          '& fieldset': {
                                            borderColor: '#E65100',
                                          },
                                          '&:hover fieldset': {
                                            borderColor: '#FF8F00',
                                          }
                                        }
                                      }}
                                    />
                                  ) : (
                                    <Typography sx={{ fontWeight: 500 }}>
                                      {stop.stopName}
                                    </Typography>
                                  )}
                                </Box>
                              );
                            }
                          },
                          {
                            header: "Status",
                            accessor: "status",
                            render: (stop) => {
                              const isEditing = editingStop.id === stop._id;
                              
                              return (
                                <Box>
                                  {isEditing ? (
                                    <Select
                                      value={editingStop.status}
                                      onChange={(e) => setEditingStop({
                                        ...editingStop,
                                        status: e.target.value
                                      })}
                                      size="small"
                                      fullWidth
                                      sx={{
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: '#E65100'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                          borderColor: '#FF8F00'
                                        }
                                      }}
                                    >
                                      <MenuItem value="active">Active</MenuItem>
                                      <MenuItem value="inactive">Inactive</MenuItem>
                                    </Select>
                                  ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Box sx={styles.statusChip(stop.status)}>
                                        {stop.status}
                                      </Box>
                                      <Tooltip title={`Toggle to ${stop.status === 'active' ? 'inactive' : 'active'}`} arrow>
                                        <Button
                                          variant="secondary"
                                          onClick={() => handleToggleStatus(stop._id)}
                                          className="min-w-[40px] p-2"
                                        >
                                          <Sync fontSize="small" />
                                        </Button>
                                      </Tooltip>
                                    </Box>
                                  )}
                                </Box>
                              );
                            }
                          },
                          {
                            header: "Actions",
                            accessor: "actions",
                            render: (stop) => {
                              const isEditing = editingStop.id === stop._id;
                              
                              if (isEditing) {
                                return (
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="primary"
                                      onClick={handleUpdateStop}
                                      disabled={!editingStop.stopName.trim()}
                                      className="min-w-[40px] p-2"
                                    >
                                      <Save fontSize="small" />
                                    </Button>
                                    <Button 
                                      variant="light"
                                      onClick={handleCancelEdit}
                                      className="min-w-[40px] p-2"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="flex space-x-2">
                                  <Tooltip title="Edit stop" arrow>
                                    <Button 
                                      variant="primary"
                                      onClick={() => handleEditStop(stop)}
                                      className="min-w-[40px] p-2"
                                    >
                                      <Edit fontSize="small" />
                                    </Button>
                                  </Tooltip>
                                  <Tooltip title="Delete stop" arrow>
                                    <Button
                                      variant="danger" 
                                      onClick={() => handleDeleteStop(stop._id)}
                                      className="min-w-[40px] p-2"
                                    >
                                      <Delete fontSize="small" />
                                    </Button>
                                  </Tooltip>
                                </div>
                              );
                            }
                          }
                        ]}
                        data={getPaginatedStops()}
                        highlightOnHover
                      />
                      <Box sx={{ 
                        mt: 4, // Increased top margin
                        mb: 2, // Added bottom margin
                        display: 'flex', 
                        justifyContent: 'center',
                        position: 'relative', // Ensure proper stacking context
                        zIndex: 1 // Ensure pagination stays above other elements
                      }}>
                        <Pagination
                          count={Math.ceil(filteredStops.length / rowsPerPage)}
                          page={page}
                          onChange={handlePageChange}
                          color="primary"
                          shape="rounded"
                          size="large"
                          sx={{
                            '& .MuiPaginationItem-root': {
                              color: '#E65100',
                              margin: '0 4px', // Add spacing between pagination items
                              minWidth: '32px', // Ensure consistent width
                              height: '32px', // Ensure consistent height
                              '&.Mui-selected': {
                                backgroundColor: '#FFC107',
                                color: '#212121',
                                fontWeight: 500,
                                '&:hover': {
                                  backgroundColor: '#FFD600'
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Box>
      </AdminLayout>
    );
}

export default StopList;