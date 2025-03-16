import { Route, Stop } from "../models/routes.model.js"; // Importing both Route and Stop models

// ✅ Add Stop to a Route
export const addStopToRoute = async (req, res) => {
  try {
    const { stopName, stopOrder, location } = req.body;
    const routeId = req.params.routeId;

    if (!routeId) {
      return res.status(400).json({ error: "routeId is required" });
    }

    if (!stopName || !stopOrder || !location) {
      return res.status(400).json({ error: "stopName, stopOrder, and location are required" });
    }

    const route = await Route.findOne({ routeId });
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Determine the new stopId based on the current stops in the route
    const maxStopId = route.stops.length > 0 ? Math.max(...route.stops.map(stop => stop.stopId)) : 0;
    const newStopId = maxStopId + 1;

    // Create a new stop document
    const newStop = new Stop({
      stopId: newStopId,
      stopName,
      stopOrder,
      location,
      status: "Active" // Default status
    });

    // Save the new stop to the database
    await newStop.save();

    // Add the stop to the route's stops array
    route.stops.push(newStop._id);
    await route.save();

    res.status(201).json({ message: "Stop added successfully", route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Stops for a Route
export const getStopsForRoute = async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId }).populate('stops');
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json(route.stops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update Stop in a Route
export const updateStopInRoute = async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId });
    if (!route) return res.status(404).json({ message: "Route not found" });

    const stopIdToUpdate = req.params.stopId;
    const stop = await Stop.findById(stopIdToUpdate);
    if (!stop) return res.status(404).json({ message: "Stop not found" });

    // Update the stop fields
    stop.stopName = req.body.stopName || stop.stopName;
    stop.stopOrder = req.body.stopOrder || stop.stopOrder;
    stop.location = req.body.location || stop.location;

    await stop.save();
    res.json({ message: "Stop updated successfully", route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete Stop from a Route
export const deleteStopFromRoute = async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId });
    if (!route) return res.status(404).json({ message: "Route not found" });

    const stopIdToDelete = req.params.stopId;
    const stop = await Stop.findById(stopIdToDelete);
    if (!stop) return res.status(404).json({ message: "Stop not found" });

    // Remove the stop from the route's stops array
    route.stops = route.stops.filter(stop => stop.toString() !== stopIdToDelete);
    await route.save();

    // Delete the stop document
    await Stop.findByIdAndDelete(stopIdToDelete);

    res.json({ message: "Stop deleted successfully", route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Toggle Stop Status
export const toggleStopStatus = async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId });
    if (!route) return res.status(404).json({ message: "Route not found" });

    const stopIdToToggle = req.params.stopId;
    const stop = await Stop.findById(stopIdToToggle);
    if (!stop) return res.status(404).json({ message: "Stop not found" });

    stop.status = stop.status === "Active" ? "Inactive" : "Active";
    await stop.save();

    res.json({ message: `Stop ${stop.status} successfully`, route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
