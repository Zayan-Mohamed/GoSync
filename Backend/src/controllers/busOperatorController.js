// controllers/busOperatorController.js
import BusOperator from "../models/busOperatorModel.js";

// Create a new bus operator
export const createOperator = async (req, res) => {
  try {
    const newOperator = new BusOperator(req.body);
    await newOperator.save();
    res.status(201).json({ message: "Operator added successfully", newOperator });
  } catch (err) {
    res.status(500).json({ message: "Error adding operator", error: err });
  }
};

// Get all bus operators
export const getAllOperators = async (req, res) => {
  try {
    const operators = await BusOperator.find();
    res.status(200).json(operators);
  } catch (err) {
    res.status(500).json({ message: "Error fetching operators", error: err });
  }
};

// Update a bus operator
export const updateOperator = async (req, res) => {
  try {
    const updatedOperator = await BusOperator.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json({ message: "Operator updated", updatedOperator });
  } catch (err) {
    res.status(500).json({ message: "Error updating operator", error: err });
  }
};

// Delete a bus operator
export const deleteOperator = async (req, res) => {
  try {
    await BusOperator.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Operator deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting operator", error: err });
  }
};
