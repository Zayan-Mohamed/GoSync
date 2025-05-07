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
  CircularProgress
} from "@mui/material";
import { Edit, Delete, Save, Sync, PictureAsPdf } from "@mui/icons-material";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Table from "../components/Table";
import CustomButton from "../components/Button";
import { jsPDF } from "jspdf";
import autoTable from  "jspdf-autotable";
import Loader from "../components/Loader";

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
  
    useEffect(() => {
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
      fetchStops();
    }, []);

  const filteredStops = Array.isArray(stops) 
    ? stops.filter(stop => 
        stop?.stopName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const showToast = (message, type = "success") => {
    toast[type](message);
  };

  const handleDeleteStop = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this stop?");
    if (!confirmed) return;
    try {
      await deleteStop(id);
      setStops(prev => prev.filter(stop => stop._id !== id));
      showToast("Stop deleted successfully");
    } catch (error) {
      showToast(error.message || "Delete failed", "error");
    }
  };

  const handleEditStop = (stop) => {
    setEditingStop({
      id: stop._id,
      stopId: stop.stopId,
      stopName: stop.stopName,
      status: stop.status
    });
  };

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
        stop._id === editingStop.id ? updatedStop : stop
      ));
      
      setEditingStop({
        id: null,
        stopId: "",
        stopName: "",
        status: "active"
      });
      showToast("Stop updated successfully");
    } catch (error) {
      showToast(error.message || "Update failed", "error");
    }
  };

  const handleToggleStatus = async (stopId) => {
    try {
      const updatedStop = await toggleStopStatus(stopId);
      setStops(prev => prev.map(stop => 
        stop._id === stopId ? updatedStop : stop
      ));
      showToast(`Status changed to ${updatedStop.status}`);
    } catch (error) {
      showToast(error.message || "Status change failed", "error");
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

  const columns = [
    {
      header: "Stop Name",
      accessor: "stopName",
      render: (stop) => (
        editingStop.id === stop._id ? (
          <div>
            <TextField
              value={editingStop.stopName}
              onChange={(e) => setEditingStop({
                ...editingStop,
                stopName: e.target.value
              })}
              variant="outlined"
              size="small"
              fullWidth
            />
            <div className="text-xs text-gray-500 mt-1">
              ID: {editingStop.stopId}
            </div>
          </div>
        ) : (
          <div>
            <div className="font-medium">{stop.stopName}</div>
            <div className="text-xs text-gray-500">ID: {stop.stopId}</div>
          </div>
        )
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (stop) => (
        editingStop.id === stop._id ? (
          <Select
            value={editingStop.status}
            onChange={(e) => setEditingStop({
              ...editingStop,
              status: e.target.value
            })}
            size="small"
            fullWidth
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        ) : (
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded ${
              stop.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {stop.status}
            </span>
            <CustomButton
              onClick={() => handleToggleStatus(stop._id)}
              className="p-1"
              title="Toggle status"
            >
              <Sync fontSize="small" />
            </CustomButton>
          </div>
        )
      )
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (stop) => (
        editingStop.id === stop._id ? (
          <div className="flex space-x-2">
            <CustomButton 
              onClick={handleUpdateStop}
              disabled={!editingStop.stopName.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Save fontSize="small" />
            </CustomButton>
            <CustomButton 
              onClick={handleCancelEdit}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancel
            </CustomButton>
          </div>
        ) : (
          <div className="flex space-x-2">
            <CustomButton 
              onClick={() => handleEditStop(stop)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Edit fontSize="small" />
            </CustomButton>
            <CustomButton
              onClick={() => handleDeleteStop(stop._id)}
              variant="destructive" className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Delete fontSize="small" />
            </CustomButton>
          </div>
        )
      )
    }
  ];

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Stops List', 14, 15);
    
    // Prepare data for PDF (only first two columns)
    const pdfData = filteredStops.map(stop => [
      `${stop.stopName}\nID: ${stop.stopId}`,
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
        <div className="flex justify-center items-center h-screen">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Current Stops</h2>

        <div className="flex mb-4 gap-2">
          <TextField
            label="Search stops by name"
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
            disabled={filteredStops.length === 0}
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
              onClick={fetchStops}
              className="ml-2 bg-red-500 hover:bg-red-600 text-white"
            >
              Retry
            </CustomButton>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredStops.length === 0 ? (
              <div className="p-4 text-center">
                {searchTerm ? "No matching stops found" : "No stops available"}
              </div>
            ) : (
              <Table
                columns={columns}
                data={filteredStops}
                className="w-full border border-gray-200"
              />
            )}
          </div>
        )}
      </div>
      <ToastContainer />
    </AdminLayout>
  );
}

export default StopList;