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
    // Normalize and validate incoming stops
    const stopsToInsert = [];
    const duplicateStops = [];

    for (const stop of req.body) {
      const normalizedStopName = stop.stopName.trim().toLowerCase();
      
      // Check if stop already exists
      const existingStop = await Stop.findOne({ 
        stopName: { 
          $regex: new RegExp(`^${normalizedStopName}$`, 'i') 
        } 
      });

      if (existingStop) {
        duplicateStops.push({
          originalName: stop.stopName,
          existingName: existingStop.stopName
        });
      } else {
        stopsToInsert.push({
          stopId: generateStopId(),
          stopName: stop.stopName.trim(),
          status: stop.status || 'active'
        });
      }
    }

    // Insert non-duplicate stops
    const insertedStops = await Stop.insertMany(stopsToInsert);

    return res.status(201).json({
      message: `Successfully inserted ${insertedStops.length} stops`,
      insertedStops,
      duplicates: duplicateStops.length > 0 ? duplicateStops : undefined
    });
  } catch (error) {
    console.error('Error in createMultipleStops:', error);
    
    return res.status(500).json({
      error: "Error inserting stops",
      details: error.message
    });
  }
};
// Edit an existing stop
export const editStop = async (req, res) => {
  const { stopId, stopName, status } = req.body;

  try {
    const stop = await Stop.findOne({ stopId });

    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
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
  const { stopId } = req.params;

  try {
    const stop = await Stop.findOneAndDelete({ stopId });

    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    res.status(200).json({ message: 'Stop deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
