// src/controllers/busController.js
import Bus from "../models/bus.js";
import Route from "../models/routeModel.js";
import Schedule from "../models/scheduleModel.js";
import Seat from "../models/seatModel.js";
import Stop from "../models/stopModel.js";

export const createBus = async (req, res) => {
  try {
    const {
      busNumber,
      busType,
      capacity,
      status,
      routeId,
      busRouteNumber,
      fareAmount,
      travelName,
    } = req.body;

    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      return res.status(400).json({ message: "Bus number already exists" });
    }

    const newBus = new Bus({
      busNumber,
      busType,
      capacity,
      status: status || "Active",
      routeId,
      busRouteNumber,
      fareAmount,
      travelName,
    });

    const savedBus = await newBus.save();
    res.status(201).json(savedBus);
  } catch (error) {
    console.error("Error creating bus:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation Error", error: error.message });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find({}).populate("routeId");
    res.status(200).json(buses);
  } catch (error) {
    res.status(400).json({ message: "Error fetching buses", error });
    console.log("Error fetching buses:", error);
  }
};

export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate("routeId");
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    res.status(200).json(bus);
  } catch (error) {
    res.status(400).json({ message: "Error fetching bus", error });
  }
};

export const getBusesByRoute = async (req, res) => {
  try {
    const buses = await Bus.find({ routeId: req.params.routeId });
    if (buses.length === 0) {
      return res.status(404).json({ message: "No buses found for this route" });
    }
    res.status(200).json(buses);
  } catch (error) {
    res.status(400).json({ message: "Error fetching buses by route", error });
  }
};

export const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    res.status(200).json(bus);
  } catch (error) {
    res.status(400).json({ message: "Error updating bus", error });
  }
};

export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    res.status(200).json({ message: "Bus deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting bus", error });
  }
};

export const getBusesByTravelName = async (req, res) => {
  try {
    const buses = await Bus.find({ travelName: req.params.travelName });
    if (buses.length === 0) {
      return res.status(404).json({ message: "No buses found for this travel company" });
    }
    res.status(200).json(buses);
  } catch (error) {
    res.status(400).json({ message: "Error fetching buses by travel name", error });
  }
};


export const searchBuses = async (req, res) => {
  try {
      const { fromLocation, toLocation, selectedDate } = req.body;

      // Format the date properly if it's not already
      const formattedDate = new Date(selectedDate);
      const dateQuery = {
          $gte: new Date(formattedDate.setHours(0, 0, 0, 0)),
          $lt: new Date(formattedDate.setHours(23, 59, 59, 999))
      };

      // 1️⃣ Find routes that have fromLocation as a boarding stop and toLocation as a dropping stop
      const routes = await Route.find({})
          .populate({
              path: 'stops.stop',
              model: 'Stop'
          });

      // 2️⃣ Filter routes that have fromLocation as boarding and toLocation as dropping
      const validRoutes = routes.filter(route => {
          const fromStop = route.stops.find(stop => 
              stop.stop.stopName === fromLocation && stop.stopType === 'boarding'
          );
          
          const toStop = route.stops.find(stop => 
              stop.stop.stopName === toLocation && stop.stopType === 'dropping'
          );
          
          // Check if both stops exist and fromStop comes before toStop in order
          return fromStop && toStop && fromStop.order < toStop.order;
      });

      if (validRoutes.length === 0) {
          return res.status(404).json({ 
              message: "No routes found for the selected locations with proper boarding and dropping points" 
          });
      }

      // 3️⃣ Get buses associated with valid routes using routeId
      const routeIds = validRoutes.map(r => r.routeId);
      const buses = await Bus.find({ 
          routeId: { $in: routeIds },
          status: 'Active' // Only return active buses
      });

      if (buses.length === 0) {
          return res.status(404).json({ 
              message: "No active buses found for the selected route" 
          });
      }

      // 4️⃣ Get schedules for these buses on the selected date
      const schedules = await Schedule.find({
          busId: { $in: buses.map(b => b._id) },
          departureDate: dateQuery
      });

      if (schedules.length === 0) {
          return res.status(404).json({ 
              message: "No schedules available for the selected date" 
          });
      }

      // 5️⃣ Format data for frontend
      const searchResults = [];
      
      for (const bus of buses) {
          const route = validRoutes.find(r => r.routeId === bus.routeId);
          const busSchedules = schedules.filter(s => s.busId.equals(bus._id));
          
          for (const schedule of busSchedules) {
              // Get the relevant stops
              const fromStop = route.stops.find(stop => 
                  stop.stop.stopName === fromLocation && stop.stopType === 'boarding'
              );
              
              const toStop = route.stops.find(stop => 
                  stop.stop.stopName === toLocation && stop.stopType === 'dropping'
              );
              
              searchResults.push({
                  busId: bus._id,
                  scheduleId: schedule._id,
                  routeId: route._id,
                  busRouteNumber: bus.busRouteNumber,
                  travelName: bus.travelName,
                  busNumber: bus.busNumber,
                  busType: bus.busType,
                  fareAmount: bus.fareAmount,
                  route: {
                      routeName: route.routeName,
                      // Use the actual from/to locations instead of route start/end
                      departureLocation: fromLocation,
                      arrivalLocation: toLocation
                  },
                  schedule: {
                      departureDate: schedule.departureDate,
                      arrivalDate: schedule.arrivalDate,
                      departureTime: schedule.departureTime,
                      arrivalTime: schedule.arrivalTime,
                      duration: schedule.duration
                  },
                  availableSeats: bus.capacity // You'll need to calculate actual available seats
              });
          }
      }

      if (searchResults.length === 0) {
          return res.status(404).json({ 
              message: "No matching buses found for your criteria" 
          });
      }

      res.status(200).json(searchResults);

  } catch (error) {
      console.error("Search buses error:", error);
      res.status(500).json({ error: "Error searching buses", details: error.message });
  }
};