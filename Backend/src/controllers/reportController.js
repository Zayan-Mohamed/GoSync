import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import Route from '../models/routeModel.js';
import AuditLog from '../models/auditLogModel.js';
import Booking from '../models/bookingModel.js';
import { PassThrough } from 'stream';
import mongoose from 'mongoose';

const formatDateToLocal = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR'
  }).format(amount);
};

const formatActionDescription = (action) => {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

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
      // Find the route first to get its routeId
      let routeIdToSearch = routeId;
      
      // If we have a routeId from the request, try to find the corresponding route
      if (routeId) {
        const route = await Route.findOne({
          $or: [
            { _id: mongoose.isValidObjectId(routeId) ? new mongoose.Types.ObjectId(routeId) : null },
            { routeId: routeId }
          ]
        });
        
        if (route) {
          console.log('Found route for route_modification:', route.routeName);
          // Use the routeId field from the route document
          routeIdToSearch = route.routeId;
        }
      }
      
      const query = {
        entityType: 'Route',
        ...(routeIdToSearch ? { entityId: routeIdToSearch } : {}),
      };
      
      // Add date filters if provided
      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      
      // Log the query for debugging
      console.log('Audit log query:', JSON.stringify(query));
      
      const logs = await AuditLog.find(query)
        .populate('userId', 'name email')
        .lean();
        
      console.log('Found logs count:', logs.length);

      data = logs.map(log => ({
        'Date & Time': formatDateToLocal(log.timestamp),
        'Action': formatActionDescription(log.action),
        'Route ID': log.entityId ? log.entityId.toString() : 'N/A',
        'Modified By': log.userId ? `${log.userId.name} (${log.userId.email})` : 'System',
        'Changes Made': log.details ? Object.entries(log.details)
          .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}`)
          .join('; ') : 'No specific changes recorded'
      }));

      fields = ['Date & Time', 'Action', 'Route ID', 'Modified By', 'Changes Made'];
      filename = `route_modification_report_${new Date().toISOString().split('T')[0]}.${format}`;
    } else if (reportType === 'route_performance') {
      const bookingQuery = { status: 'confirmed' };
      if (startDate && endDate) {
        bookingQuery.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // For debugging
      console.log('Route ID received for performance report:', routeId);
      
      // First, fetch the route to get its MongoDB ObjectId
      let routeObjectId = null;
      if (routeId) {
        try {
          const route = await Route.findOne({ 
            $or: [
              { _id: mongoose.isValidObjectId(routeId) ? new mongoose.Types.ObjectId(routeId) : null },
              { routeId: routeId } // Use routeId field as shown in your controller
            ]
          });
          
          if (route) {
            routeObjectId = route._id;
            console.log('Found route for performance report:', route.routeName, 'with _id:', routeObjectId);
          } else {
            console.log('No route found with routeId or _id:', routeId);
          }
        } catch (err) {
          console.error('Error finding route:', err);
        }
      }
      
      // Prepare route matching condition
      const routeMatch = {};
      if (routeObjectId) {
        routeMatch['route._id'] = routeObjectId;
      }

      const bookings = await Booking.aggregate([
        { $match: bookingQuery },
        {
          $lookup: {
            from: 'schedules',
            localField: 'scheduleId',
            foreignField: '_id',
            as: 'schedule'
          }
        },
        { $unwind: { path: '$schedule', preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: 'routes',
            localField: 'schedule.routeId',
            foreignField: '_id',
            as: 'route'
          }
        },
        { $unwind: { path: '$route', preserveNullAndEmptyArrays: false } },
        {
          $match: routeMatch
        },
        {
          $group: {
            _id: '$route._id',
            routeName: { $first: '$route.routeName' },
            bookingCount: { $sum: 1 },
            totalRevenue: { $sum: '$fareTotal' },
            stopCount: { $first: { $size: '$route.stops' } },
            startLocation: { $first: '$route.startLocation' },
            endLocation: { $first: '$route.endLocation' },
            status: { $first: '$route.status' }
          }
        }
      ]);

      // For debugging
      console.log('Aggregation results:', JSON.stringify(bookings));

      data = bookings.map(b => ({
        'Route Name': b.routeName,
        'From': b.startLocation,
        'To': b.endLocation,
        'Status': b.status.charAt(0).toUpperCase() + b.status.slice(1),
        'Total Bookings': b.bookingCount,
        'Revenue': formatCurrency(b.totalRevenue),
        'Number of Stops': b.stopCount
      }));

      fields = ['Route Name', 'From', 'To', 'Status', 'Total Bookings', 'Revenue', 'Number of Stops'];
      filename = `route_performance_report_${new Date().toISOString().split('T')[0]}.${format}`;
    }

    // Check if we have data to display
    if (data.length === 0) {
      // For debugging
      console.log('No data found for the specified filters');
      console.log('Report type:', reportType);
      console.log('Route ID:', routeId);
      console.log('Date range:', startDate, 'to', endDate);
      
      // For route_modification, let's try a more relaxed query to see if there's any data at all
      if (reportType === 'route_modification' && routeId) {
        // First check the route structure
        const route = await Route.findOne({
          $or: [
            { _id: mongoose.isValidObjectId(routeId) ? new mongoose.Types.ObjectId(routeId) : null },
            { routeId: routeId }
          ]
        });
        
        if (route) {
          console.log('Route found:', route.routeName);
          console.log('Route _id:', route._id);
          console.log('Route routeId:', route.routeId);
        }
        
        // Now check audit logs
        const allLogs = await AuditLog.find({ entityType: 'Route' }).limit(10).lean();
        console.log('Sample route logs:', allLogs);
        
        if (allLogs.length > 0) {
          console.log('Sample entityId format in logs:', allLogs[0].entityId);
        }
        
        // Count all logs for this specific route
        if (route && route.routeId) {
          const exactMatchLogs = await AuditLog.find({ 
            entityType: 'Route', 
            entityId: route.routeId 
          }).lean();
          
          console.log(`Found ${exactMatchLogs.length} logs with exact route.routeId match`);
        }
      }
      
      if (format === 'csv') {
        // Return an empty CSV with headers
        const parser = new Parser({ fields });
        const csv = parser.parse([{ 
          [fields[0]]: 'No data available for the specified criteria',
          ...Object.fromEntries(fields.slice(1).map(f => [f, '']))
        }]);
        res.header('Content-Type', 'text/csv');
        res.attachment(filename);
        return res.send(csv);
      } else {
        // Create a PDF with a message about no data
        const doc = new PDFDocument();
        const stream = new PassThrough();
        doc.pipe(stream);

        // Header section
        doc.fontSize(20).text('Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`${reportType.replace(/_/g, ' ').toUpperCase()}`, { align: 'center' });
        doc.moveDown();

        // Report metadata
        doc.fontSize(12);
        doc.text(`Generated on: ${formatDateToLocal(new Date())}`);
        
        if (startDate && endDate) {
          doc.text(`Period: ${formatDateToLocal(startDate)} to ${formatDateToLocal(endDate)}`);
        }
        
        if (routeId) {
          const route = await Route.findOne({
            $or: [
              { _id: mongoose.isValidObjectId(routeId) ? new mongoose.Types.ObjectId(routeId) : null },
              { routeId: routeId }
            ]
          });
          
          if (route) {
            doc.text(`Route: ${route.routeName}`);
            doc.text(`From: ${route.startLocation} To: ${route.endLocation}`);
          }
        }
        
        doc.moveDown();
        // No data message
        doc.fontSize(14).text('No Data Available', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text('No records were found matching the specified criteria.', { align: 'center' });

        doc.end();
        res.header('Content-Type', 'application/pdf');
        res.attachment(filename);
        stream.pipe(res);
        return;
      }
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

      // Header section
      doc.fontSize(20).text('Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(`${reportType.replace(/_/g, ' ').toUpperCase()}`, { align: 'center' });
      doc.moveDown();

      // Report metadata
      doc.fontSize(12);
      doc.text(`Generated on: ${formatDateToLocal(new Date())}`);
      
      if (startDate && endDate) {
        doc.text(`Period: ${formatDateToLocal(startDate)} to ${formatDateToLocal(endDate)}`);
      }
      
      if (routeId) {
        const route = await Route.findOne({
          $or: [
            { _id: mongoose.isValidObjectId(routeId) ? new mongoose.Types.ObjectId(routeId) : null },
            { routeId: routeId }
          ]
        });
        
        if (route) {
          doc.text(`Route: ${route.routeName}`);
          doc.text(`From: ${route.startLocation} To: ${route.endLocation}`);
        }
      }
      
      doc.moveDown();
      doc.moveDown();

      // Data section
      data.forEach((item, index) => {
        doc.fontSize(14).text(`Record ${index + 1}`, { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(12);
        Object.entries(item).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`, {
            indent: 20,
            align: 'left'
          });
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