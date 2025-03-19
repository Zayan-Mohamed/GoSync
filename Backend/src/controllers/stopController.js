import Stop from '../models/stopModel.js';
import generateStopId from '../utils/generateStopId.js';

// Create a new stop
export const createStop = async (req, res) => {
  const { stopName, stopOrder, status } = req.body;

  const stopId = generateStopId();

  try {
    const stop = new Stop({ stopId, stopName, stopOrder, status });
    await stop.save();
    res.status(201).json(stop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Edit an existing stop
export const editStop = async (req, res) => {
  const { stopId, stopName, stopOrder, status } = req.body;

  try {
    const stop = await Stop.findOne({ stopId });

    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    stop.stopName = stopName || stop.stopName;
    stop.stopOrder = stopOrder || stop.stopOrder;
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

// Toggle stop status (active/inactive)
export const toggleStopStatus = async (req, res) => {
  const { stopId } = req.params;

  try {
    const stop = await Stop.findOne({ stopId });

    if (!stop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    stop.status = stop.status === 'active' ? 'inactive' : 'active';
    await stop.save();
    res.status(200).json(stop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
