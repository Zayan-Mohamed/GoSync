import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import {
  TextField,
  Button,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import { addBusOperator } from "../services/busOperatorService";

function AddBusOperators() {
  const [formData, setFormData] = useState({
    operatorName: "",
    operatorPhone: "",
    operatorLicenseNumber: "",
    licenseEndDate: "",
    role: "Driver",
    status: "Active",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation logic
    if (formData.operatorName.trim().length < 3) {
      setError("Name must be at least 3 characters.");
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.operatorPhone)) {
      setError("Phone must be a valid 10-digit number.");
      return;
    }

    if (formData.operatorLicenseNumber.trim().length < 6) {
      setError("License number must be at least 6 characters.");
      return;
    }

    if (!formData.licenseEndDate) {
      setError("License end date is required.");
      return;
    }

    if (new Date(formData.licenseEndDate) <= new Date()) {
      setError("License end date must be a future date.");
      return;
    }

    // Submit if validations pass
    try {
      await addBusOperator(formData);
      setSuccess("Operator added successfully!");
      setFormData({
        operatorName: "",
        operatorPhone: "",
        operatorLicenseNumber: "",
        licenseEndDate: "",
        role: "Driver",
        status: "Active",
      });
    } catch (err) {
      setError("Error adding operator. Please check fields or license uniqueness.");
      console.error("Add operator error:", err);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-[#F5F5F5] min-h-screen">
        <Navbar />
        <div className="p-6 max-w-xl mx-auto">
          <Typography variant="h5" className="mb-4 font-bold">
            Add New Bus Operator
          </Typography>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          {success && <p className="text-green-600 mb-2">{success}</p>}
          <Paper className="p-4">
            <form onSubmit={handleSubmit} className="grid gap-4">
              <TextField
                label="Name"
                name="operatorName"
                value={formData.operatorName}
                onChange={handleChange}
                required
              />
              <TextField
                label="Phone"
                name="operatorPhone"
                value={formData.operatorPhone}
                onChange={handleChange}
                required
              />
              <TextField
                label="License Number"
                name="operatorLicenseNumber"
                value={formData.operatorLicenseNumber}
                onChange={handleChange}
                required
              />
              <TextField
                label="License End Date"
                name="licenseEndDate"
                type="date"
                value={formData.licenseEndDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <MenuItem value="Driver">Driver</MenuItem>
                <MenuItem value="Conductor">Conductor</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </TextField>
              <TextField
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
              <Button variant="contained" color="primary" type="submit">
                Add Operator
              </Button>
            </form>
          </Paper>
        </div>
      </div>
    </div>
  );
}

export default AddBusOperators;
