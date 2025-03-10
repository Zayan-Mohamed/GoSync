import Route from '../models/routes.model.js';

// ✅ Create a New Route
export const createRoute = async (req, res) => {
  try {
    const newRoute = new Route(req.body);
    await newRoute.save();
    res.status(201).json({ message: 'Route created successfully', newRoute });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get All Routes (With Stops)
export const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find({}, { 
      routeId: 1, 
      routeNumber: 1, 
      startLocation: 1, 
      endLocation: 1, 
      stops: 1,
      status: 1
    });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Route by ID
export const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update Route Details
export const updateRoute = async (req, res) => {
  try {
    const updatedRoute = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRoute) return res.status(404).json({ message: 'Route not found' });
    res.json({ message: 'Route updated successfully', updatedRoute });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete Route
export const deleteRoute = async (req, res) => {
  try {
    const deletedRoute = await Route.findByIdAndDelete(req.params.id);
    if (!deletedRoute) return res.status(404).json({ message: 'Route not found' });
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Toggel Route Status
export const toggleRouteStatus = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });

    // Check if the current status is valid
    if (!["Active", "Inactive"].includes(route.status)) {
      return res.status(400).json({ message: `Invalid current status: ${route.status}` });
    }

    // Toggle between Active and Inactive
    route.status = route.status === "Active" ? "Inactive" : "Active";

    await route.save(); // Save the updated route

    res.json({ message: `Route ${route.status} successfully`, route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};