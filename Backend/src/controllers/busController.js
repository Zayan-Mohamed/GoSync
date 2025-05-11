// src/controllers/busController.js
import Bus from "../models/bus.js";
import Route from "../models/routeModel.js";
import Schedule from "../models/scheduleModel.js";
import Seat from "../models/seatModel.js";
import Stop from "../models/stopModel.js";

export const createBus = async (req, res) => {
  try {
    console.log('Received bus creation request:', req.body);

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

    // Create an object to store missing fields
    const missingFields = [];
    if (!busNumber) missingFields.push('busNumber');
    if (!busType) missingFields.push('busType');
    if (!capacity) missingFields.push('capacity');
    if (!routeId) missingFields.push('routeId');
    if (!busRouteNumber) missingFields.push('busRouteNumber');
    if (!fareAmount) missingFields.push('fareAmount');
    if (!travelName) missingFields.push('travelName');

    // If any required fields are missing, return detailed error
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
        receivedData: req.body
      });
    }

    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      return res.status(400).json({ message: "Bus number already exists" });
    }

    // Validate if route exists
    const routeExists = await Route.findById(routeId);
    if (!routeExists) {
      return res.status(400).json({ message: "Invalid route ID" });
    }

    // Set bus image path if file was uploaded
    const busImage = req.file ? `/uploads/busImages/${req.file.filename}` : "";

    // Create new bus with validated data
    const newBus = new Bus({
      busNumber,
      busType,
      capacity: Number(capacity),
      status: status || "Active",
      routeId,
      busRouteNumber,
      fareAmount: Number(fareAmount),
      travelName,
      busImage,
    });

    const savedBus = await newBus.save();
    res.status(201).json(savedBus);
  } catch (error) {
    console.error("Error creating bus:", error);
    
    // Handle specific validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation Error",
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getAllBuses = async (req, res) => {
  console.log("Fetching all buses...");
  try {
    const buses = await Bus.find({})
      .populate("routeId")
      .populate("operator");
    res.status(200).json(buses);
  } catch (error) {
    console.log("Error fetching buses:", error);
    res.status(400).json({ message: "Error fetching buses", error });
  }finally{
    console.log("Finished fetching all buses.");
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

// controllers/busController.js (add this function)
export const getUnassignedBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ operator: null });
    res.status(200).json(buses);
  } catch (error) {
    res.status(400).json({ message: "Error fetching unassigned buses", error });
  }
};

export const searchBuses = async (req, res) => {
  try {
      const { fromLocation, toLocation, selectedDate } = req.body;

      if (!fromLocation || !toLocation || !selectedDate) {
          return res.status(400).json({ 
              message: "Missing required fields", 
              details: {
                  fromLocation: !fromLocation,
                  toLocation: !toLocation,
                  selectedDate: !selectedDate
              }
          });
      }

      // Format the date properly if it's not already
      const formattedDate = new Date(selectedDate);
      if (isNaN(formattedDate.getTime())) {
          return res.status(400).json({ 
              message: "Invalid date format",
              receivedDate: selectedDate
          });
      }

      const dateQuery = {
          $gte: new Date(formattedDate.setHours(0, 0, 0, 0)),
          $lt: new Date(formattedDate.setHours(23, 59, 59, 999))
      };

      // Find routes that have fromLocation as a boarding stop and toLocation as a dropping stop
      const routes = await Route.find({})
          .populate({
              path: 'stops.stop',
              model: 'Stop',
              select: 'stopName stopAddress coordinates' // Only select needed fields
          }).lean(); // Convert to plain JavaScript objects

      // Filter routes that have fromLocation as boarding and toLocation as dropping
      const validRoutes = routes.filter(route => {
          if (!route.stops || !Array.isArray(route.stops)) return false;
          
          const fromStop = route.stops.find(stop => {
              if (!stop || !stop.stop || !stop.stop.stopName) return false;
              return stop.stop.stopName === fromLocation && stop.stopType === 'boarding';
          });
          
          const toStop = route.stops.find(stop => {
              if (!stop || !stop.stop || !stop.stop.stopName) return false;
              return stop.stop.stopName === toLocation && stop.stopType === 'dropping';
          });
          
          // Check if both stops exist and fromStop comes before toStop in order
          return fromStop && toStop && fromStop.order < toStop.order;
      });

      if (validRoutes.length === 0) {
          return res.status(404).json({ 
              message: "No routes found for the selected locations with proper boarding and dropping points" 
          });
      }

      //Get buses associated with valid routes using routeId
      const routeIds = validRoutes.map(r => r.routeId);
      const buses = await Bus.find({ 
          routeId: { $in: routeIds },
          status: 'Active' // Only return active buses
      }).lean();

      if (buses.length === 0) {
          return res.status(404).json({ 
              message: "No active buses found for the selected route" 
          });
      }

      //Get schedules for these buses on the selected date
      const schedules = await Schedule.find({
          busId: { $in: buses.map(b => b._id) },
          departureDate: dateQuery
      }).lean();

      if (schedules.length === 0) {
          return res.status(404).json({ 
              message: "No schedules available for the selected date" 
          });
      }

      //Format data for frontend
      const searchResults = [];
      
      for (const bus of buses) {
          const route = validRoutes.find(r => r.routeId === bus.routeId);
          if (!route) continue; // Skip if route not found

          const busSchedules = schedules.filter(s => s.busId.equals(bus._id));
          
          for (const schedule of busSchedules) {
              // Get booked seats count for this schedule
              const bookedSeatsCount = await Seat.countDocuments({
                  busId: bus._id,
                  scheduleId: schedule._id,
                  isBooked: true
              });

              // Get reserved seats that haven't expired
              const reservedSeatsCount = await Seat.countDocuments({
                  busId: bus._id,
                  scheduleId: schedule._id,
                  isBooked: false,
                  reservedUntil: { $gt: new Date() }
              });

              // Calculate available seats
              const availableSeats = bus.capacity - (bookedSeatsCount + reservedSeatsCount);
              
              // Filter and format stops safely
              const safeStops = route.stops
                  .filter(stop => stop && stop.stop && stop.stop.stopName) // Remove any invalid stops
                  .map(stop => ({
                      stop: {
                          stopId: stop.stop._id,
                          stopName: stop.stop.stopName,
                          stopAddress: stop.stop.stopAddress || '',
                          coordinates: stop.stop.coordinates || {}
                      },
                      stopType: stop.stopType || 'boarding',
                      order: stop.order
                  }));
              
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
                      departureLocation: fromLocation,
                      arrivalLocation: toLocation,
                      stops: safeStops
                  },
                  schedule: {
                      departureDate: schedule.departureDate,
                      arrivalDate: schedule.arrivalDate,
                      departureTime: schedule.departureTime,
                      arrivalTime: schedule.arrivalTime,
                      duration: schedule.duration
                  },
                  availableSeats,
                  totalSeats: bus.capacity
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
      res.status(500).json({ 
          error: "Error searching buses", 
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
  }
};