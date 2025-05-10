import express from "express";
import {
  createMaintenance,
  getAllMaintenances,
  getMaintenanceById,
  updateMaintenanceStatus,
  deleteMaintenance,
} from "../controllers/busMaintenanceController.js";

const router = express.Router();

router.get("/", getAllMaintenances);
router.post("/", createMaintenance);
router.get("/:id", getMaintenanceById);
router.put("/:id", updateMaintenanceStatus);
router.delete("/:id", deleteMaintenance);

export default router;
