import React, { useState, useEffect } from "react";
import { getBuses, addBus, updateBus, deleteBus } from "../services/busService";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Select, MenuItem } from "@mui/material";

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
import { Edit, Delete, Save } from "@mui/icons-material";

function BusList() {
  const [buses, setBuses] = useState([]);
  const [newBus, setNewBus] = useState("");
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
    }

    // Proceed to update the bus
    updateBus(id, {
      bus_number: editingBus.busNumber,
      bus_route_number: editingBus.busRouteNumber,
      bus_type: editingBus.busType,
      capacity: editingBus.capacity,
      status: editingBus.status,
      fare_amount: editingBus.fareAmount,
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

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Bus List</h2>

          {/* Add new bus input and button */}
          <div className="flex mb-4">
            <TextField
              label="Enter new bus number"
              variant="outlined"
              size="small"
              value={newBus}
              onChange={(e) => setNewBus(e.target.value)}
              className="mr-2"
            />
            <Button
              onClick={handleAddBus}
              disabled={!newBus.trim()}
              variant="contained"
              color="primary"
            >
              Add Bus
            </Button>
          </div>

          {/* Bus Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bus Number</TableCell>
                  <TableCell>Route Number</TableCell>
                  <TableCell>Bus Type</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Fare Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(buses) &&
                  buses.map((bus) => (
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
    >
      <MenuItem value="Semi-Luxury">Semi-Luxury</MenuItem>
      <MenuItem value="Non-AC">Non-AC</MenuItem>
      <MenuItem value="AC">Luxury</MenuItem>
    </Select>
  ) : (
    bus.busType
  )}
</TableCell>
    <TableCell>
                        {editingBus.id === bus._id ? (
                          <TextField
                            value={String(editingBus.capacity)} // Ensure capacity is a string
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
                          String(bus.capacity) // Ensure capacity is rendered as a string
                        )}
                      </TableCell>
                      <TableCell>
  {editingBus.id === bus._id ? (
    <select
      value={editingBus.status}
      onChange={(e) =>
        setEditingBus({ ...editingBus, status: e.target.value })
      }
    >
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
    </select>
  ) : (
    bus.status
  )}
</TableCell>

                      <TableCell>
                        {editingBus.id === bus._id ? (
                          <TextField
                            value={String(editingBus.fareAmount)} // Ensure fareAmount is a string
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
                          String(bus.fareAmount) // Ensure fareAmount is rendered as a string
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
                            <IconButton
                              onClick={() => handleDeleteBus(bus._id)}
                            >
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
