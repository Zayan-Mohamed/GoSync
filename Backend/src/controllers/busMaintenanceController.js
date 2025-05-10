import BusMaintenance from "../models/busMaintenanceModel.js";

// Create a new bus maintenance entry
export const createMaintenance = async (req, res) => {
  try {
    const { busId, startDate, endDate, reason } = req.body;
    const newEntry = new BusMaintenance({ busId, startDate, endDate, reason });
    const saved = await newEntry.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bus maintenance records
export const getAllMaintenances = async (req, res) => {
  try {
    const maintenances = await BusMaintenance.find().populate("busId");
    res.status(200).json(maintenances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific maintenance record by ID
export const getMaintenanceById = async (req, res) => {
  try {
    const entry = await BusMaintenance.findById(req.params.id).populate("busId");
    if (!entry) return res.status(404).json({ message: "Not found" });
    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update maintenance status by ID
export const updateMaintenanceStatus = async (req, res) => {
  try {
    const updated = await BusMaintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a maintenance record by ID
export const deleteMaintenance = async (req, res) => {
  try {
    await BusMaintenance.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
