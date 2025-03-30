import { searchBuses } from "../controllers/searchBuses.js";
import express from "express";


const router = express.Router();

router.post("/", searchBuses);

export default router;