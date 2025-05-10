import React, { useState, useEffect, useCallback } from "react";
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
  CircularProgress,
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
import { Edit, Delete, Save, Sync, PictureAsPdf, Search, ErrorOutline, Timer } from "@mui/icons-material";
import { toast } from 'react-toastify';
import Table from "../components/Table";
import Button from '../components/Button';
import { jsPDF } from "jspdf";
import autoTable from  "jspdf-autotable";
import Loader from "../components/Loader";

// Add custom styles
const styles = {
  pageContainer: {
    p: 3,
    backgroundColor: '#F5F5F5',
    minHeight: 'calc(100vh - 64px)',
    transition: 'all 0.3s ease'
  },
  mainPaper: {
    p: 4,
    borderRadius: 3,
    backgroundColor: '#fff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease'
  },
  searchContainer: {
    display: 'flex',
    gap: 2,
    mb: 3,
    alignItems: 'center',
    transition: 'all 0.3s ease'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    p: '2px 4px',
    border: '1px solid #e0e0e0',
    borderRadius: 2,
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      borderColor: '#E65100'
    }
  },
  actionButton: {
    backgroundColor: '#FFC107', // Golden Yellow
    color: '#212121', // Dark Charcoal
    minWidth: '40px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#FFD600', // Bright Yellow
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(255, 193, 7, 0.2)'
    },
  },
  editButton: {
    backgroundColor: '#E65100', // Deep Orange
    color: 'white',
    minWidth: '40px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#FF8F00', // Sunset Orange
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(230, 81, 0, 0.2)'
    },
  },
  deleteButton: {
    backgroundColor: '#D32F2F', // A more prominent red color
    color: 'white',
    minWidth: '40px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#B71C1C', // Darker red on hover
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
    },
  },
  exportButton: {
    backgroundColor: '#FFC107',
    color: '#212121',
    '&:hover': {
      backgroundColor: '#FFD600',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(255, 193, 7, 0.2)'
    },
    '&.Mui-disabled': {
      backgroundColor: alpha('#FFC107', 0.12),
      color: alpha('#212121', 0.26)
    }
  },
  statusChip: (status) => ({
    px: 2,
    py: 1,
    borderRadius: 2,
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    fontWeight: 500,
    textTransform: 'capitalize',
    backgroundColor: status === 'active' 
      ? alpha('#4CAF50', 0.1)
      : alpha('#F44336', 0.1),
    color: status === 'active' ? '#2E7D32' : '#D32F2F',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: status === 'active' 
        ? alpha('#4CAF50', 0.2)
        : alpha('#F44336', 0.2)
    }
  }),
  tableContainer: {
    borderRadius: 2,
    overflow: 'hidden',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    }
  },
  pendingActionItem: {
    opacity: 0.6,
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.05)',
      zIndex: 1
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
    const [pendingActions, setPendingActions] = useState({});
    const [activeCountdown, setActiveCountdown] = useState(null);

    // Fetch stops on component mount
    useEffect(() => {
      fetchStops();
    }, []);

    const fetchStops = async () => {
      try {
        setLoading(true);
        const data = await getAllStops();
        console.log("Received data:", data);
        
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

    // Clear timeouts when component unmounts
    useEffect(() => {
      return () => {
        Object.values(pendingActions).forEach(({timeoutId}) => {
          if (timeoutId) clearTimeout(timeoutId);
        });
      };
    }, [pendingActions]);

    // Create a countdown timer effect
    const [countdown, setCountdown] = useState(3);
    
    useEffect(() => {
      let interval;
      
      if (activeCountdown) {
        setCountdown(3);
        interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        clearInterval(interval);
      }
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [activeCountdown]);

    // Filter stops based on search term
    const filteredStops = Array.isArray(stops) 
      ? stops.filter(stop => 
          stop?.stopName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [];

    // Toast notification helpers
    const showToast = (message, type = "success") => {
      toast[type](message);
    };

    const showToastWithUndo = (message, actionType, actionId) => {
      toast(
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Timer style={{ fontSize: '18px' }} /> 
            <span>{message} <strong>{countdown}</strong> seconds...</span>
          </div>
          <button
            onClick={() => handleCancelAction(actionId)}
            style={{
              padding: '4px 12px',
              backgroundColor: '#E65100',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minWidth: '60px',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FF8F00'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#E65100'}
          >
            Cancel
          </button>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          style: {
            background: 'white',
            color: '#000',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }
        }
      );
    };

    // Handle initiating delete action
    const handleDeleteStop = async (stopId) => {
      if (!window.confirm("Are you sure you want to delete this stop?")) return;

      try {
        const actionKey = `delete-${stopId}`;
        const stopToDelete = stops.find(stop => stop._id === stopId);
        
        if (!stopToDelete) {
          throw new Error("Stop not found");
        }

        // Add stop to pending actions (marked for deletion)
        setPendingActions(prev => ({
          ...prev,
          [actionKey]: { 
            type: 'delete',
            stopId,
            originalData: stopToDelete,
            timeoutId: null
          }
        }));
        
        // Set active countdown for UI
        setActiveCountdown(actionKey);
        
        // Create a timeout for the actual deletion
        const timeoutId = setTimeout(async () => {
          try {
            // Perform actual deletion after delay
            await deleteStop(stopId);
            
            // Remove from stops list 
            setStops(prev => prev.filter(stop => stop._id !== stopId));
            
            // Clean up the pending action
            setPendingActions(prev => {
              const { [actionKey]: _, ...rest } = prev;
              return rest;
            });
            
            // Show success toast
            showToast("Stop deleted successfully!", "success");
          } catch (err) {
            console.error("Delete stop failed:", err);
            showToast(err.message || "Failed to delete stop", "error");
          } finally {
            setActiveCountdown(null);
          }
        }, 3000);
        
        // Store the timeout ID
        setPendingActions(prev => ({
          ...prev,
          [actionKey]: {
            ...prev[actionKey],
            timeoutId
          }
        }));
        
        // Show countdown toast
        showToastWithUndo(
          "Stop will be deleted in",
          'delete',
          actionKey
        );
      } catch (err) {
        console.error("Delete operation failed:", err);
        showToast(err.message || "Operation failed", "error");
      }
    };

    // Handle initiating edit action
    const handleEditStop = (stop) => {
      setEditingStop({
        id: stop._id,
        stopId: stop.stopId,
        stopName: stop.stopName,
        status: stop.status
      });
    };

    // Handle initiating update action
    const handleUpdateStop = async () => {
      if (!editingStop.stopName.trim()) {
        showToast("Stop name cannot be empty", "error");
        return;
      }

      try {
        const actionKey = `edit-${editingStop.id}`;
        const originalStop = stops.find(stop => stop._id === editingStop.id);
        const updatedStopData = {
          ...originalStop,
          stopName: editingStop.stopName.trim(),
          status: editingStop.status
        };

        // Add to pending actions
        setPendingActions(prev => ({
          ...prev,
          [actionKey]: {
            type: 'edit',
            stopId: editingStop.id,
            originalData: originalStop,
            newData: updatedStopData,
            timeoutId: null
          }
        }));

        // Reset editing state
        setEditingStop({
          id: null,
          stopId: "",
          stopName: "",
          status: "active"
        });

        // Set active countdown for UI
        setActiveCountdown(actionKey);

        // Create a timeout for the actual update
        const timeoutId = setTimeout(async () => {
          try {
            // Make the API call
            const updatedStop = await updateStop(editingStop.id, {
              stopName: editingStop.stopName.trim(),
              status: editingStop.status
            });

            // Update the actual data in the state
            setStops(prev => prev.map(stop =>
              stop._id === editingStop.id ? {...stop, ...updatedStop} : stop
            ));

            // Clean up the pending action
            setPendingActions(prev => {
              const { [actionKey]: _, ...rest } = prev;
              return rest;
            });

            // Show success toast
            showToast("Stop updated successfully", "success");
          } catch (err) {
            console.error("Update failed:", err);
            showToast(err.message || "Update failed", "error");
          } finally {
            setActiveCountdown(null);
          }
        }, 3000);

        // Store the timeout ID
        setPendingActions(prev => ({
          ...prev,
          [actionKey]: {
            ...prev[actionKey],
            timeoutId
          }
        }));

        // Show countdown toast
        showToastWithUndo(
          "Stop will be updated in",
          'edit',
          actionKey
        );
      } catch (err) {
        console.error("Update preparation failed:", err);
        showToast(err.message || "Operation failed", "error");
      }
    };

    // Handle initiating toggle status action
    const handleToggleStatus = async (stopId) => {
      try {
        const actionKey = `toggle-${stopId}`;
        const originalStop = stops.find(stop => stop._id === stopId);

        if (!originalStop) {
          throw new Error("Stop not found");
        }

        const newStatus = originalStop.status === 'active' ? 'inactive' : 'active';

        // Add to pending actions
        setPendingActions(prev => ({
          ...prev,
          [actionKey]: {
            type: 'toggle',
            stopId,
            originalData: originalStop,
            newStatus,
            timeoutId: null
          }
        }));

        // Set active countdown for UI
        setActiveCountdown(actionKey);

        // Create a timeout for the actual toggle
        const timeoutId = setTimeout(async () => {
          try {
            // Make the API call
            const updatedStop = await toggleStopStatus(stopId);

            // Update the actual data in the state
            setStops(prev => prev.map(stop =>
              stop._id === stopId ? {...stop, ...updatedStop} : stop
            ));

            // Clean up the pending action
            setPendingActions(prev => {
              const { [actionKey]: _, ...rest } = prev;
              return rest;
            });

            // Show success toast
            showToast(`Status changed to ${updatedStop.status}`, "success");
          } catch (err) {
            console.error("Toggle status failed:", err);
            showToast(err.message || "Status change failed", "error");
          } finally {
            setActiveCountdown(null);
          }
        }, 3000);

        // Store the timeout ID
        setPendingActions(prev => ({
          ...prev,
          [actionKey]: {
            ...prev[actionKey],
            timeoutId
          }
        }));

        // Show countdown toast
        showToastWithUndo(
          "Status will be changed in",
          'toggle',
          actionKey
        );
      } catch (err) {
        console.error("Toggle operation failed:", err);
        showToast(err.message || "Operation failed", "error");
      }
    };

    // Handle canceling a pending action
    const handleCancelAction = (actionId) => {
      const action = pendingActions[actionId];
      
      if (!action) return;
      
      // Clear the timeout to prevent the action
      if (action.timeoutId) {
        clearTimeout(action.timeoutId);
      }
      
      // Reset the state if it was an edit action
      if (action.type === 'edit') {
        setEditingStop({
          id: null,
          stopId: "",
          stopName: "",
          status: "active"
        });
      }
      
      // Remove from pending actions
      setPendingActions(prev => {
        const { [actionId]: _, ...rest } = prev;
        return rest;
      });
      
      // Reset active countdown
      setActiveCountdown(null);
      
      // Show confirmation toast
      showToast(`${action.type} action cancelled`, "success");
    };

    // Check if a stop has a pending action
    const hasPendingAction = (stopId) => {
      return Object.values(pendingActions).some(
        action => action.stopId === stopId
      );
    };

    // Get the pending action type for a stop
    const getPendingActionType = (stopId) => {
      const action = Object.values(pendingActions).find(
        action => action.stopId === stopId
      );
      return action ? action.type : null;
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
          <Fade in={true}>
            <Paper sx={styles.mainPaper}>
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#212121',
                    fontWeight: 600,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  Bus Stops Management
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#666',
                    mb: 3
                  }}
                >
                  View and manage all bus stops in the system
                </Typography>

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
                              const pendingActionType = getPendingActionType(stop._id);
                              const isPending = hasPendingAction(stop._id);
                              const isEditing = editingStop.id === stop._id;
                              
                              return (
                                <Box sx={isPending ? styles.pendingActionItem : {}}>
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
                                    <Box sx={{ position: 'relative' }}>
                                      <Typography sx={{ fontWeight: 500 }}>
                                        {stop.stopName}
                                      </Typography>
                                      {pendingActionType === 'delete' && (
                                        <Typography variant="caption" sx={{ color: '#D32F2F', fontStyle: 'italic' }}>
                                          Pending deletion...
                                        </Typography>
                                      )}
                                      {pendingActionType === 'edit' && (
                                        <Typography variant="caption" sx={{ color: '#E65100', fontStyle: 'italic' }}>
                                          Pending update...
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                </Box>
                              );
                            }
                          },
                          {
                            header: "Status",
                            accessor: "status",
                            render: (stop) => {
                              const pendingActionType = getPendingActionType(stop._id);
                              const isPending = hasPendingAction(stop._id);
                              const isEditing = editingStop.id === stop._id;
                              
                              return (
                                <Box sx={isPending ? styles.pendingActionItem : {}}>
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
                                    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={styles.statusChip(stop.status)}>
                                          {stop.status}
                                        </Box>
                                        {!isPending && (
                                          <Tooltip title={`Toggle to ${stop.status === 'active' ? 'inactive' : 'active'}`} arrow>
                                            <Button
                                              variant="secondary"
                                              onClick={() => handleToggleStatus(stop._id)}
                                              className="min-w-[40px] p-2"
                                              disabled={isPending}
                                            >
                                              <Sync fontSize="small" />
                                            </Button>
                                          </Tooltip>
                                        )}
                                        {pendingActionType === 'toggle' && (
                                          <Typography variant="caption" sx={{ color: '#E65100', fontStyle: 'italic' }}>
                                            Pending status change...
                                          </Typography>
                                        )}
                                      </Box>
                                    </Zoom>
                                  )}
                                </Box>
                              );
                            }
                          },
                          {
                            header: "Actions",
                            accessor: "actions",
                            render: (stop) => {
                              const isPending = hasPendingAction(stop._id);
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
                                  <Tooltip title={isPending ? "Action pending" : "Edit stop"} arrow>
                                    <span> {/* Wrapper to make disabled tooltip work */}
                                      <Button 
                                        variant="primary"
                                        onClick={() => handleEditStop(stop)}
                                        className="min-w-[40px] p-2"
                                        disabled={isPending}
                                      >
                                        <Edit fontSize="small" />
                                      </Button>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title={isPending ? "Action pending" : "Delete stop"} arrow>
                                    <span> {/* Wrapper to make disabled tooltip work */}
                                      <Button
                                        variant="danger" 
                                        onClick={() => handleDeleteStop(stop._id)}
                                        className="min-w-[40px] p-2"
                                        disabled={isPending}
                                        >
                                          <Delete fontSize="small" />
                                        </Button>
                                                                            </span>
                                                                          </Tooltip>
                                                                        </div>
                                                                      );
                                                                    }
                                                                  }
                                                                ]}
                                                                data={getPaginatedStops()}
                                                                highlightOnHover
                                                              />
                                                              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
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
                                                  </Fade>
                                                </Box>
                                              </AdminLayout>
                                            );
                                        }
                                        
                                        export default StopList;