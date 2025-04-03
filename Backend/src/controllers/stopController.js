import Stop from '../models/stopModel.js';
import generateStopId from '../utils/generateStopId.js';

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

    // Process stops
    const stopsToInsert = [];
    const duplicateStops = [];

    for (const stopData of req.body) {
      // Validate each stop
      if (!stopData.stopName || typeof stopData.stopName !== 'string') {
        return res.status(400).json({
          error: "Each stop must have a valid stopName"
        });
      }

      const normalizedStopName = stopData.stopName.trim().toLowerCase();
      
      // Check for existing stop (case-insensitive)
      const existingStop = await Stop.findOne({ 
        stopName: { $regex: new RegExp(`^${normalizedStopName}$`, 'i') }
      });

      if (existingStop) {
        duplicateStops.push(existingStop.stopName);
      } else {
        stopsToInsert.push({
          stopId: generateStopId(),
          stopName: stopData.stopName.trim(),
          status: stopData.status || 'active'
        });
      }
    }

    // If duplicates found, return them
    if (duplicateStops.length > 0) {
      return res.status(409).json({
        error: "Some stops already exist",
        duplicates: duplicateStops
      });
    }

    // Insert all non-duplicate stops
    const insertedStops = await Stop.insertMany(stopsToInsert);
    
    res.status(201).json({
      message: `Successfully created ${insertedStops.length} stops`,
      createdCount: insertedStops.length
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