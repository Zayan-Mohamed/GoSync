import Route from '../models/routeModel.js';
import Stop from '../models/stopModel.js';
import generateRouteId from '../utils/generateRouteId.js';
import mongoose from 'mongoose';

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

// Get all routes with populated stops
export const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().populate('stops'); // Populate stops to get full details
    res.status(200).json({ routes });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching routes', details: error.message });
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

// Update an existing route
export const updateRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { routeName, startLocation, endLocation, totalDistance, startLocationCoordinates, endLocationCoordinates, stops } = req.body;

    // Check if routeId is valid
    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ error: "Invalid route ID" });
    }

    // Validate stop IDs
    const stopObjectIds = stops.map(stopId => {
      if (!mongoose.Types.ObjectId.isValid(stopId)) {
        return res.status(400).json({ error: `Invalid stop ID: ${stopId}` });
      }
      return new mongoose.Types.ObjectId(stopId);
    });

    // Find and update the route
    const updatedRoute = await Route.findByIdAndUpdate(
      routeId,
      {
        routeName,
        startLocation,
        endLocation,
        totalDistance,
        startLocationCoordinates,
        endLocationCoordinates,
        stops: stopObjectIds
      },
      { new: true, runValidators: true } // Return updated document
    );

    if (!updatedRoute) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.status(200).json({ message: "Route updated successfully", route: updatedRoute });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating route", details: error.message });
  }
};

// Update a specific stop in a route
export const updateStopInRoute = async (req, res) => {
  try {
    const { routeId, stopId } = req.params;
    const updatedStopData = req.body;
    
    // Validate routeId and stopId
    if (!mongoose.Types.ObjectId.isValid(routeId) || !mongoose.Types.ObjectId.isValid(stopId)) {
      return res.status(400).json({ error: "Invalid route ID or stop ID format" });
    }
    
    // Check if route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    
    // Check if the stopId is in the route's stops array
    if (!route.stops.includes(stopId)) {
      return res.status(404).json({ error: "Stop not found in route" });
    }
    
    // Update the stop document directly
    const updatedStop = await Stop.findByIdAndUpdate(
      stopId,
      { $set: updatedStopData },
      { new: true, runValidators: true }
    );
    
    if (!updatedStop) {
      return res.status(404).json({ error: "Stop could not be updated" });
    }
    
    res.status(200).json({ 
      message: "Stop updated successfully", 
      updatedStop 
    });
  } catch (error) {
    res.status(500).json({ error: "Error updating stop", details: error.message });
  }
};

//Getting all the stops for a specific route
export const getStopsForRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    // Validate the routeId format
    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ error: "Invalid route ID format" });
    }
    
    // Find the route by ID
    const route = await Route.findById(routeId).populate('stops');  // Assuming stops are populated with Stop data
    
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    
    // Return the stops for the route
    res.status(200).json({
      message: "Stops retrieved successfully",
      stops: route.stops,  // This will return the populated stops array
    });
    
  } catch (error) {
    res.status(500).json({ error: "Error fetching stops", details: error.message });
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

// delete a stop from a route
export const deleteStopFromRoute = async (req, res) => {
  try {
    const { routeId, stopId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(routeId) || !mongoose.Types.ObjectId.isValid(stopId)) {
      return res.status(400).json({ error: "Invalid route ID or stop ID format" });
    }

    // Find the route
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    // Check if the stop exists in the route
    if (!route.stops.includes(stopId)) {
      return res.status(404).json({ error: "Stop not found in route" });
    }

    // Remove stop from the route's stops array
    route.stops = route.stops.filter(id => id.toString() !== stopId);
    await route.save();

    // Delete the stop from the Stop collection
    const deletedStop = await Stop.findByIdAndDelete(stopId);
    if (!deletedStop) {
      return res.status(404).json({ error: "Stop could not be deleted" });
    }

    res.status(200).json({ message: "Stop deleted successfully", deletedStop });

  } catch (error) {
    res.status(500).json({ error: "Error deleting stop", details: error.message });
  }
};

// delete a route

export const deleteRoute = async (req, res) => {
  try {
    const { routeId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ error: "Invalid route ID format" });
    }

    // Find the route
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    // Delete the route
    await Route.findByIdAndDelete(routeId);

    res.status(200).json({ message: "Route deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: "Error deleting route", details: error.message });
  }
};
