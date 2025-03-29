import express from "express";
import { shedMessage, getAllShedMessages, updateShedMessage, deleteShedMessage } from "../controllers/shedController.js";

const router = express.Router();

router.post("/shed", shedMessage);
router.get("/messages", getAllShedMessages);
router.put("/messages/:id", updateShedMessage);
router.delete("/messages/:id", deleteShedMessage);

export default router;
