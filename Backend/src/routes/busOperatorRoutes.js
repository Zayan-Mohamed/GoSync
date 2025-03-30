// routes/busOperatorRoutes.js
import express from "express";
import { createOperator, getAllOperators, updateOperator, deleteOperator } from "../controllers/busOperatorController.js"; // Import the controller functions

const router = express.Router();

// Create a new bus operator
router.post("/add", createOperator);

// Get all bus operators
router.get("/", getAllOperators);

// Update a bus operator
router.put("/update/:id", updateOperator);

// Delete a bus operator
router.delete("/delete/:id", deleteOperator);

export default router;
