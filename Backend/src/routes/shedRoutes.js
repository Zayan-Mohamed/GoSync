import express from "express";
import { shedMessage, getAllShedMessages, updateShedMessage, deleteShedMessage,getShedMessageById } from "../controllers/shedController.js";

const router = express.Router();

router.post("/shed", shedMessage);
router.get("/messages", getAllShedMessages);
router.put("/messages/:id", updateShedMessage);
router.delete("/messages/:id", deleteShedMessage);
router.get("/messages/:id", getShedMessageById);

export default router;
