import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import Route from '../models/routeModel.js';
import AuditLog from '../models/auditLogModel.js';
import Booking from '../models/bookingModel.js';
import { PassThrough } from 'stream';

export const generateReport = async (req, res) => {
  try {
    const { reportType, routeId, startDate, endDate, format } = req.body;

    if (!['route_modification', 'route_performance'].includes(reportType)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }
    if (!['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format' });
    }

    const query = {};
    if (routeId) query.entityId = routeId;
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    let data = [];
    let fields = [];
    let filename = '';

    if (reportType === 'route_modification') {
      const logs = await AuditLog.find({ ...query, entityType: 'Route' })
        .populate('userId', 'name email')
        .lean();

      data = logs.map(log => ({
        timestamp: log.timestamp.toLocaleString(),
        action: log.action,
        routeId: log.entityId,
        user: log.userId ? `${log.userId.name} (${log.userId.email})` : 'System',
        details: JSON.stringify(log.details || {}),
      }));

      fields = ['timestamp', 'action', 'routeId', 'user', 'details'];
      filename = `route_modification_report_${new Date().toISOString().split('T')[0]}.${format}`;
    } else if (reportType === 'route_performance') {
      const bookingQuery = { status: 'confirmed' };
      if (startDate && endDate) {
        bookingQuery.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      if (routeId) {
        const route = await Route.findById(routeId);
        if (!route) return res.status(404).json({ error: 'Route not found' });
        bookingQuery['schedule.routeId'] = route._id;
      }

      const bookings = await Booking.aggregate([
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
        {
          $group: {
            _id: '$schedule.routeId',
            routeName: { $first: '$route.routeName' },
            bookingCount: { $sum: 1 },
            totalRevenue: { $sum: '$fareTotal' },
            stopCount: { $first: { $size: '$route.stops' } },
          },
        },
      ]);

      data = bookings.map(b => ({
        routeName: b.routeName,
        bookingCount: b.bookingCount,
        totalRevenue: b.totalRevenue.toFixed(2),
        stopCount: b.stopCount,
      }));

      fields = ['routeName', 'bookingCount', 'totalRevenue', 'stopCount'];
      filename = `route_performance_report_${new Date().toISOString().split('T')[0]}.${format}`;
    }

    if (format === 'csv') {
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment(filename);
      return res.send(csv);
    } else {
      const doc = new PDFDocument();
      const stream = new PassThrough();
      doc.pipe(stream);

      doc.fontSize(16).text(`${reportType.replace('_', ' ').toUpperCase()} REPORT`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
      if (startDate && endDate) {
        doc.text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`);
      }
      if (routeId) {
        const route = await Route.findById(routeId);
        doc.text(`Route: ${route?.routeName || 'Unknown'}`);
      }
      doc.moveDown();

      data.forEach((item, index) => {
        doc.fontSize(10).text(`Record ${index + 1}:`);
        Object.entries(item).forEach(([key, value]) => {
          doc.text(`${key.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${value}`);
        });
        doc.moveDown();
      });

      doc.end();
      res.header('Content-Type', 'application/pdf');
      res.attachment(filename);
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
};