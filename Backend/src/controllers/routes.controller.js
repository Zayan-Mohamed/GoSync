import { Route, Stop } from "../models/routes.model.js"; // Importing both Route and Stop models

// ✅ Create a New Route
export const createRoute = async (req, res) => {
  try {
    const routeData = {
      ...req.body,
      stops: Array.isArray(req.body.stops) ? req.body.stops : [],
    };

    if (routeData.stops.length > 0) {
      for (let stop of routeData.stops) {
        if (!stop.stopId || !stop.stopName || !stop.stopOrder) {
          return res.status(400).json({ error: 'Each stop must have stopId, stopName, and stopOrder' });
        }
        
        // Create and save the stop if it doesn't exist yet
        const newStop = new Stop(stop);
        await newStop.save();
      }
    }

    const newRoute = new Route(routeData);
    await newRoute.save();

    res.status(201).json({ message: 'Route created successfully', route: newRoute });
  } catch (error) {
    console.error("Error creating route:", error);
    res.status(500).json({ error: error.message });
  }
};


// ✅ Get All Routes
export const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find({}, {
      routeId: 1,
      routeNumber: 1,
      startLocation: 1,
      endLocation: 1,
      location: 1,
      status: 1,
    }).populate('stops', 'stopName stopOrder'); // Populating stop details for each route
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Route by routeId
export const getRouteById = async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId }).populate('stops', 'stopName stopOrder');
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update Route Details
export const updateRoute = async (req, res) => {
  try {
    // Ensure stops is an empty array if not provided
    const updatedData = {
      ...req.body,
      stops: Array.isArray(req.body.stops) ? req.body.stops : [],
    };

    // Check for stop validity if stops are updated
    if (updatedData.stops.length > 0) {
      for (let stop of updatedData.stops) {
        if (!stop.stopId || !stop.stopName || !stop.stopOrder) {
          return res.status(400).json({ error: 'Each stop must have stopId, stopName, and stopOrder' });
        }

        // Save each new stop if not already in the database
        const existingStop = await Stop.findOne({ stopId: stop.stopId });
        if (!existingStop) {
          const newStop = new Stop(stop);
          await newStop.save();
        }
      }
    }

    const updatedRoute = await Route.findOneAndUpdate(
      { routeId: req.params.routeId },
      updatedData,
      { new: true }
    ).populate('stops', 'stopName stopOrder');

    if (!updatedRoute) return res.status(404).json({ message: "Route not found" });
    res.json({ message: "Route updated successfully", updatedRoute });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete Route
export const deleteRoute = async (req, res) => {
  try {
    const deletedRoute = await Route.findOneAndDelete({ routeId: req.params.routeId });
    if (!deletedRoute) return res.status(404).json({ message: "Route not found" });
    res.json({ message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Toggle Route Status
export const toggleRouteStatus = async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId });
    if (!route) return res.status(404).json({ message: "Route not found" });

    route.status = route.status === "Active" ? "Inactive" : "Active";
    await route.save();

    res.json({ message: `Route ${route.status} successfully`, route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
