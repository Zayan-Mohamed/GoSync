// routes/busRoutes.js

import express from "express";
import { getRouteByBus } from "../controllers/busRouteController.js";

const router = express.Router();

// GET route by busNumber
router.get("/bus/:busNumber/route", getRouteByBus);

export default router;
