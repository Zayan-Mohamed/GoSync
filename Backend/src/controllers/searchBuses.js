import Bus from "../models/bus.js";
import Route from "../models/routeModel.js";
import Schedule from "../models/scheduleModel.js";
import Stop from "../models/stopModel.js"; // Make sure to import Stop model

export const searchBuses = async (req, res) => {
    try {
        const { fromLocation, toLocation, selectedDate } = req.body;

        // Format the date properly if it's not already
        const formattedDate = new Date(selectedDate);
        const dateQuery = {
            $gte: new Date(formattedDate.setHours(0, 0, 0, 0)),
            $lt: new Date(formattedDate.setHours(23, 59, 59, 999))
        };

        // 1️⃣ Find routes that have fromLocation as a boarding stop and toLocation as a dropping stop
        const routes = await Route.find({})
            .populate({
                path: 'stops.stop',
                model: 'Stop'
            });

        // 2️⃣ Filter routes that have fromLocation as boarding and toLocation as dropping
        const validRoutes = routes.filter(route => {
            const fromStop = route.stops.find(stop => 
                stop.stop.stopName === fromLocation && stop.stopType === 'boarding'
            );
            
            const toStop = route.stops.find(stop => 
                stop.stop.stopName === toLocation && stop.stopType === 'dropping'
            );
            
            // Check if both stops exist and fromStop comes before toStop in order
            return fromStop && toStop && fromStop.order < toStop.order;
        });

        if (validRoutes.length === 0) {
            return res.status(404).json({ 
                message: "No routes found for the selected locations with proper boarding and dropping points" 
            });
        }

        // 3️⃣ Get buses associated with valid routes using routeId
        const routeIds = validRoutes.map(r => r.routeId);
        const buses = await Bus.find({ 
            routeId: { $in: routeIds },
            status: 'Active' // Only return active buses
        });

        if (buses.length === 0) {
            return res.status(404).json({ 
                message: "No active buses found for the selected route" 
            });
        }

        // 4️⃣ Get schedules for these buses on the selected date
        const schedules = await Schedule.find({
            busId: { $in: buses.map(b => b._id) },
            departureDate: dateQuery
        });

        if (schedules.length === 0) {
            return res.status(404).json({ 
                message: "No schedules available for the selected date" 
            });
        }

        // 5️⃣ Format data for frontend
        const searchResults = [];
        
        for (const bus of buses) {
            const route = validRoutes.find(r => r.routeId === bus.routeId);
            const busSchedules = schedules.filter(s => s.busId.equals(bus._id));
            
            for (const schedule of busSchedules) {
                // Get the relevant stops
                const fromStop = route.stops.find(stop => 
                    stop.stop.stopName === fromLocation && stop.stopType === 'boarding'
                );
                
                const toStop = route.stops.find(stop => 
                    stop.stop.stopName === toLocation && stop.stopType === 'dropping'
                );
                
                searchResults.push({
                    busId: bus._id,
                    scheduleId: schedule._id,
                    routeId: route._id,
                    busRouteNumber: bus.busRouteNumber,
                    travelName: bus.travelName,
                    busNumber: bus.busNumber,
                    busType: bus.busType,
                    fareAmount: bus.fareAmount,
                    route: {
                        routeName: route.routeName,
                        // Use the actual from/to locations instead of route start/end
                        departureLocation: fromLocation,
                        arrivalLocation: toLocation
                    },
                    schedule: {
                        departureDate: schedule.departureDate,
                        arrivalDate: schedule.arrivalDate,
                        departureTime: schedule.departureTime,
                        arrivalTime: schedule.arrivalTime,
                        duration: schedule.duration
                    },
                    availableSeats: bus.capacity // You'll need to calculate actual available seats
                });
            }
        }

        if (searchResults.length === 0) {
            return res.status(404).json({ 
                message: "No matching buses found for your criteria" 
            });
        }

        res.status(200).json(searchResults);

    } catch (error) {
        console.error("Search buses error:", error);
        res.status(500).json({ error: "Error searching buses", details: error.message });
    }
};