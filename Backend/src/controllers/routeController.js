import Route from "../models/routeModel.js";
import Stop from "../models/stopModel.js";
import Booking from "../models/bookingModel.js";
import mongoose from "mongoose";
import { logAction } from "./auditLogController.js";

export const createRoute = async (req, res) => {
  try {
    const {
      routeName,
      startLocation,
      endLocation,
      totalDistance,
      startLocationCoordinates,
      endLocationCoordinates,
      stops,
    } = req.body;

    const normalizedRouteName = routeName.toLowerCase().trim();

    const existingRoute = await Route.findOne({
      routeName: { $regex: new RegExp(`^${normalizedRouteName}$`, "i") },
    });

    if (existingRoute) {
      return res.status(400).json({
        error: "A route with this name already exists",
        existingRouteId: existingRoute.routeId,
      });
    }

    // Format stops array to include stop reference and order
    const formattedStops = [];

    if (stops && stops.length > 0) {
      for (let i = 0; i < stops.length; i++) {
        const stopData = stops[i];
        
        const stopId =
          typeof stopData === "object" ? stopData.stopId : stopData;
        const order = typeof stopData === "object" ? stopData.order : i + 1;

        // Validate the stop exists
        const stop = await Stop.findOne({
          stopId: stopId,
        });

        if (!stop) {
          return res
            .status(404)
            .json({ error: `Stop with ID ${stopId} not found` });
        }

        formattedStops.push({
          stop: stop._id,
          order: order,
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
      status: "active",
    });

    await newRoute.save();

    // Prepare stops for logging
    const formattedStopsForLog = await Promise.all(
      formattedStops.map(async (s) => {
        const stop = await Stop.findById(s.stop);
        return {
          stopId: stop?.stopId || s.stop.toString(),
          order: s.order,
        };
      })
    );

    // Log the creation action
    await logAction({
      entityType: 'Route',
      entityId: newRoute.routeId,
      action: 'create',
      userId: req.user?.id,
      details: {
        routeName,
        startLocation,
        endLocation,
        totalDistance,
        startLocationCoordinates,
        endLocationCoordinates,
        stops: formattedStopsForLog,
      },
    });

    res.status(201).json({
      message: "Route created successfully",
      route: newRoute,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error creating route",
      details: error.message,
    });
  }
};

export const createMultipleRoutes = async (req, res) => {
  
  req.setTimeout(30000);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const { routes } = req.body;

     
      if (!Array.isArray(routes)) {
        throw { status: 400, message: "Input should be an array of routes" };
      }

      if (routes.length === 0) {
        throw { status: 400, message: "No routes provided" };
      }

      
      const nameMap = new Map();
      for (const route of routes) {
        const normalized = route.routeName?.trim().toLowerCase();
        if (nameMap.has(normalized)) {
          throw {
            status: 400,
            message: `Duplicate route name found: ${route.routeName}`,
          };
        }
        nameMap.set(normalized, true);
      }

  
      const existing = await Route.find({
        routeName: {
          $in: routes.map((r) => new RegExp(`^${r.routeName.trim()}$`, "i")),
        },
      })
        .session(session)
        .lean();

      if (existing.length > 0) {
        throw {
          status: 400,
          message: "Some routes already exist",
          existing: existing.map((r) => r.routeName),
        };
      }

      
      const routesToCreate = [];

      for (const [index, route] of routes.entries()) {
        const formattedStops = [];

        // Process stops if they exist
        if (route.stops?.length > 0) {
          for (const [stopIndex, stopData] of route.stops.entries()) {
            const stopId = stopData.stopId;

            const stop = await Stop.findOne({ stopId })
              .session(session)
              .maxTimeMS(5000) 
              .lean();

            if (!stop) {
              throw {
                status: 404,
                message: `Stop not found: ${stopId}`,
              };
            }

            formattedStops.push({
              stop: stop._id,
              order: stopData.order || stopIndex + 1,
              stopType: ["boarding", "dropping"].includes(stopData.stopType)
                ? stopData.stopType
                : undefined,
            });
          }
        }

        routesToCreate.push({
          routeId: generateRouteId(),
          routeName: route.routeName,
          startLocation: route.startLocation,
          endLocation: route.endLocation,
          totalDistance: route.totalDistance,
          startLocationCoordinates: route.startLocationCoordinates,
          endLocationCoordinates: route.endLocationCoordinates,
          stops: formattedStops,
          status: "active",
        });
      }

      

      const result = await Route.insertMany(routesToCreate, {
        session,
        maxTimeMS: 15000, 
      });

      console.log(`[Route] Successfully created ${result.length} routes`);
      return res.status(201).json({
        success: true,
        created: result.length,
        routeIds: result.map((r) => r.routeId),
      });
    });
  } catch (error) {
    console.error("[Route] Error:", error.message || error);
    await session.abortTransaction();

    const status = error.status || 500;
    const response = {
      error: error.message || "Failed to create routes",
      ...(error.existing && { existingRoutes: error.existing }),
    };

    return res.status(status).json(response);
  } finally {
    session.endSession();
  }
};

export const addStopToRoute = async (req, res) => {
  try {
    const { routeId, stopId, order, stopType } = req.body;

    // Validate required fields
    if (!routeId || !stopId) {
      return res.status(400).json({ error: "routeId and stopId are required" });
    }

    const route = await Route.findOne({
      $or: [{ _id: routeId }, { routeId: routeId }],
    });
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    const stop = await Stop.findOne({
      $or: [{ _id: stopId }, { stopId: stopId }],
    });
    if (!stop) {
      return res.status(404).json({ error: "Stop not found" });
    }

    const stopExists = route.stops.some((existingStop) => {
      const existingStopId =
        existingStop.stop?._id?.toString() || existingStop.stop?.toString();
      return existingStopId === stop._id.toString();
    });

    if (stopExists) {
      return res.status(400).json({
        error: "Stop already exists in this route",
        existingStop: route.stops.find(
          (s) =>
            (s.stop?._id?.toString() || s.stop?.toString()) ===
            stop._id.toString()
        ),
      });
    }

    // Validate order (default to next available if not provided)
    const newOrder = order || route.stops.length + 1;
    if (newOrder < 1) {
      return res.status(400).json({ error: "Order must be at least 1" });
    }

    // Check for order conflicts
    const orderConflict = route.stops.some((s) => s.order === newOrder);
    if (orderConflict) {
      return res.status(400).json({
        error: `Order ${newOrder} is already taken`,
        conflictingStop: route.stops.find((s) => s.order === newOrder),
      });
    }

    // Add the stop to the route
    route.stops.push({
      stop: stop._id,
      order: newOrder,
      stopType: stopType || "boarding", // Default to boarding if not specified
    });

    // Re-sort stops by order
    route.stops.sort((a, b) => a.order - b.order);

    await route.save();

    // Log the action
    await logAction({
      entityType: 'Route',
      entityId: route.routeId || route._id.toString(),
      action: 'add_stop',
      userId: req.user?.id,
      details: {
        stopId: stop.stopId || stop._id.toString(),
        stopName: stop.stopName,
        order: newOrder,
        stopType: stopType || "boarding",
      },
    });

    // Populate the stop details in the response
    const populatedRoute = await Route.populate(route, { path: "stops.stop" });

    res.status(200).json({
      message: "Stop added to route successfully",
      addedStop: populatedRoute.stops.find(
        (s) =>
          (s.stop?._id?.toString() || s.stop?.toString()) ===
          stop._id.toString()
      ),
      route: populatedRoute,
    });
  } catch (error) {
    console.error("Error adding stop to route:", error);
    res.status(500).json({
      error: "Error adding stop to route",
      details: error.message,
    });
  }
};

// Update getAllRoutes function
export const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().populate("stops.stop").sort({ createdAt: -1 });;

    // Format the routes to match the expected frontend structure
    const formattedRoutes = routes.map((route) => {
      const routeObj = route.toObject();

      // Sort stops by order without mutating the original array
      const sortedStops = [...routeObj.stops].sort((a, b) => a.order - b.order);

      return {
        _id: routeObj._id,
        routeId: routeObj.routeId,
        routeName: routeObj.routeName,
        startLocation: routeObj.startLocation,
        endLocation: routeObj.endLocation,
        totalDistance: routeObj.totalDistance,
        status: routeObj.status ?? "active", // Ensure default 'active' status
        startLocationCoordinates: routeObj.startLocationCoordinates ?? {
          lat: 0,
          lng: 0,
        },
        endLocationCoordinates: routeObj.endLocationCoordinates ?? {
          lat: 0,
          lng: 0,
        },
        stops: sortedStops, // Return sorted stops
      };
    }).reverse();

    res.status(200).json({ routes: formattedRoutes });
  } catch (error) {
    console.error("Error fetching routes:", error);
    res
      .status(500)
      .json({ error: "Error fetching routes", details: error.message });
  }
};

// Get route details by routeId, including stops
export const getRouteById = async (req, res) => {
  try {
    const { id } = req.params; // Changed from routeId to id

    // Validate if the id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid route ID format" });
    }

    const route = await Route.findById(id).populate("stops.stop");
    if (!route) return res.status(404).json({ error: "Route not found" });

    // Sort stops by order for consistent output
    const sortedRoute = route.toObject();
    sortedRoute.stops = sortedRoute.stops.sort((a, b) => a.order - b.order);

    res.status(200).json({ route: sortedRoute });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching route", details: error.message });
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
      stops,
    } = req.body;

    // Check if routeId is valid
    if (!mongoose.Types.ObjectId.isValid(routeId)) {
      return res.status(400).json({ error: "Invalid route ID" });
    }

    // Find the route first to preserve stops if not provided
    const existingRoute = await Route.findById(routeId);
    if (!existingRoute) {
      return res.status(404).json({ error: "Route not found" });
    }

    // Create an update object with only the fields that are provided
    const updateData = {};

    if (routeName !== undefined) updateData.routeName = routeName;
    if (startLocation !== undefined) updateData.startLocation = startLocation;
    if (endLocation !== undefined) updateData.endLocation = endLocation;
    if (totalDistance !== undefined) updateData.totalDistance = totalDistance;
    if (startLocationCoordinates !== undefined)
      updateData.startLocationCoordinates = startLocationCoordinates;
    if (endLocationCoordinates !== undefined)
      updateData.endLocationCoordinates = endLocationCoordinates;
    if (status !== undefined) updateData.status = status;

    // Process stops only if they're provided in the request
    if (stops && stops.length > 0) {
      let formattedStops = [];

      for (const stopData of stops) {
        // Check if the stop is provided as an ID or an object with stopId and order
        const stopId = typeof stopData === "object" ? stopData.stop : stopData;
        const order =
          typeof stopData === "object"
            ? stopData.order
            : formattedStops.length + 1;
        const stopType =
          typeof stopData === "object" ? stopData.stopType : undefined;

        if (!mongoose.Types.ObjectId.isValid(stopId)) {
          return res.status(400).json({ error: `Invalid stop ID: ${stopId}` });
        }

        const stopObj = {
          stop: new mongoose.Types.ObjectId(stopId),
          order,
        };

        // Only add stopType if it's provided
        if (stopType) {
          if (["boarding", "dropping"].includes(stopType.toLowerCase())) {
            stopObj.stopType = stopType.toLowerCase();
          } else {
            return res
              .status(400)
              .json({ error: `Invalid stop type for stop ${stopId}` });
          }
        }

        formattedStops.push(stopObj);
      }

      updateData.stops = formattedStops;
    }

    // If no fields to update, return early
    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    // Update the route with only the provided fields
    const updatedRoute = await Route.findByIdAndUpdate(
      routeId,
      updateData,
      { new: true, runValidators: true } // Return updated document
    );

    // Log the update action
    await logAction({
      entityType: 'Route',
      entityId: updatedRoute.routeId || updatedRoute._id.toString(),
      action: 'update',
      userId: req.user?.id,
      details: {
        routeName: updatedRoute.routeName,
        ...updateData,
        ...(updateData.stops && {
          stops: await Promise.all(
            updateData.stops.map(async (s) => ({
              stopId: (await Stop.findById(s.stop))?.stopId || s.stop.toString(),
              order: s.order,
              stopType: s.stopType,
            }))
          ),
        }),
      },
    });

    res.status(200).json({
      message: "Route updated successfully",
      route: updatedRoute,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error updating route", details: error.message });
  }
};

// Get stops for a specific route
export const getStopsForRoute = async (req, res) => {
  try {
    const { routeId } = req.params;

    // Validate routeId format
    if (!routeId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid route ID format" });
    }

    const route = await Route.findById(routeId).populate("stops.stop").lean();

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Transform the data to match frontend expectations
    const formattedStops = route.stops.map((stop) => ({
      ...stop,
      stopId: stop.stop._id, // Add stopId for frontend compatibility
      stopName: stop.stop.stopName, // Flatten the stop name
    }));

    res.status(200).json({
      stops: formattedStops,
    });
  } catch (error) {
    console.error("Error in getStopsForRoute:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
export const toggleRouteStatus = async (req, res) => {
  try {
    const { routeId } = req.params;
    const route = await Route.findOne({ routeId });

    if (!route) return res.status(404).json({ error: "Route not found" });

    // Toggle the status
    const newStatus = route.status === "active" ? "inactive" : "active";
    route.status = newStatus;
    await route.save();

    // Log the action
    await logAction({
      entityType: 'Route',
      entityId: route.routeId,
      action: 'toggle_status',
      userId: req.user?.id,
      details: {
        routeName: route.routeName,
        newStatus,
      },
    });

    res.status(200).json({ message: "Route status toggled", route });
  } catch (error) {
    console.error("Error toggling route status:", error);
    res
      .status(500)
      .json({ error: "Error toggling route status", details: error.message });
  }
};

export const deleteStopFromRoute = async (req, res) => {
  try {
    const { routeId, stopId } = req.params;

    // Validate input
    if (!routeId || !stopId) {
      return res
        .status(400)
        .json({ error: "Route ID and Stop ID are required" });
    }

    // Find the route - try both _id and routeId
    const route = await Route.findOne({
      $or: [
        {
          _id: mongoose.Types.ObjectId.isValid(routeId)
            ? new mongoose.Types.ObjectId(routeId)
            : null,
        },
        { routeId: routeId },
      ],
    });

    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    // Convert stopId to ObjectId if valid
    const stopObjectId = mongoose.Types.ObjectId.isValid(stopId)
      ? new mongoose.Types.ObjectId(stopId)
      : stopId;

    // Handle both MongoDB _id and string stopId
    const stopToDelete = route.stops.find((s) => {
      const stopIdentifier = s.stop._id
        ? s.stop._id.toString()
        : s.stop.toString();
      return (
        stopIdentifier === stopId ||
        (mongoose.Types.ObjectId.isValid(stopId) &&
          stopIdentifier === stopObjectId.toString())
      );
    });

    if (!stopToDelete) {
      return res.status(404).json({
        error: "Stop not found in route",
        details: {
          routeId: route._id,
          stopIds: route.stops.map(
            (s) => s.stop._id?.toString() || s.stop.toString()
          ),
        },
      });
    }

    // Get the order and stop details for logging
    const deletedStopOrder = stopToDelete.order;
    const stop = await Stop.findOne({
      $or: [{ _id: stopId }, { stopId: stopId }],
    });

    // Remove stop from the route's stops array
    route.stops = route.stops.filter((s) => {
      const currentStopId = s.stop._id
        ? s.stop._id.toString()
        : s.stop.toString();
      return (
        currentStopId !== stopId && currentStopId !== stopObjectId.toString()
      );
    });

    // Reorder the remaining stops
    route.stops.forEach((stop) => {
      if (stop.order > deletedStopOrder) {
        stop.order -= 1;
      }
    });

    // Sort stops by order to ensure correct sequence
    route.stops.sort((a, b) => a.order - b.order);

    // Save the updated route
    const updatedRoute = await route.save();

    // Log the action
    await logAction({
      entityType: 'Route',
      entityId: route.routeId || route._id.toString(),
      action: 'remove_stop',
      userId: req.user?.id,
      details: {
        stopId: stop?.stopId || stopId,
        stopName: stop?.stopName || 'Unknown',
        order: deletedStopOrder,
      },
    });

    // Send a success response
    return res.status(200).json({
      message: "Stop successfully removed from route",
      updatedStops: updatedRoute.stops,
    });
  } catch (error) {
    console.error("Error in deleteStopFromRoute:", error);
    return res.status(500).json({
      error: "Error deleting stop",
      details: error.message,
    });
  }
};

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

    // Log the action before deletion
    await logAction({
      entityType: 'Route',
      entityId: route.routeId || route._id.toString(),
      action: 'delete',
      userId: req.user?.id,
      details: {
        routeName: route.routeName,
      },
    });

    // Delete the route
    await Route.findByIdAndDelete(routeId);

    res.status(200).json({ message: "Route deleted successfully" });
  } catch (error) {
    console.error("Error deleting route:", error);
    res
      .status(500)
      .json({ error: "Error deleting route", details: error.message });
  }
};

export const updateStopType = async (req, res) => {
  try {
    const { routeId, stopId, stopType } = req.body; // stopType can be 'Boarding' or 'Dropping'

    // Validate stopType
    if (!["boarding", "dropping"].includes(stopType)) {
      return res
        .status(400)
        .json({
          error:
            'Invalid stop type. It must be either "Boarding" or "Dropping".',
        });
    }

    // Find the route
    const route = await Route.findOne({ routeId });
    if (!route) return res.status(404).json({ error: "Route not found" });

    // Find the stop index in the stops array
    const stopIndex = route.stops.findIndex(
      (stop) => stop.stop.toString() === stopId
    );
    if (stopIndex === -1) {
      return res
        .status(404)
        .json({ error: "Stop not found in the specified route" });
    }

    // Update only the stopType for the specific stop
    route.stops[stopIndex].stopType = stopType;

    // Save the updated route
    await route.save();

    res.status(200).json({ message: "Stop type updated successfully", route });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating stop type", details: error.message });
  }
};

//

export const addMultipleStops = async (req, res) => {
  try {
    const { routeId, stops } = req.body; // stops is an array of { stopId, order, stopType }
    const validStopTypes = ["boarding", "dropping"];

    // Find the route
    const route = await Route.findOne({ routeId });
    if (!route) return res.status(404).json({ error: "Route not found" });

    // Fetch all stops from the database
    const stopIds = stops.map((s) => s.stopId);
    const foundStops = await Stop.find({ stopId: { $in: stopIds } });

    if (foundStops.length !== stopIds.length) {
      return res
        .status(400)
        .json({ error: "Some stops do not exist in the database" });
    }

    // Convert stopId to ObjectId for comparison
    const existingStopIds = route.stops.map((s) => s.stop.toString());

    // Process each requested stop
    const newStops = [];
    const updatedExistingStops = [];

    for (const stopData of stops) {
      // Validate stop type
      const stopType = stopData.stopType?.toLowerCase();
      if (!validStopTypes.includes(stopType)) {
        return res
          .status(400)
          .json({ error: `Invalid stop type for stop ${stopData.stopId}` });
      }

      const stopDoc = foundStops.find((s) => s.stopId === stopData.stopId);
      if (!stopDoc) continue;

      // Check if this stop already exists in the route
      const existingStopIndex = route.stops.findIndex(
        (s) => s.stop.toString() === stopDoc._id.toString()
      );

      if (existingStopIndex === -1) {
        // This is a new stop - add it with type and order
        newStops.push({
          stop: stopDoc._id,
          order: stopData.order || route.stops.length + newStops.length + 1,
          stopType: stopType,
        });
      } else {
        // This stop already exists - update its type and order if provided
        if (stopData.order) {
          route.stops[existingStopIndex].order = stopData.order;
        }
        route.stops[existingStopIndex].stopType = stopType;
        updatedExistingStops.push(route.stops[existingStopIndex]);
      }
    }

    // If neither new stops added nor existing stops updated
    if (newStops.length === 0 && updatedExistingStops.length === 0) {
      return res
        .status(400)
        .json({
          error:
            "No stops were added or updated (either already exist or invalid data)",
        });
    }

    // Add new stops and sort all stops by order
    route.stops = [...route.stops, ...newStops].sort(
      (a, b) => a.order - b.order
    );

    await route.save();

    res.status(200).json({
      message: `${newStops.length} stops added and ${updatedExistingStops.length} stops updated successfully`,
      route,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error managing stops on route",
      details: error.message,
    });
  }
};

export const updateStopInRoute = async (req, res) => {
  try {
    const { routeId, stopId } = req.params;
    const { order, stopType } = req.body;

    // 1. Input validation
    if (order === undefined && stopType === undefined) {
      return res
        .status(400)
        .json({ message: "Nothing to update (provide order or stopType)" });
    }

    // 2. Find the route
    const route = await Route.findOne({
      $or: [{ _id: routeId }, { routeId: routeId }],
    }).populate("stops.stop"); // Ensure stops are populated

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // 3. Find the exact stop to update
    const stopToUpdate = route.stops.find(
      (s) => s.stop?._id?.toString() === stopId || s.stop?.toString() === stopId
    );

    if (!stopToUpdate) {
      return res.status(404).json({
        message: "Stop not found in this route",
        availableStops: route.stops.map((s) => ({
          stopId: s.stop?._id?.toString() || s.stop?.toString(),
          order: s.order,
          name: s.stop?.stopName || "Unknown",
        })),
      });
    }

    // 4. STRICT Order Validation
    if (order !== undefined) {
      // Check if another stop has this order (excluding current stop)
      const orderConflict = route.stops.some((s) => {
        const isSameStop =
          s.stop?._id?.toString() === stopId || s.stop?.toString() === stopId;
        return s.order === order && !isSameStop;
      });

      if (orderConflict) {
        const conflictingStop = route.stops.find((s) => s.order === order);
        return res.status(400).json({
          message: `Order ${order} is already assigned to ${
            conflictingStop.stop?.stopName || "another stop"
          }`,
          conflict: {
            existingStop: {
              name: conflictingStop.stop?.stopName,
              order: conflictingStop.order,
              stopType: conflictingStop.stopType,
            },
            attemptedUpdate: {
              stopId: stopId,
              newOrder: order,
            },
          },
          allStops: route.stops.map((s) => ({
            stopId: s.stop?._id?.toString() || s.stop?.toString(),
            order: s.order,
            name: s.stop?.stopName,
          })),
        });
      }

      // Update only after validation passes
      stopToUpdate.order = order;
    }

    // 5. Update stopType if provided
    if (stopType !== undefined) {
      stopToUpdate.stopType = stopType;
    }

    // 6. Verify uniqueness before saving
    const orders = route.stops.map((s) => s.order);
    const hasDuplicates = new Set(orders).size !== orders.length;

    if (hasDuplicates) {
      return res.status(500).json({
        message: "Critical error: Duplicate orders detected after validation",
        orders: orders,
        stops: route.stops.map((s) => ({
          stopId: s.stop?._id?.toString() || s.stop?.toString(),
          order: s.order,
        })),
      });
    }

    // 7. Save changes
    await route.save();

    return res.status(200).json({
      message: "Stop updated successfully",
      updatedStop: {
        stopId: stopId,
        order: stopToUpdate.order,
        stopType: stopToUpdate.stopType,
      },
      allOrders: route.stops.map((s) => s.order), // Return all orders for verification
    });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      message: "Failed to update stop",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const getRouteAnalytics = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    // Base queries with error handling for invalid dates
    const routeQuery = {};
    if (status && ['active', 'inactive'].includes(status)) {
      routeQuery.status = status;
    }

    const bookingQuery = { status: 'confirmed' };
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        bookingQuery.createdAt = {
          $gte: start,
          $lte: end,
        };
      }
    }

    // Get counts with error handling
    const [
      totalRoutesResult,
      activeRoutesResult,
      inactiveRoutesResult
    ] = await Promise.all([
      Route.countDocuments(routeQuery),
      Route.countDocuments({ ...routeQuery, status: 'active' }),
      Route.countDocuments({ ...routeQuery, status: 'inactive' })
    ]);

    // Get routes with safe error handling
    const routes = await Route.find(routeQuery)
      .select('_id routeId routeName startLocation endLocation status stops totalDistance startLocationCoordinates endLocationCoordinates')
      .populate('stops.stop', 'stopName stopAddress coordinates')
      .lean();

    // Calculate route statistics
    const formattedRoutes = routes.map(route => ({
      _id: route._id,
      routeId: route.routeId || route._id.toString(),
      routeName: route.routeName || 'Unnamed Route',
      startLocation: route.startLocation || 'Unknown',
      endLocation: route.endLocation || 'Unknown',
      status: route.status || 'active',
      startLocationCoordinates: route.startLocationCoordinates || { latitude: 0, longitude: 0 },
      endLocationCoordinates: route.endLocationCoordinates || { latitude: 0, longitude: 0 },
      totalDistance: route.totalDistance || 0,
      stops: (route.stops || []).map(stop => ({
        stopId: stop.stop?._id || stop.stop,
        stopName: stop.stop?.stopName || 'Unknown Stop',
        order: stop.order || 0,
        stopType: stop.stopType || 'boarding',
      })),
    }));

    // Get bookings data safely
    const bookings = await Booking.find(bookingQuery)
      .populate('busId', 'routeId')
      .lean();

    // Process bookings by route
    const bookingsByRouteMap = new Map();
    bookings.forEach(booking => {
      if (booking.busId?.routeId) {
        const routeId = booking.busId.routeId;
        bookingsByRouteMap.set(routeId, (bookingsByRouteMap.get(routeId) || 0) + 1);
      }
    });

    // Format bookings by route 
    const bookingsByRoute = Array.from(bookingsByRouteMap.entries())
      .map(([routeId, count]) => {
        const route = routes.find(r => r.routeId === routeId);
        return {
          routeName: route?.routeName || 'Unknown Route',
          bookingCount: count
        };
      })
      .sort((a, b) => b.bookingCount - a.bookingCount);

    // Get bookings over time
    const bookingDates = bookings.reduce((acc, booking) => {
      const date = booking.createdAt.toISOString().split('T')[0];
      acc.set(date, (acc.get(date) || 0) + 1);
      return acc;
    }, new Map());

    const bookingsOverTime = Array.from(bookingDates.entries())
      .map(([date, count]) => ({
        _id: date,
        count
      }))
      .sort((a, b) => new Date(a._id) - new Date(b._id));

    // Calculate most popular route
    const mostPopularRoute = bookingsByRoute[0] || { routeName: 'No data', bookingCount: 0 };

    // Calculate average stops per route safely
    const totalStops = routes.reduce((sum, route) => sum + (route.stops?.length || 0), 0);
    const avgStopsPerRoute = routes.length > 0 ? totalStops / routes.length : 0;

    // Get top routes with complete info
    const topRoutes = routes
      .map(route => {
        const bookingCount = bookingsByRouteMap.get(route.routeId) || 0;
        return {
          routeName: route.routeName,
          status: route.status || 'active',
          stopCount: route.stops?.length || 0,
          bookingCount
        };
      })
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);

    // Send response
    res.status(200).json({
      totalRoutes: totalRoutesResult,
      activeRoutes: activeRoutesResult,
      inactiveRoutes: inactiveRoutesResult,
      mostPopularRoute,
      avgStopsPerRoute,
      bookingsByRoute,
      bookingsOverTime,
      topRoutes,
      routes: formattedRoutes,
    });

  } catch (error) {
    console.error('Route analytics error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


export const reorderRouteStops = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { stops } = req.body;

    if (!Array.isArray(stops)) {
      return res.status(400).json({ error: 'Invalid stops data format' });
    }

    // Find the route with more flexible id matching
    const route = await Route.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(routeId) ? new mongoose.Types.ObjectId(routeId) : null },
        { routeId: routeId }
      ]
    }).populate('stops.stop');

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Create a map for quick lookup using both possible ID formats
    const orderMap = new Map();
    stops.forEach(({ stopId, order }) => {
      orderMap.set(stopId.toString(), order);
      if (mongoose.Types.ObjectId.isValid(stopId)) {
        orderMap.set(new mongoose.Types.ObjectId(stopId).toString(), order);
      }
    });

    // Reorder stops with better type handling
    route.stops = route.stops.map((s) => {
      const stopId = s.stop?._id ? s.stop._id.toString() : s.stop.toString();
      if (orderMap.has(stopId)) {
        const stop = s.toObject();
        return {
          ...stop,
          order: parseInt(orderMap.get(stopId))
        };
      }
      return s;
    });

    // Sort the stops array by the new order
    route.stops.sort((a, b) => a.order - b.order);

    // Validate that all orders are present and unique
    const orders = route.stops.map(s => s.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      return res.status(400).json({ error: 'Invalid order sequence - duplicate orders detected' });
    }

    await route.save();

    // Send back the updated route data
    const updatedRoute = await Route.findById(route._id).populate('stops.stop');
    
    res.status(200).json({ 
      message: 'Stop order updated successfully',
      route: updatedRoute
    });
  } catch (error) {
    console.error('Error updating stop order:', error);
    res.status(500).json({ 
      error: 'Error updating stop order',
      details: error.message
    });
  }
};