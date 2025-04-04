import React, { useEffect, useState } from "react";
import useRouteStore from "../store/routeStore";
import AdminLayout from "../layouts/AdminLayout";
import { TextField, CircularProgress, MenuItem, Select } from "@mui/material";
import {
  Edit,
  Delete,
  Save,
  Cancel,
  PictureAsPdf,
  Map as MapIcon,
} from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "../components/Table";
import CustomButton from "../components/Button";
import RouteMapModal from "../components/RouteMapModal";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
    doc.text('Routes List', 14, 15);
    
    // Prepare data with only the first 4 columns
    const pdfData = filteredRoutes.map(route => [
      `${route.routeName || "Unnamed Route"}\nID: ${route.routeId || route._id}`,
      route.stops?.length > 0 ? 
        route.stops.map(stop => 
          `${stop.stop?.stopName || stop.stopName || "Unknown Stop"} (${stop.stopType || 'unknown'})`
        ).join('\n') : 
        'No stops',
      `From: ${route.startLocation || "N/A"}\n` +
      `To: ${route.endLocation || "N/A"}\n` +
      `Distance: ${route.totalDistance || "N/A"} km`,
      route.status || "N/A"
    ]);
    
    autoTable(doc, {
      head: [['Route Name', 'Stops', 'Details', 'Status']], // Only 4 columns
      body: pdfData,
      startY: 25,
      styles: {
        fontSize: 10,
        cellPadding: 2,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 60 },  // Route Name
        1: { cellWidth: 50 },  // Stops
        2: { cellWidth: 50 },  // Details
        3: { cellWidth: 20 }   // Status
      },
      didDrawCell: (data) => {
        // Status column styling
        if (data.section === 'body' && data.column.index === 3) {
          const status = data.cell.raw;
          doc.setFillColor(status === 'active' ? '#d1fae5' : '#fee2e2');
          doc.setDrawColor(status === 'active' ? '#10b981' : '#ef4444');
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            'FD'
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
    
    doc.save('routes-list.pdf');
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
        <div className="max-h-32 overflow-y-auto">
          {route.stops && route.stops.length > 0 ? (
            <div className="flex">
              {/* Boarding Stops Column */}
              <div className="w-1/2 pr-2">
                <div className="font-medium text-sm mb-1">Boarding:</div>
                <ul className="list-disc pl-4">
                  {route.stops
                    .filter((stop) => stop.stopType === "boarding")
                    .map((stopItem, index) => (
                      <li key={stopItem._id || index} className="text-sm">
                        {stopItem.stop?.stopName ||
                          stopItem.stopName ||
                          "Unknown Stop"}
                        <span className="text-xs text-gray-500 ml-1">
                          (Order: {stopItem.order})
                        </span>
                        <span className="ml-2 text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-800">
                          Boarding
                        </span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Dropping Stops Column */}
              <div className="w-1/2 pl-2">
                <div className="font-medium text-sm mb-1">Dropping:</div>
                <ul className="list-disc pl-4">
                  {route.stops
                    .filter((stop) => stop.stopType === "dropping")
                    .map((stopItem, index) => (
                      <li key={stopItem._id || index} className="text-sm">
                        {stopItem.stop?.stopName ||
                          stopItem.stopName ||
                          "Unknown Stop"}
                        <span className="text-xs text-gray-500 ml-1">
                          (Order: {stopItem.order})
                        </span>
                        <span className="ml-2 text-xs px-1 py-0.5 rounded bg-purple-100 text-purple-800">
                          Dropping
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          ) : (
            <span className="text-gray-500 text-sm">No stops</span>
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
      width: "10%",
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
        <CustomButton
          onClick={() => handleShowMap(route)}
          className="bg-green-500 hover:bg-green-600 text-white p-1"
          title="View Map"
        >
          <MapIcon fontSize="small" />
        </CustomButton>
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
              <CustomButton
                onClick={handleUpdateRoute}
                disabled={
                  editingRoute.totalDistance === "" ||
                  isNaN(editingRoute.totalDistance)
                }
                className="bg-blue-500 hover:bg-blue-600 text-white p-1"
                title="Save"
              >
                <Save fontSize="small" />
              </CustomButton>

              <CustomButton
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white p-1"
                title="Cancel"
              >
                <Cancel fontSize="small" />
              </CustomButton>
            </>
          ) : (
            <>
              <CustomButton
                onClick={() => handleEditRoute(route)}
                className="bg-blue-500 hover:bg-blue-600 text-white p-1"
                title="Edit"
              >
                <Edit fontSize="small" />
              </CustomButton>
              <CustomButton
                onClick={() => handleDeleteRoute(route._id)}
                className="bg-red-500 hover:bg-red-600 text-white p-1"
                title="Delete"
              >
                <Delete fontSize="small" />
              </CustomButton>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Current Routes</h2>

        <div className="flex mb-4 gap-2">
          <TextField
            label="Search routes by name or ID"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <CustomButton
            variant="contained"
            color="primary"
            starticon={<PictureAsPdf />}
            onClick={generatePDF}
            disabled={filteredRoutes.length === 0}
          >
            Generate PDF
          </CustomButton>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <CircularProgress />
          </div>
        ) : error ? (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
            <CustomButton
              onClick={fetchRoutes}
              className="ml-2 bg-red-500 hover:bg-red-600 text-white"
            >
              Retry
            </CustomButton>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredRoutes.length === 0 ? (
              <div className="p-4 text-center">
                {searchTerm
                  ? "No matching routes found"
                  : "No routes available"}
              </div>
            ) : (
              <Table
                columns={columns}
                data={filteredRoutes}
                className="w-full border border-gray-200"
              />
            )}
          </div>
        )}
      </div>

      {showMapModal && selectedRoute && (
        <RouteMapModal route={selectedRoute} onClose={handleCloseMap} />
      )}
      <ToastContainer />
    </AdminLayout>
  );
};

export default CurrentRoutes;
