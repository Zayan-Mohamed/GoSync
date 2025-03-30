import Bus from "../models/bus.js";
import Route from "../models/routeModel.js";
import Schedule from "../models/scheduleModel.js";


export const searchBuses = async (req, res) => {
    try {
        const { fromLocation, toLocation, selectedDate } = req.body;

        // 1️⃣ Find routes with matching startLocation
        const routes = await Route.find({ startLocation: fromLocation }).populate("stops.stop");

        // 2️⃣ Filter routes that contain the TO location in their stops
        const validRoutes = routes.filter(route =>
            route.stops.some(stop => stop.stop.stopName === toLocation)
        );

        if (validRoutes.length === 0) {
            return res.status(404).json({ message: "No routes found for the selected locations" });
        }

        // 3️⃣ Get Buses associated with valid routes using routeId (custom field)
        const routeIds = validRoutes.map(r => r.routeId); // Extracting custom routeId
        const buses = await Bus.find({ routeId: { $in: routeIds } }); // Using routeId instead of _id

        if (buses.length === 0) {
            return res.status(404).json({ message: "No buses found for the selected route" });
        }

        // 4️⃣ Get Schedules for these buses on the selected date
        const schedules = await Schedule.find({
            busId: { $in: buses.map(b => b._id) },
            departureDate: selectedDate
        });

        if (schedules.length === 0) {
            return res.status(404).json({ message: "No schedules available for the selected date" });
        }

        // 5️⃣ Format data for frontend
        const searchResults = buses.map(bus => {
            const route = validRoutes.find(r => r.routeId === bus.routeId); // Match custom routeId
            const schedule = schedules.find(s => s.busId.equals(bus._id));

            return {
                routeName: route?.routeName,
                busRouteNumber: bus.busRouteNumber,
                travelName: bus.travelName,
                busNumber: bus.busNumber,
                busType: bus.busType,
                startLocation: route?.startLocation,
                endLocation: route?.endLocation,
                departureDate: schedule?.departureDate,
                arrivalDate: schedule?.arrivalDate,
                departureTime: schedule?.departureTime,
                arrivalTime: schedule?.arrivalTime,
                duration: schedule?.duration
            };
        });

        res.status(200).json(searchResults);

    } catch (error) {
        res.status(500).json({ error: "Error searching buses", details: error.message });
    }
};
