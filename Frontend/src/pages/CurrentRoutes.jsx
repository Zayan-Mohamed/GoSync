import React, { useEffect, useState } from "react";
import useRouteStore from "../store/routeStore";
import AdminLayout from "../layouts/AdminLayout";
import {
  TextField,
  CircularProgress,
  MenuItem,
  Select,
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Fade,
  alpha,
} from "@mui/material";
import {
  Edit,
  Delete,
  Save,
  Cancel,
  PictureAsPdf,
  Map as MapIcon,
  Search,
  ErrorOutline,
  InfoOutlined,
} from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "../components/Table";
import Button from "../components/Button";
import RouteMapModal from "../components/RouteMapModal";
import StopsModal from "../components/StopsModal";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Loader from "../components/Loader";
import { motion } from "framer-motion";

// Add custom styles
const styles = {
  pageContainer: {
    p: 3,
    backgroundColor: "#F8FAFC",
    minHeight: "calc(100vh - 64px)",
    transition: "all 0.3s ease",
  },
  mainPaper: {
    p: 4,
    borderRadius: "16px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
    transition: "all 0.3s ease",
    overflow: "hidden",
  },
  searchContainer: {
    display: "flex",
    gap: 2,
    mb: 4,
    alignItems: "center",
    flexWrap: "wrap",
    transition: "all 0.3s ease",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    p: "8px 16px",
    border: "2px solid #E2E8F0",
    borderRadius: "12px",
    backgroundColor: "#F8FAFC",
    transition: "all 0.2s ease",
    minWidth: "280px",
    "&:hover": {
      borderColor: "#E65100",
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    },
    "&:focus-within": {
      borderColor: "#E65100",
      boxShadow: "0 2px 12px rgba(230, 81, 0, 0.1)",
    },
  },
  tableContainer: {
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
    transition: "all 0.3s ease",
    backgroundColor: "#FFF",
    border: "1px solid #E2E8F0",
    "& .MuiTableCell-root": {
      borderColor: "#E2E8F0",
      padding: "16px",
    },
    "& .MuiTableHead-root": {
      backgroundColor: "#F8FAFC",
      "& .MuiTableCell-root": {
        fontWeight: 600,
        color: "#475569",
        borderBottom: "2px solid #E2E8F0",
      },
    },
    "& .MuiTableBody-root .MuiTableRow-root:hover": {
      backgroundColor: "#F8FAFC",
    },
  },
  statusChip: (status) => ({
    px: 2,
    py: 1,
    borderRadius: "8px",
    display: "inline-flex",
    alignItems: "center",
    fontSize: "0.875rem",
    fontWeight: 600,
    textTransform: "capitalize",
    backgroundColor: status === "active" ? "#DCFCE7" : "#FEE2E2",
    color: status === "active" ? "#166534" : "#991B1B",
    border: `1px solid ${status === "active" ? "#BBF7D0" : "#FECACA"}`,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: status === "active" ? "#BBF7D0" : "#FECACA",
    },
  }),
};

const CurrentRoutes = () => {
  const { routes, fetchRoutes, deleteRoute, updateRoute } = useRouteStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState({
    id: null,
    totalDistance: "",
    status: "active",
  });
  const [selectedStops, setSelectedStops] = useState(null);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);
        await fetchRoutes();
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to load routes");
      } finally {
        setLoading(false);
      }
    };
    loadRoutes();
  }, [fetchRoutes]);

  const filteredRoutes =
    routes?.filter(
      (route) =>
        route.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.routeId?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const showToast = (message, type = "success") => {
    toast[type](message);
  };

  const handleShowMap = (route) => {
    setSelectedRoute(route);
    setShowMapModal(true);
  };

  const handleCloseMap = () => {
    setShowMapModal(false);
    setSelectedRoute(null);
  };

  const handleShowStops = (stops) => {
    setSelectedStops(stops);
  };

  // For deleting a route
  const handleDeleteRoute = async (routeId) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        await deleteRoute(routeId);
        showToast("Route deleted successfully");
      } catch (error) {
        showToast(error.message || "Delete failed", "error");
      }
    }
  };

  const handleEditRoute = (route) => {
    setEditingRoute({
      id: route._id,
      routeName: route.routeName,
      totalDistance: route.totalDistance || "",
      status: route.status || "active",
    });
  };

  const handleUpdateRoute = async () => {
    try {
      // Convert distance to number if it's a string
      const distance =
        typeof editingRoute.totalDistance === "string"
          ? parseFloat(editingRoute.totalDistance)
          : editingRoute.totalDistance;

      await updateRoute(editingRoute.id, {
        totalDistance: distance,
        status: editingRoute.status,
      });

      setEditingRoute({
        id: null,
        totalDistance: "",
        status: "active",
      });

      showToast("Route updated successfully");
    } catch (error) {
      showToast(error.message || "Update failed", "error");
    }
  };
  const handleCancelEdit = () => {
    setEditingRoute({
      id: null,
      routeName: "",
      startLocation: "",
      endLocation: "",
      totalDistance: "",
      status: "active",
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Routes List", 14, 15);

    const pdfData = filteredRoutes.map((route) => {
      const boardingStops =
        route.stops
          ?.filter((stop) => stop.stopType === "boarding")
          .map((stop) => stop.stop?.stopName || "Unknown Stop") || [];
      const droppingStops =
        route.stops
          ?.filter((stop) => stop.stopType === "dropping")
          .map((stop) => stop.stop?.stopName || "Unknown Stop") || [];

      return [
        route.routeName || "Unnamed Route",
        boardingStops.length > 0 ? boardingStops.join("\n") : "No Stops",
        droppingStops.length > 0 ? droppingStops.join("\n") : "No Stops",
        `From: ${route.startLocation || "N/A"}\nTo: ${route.endLocation || "N/A"}\nDistance: ${route.totalDistance || "N/A"} km`,
        route.status || "N/A",
      ];
    });

    autoTable(doc, {
      head: [
        ["Route Name", "Boarding Stops", "Dropping Stops", "Details", "Status"],
      ],
      body: pdfData,
      startY: 25,
      margin: { left: 20, right: 20 }, // Add margins on both sides
      tableWidth: "auto", // Let the table adjust width based on content and margins
      styles: {
        fontSize: 10,
        cellPadding: 2,
        valign: "middle",
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Route Name
        1: { cellWidth: 40 }, // Boarding Stops
        2: { cellWidth: 40 }, // Dropping Stops
        3: { cellWidth: 45 }, // Details
        4: { cellWidth: 20 }, // Status
      },
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const status = data.cell.raw;
          const fillColor = status === "active" ? "#d1fae5" : "#fee2e2";
          const borderColor = status === "active" ? "#10b981" : "#ef4444";
          const textColor = status === "active" ? "#065f46" : "#991b1b";

          const { x, y, width, height } = data.cell;

          data.doc.setFillColor(fillColor);
          data.doc.setDrawColor(borderColor);
          data.doc.rect(x, y, width, height, "FD");

          data.doc.setTextColor(textColor);
          data.doc.setFontSize(10);

          data.doc.text(status, x + width / 2, y + height / 2 + 2, {
            align: "center",
            maxWidth: width - 4,
          });

          data.cell.text = "";
        }
      },
    });

    doc.save("routes-list.pdf");
  };

  const columns = [
    {
      header: "Route Name",
      accessor: "routeName",
      width: "20%",
      render: (route) => (
        <div>
          <div className="font-medium">
            {route.routeName || "Unnamed Route"}
          </div>
          <div className="text-xs text-gray-500">
            ID: {route.routeId || route._id}
          </div>
        </div>
      ),
    },
    {
      header: "Stops",
      accessor: "stops",
      width: "25%",
      render: (route) => (
        <div>
          {route.stops && route.stops.length > 0 ? (
            <Button
              onClick={() => handleShowStops(route.stops)}
              className="text-left w-full group p-3 rounded-lg transition-all duration-200 relative overflow-hidden min-h-[80px]
                bg-white border border-[#FFB300]/20 
                hover:bg-gradient-to-r hover:from-[#FFD54F] hover:to-[#FFB300]
                transform hover:scale-[1.02] hover:shadow-sm"
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#E65100] to-[#FF8F00] flex items-center justify-center text-white shadow-sm">
                  <InfoOutlined className="w-5 h-5 transform group-hover:rotate-12 transition-transform duration-200" />
                </div>
                <div className="flex-grow">
                  <div className="font-medium text-[#E65100] group-hover:text-[#212121] transition-colors duration-200 text-base">
                    {route.stops.length} Stops
                  </div>
                  <div className="text-sm text-[#212121] flex flex-col gap-1 mt-1">
                    <div className="flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF8F00] mr-2 group-hover:bg-[#212121] transition-colors duration-200"></span>
                      <span className="whitespace-nowrap">{route.stops.filter((s) => s.stopType === "boarding").length} Boarding</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E65100] mr-2 group-hover:bg-[#212121] transition-colors duration-200"></span>
                      <span className="whitespace-nowrap">{route.stops.filter((s) => s.stopType === "dropping").length} Dropping</span>
                    </div>
                  </div>
                </div>
              </div>
            </Button>
          ) : (
            <span className="text-gray-500 text-sm px-3 py-2 block bg-gray-50 rounded-lg border border-gray-200">
              No stops
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Details",
      accessor: "details",
      width: "25%",
      render: (route) => (
        <div className="max-h-48 overflow-y-auto px-2 py-1.5">
          {editingRoute.id === route._id ? (
            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <span className="font-medium min-w-[80px]">From:</span>
                <span className="ml-2">{route.startLocation || "N/A"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium min-w-[80px]">To:</span>
                <span className="ml-2">{route.endLocation || "N/A"}</span>
              </div>
              <TextField
                value={editingRoute.totalDistance}
                onChange={(e) =>
                  setEditingRoute({
                    ...editingRoute,
                    totalDistance: e.target.value,
                  })
                }
                variant="outlined"
                size="small"
                fullWidth
                label="Distance (km)"
                type="number"
                margin="dense"
                inputProps={{ step: "0.01" }} // Allows decimal values
              />
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <div className="pb-1">
                <strong>From:</strong> {route.startLocation || "N/A"}
              </div>
              <div className="pb-1">
                <strong>To:</strong> {route.endLocation || "N/A"}
              </div>
              <div>
                <strong>Distance:</strong> {route.totalDistance || "N/A"} km
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      width: "15%",
      render: (route) =>
        editingRoute.id === route._id ? (
          <Select
            value={editingRoute.status}
            onChange={(e) =>
              setEditingRoute({
                ...editingRoute,
                status: e.target.value,
              })
            }
            size="small"
            fullWidth
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        ) : (
          <span
            className={`px-2 py-1 rounded text-sm ${
              route.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {route.status || "N/A"}
          </span>
        ),
    },
    {
      header: "Map",
      accessor: "map",
      width: "5%",
      render: (route) => (
        <Button
          onClick={() => handleShowMap(route)}
          className="bg-green-500 hover:bg-green-600 text-white p-1"
          title="View Map"
        >
          <MapIcon fontSize="small" />
        </Button>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      width: "15%",
      render: (route) => (
        <div className="flex space-x-1">
          {editingRoute.id === route._id ? (
            <>
              <Button
                onClick={handleUpdateRoute}
                disabled={
                  editingRoute.totalDistance === "" ||
                  isNaN(editingRoute.totalDistance)
                }
                className="bg-blue-500 hover:bg-blue-600 text-white p-1"
                title="Save"
              >
                <Save fontSize="small" />
              </Button>

              <Button
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white p-1"
                title="Cancel"
              >
                <Cancel fontSize="small" />
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => handleEditRoute(route)}
                className="bg-blue-500 hover:bg-blue-600 text-white p-1"
                title="Edit"
              >
                <Edit fontSize="small" />
              </Button>
              <Button
                onClick={() => handleDeleteRoute(route._id)}
                className="bg-red-500 hover:bg-red-600 text-white p-1"
                title="Delete"
              >
                <Delete fontSize="small" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Loader />
        </div>
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
            <h2 className="text-3xl font-bold text-[#E65100] mb-2">
              Current Routes
            </h2>
            <p className="text-gray-700">
              View and manage all bus routes in the system
            </p>
          </div>

          <Paper sx={styles.mainPaper}>
            <Box sx={{ mb: 4 }}>
              <Box sx={styles.searchContainer}>
                <Paper elevation={0} sx={styles.searchBox}>
                  <IconButton sx={{ p: "10px" }}>
                    <Search />
                  </IconButton>
                  <TextField
                    sx={{
                      flex: 1,
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    }}
                    placeholder="Search routes by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                    }}
                  />
                </Paper>

                <Tooltip title="Export to PDF" arrow>
                  <Button
                    variant="secondary"
                    onClick={generatePDF}
                    disabled={filteredRoutes.length === 0}
                    className="flex items-center gap-2"
                  >
                    <PictureAsPdf /> Export PDF
                  </Button>
                </Tooltip>
              </Box>

              {error && (
                <Fade in={true}>
                  <Box
                    sx={{
                      p: 2,
                      mb: 3,
                      borderRadius: 2,
                      backgroundColor: alpha("#F44336", 0.1),
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <ErrorOutline sx={{ color: "#D32F2F" }} />
                    <Typography sx={{ color: "#D32F2F", flex: 1 }}>
                      {error}
                    </Typography>
                    <Button
                      variant="primary"
                      onClick={() => fetchRoutes()}
                      className="min-w-[40px] p-2"
                    >
                      Retry
                    </Button>
                  </Box>
                </Fade>
              )}

              <Box sx={styles.tableContainer}>
                {filteredRoutes.length === 0 ? (
                  <Fade in={true}>
                    <Box
                      sx={{
                        p: 4,
                        textAlign: "center",
                        backgroundColor: "#fff",
                      }}
                    >
                      <Typography color="textSecondary">
                        {searchTerm
                          ? "No matching routes found"
                          : "No routes available"}
                      </Typography>
                    </Box>
                  </Fade>
                ) : (
                  <Table
                    columns={columns}
                    data={filteredRoutes}
                    highlightOnHover
                  />
                )}
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Box>

      {showMapModal && selectedRoute && (
        <RouteMapModal route={selectedRoute} onClose={handleCloseMap} />
      )}

      {selectedStops && (
        <StopsModal
          open={!!selectedStops}
          onClose={() => setSelectedStops(null)}
          stops={selectedStops}
        />
      )}

      <ToastContainer />
    </AdminLayout>
  );
};

export default CurrentRoutes;
