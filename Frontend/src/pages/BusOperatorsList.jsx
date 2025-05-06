import React, { useState, useEffect } from "react";
import {
  getBusOperators,
  addBusOperator,
  updateBusOperator,
  deleteBusOperator,
} from "../services/busOperatorService";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
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
  const [newOperator, setNewOperator] = useState({
    operatorName: "",
    operatorPhone: "",
    operatorLicenseNumber: "",
    licenseEndDate: "",
    role: "Driver",
    status: "Active",
  });
  const [editingOperator, setEditingOperator] = useState(null);

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
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Bus Operators Report', 14, 15);
  
    const tableColumn = ["Name", "Phone", "License", "Role", "Status"];
    const tableRows = [];
  
    // Use the operators from the component's state
    operators.forEach((op) => {
      const operatorData = [
        op.operatorName,
        op.operatorPhone,
        op.operatorLicenseNumber || "N/A",
        op.role,
        op.status,
      ];
      tableRows.push(operatorData);
    });
  
    // Use autoTable as a function
    autoTable(doc, {
      startY: 20,
      head: [tableColumn],
      body: tableRows,
    });
  
    doc.save("bus_operators_report.pdf");
  };
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Bus Operators</h2>
          <div className="flex mb-4">
            <TextField
              label="Name"
              value={newOperator.operatorName}
              onChange={(e) =>
                setNewOperator({ ...newOperator, operatorName: e.target.value })
              }
              className="mr-2"
              size="small"
            />
            <TextField
              label="Phone"
              value={newOperator.operatorPhone}
              onChange={(e) =>
                setNewOperator({ ...newOperator, operatorPhone: e.target.value })
              }
              className="mr-2"
              size="small"
            />
            <Button
              onClick={handleAddOperator}
              disabled={!newOperator.operatorName.trim()}
              variant="contained"
              color="primary"
            >
              Add
            </Button>
          </div>
          
          <div className="flex justify-end mb-4">
  <button
    onClick={generatePDF}
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  >
    Download PDF
  </button>
</div>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>License</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {operators.map((op, index) => (
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
