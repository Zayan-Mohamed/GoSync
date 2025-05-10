// controllers/busController.js

import Bus from "../models/bus.js";
import Route from "../models/routeModel.js";

export const getRouteByBus = async (req, res) => {
  try {
    const { busNumber } = req.params;

    // Step 1: Find the bus by busNumber
    const bus = await Bus.findOne({ busNumber });

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    // Step 2: Use routeId from bus to find route
    const route = await Route.findOne({ routeId: bus.routeId })
      .populate("stops.stop", "stopName location") // If you want stop details populated
      .exec();

    if (!route) {
      return res.status(404).json({ message: "Route not found for this bus" });
    }

    // Step 3: Return route
    res.status(200).json({ route });
  } catch (error) {
    console.error("Error fetching route for bus:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
