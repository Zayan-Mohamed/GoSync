import Route from '../models/routeModel.js';
import Stop from '../models/stopModel.js';
import generateRouteId from '../utils/generateRouteId.js';
import mongoose from 'mongoose';

export const createRoute = async (req, res) => {
  try {
    const {
      routeName,
      startLocation,
      endLocation,
      totalDistance,
      startLocationCoordinates,
      endLocationCoordinates,
      stops
    } = req.body;

    // Normalize route name by converting to lowercase for case-insensitive comparison
    const normalizedRouteName = routeName.toLowerCase().trim();

    // Check for existing route with the same name (case-insensitive)
    const existingRoute = await Route.findOne({
      routeName: { $regex: new RegExp(`^${normalizedRouteName}$`, 'i') }
    });

    if (existingRoute) {
      return res.status(400).json({ 
        error: 'A route with this name already exists', 
        existingRouteId: existingRoute.routeId 
      });
    }

    // Format stops array to include stop reference and order
    const formattedStops = [];
   
    if (stops && stops.length > 0) {
      for (let i = 0; i < stops.length; i++) {
        const stopData = stops[i];
        // Handle if stop is passed as object or just ID
        const stopId = typeof stopData === 'object' ? stopData.stopId : stopData;
        const order = typeof stopData === 'object' ? stopData.order : i + 1;
       
        // Validate the stop exists
        const stop = await Stop.findOne({
          stopId: stopId
        });
       
        if (!stop) {
          return res.status(404).json({ error: `Stop with ID ${stopId} not found` });
        }
       
        formattedStops.push({
          stop: stop._id,
          order: order
        });
      }
    }

    // Create a new route
    const newRoute = new Route({
      routeId: generateRouteId(),
      routeName,
      startLocation,
      endLocation,
      totalDistance,
      startLocationCoordinates,
      endLocationCoordinates,
      stops: formattedStops,
      status: 'active',
    });

    await newRoute.save();
    
    res.status(201).json({ 
      message: 'Route created successfully', 
      route: newRoute 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error creating route', 
      details: error.message 
    });
  }
};
// Update addStopToRoute function
export const addStopToRoute = async (req, res) => {
  try {
    const { routeId, stopId, order } = req.body;

    // Find the route
    const route = await Route.findOne({ routeId });
    if (!route) return res.status(404).json({ error: 'Route not found' });

    // Find the stop
    const stop = await Stop.findOne({ stopId });
    if (!stop) return res.status(404).json({ error: 'Stop not found' });

    // Check if the stop is already in the route
    const stopExists = route.stops.some((existingStop) => 
      existingStop.stop.toString() === stop._id.toString()
    );
    
    if (stopExists) {
      return res.status(400).json({ error: 'Stop is already under this route, cannot add again.' });
    }

    // Add the stop to the route with the specified order
    route.stops.push({
      stop: stop._id,
      order: order || route.stops.length + 1 // Default to next position if no order specified
    });
    
    // Sort the stops by order
    route.stops.sort((a, b) => a.order - b.order);
    
    await route.save();

    res.status(200).json({ message: 'Stop added to route successfully', route });
  } catch (error) {
    res.status(500).json({ error: 'Error adding stop to route', details: error });
  }
};

export const addMultipleStopsToRoute = async (req, res) => {
  try {
    const { routeId, stops } = req.body; // stops is an array of { stopId, order }

    // Find the route
    const route = await Route.findOne({ routeId });
    if (!route) return res.status(404).json({ error: 'Route not found' });

    // Fetch all stops from the database
    const stopIds = stops.map(s => s.stopId);
    const foundStops = await Stop.find({ stopId: { $in: stopIds } });

    if (foundStops.length !== stopIds.length) {
      return res.status(400).json({ error: 'Some stops do not exist in the database' });
    }

    // Convert stopId to ObjectId for comparison
    const existingStopIds = route.stops.map(s => s.stop.toString());

    const newStops = [];
    stops.forEach((stop, index) => {
      const stopDoc = foundStops.find(s => s.stopId === stop.stopId);
      if (!stopDoc) return;

      if (!existingStopIds.includes(stopDoc._id.toString())) {
        newStops.push({
          stop: stopDoc._id,
          order: stop.order || route.stops.length + newStops.length + 1
        });
      }
    });

    if (newStops.length === 0) {
      return res.status(400).json({ error: 'No new stops were added (either already exist or invalid data)' });
    }

    // Add new stops and sort by order
    route.stops = [...route.stops, ...newStops].sort((a, b) => a.order - b.order);

    await route.save();

    res.status(200).json({ message: 'Stops added successfully', route });
  } catch (error) {
    res.status(500).json({ error: 'Error adding stops to route', details: error.message });
  }
};


// Update getAllRoutes function
export const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().populate('stops.stop');

    // Format the routes to match the expected frontend structure
    const formattedRoutes = routes.map(route => {
      // Convert mongoose document to plain object
      const routeObj = route.toObject();
      
      // Sort stops by order
      const sortedStops = routeObj.stops.sort((a, b) => a.order - b.order);
      
      return {
        _id: routeObj._id,
        routeId: routeObj.routeId,
        routeName: routeObj.routeName,
        startLocation: routeObj.startLocation,
        endLocation: routeObj.endLocation,
        totalDistance: routeObj.totalDistance,
        status: routeObj.status || 'active',
        startLocationCoordinates: routeObj.startLocationCoordinates || { lat: null, lng: null },
        endLocationCoordinates: routeObj.endLocationCoordinates || { lat: null, lng: null },
        stops: sortedStops, // Return the sorted stops
      };
    });

    res.status(200).json({ routes: formattedRoutes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching routes', details: error.message });
  }
};
// Get route details by routeId, including stops
export const getRouteById = async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await Route.findOne({ routeId }).populate('stops.stop');
    if (!route) return res.status(404).json({ error: 'Route not found' });

    // Sort stops by order for consistent output
    const sortedRoute = route.toObject();
    sortedRoute.stops = sortedRoute.stops.sort((a, b) => a.order - b.order);

    res.status(200).json({ route: sortedRoute });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching route', details: error.message });
  }
};

// Update the updateRoute function
export const updateRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { 
      routeName, 
      startLocation, 
      endLocation, 
      totalDistance, 
      startLocationCoordinates, 
      endLocationCoordinates, 
      status, 
      stops 
    } = req.body;

    // Check if routeId is valid
    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ error: "Invalid route ID" });
    }

    // Create an array to store the formatted stops
    let formattedStops = [];
    
    // Process each stop in the request
    if (stops && stops.length > 0) {
      for (const stopData of stops) {
        // Check if the stop is provided as an ID or an object with stopId and order
        const stopId = typeof stopData === 'object' ? stopData.stop : stopData;
        const order = typeof stopData === 'object' ? stopData.order : formattedStops.length + 1;
        
        if (!mongoose.Types.ObjectId.isValid(stopId)) {
          return res.status(400).json({ error: `Invalid stop ID: ${stopId}` });
        }
        
        formattedStops.push({
          stop: new mongoose.Types.ObjectId(stopId),
          order
        });
      }
    }

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
        status,
        stops: formattedStops
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

// Getting all the stops for a specific route
export const getStopsForRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    // Validate the routeId format
    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ error: "Invalid route ID format" });
    }
    
    // Find the route by ID and populate the stop details
    const route = await Route.findById(routeId).populate('stops.stop');
    
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    
    // Sort stops by order and format the response
    const formattedStops = route.stops
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        stop: item.stop,
        order: item.order,
        stopType: item.stopType // Add this line to include stopType in response
      }));
    
    // Return the stops for the route
    res.status(200).json({
      message: "Stops retrieved successfully",
      stops: formattedStops
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

export const deleteStopFromRoute = async (req, res) => {
  try {
    const { routeId, stopId } = req.params;

    // Validate input
    if (!routeId || !stopId) {
      return res.status(400).json({ error: "Route ID and Stop ID are required" });
    }

    // Find the route using routeId
    const route = await Route.findOne({ routeId: routeId });
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    // Find the index and order of the stop to be deleted
    const stopToDelete = route.stops.find(s => s.stop.toString() === stopId);
    if (!stopToDelete) {
      return res.status(404).json({ 
        error: "Stop not found in route",
        details: {
          routeId: route.routeId,
          stopIds: route.stops.map(s => s.stop.toString())
        }
      });
    }

    // Get the order of the stop to be deleted
    const deletedStopOrder = stopToDelete.order;

    // Remove stop from the route's stops array
    route.stops = route.stops.filter(s => s.stop.toString() !== stopId);

    // Reorder the remaining stops
    route.stops.forEach(stop => {
      if (stop.order > deletedStopOrder) {
        stop.order -= 1;
      }
    });

    // Sort stops by order to ensure correct sequence
    route.stops.sort((a, b) => a.order - b.order);

    // Save the updated route
    const updatedRoute = await route.save();

    // Send a success response
    return res.status(200).json({ 
      message: "Stop successfully removed from route",
      updatedStops: updatedRoute.stops 
    });
  } catch (error) {
    console.error('Error in deleteStopFromRoute:', error);
    return res.status(500).json({
      error: "Error deleting stop",
      details: error.message
    });
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

// Update Stop and Reflect Changes in Routes
export const updateStop = async (req, res) => {
  try {
    const { stopId } = req.params; // Get stop ID from URL params
    const updateData = req.body; // Get updated data from request body

    // Find and update the stop
    const updatedStop = await Stop.findOneAndUpdate({ stopId }, updateData, { new: true });

    if (!updatedStop) {
      return res.status(404).json({ message: 'Stop not found' });
    }

    // Find all routes that contain this stop
    const routesToUpdate = await Route.find({ 'stops.stopId': stopId });

    // Update stop details in each route
    for (const route of routesToUpdate) {
      route.stops = route.stops.map((stop) =>
        stop.stopId === stopId ? { ...stop, ...updateData } : stop
      );
      await route.save(); // Save the updated route
    }

    res.status(200).json({ message: 'Stop and associated routes updated successfully', updatedStop });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle stop status (active/inactive)
export const toggleStopStatus = async (req, res) => {
  const { stopId } = req.params;

  try {
    // Find the stop by stopId and toggle its status
    const stop = await Stop.findOne({ stopId });

    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    // Toggle the status
    stop.status = stop.status === 'active' ? 'inactive' : 'active';
    
    // Save the updated stop
    await stop.save();

    // Find all routes that contain this stop
    const routesToUpdate = await Route.find({ 'stops.stop': stop._id });

    // Optionally update the status in associated routes if needed
    for (const route of routesToUpdate) {
      await route.save(); // This triggers any pre-save middleware if you have any
    }

    res.status(200).json({
      message: 'Stop status toggled successfully',
      stop: stop
    });
  } catch (err) {
    console.error('Error toggling stop status:', err);
    res.status(500).json({ 
      error: 'Error toggling stop status', 
      details: err.message 
    });
  }
};

export const updateStopType = async (req, res) => {
  try {
    const { routeId, stopId, stopType } = req.body; // stopType can be 'Boarding' or 'Dropping'

    // Validate stopType
    if (!['boarding', 'dropping'].includes(stopType)) {
      return res.status(400).json({ error: 'Invalid stop type. It must be either "Boarding" or "Dropping".' });
    }

    // Find the route
    const route = await Route.findOne({ routeId });
    if (!route) return res.status(404).json({ error: 'Route not found' });

    // Find the stop index in the stops array
    const stopIndex = route.stops.findIndex(stop => stop.stop.toString() === stopId);
    if (stopIndex === -1) {
      return res.status(404).json({ error: 'Stop not found in the specified route' });
    }

    // Update only the stopType for the specific stop
    route.stops[stopIndex].stopType = stopType;

    // Save the updated route
    await route.save();

    res.status(200).json({ message: 'Stop type updated successfully', route });
  } catch (error) {
    res.status(500).json({ error: 'Error updating stop type', details: error.message });
  }
};

export const updateMultipleStopTypes = async (req, res) => {
  try {
    const { routeId, stops } = req.body;
    const validStopTypes = ['boarding', 'dropping'];
    const route = await Route.findOne({ routeId });

    if (!route) return res.status(404).json({ error: 'Route not found' });

    // Debug: Log the stop IDs from the database
    console.log("Database Stop IDs:", route.stops.map(s => s.stopId || s._id || s.stop));

    const updatedStops = [];

    for (const stopData of stops) {
      // Normalize stopType to lowercase
      const stopType = stopData.stopType?.toLowerCase();
      if (!validStopTypes.includes(stopType)) {
        return res.status(400).json({ error: `Invalid stop type for stop ${stopData.stopId}` });
      }

      // Try multiple ID fields if needed
      const stopIndex = route.stops.findIndex(s => 
        String(s.stopId) === String(stopData.stopId) || 
        String(s._id) === String(stopData.stopId) ||
        String(s.stop) === String(stopData.stopId)
      );

      if (stopIndex !== -1) {
        route.stops[stopIndex].stopType = stopType;
        updatedStops.push(route.stops[stopIndex]);
      } else {
        console.log("No match for stopId:", stopData.stopId);
      }
    }

    if (updatedStops.length === 0) {
      return res.status(404).json({ 
        error: "No matching stops found", 
        databaseStopIds: route.stops.map(s => s.stopId || s._id || s.stop),
        requestedStopIds: stops.map(s => s.stopId)
      });
    }

    await route.save();
    res.status(200).json({ message: `${updatedStops.length} stops updated`, updatedStops });
  } catch (error) {
    res.status(500).json({ error: 'Update failed', details: error.message });
  }
};