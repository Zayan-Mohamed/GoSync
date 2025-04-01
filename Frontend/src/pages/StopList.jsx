import React, { useState, useEffect } from "react";
import { 
  getAllStops, 
  updateStop, 
  deleteStop,
  toggleStopStatus
} from "../services/stopService";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  TextField,
  MenuItem,
  Select,
  CircularProgress
} from "@mui/material";
import { Edit, Delete, Save, Sync } from "@mui/icons-material";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Table from "../components/Table";
import CustomButton from "../components/Button";

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
          
          // Corrected ternary operation
          const stopsData = Array.isArray(data) 
            ? data 
            : (Array.isArray(data?.stops) 
              ? data.stops 
              : []);
              
          setStops(stopsData);
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
      header: "Stop ID",
      accessor: "stopId",
      render: (stop) => stop.stopId
    },
    {
      header: "Stop Name",
      accessor: "stopName",
      render: (stop) => (
        editingStop.id === stop._id ? (
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
        ) : (
          stop.stopName
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
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Delete fontSize="small" />
            </CustomButton>
          </div>
        )
      )
    }
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Current Stops</h2>

          <div className="flex mb-4">
            <TextField
              label="Search stops by name"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2"
            />
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
      </div>
      <ToastContainer />
    </div>
  );
}

export default StopList;
