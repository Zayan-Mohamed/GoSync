import Route from "../models/routes.model.js";

// ✅ Create a New Route
export const createRoute = async (req, res) => {
  try {
    const routeData = { ...req.body, stops: req.body.stops || [] }; // Ensure stops is empty if not provided
    const newRoute = new Route(routeData);
    await newRoute.save();

    res.status(201).json({ message: 'Route created successfully', newRoute });
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
    });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Route by routeId
export const getRouteById = async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId });
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update Route Details
export const updateRoute = async (req, res) => {
  try {
    const updatedRoute = await Route.findOneAndUpdate(
      { routeId: req.params.routeId },
      req.body,
      { new: true }
    );
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