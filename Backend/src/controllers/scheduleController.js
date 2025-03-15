import Schedule from "../models/scheduleModel.js";
import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";
import Route from "../models/routes.model.js";

// ✅ Create a new schedule
export const createSchedule = asyncHandler(async (req, res) => {
  const { routeId, departureTime, arrivalTime, departureDate, duration, busId } = req.body;

  if (!routeId || !departureTime || !arrivalTime || !departureDate || !duration || !busId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const schedule = await Schedule.create({
    scheduleID: uuidv4(), // Generate unique scheduleID
    routeId,
    departureTime,
    arrivalTime,
    departureDate,
    duration,
    busId,
  });

  res.status(201).json(schedule);
});

// ✅ Get all schedules
export const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await Schedule.find({})
    .populate("routeId", "startLocation endLocation")
    .populate("busId", "busNumber busType");
  res.json(schedules);
});

// ✅ Get a schedule by scheduleID
export const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findOne({ scheduleID: req.params.scheduleID })
    .populate("routeId", "startLocation endLocation")
    .populate("busId", "busNumber busType");

  if (schedule) {
    res.json(schedule);
  } else {
    res.status(404).json({ message: "Schedule not found" });
  }
});

// ✅ Update a schedule by scheduleID
export const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findOne({ scheduleID: req.params.scheduleID });

  if (schedule) {
    schedule.routeId = req.body.routeId || schedule.routeId;
    schedule.departureTime = req.body.departureTime || schedule.departureTime;
    schedule.arrivalTime = req.body.arrivalTime || schedule.arrivalTime;
    schedule.departureDate = req.body.departureDate || schedule.departureDate;
    schedule.duration = req.body.duration || schedule.duration;
    schedule.busId = req.body.busId || schedule.busId;

    const updatedSchedule = await schedule.save();
    res.json(updatedSchedule);
  } else {
    res.status(404).json({ message: "Schedule not found" });
  }
});

// ✅ Delete a schedule by scheduleID
export const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findOne({ scheduleID: req.params.scheduleID });

  if (schedule) {
    await schedule.deleteOne();
    res.json({ message: "Schedule removed" });
  } else {
    res.status(404).json({ message: "Schedule not found" });
  }
});
