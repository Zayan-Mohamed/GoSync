import User from "../models/user.js";
import Booking from "../models/bookingModel.js";
import Bus from "../models/bus.js";
import Route from "../models/routeModel.js";
import Schedule from "../models/scheduleModel.js";
import Seat from "../models/seatModel.js";
import Notification from "../models/notificationModel.js";
import BusOperator from "../models/busOperatorModel.js";

/**
 * Get consolidated dashboard statistics
 * @route GET /api/dashboard/stats
 * @access Private (Admin only)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel fetching of all required stats
    const [
      users,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      pendingPayments,
      totalRevenue,
      seats,
      buses,
      routes,
      schedules,
      operators,
      notifications,
      bookingsByDay,
      revenueByBus,
      topRoutes,
      recentBookings,
      latestSchedules,
      busUtilization,
    ] = await Promise.all([
      // User stats
      User.find().lean(),

      // Booking stats
      Booking.countDocuments(),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.countDocuments({ paymentStatus: "pending" }),

      // Revenue stats
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$fareTotal" } } },
      ]),

      // Seat stats
      Seat.find().lean(),

      // Fleet stats
      Bus.find().lean(),
      Route.find().lean(),
      Schedule.find().lean(),
      BusOperator.find().lean(),

      // Notification stats
      Notification.find().lean(),

      // Booking trends by day (last 30 days)
      Booking.aggregate([
        { $match: { createdAt: { $gte: lastMonth } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Revenue by bus
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: "$busId", totalRevenue: { $sum: "$fareTotal" } } },
        {
          $lookup: {
            from: "buses",
            localField: "_id",
            foreignField: "_id",
            as: "bus",
          },
        },
        { $unwind: "$bus" },
        { $project: { busNumber: "$bus.busNumber", totalRevenue: 1 } },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),

      // Popular routes
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        {
          $lookup: {
            from: "buses",
            localField: "busId",
            foreignField: "_id",
            as: "bus",
          },
        },
        { $unwind: "$bus" },
        {
          $lookup: {
            from: "routes",
            localField: "bus.routeId",
            foreignField: "routeId",
            as: "route",
          },
        },
        { $unwind: "$route" },
        { $group: { _id: "$route.routeName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Recent bookings
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .populate("busId", "busNumber busRouteNumber routeId")
        .populate("seats", "seatNumber")
        .lean(),

      // Latest schedules
      Schedule.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("busId", "busNumber busType")
        .populate("routeId", "routeName startLocation endLocation")
        .lean(),

      // Bus utilization (bookings per bus)
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: "$busId", bookingCount: { $sum: 1 } } },
        {
          $lookup: {
            from: "buses",
            localField: "_id",
            foreignField: "_id",
            as: "bus",
          },
        },
        { $unwind: "$bus" },
        {
          $project: {
            busNumber: "$bus.busNumber",
            busType: "$bus.busType",
            bookingCount: 1,
          },
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 8 },
      ]),
    ]);

    // Process bookings for route data
    const enrichedBookings = await Promise.all(
      recentBookings.map(async (booking) => {
        const route = await Route.findOne({
          routeId: booking.busId.routeId,
        }).lean();
        return {
          ...booking,
          from: route?.startLocation || "Unknown",
          to: route?.endLocation || "Unknown",
          seatNumbers: booking.seats.map((seat) => seat.seatNumber),
        };
      })
    );

    // Process seat stats
    const totalSeats = seats.length;
    const bookedSeats = seats.filter((seat) => seat.isBooked).length;
    const reservedSeats = seats.filter(
      (seat) => seat.reservedUntil && new Date(seat.reservedUntil) > new Date()
    ).length;
    const availableSeats = totalSeats - bookedSeats - reservedSeats;

    // User stats
    const newUsers = users.filter(
      (user) => new Date(user.createdAt) > lastWeek
    ).length;

    const activeUsers = users.filter(
      (user) => user.lastActivity && new Date(user.lastActivity) > lastMonth
    ).length;

    // Build response object
    const response = {
      summary: {
        users: {
          total: users.length,
          new: newUsers,
          active: activeUsers || 0,
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
          pendingPayment: pendingPayments,
          cancellationRate: totalBookings
            ? ((cancelledBookings / totalBookings) * 100).toFixed(2) + "%"
            : "0%",
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          byBus: revenueByBus || [],
        },
        seats: {
          total: totalSeats,
          booked: bookedSeats,
          reserved: reservedSeats,
          available: availableSeats,
          occupancyRate: totalSeats
            ? ((bookedSeats / totalSeats) * 100).toFixed(2) + "%"
            : "0%",
        },
        fleet: {
          buses: buses.length,
          routes: routes.length,
          schedules: schedules.length,
          operators: operators.length,
        },
        notifications: notifications.length,
      },
      charts: {
        bookingsByDay,
        revenueByBus,
        topRoutes,
        busUtilization,
      },
      recentData: {
        bookings: enrichedBookings,
        schedules: latestSchedules,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

/**
 * Get filtered dashboard statistics by time period
 * @route GET /api/dashboard
 * @access Private (Admin only)
 */
export const getFilteredDashboardStats = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    const today = new Date();
    let startDate;

    // Calculate start date based on period parameter
    switch (period) {
      case "day":
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "year":
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1); // Default to month
    }

    // Match condition for date filtering
    const dateMatch = { createdAt: { $gte: startDate } };

    // Parallel fetching of all required stats
    const [
      users,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      pendingPayments,
      totalRevenue,
      seats,
      buses,
      routes,
      schedules,
      operators,
      notifications,
      bookingsByDay,
      revenueByBus,
      topRoutes,
      recentBookings,
      latestSchedules,
    ] = await Promise.all([
      // User stats
      User.find({ createdAt: { $gte: startDate } }).lean(),

      // Booking stats within period
      Booking.countDocuments(dateMatch),
      Booking.countDocuments({ ...dateMatch, status: "confirmed" }),
      Booking.countDocuments({ ...dateMatch, status: "cancelled" }),
      Booking.countDocuments({ ...dateMatch, paymentStatus: "pending" }),

      // Revenue stats within period
      Booking.aggregate([
        { $match: { ...dateMatch, status: "confirmed" } },
        { $group: { _id: null, total: { $sum: "$fareTotal" } } },
      ]),

      // All seats (not filtered by date as they don't have timestamps)
      Seat.find().lean(),

      // Fleet stats (not filtered by date)
      Bus.find().lean(),
      Route.find().lean(),
      Schedule.find().lean(),
      BusOperator.find().lean(),

      // Notification stats within period
      Notification.find(dateMatch).lean(),

      // Booking trends by day for selected period
      Booking.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Revenue by bus within period
      Booking.aggregate([
        { $match: { ...dateMatch, status: "confirmed" } },
        { $group: { _id: "$busId", totalRevenue: { $sum: "$fareTotal" } } },
        {
          $lookup: {
            from: "buses",
            localField: "_id",
            foreignField: "_id",
            as: "bus",
          },
        },
        { $unwind: "$bus" },
        { $project: { busNumber: "$bus.busNumber", totalRevenue: 1 } },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),

      // Popular routes within period
      Booking.aggregate([
        { $match: { ...dateMatch, status: "confirmed" } },
        {
          $lookup: {
            from: "buses",
            localField: "busId",
            foreignField: "_id",
            as: "bus",
          },
        },
        { $unwind: "$bus" },
        {
          $lookup: {
            from: "routes",
            localField: "bus.routeId",
            foreignField: "routeId",
            as: "route",
          },
        },
        { $unwind: "$route" },
        { $group: { _id: "$route.routeName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Recent bookings
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .populate("busId", "busNumber busRouteNumber routeId")
        .populate("seats", "seatNumber")
        .lean(),

      // Latest schedules
      Schedule.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("busId", "busNumber busType")
        .populate("routeId", "routeName startLocation endLocation")
        .lean(),
    ]);

    // Process bookings for route data
    const enrichedBookings = await Promise.all(
      recentBookings.map(async (booking) => {
        const route = await Route.findOne({
          routeId: booking.busId.routeId,
        }).lean();
        return {
          ...booking,
          from: route?.startLocation || "Unknown",
          to: route?.endLocation || "Unknown",
          seatNumbers: booking.seats.map((seat) => seat.seatNumber),
        };
      })
    );

    // Process seat stats
    const totalSeats = seats.length;
    const bookedSeats = seats.filter((s) => s.isBooked).length;
    const reservedSeats = seats.filter(
      (s) => s.reservedUntil && new Date(s.reservedUntil) > new Date()
    ).length;
    const availableSeats = totalSeats - bookedSeats - reservedSeats;

    // Count new users in the selected period
    const newUsers = users.length;

    // Build response object
    const response = {
      totalUsers: await User.countDocuments(), // Total users count
      newUsers: newUsers,
      totalBookings: totalBookings,
      confirmedBookings: confirmedBookings,
      cancelledBookings: cancelledBookings,
      pendingPayments: pendingPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      routesCount: routes.length,
      fleetCount: buses.length,
      schedulesCount: schedules.length,
      operatorsCount: operators.length,
      bookingsByDay: bookingsByDay,
      topRoutes: topRoutes,
      revenueByBus: revenueByBus,
      recentBookings: enrichedBookings,
      recentSchedules: latestSchedules,
      seatStats: {
        total: totalSeats,
        booked: bookedSeats,
        reserved: reservedSeats,
        available: availableSeats,
        occupancyRate: totalSeats
          ? ((bookedSeats / totalSeats) * 100).toFixed(2) + "%"
          : "0%",
      },
      periodFilter: period,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching filtered dashboard stats:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

/**
 * Get system health statistics
 * @route GET /api/dashboard/health
 * @access Private (Admin only)
 */
export const getSystemHealth = async (req, res) => {
  try {
    // Example system health metrics
    const health = {
      status: "operational",
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date(),
    };

    res.status(200).json(health);
  } catch (error) {
    console.error("Error fetching system health:", error);
    res.status(500).json({
      message: "Failed to fetch system health",
      error: error.message,
    });
  }
};
