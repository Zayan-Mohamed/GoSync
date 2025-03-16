import express from "express";
import {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "../controllers/scheduleController.js";

const router = express.Router();

router.route("/").post(createSchedule).get(getSchedules);
router.route("/:scheduleID").get(getScheduleById).put(updateSchedule).delete(deleteSchedule);

export default router;
