import Schedule from "../models/scheduleModel.js";
import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";
import Route from "../models/routeModel.js";

// ✅ Create a new schedule
export const createSchedule = asyncHandler(async (req, res) => {
  const { routeId, departureTime, arrivalTime, departureDate,arrivalDate, busId } = req.body;

  if (!routeId || !departureTime || !arrivalTime || !departureDate || !arrivalDate || !busId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Convert departure and arrival times into full Date objects
  const depTime = new Date(`${departureDate}T${departureTime}:00Z`);
  const arrTime = new Date(`${arrivalDate}T${arrivalTime}:00Z`);

  if (isNaN(depTime.getTime()) || isNaN(arrTime.getTime())) {
    return res.status(400).json({ message: "Invalid date or time format" });
  }

  if (arrTime < depTime) {
    return res.status(400).json({ message: "Arrival time must be after departure time" });
  }

  // Calculate duration in hours and minutes
  const durationMs = arrTime - depTime;
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const duration = `${durationHours}h ${durationMinutes}m`;

  const schedule = await Schedule.create({
    scheduleID: uuidv4(), // Generate unique scheduleID
    routeId,
    departureTime,
    arrivalTime,
    departureDate,
    arrivalDate,
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


  const durationMs = new Date(`${req.body.arrivalDate}T${req.body.arrivalTime}:00Z`) - new Date(`${req.body.departureDate}T${req.body.departureTime}:00Z`);
const durationHours = Math.floor(durationMs / (1000 * 60 * 60)); // Convert to hours
const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60)); // Convert remaining minutes

const duration = `${durationHours}h ${durationMinutes}m`;


  await Schedule.findOneAndUpdate({ scheduleID: req.params.scheduleID },
    { 
      routeId: req.body.routeId,
      departureTime: req.body.departureTime,
      arrivalTime: req.body.arrivalTime,
      departureDate: req.body.departureDate,
      arrivalDate: req.body.arrivalDate,
      busId: req.body.busId,
      duration: duration,
     }, {
      upsert: true,
      new: true,
    }
  );

    res.json('Schedule updated');
  } 
    
);

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
