import Route from "../models/routes.model.js";

// ✅ Add Stop to a Route
export const addStopToRoute = async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId });
    if (!route) return res.status(404).json({ message: "Route not found" });

    const maxStopId = route.stops.length > 0 ? Math.max(...route.stops.map(stop => stop.stopId)) : 0;

    const newStop = {
      stopId: maxStopId + 1,
      stopName: req.body.stopName,
      stopOrder: req.body.stopOrder,
      location: req.body.location,
      status: "Active" // Default status
    };

    route.stops.push(newStop);
    await route.save();

    res.status(201).json({ message: "Stop added successfully", route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Stops for a Route
export const getStopsForRoute = async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId }, { stops: 1 });
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

    const stopIdToUpdate = Number(req.params.stopId);
    const stop = route.stops.find(s => s.stopId === stopIdToUpdate);
    if (!stop) return res.status(404).json({ message: "Stop not found" });

    stop.stopName = req.body.stopName || stop.stopName;
    stop.stopOrder = req.body.stopOrder || stop.stopOrder;
    stop.location = req.body.location || stop.location;

    await route.save();
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

    route.stops = route.stops.filter(s => s.stopId !== Number(req.params.stopId));
    await route.save();

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

    const stop = route.stops.find(s => s.stopId === Number(req.params.stopId));
    if (!stop) return res.status(404).json({ message: "Stop not found" });

    stop.status = stop.status === "Active" ? "Inactive" : "Active";
    await route.save();

    res.json({ message: `Stop ${stop.status} successfully`, route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
