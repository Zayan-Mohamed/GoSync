import Bus from "../models/bus.js";

// Create a new bus
export const createBus = async (req, res) => {
  try {
    const { busNumber, busType, capacity, status, routeId, Price, OperatorName, OperatorPhone,} = req.body;
    const bus = new Bus({ busNumber, busType, capacity, status, routeId, Price, Operator:{OperatorName, OperatorPhone} });
    await bus.save();
    res.status(201).json(bus);
  } catch (error) {
    res.status(400).json({ message: "Error creating bus", error });
  }
};

// Get all buses
export const getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find({}); // Populating route details (optional)
    res.status(200).json(buses);
  } catch (error) {
    res.status(400).json({ message: "Error fetching buses", error });
  }
};

// Get a single bus by ID
export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('routeId');
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    res.status(200).json(bus);
  } catch (error) {
    res.status(400).json({ message: "Error fetching bus", error });
  }
};

// Update bus details
export const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    res.status(200).json(bus);
  } catch (error) {
    res.status(400).json({ message: "Error updating bus", error });
  }
};

// Delete a bus
export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    res.status(200).json({ message: "Bus deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting bus", error });
  }
};
