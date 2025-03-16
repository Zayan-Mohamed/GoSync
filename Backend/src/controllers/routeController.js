import Route from '../models/routeModel.js';
import Stop from '../models/stopModel.js';
import generateRouteId from '../utils/generateRouteId.js';

// Create a route with stops
export const createRoute = async (req, res) => {
  try {
    const { routeName, startLocation, endLocation, totalDistance, startLocationCoordinates, endLocationCoordinates, stops } = req.body;

    // Create a new route
    const newRoute = new Route({
      routeId: generateRouteId(),
      routeName,
      startLocation,
      endLocation,
      totalDistance,
      startLocationCoordinates,
      endLocationCoordinates,
      stops,
    });

    await newRoute.save();
    res.status(201).json({ message: 'Route created successfully', route: newRoute });
  } catch (error) {
    res.status(500).json({ error: 'Error creating route', details: error });
  }
};

// Add a stop to an existing route
export const addStopToRoute = async (req, res) => {
  try {
    const { routeId, stopId } = req.body;

    // Find the route
    const route = await Route.findOne({ routeId });
    if (!route) return res.status(404).json({ error: 'Route not found' });

    // Find the stop
    const stop = await Stop.findOne({ stopId });
    if (!stop) return res.status(404).json({ error: 'Stop not found' });

    // Add the stop to the route
    route.stops.push(stop._id);
    await route.save();

    res.status(200).json({ message: 'Stop added to route successfully', route });
  } catch (error) {
    res.status(500).json({ error: 'Error adding stop to route', details: error });
  }
};

// Get route details by routeId, including stops
export const getRouteById = async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await Route.findOne({ routeId }).populate('stops');
    if (!route) return res.status(404).json({ error: 'Route not found' });

    res.status(200).json({ route });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching route', details: error });
  }
};

// Toggle the status of the route (active/inactive)
export const toggleRouteStatus = async (req, res) => {
  try {
    const { routeId } = req.params;
    const route = await Route.findOne({ routeId });

    if (!route) return res.status(404).json({ error: 'Route not found' });

    // Toggle the status
    route.status = route.status === 'active' ? 'inactive' : 'active';
    await route.save();

    res.status(200).json({ message: 'Route status toggled', route });
  } catch (error) {
    res.status(500).json({ error: 'Error toggling route status', details: error });
  }
};
