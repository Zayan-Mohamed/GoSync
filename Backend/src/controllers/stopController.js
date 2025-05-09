import Stop from '../models/stopModel.js';
import generateStopId from '../utils/generateStopId.js';
import mongoose from 'mongoose';
import Route from '../models/routeModel.js';
import Booking from '../models/bookingModel.js';  
import Schedule from '../models/scheduleModel.js';

// Create a new stop
export const createStop = async (req, res) => {
  const { stopName, status } = req.body;

  // Normalize stopName by trimming and converting to lowercase
  const normalizedStopName = stopName.trim().toLowerCase();

  try {
    // Check for existing stop with the same name (case-insensitive)
    const existingStop = await Stop.findOne({ 
      stopName: { 
        $regex: new RegExp(`^${normalizedStopName}$`, 'i') 
      } 
    });

    // If stop already exists, return an error
    if (existingStop) {
      return res.status(409).json({ 
        error: 'Stop with this name already exists',
        existingStop: existingStop.stopName
      });
    }

    // Generate unique stopId
    const stopId = generateStopId();

    // Create and save new stop
    const stop = new Stop({ 
      stopId, 
      stopName: stopName.trim(), // Preserve original casing
      status 
    });

    await stop.save();
    res.status(201).json(stop);
  } catch (err) {
    // Handle potential validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.values(err.errors).map(e => e.message)
      });
    }
    
    // Generic error handler
    res.status(500).json({ 
      error: 'An error occurred while creating the stop',
      details: err.message 
    });
  }
};

export const createMultipleStops = async (req, res) => {
  try {
    // Validate input is an array
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ 
        error: "Invalid data format. Expected an array of stops" 
      });
    }

    // Transform input data to match expected format
    const transformedStops = req.body.map(stop => ({
      stopName: stop.stopName || stop["Stop Name"] || stop.name || stop.Name || "",
      status: (stop.status || stop.Status || 'active').toLowerCase()
    }));

    // Filter out any entries with empty stop names
    const validStops = transformedStops.filter(stop => stop.stopName && stop.stopName.trim() !== '');
    
    if (validStops.length === 0) {
      return res.status(400).json({
        error: "No valid stops found in the data. Each stop must have a valid stopName."
      });
    }

    // Process stops
    const stopsToInsert = [];
    const duplicateStops = [];

    for (const stopData of validStops) {
      const normalizedStopName = stopData.stopName.trim();
      
      // Check for existing stop (case-insensitive)
      const existingStop = await Stop.findOne({ 
        stopName: { $regex: new RegExp(`^${normalizedStopName}$`, 'i') }
      });

      if (existingStop) {
        duplicateStops.push(existingStop.stopName);
      } else {
        stopsToInsert.push({
          stopId: generateStopId(),
          stopName: normalizedStopName,
          status: stopData.status
        });
      }
    }

    // If duplicates found, return them
    if (duplicateStops.length > 0 && stopsToInsert.length === 0) {
      return res.status(409).json({
        error: "All stops already exist",
        duplicates: duplicateStops
      });
    }

    // Insert all non-duplicate stops
    let insertedStops = [];
    if (stopsToInsert.length > 0) {
      insertedStops = await Stop.insertMany(stopsToInsert);
    }
    
    res.status(201).json({
      message: `Successfully created ${insertedStops.length} stops${duplicateStops.length > 0 ? ` (${duplicateStops.length} duplicates skipped)` : ''}`,
      createdCount: insertedStops.length,
      duplicates: duplicateStops.length > 0 ? duplicateStops : undefined
    });

  } catch (error) {
    console.error("Bulk create error:", error);
    res.status(500).json({
      error: "Error inserting stops",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Edit an existing stop
// Update or add this controller function
export const editStop = async (req, res) => {
  // Check which route is being used
  const id = req.params.id;
  const { stopId, stopName, status } = req.body;

  try {
    let stop;
    
    if (id) {
      // If we're using the id route
      stop = await Stop.findById(id);
    } else {
      // If we're using the original route
      stop = await Stop.findOne({ stopId });
    }

    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    // Check for duplicate name (excluding current stop)
    if (stopName) {
      const existingStop = await Stop.findOne({
        stopName: { $regex: new RegExp(`^${stopName.trim()}$`, 'i') },
        _id: { $ne: stop._id }
      });

      if (existingStop) {
        return res.status(409).json({
          error: 'Stop with this name already exists',
          existingStop: existingStop.stopName
        });
      }
    }

    stop.stopName = stopName || stop.stopName;
    stop.status = status || stop.status;

    await stop.save();
    res.status(200).json(stop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get a stop by its stopId
export const getStop = async (req, res) => {
  const { stopId } = req.params;

  try {
    const stop = await Stop.findOne({ stopId });

    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    res.status(200).json(stop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

//TODO: Get all stops
export const getAllStops = async (req, res) => {
  try {
    const stops = await Stop.find();
    console.log("Stops retrieved:", stops); // Debugging

    if (stops.length === 0) {
      console.log("No stops found"); // Debugging
      return res.status(404).json({ message: "No stops found" });
    }

    res.status(200).json({
      message: "Stops retrieved successfully",
      stops
    });
  } catch (error) {
    console.error("Error retrieving stops:", error); // Debugging
    res.status(500).json({
      error: "Error retrieving stops",
      details: error.message
    });
  }
};


// Delete a stop
export const deleteStop = async (req, res) => {
  // Check if we're using the id or stopId route
  const id = req.params.id;
  
  try {
    let stop;
    
    if (id) {
      // If we have an id parameter, use findByIdAndDelete
      stop = await Stop.findByIdAndDelete(id);
    } else {
      // Fallback to the original method if no id is provided
      const { stopId } = req.params;
      stop = await Stop.findOneAndDelete({ stopId });
    }

    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    res.status(200).json({ message: 'Stop deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// In stopController.js
export const toggleStopStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const stop = await Stop.findById(id);

    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    // Toggle the status between active and inactive
    stop.status = stop.status === 'active' ? 'inactive' : 'active';

    await stop.save();
    res.status(200).json(stop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Stop analytics endpoint
export const getStopAnalytics = async (req, res) => {
  try {
    const { routeId, status, startDate, endDate } = req.query;

    // Build query filters
    const stopQuery = {};
    if (status) stopQuery.status = status;

    const bookingQuery = { status: 'confirmed' };
    if (startDate && endDate) {
      bookingQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Aggregate stop data
    const [totalStopsResult, activeStopsResult, inactiveStopsResult, stopsByRoute, topStops, bookingCounts] = await Promise.all([
      // Total stops
      Stop.countDocuments(stopQuery),
      // Active stops
      Stop.countDocuments({ ...stopQuery, status: 'active' }),
      // Inactive stops
      Stop.countDocuments({ ...stopQuery, status: 'inactive' }),
      // Stops by route
      Route.aggregate([
        { $match: routeId ? { _id: new mongoose.Types.ObjectId(routeId) } : {} },
        { $unwind: '$stops' },
        {
          $group: {
            _id: '$routeName',
            stopCount: { $sum: 1 },
          },
        },
        {
          $project: {
            routeName: '$_id',
            stopCount: 1,
            _id: 0,
          },
        },
        { $sort: { stopCount: -1 } },
      ]),
      // Top stops by usage (bookings)
      Booking.aggregate([
        { $match: bookingQuery },
        {
          $lookup: {
            from: 'schedules',
            localField: 'scheduleId',
            foreignField: '_id',
            as: 'schedule',
          },
        },
        { $unwind: '$schedule' },
        {
          $lookup: {
            from: 'routes',
            localField: 'schedule.routeId',
            foreignField: '_id',
            as: 'route',
          },
        },
        { $unwind: '$route' },
        { $unwind: '$route.stops' },
        { $match: routeId ? { 'schedule.routeId': new mongoose.Types.ObjectId(routeId) } : {} },
        {
          $lookup: {
            from: 'stops',
            localField: 'route.stops.stop',
            foreignField: '_id',
            as: 'stop',
          },
        },
        { $unwind: '$stop' },
        {
          $match: stopQuery.status ? { 'stop.status': stopQuery.status } : {},
        },
        {
          $group: {
            _id: '$stop._id',
            stopName: { $first: '$stop.stopName' },
            status: { $first: '$stop.status' },
            bookingCount: { $sum: 1 },
            routes: { $addToSet: '$route._id' },
          },
        },
        {
          $project: {
            stopName: 1,
            status: 1,
            bookingCount: 1,
            routeCount: { $size: '$routes' },
            _id: 0,
          },
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 5 },
      ]),
      // Most used stop
      Booking.aggregate([
        { $match: bookingQuery },
        {
          $lookup: {
            from: 'schedules',
            localField: 'scheduleId',
            foreignField: '_id',
            as: 'schedule',
          },
        },
        { $unwind: '$schedule' },
        {
          $lookup: {
            from: 'routes',
            localField: 'schedule.routeId',
            foreignField: '_id',
            as: 'route',
          },
        },
        { $unwind: '$route' },
        { $unwind: '$route.stops' },
        { $match: routeId ? { 'schedule.routeId': new mongoose.Types.ObjectId(routeId) } : {} },
        {
          $lookup: {
            from: 'stops',
            localField: 'route.stops.stop',
            foreignField: '_id',
            as: 'stop',
          },
        },
        { $unwind: '$stop' },
        {
          $match: stopQuery.status ? { 'stop.status': stopQuery.status } : {},
        },
        {
          $group: {
            _id: '$stop._id',
            stopName: { $first: '$stop.stopName' },
            bookingCount: { $sum: 1 },
          },
        },
        {
          $project: {
            stopName: 1,
            bookingCount: 1,
            _id: 0,
          },
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const mostUsedStop = bookingCounts[0] || { stopName: 'No data', bookingCount: 0 };

    res.status(200).json({
      totalStops: totalStopsResult,
      activeStops: activeStopsResult,
      inactiveStops: inactiveStopsResult,
      mostUsedStop,
      stopsByRoute,
      topStops,
    });
  } catch (error) {
    console.error('Stop analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};