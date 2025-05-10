import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import Route from "../models/routeModel.js";
import AuditLog from "../models/auditLogModel.js";
import Booking from "../models/bookingModel.js";
import { PassThrough } from "stream";
import mongoose from "mongoose";

const formatDateToLocal = (date) => {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR",
  }).format(amount);
};

const formatActionDescription = (action) => {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Helper function to create tables in PDFKit with dynamic row heights
const createTable = (doc, headers, data, options = {}) => {
  const {
    startX = 50,
    startY = doc.y,
    width = doc.page.width - 100,
    minRowHeight = 30,
    headerBgColor = "#4472C4",
    headerTextColor = "#FFFFFF",
    zebra = true,
    zebraColor = "#E6F2FF",
    fontSize = 10,
    cellPadding = 5,
    headerFontSize = 11,
    maxColumnWidths = {}, 
  } = options;

  let columnWidths = {};
  let availableWidth = width;
  let remainingColumns = headers.length;

  // First pass - assign specified column widths
  headers.forEach((header) => {
    if (maxColumnWidths[header]) {
      columnWidths[header] = maxColumnWidths[header];
      availableWidth -= maxColumnWidths[header];
      remainingColumns--;
    }
  });

  // Second pass - distribute remaining width
  headers.forEach((header) => {
    if (!columnWidths[header]) {
      columnWidths[header] = availableWidth / remainingColumns;
    }
  });

  let currentY = startY;

  // Draw header
  doc.fillColor(headerBgColor);
  doc.rect(startX, currentY, width, minRowHeight).fill();
  doc.fillColor(headerTextColor);
  doc.fontSize(headerFontSize);

  let currentX = startX;
  headers.forEach((header) => {
    doc.text(
      header,
      currentX + cellPadding,
      currentY + minRowHeight / 2 - headerFontSize / 2,
      { width: columnWidths[header] - cellPadding * 2, align: "left" }
    );
    currentX += columnWidths[header];
  });

  currentY += minRowHeight;
  doc.fontSize(fontSize);

  // Function to calculate text height
  const calculateTextHeight = (text, columnWidth) => {
    const textWidth = columnWidth - cellPadding * 2;
    
    const averageCharsPerLine = textWidth / (fontSize * 0.5); 
    const numLines = Math.ceil(text.length / averageCharsPerLine);
    return Math.max(
      minRowHeight,
      numLines * (fontSize * 1.2) + cellPadding * 2
    );
  };

  // Draw rows with dynamic heights
  data.forEach((row, rowIndex) => {
    // Calculate row height based on the content in each cell
    let rowHeight = minRowHeight;

    // Find the tallest cell in this row
    headers.forEach((header) => {
      const cellContent = String(row[header] || "");
      const estimatedHeight = calculateTextHeight(
        cellContent,
        columnWidths[header]
      );
      rowHeight = Math.max(rowHeight, estimatedHeight);
    });

    // Apply zebra striping
    if (zebra && rowIndex % 2 === 0) {
      doc.fillColor(zebraColor);
      doc.rect(startX, currentY, width, rowHeight).fill();
    }

    // Check if we need a new page before drawing this row
    if (currentY + rowHeight > doc.page.height - 50) {
      doc.addPage();
      currentY = 50;

      // Redraw header on new page
      doc.fillColor(headerBgColor);
      doc.rect(startX, currentY, width, minRowHeight).fill();
      doc.fillColor(headerTextColor);
      doc.fontSize(headerFontSize);

      currentX = startX;
      headers.forEach((header) => {
        doc.text(
          header,
          currentX + cellPadding,
          currentY + minRowHeight / 2 - headerFontSize / 2,
          { width: columnWidths[header] - cellPadding * 2, align: "left" }
        );
        currentX += columnWidths[header];
      });

      currentY += minRowHeight;
      doc.fontSize(fontSize);
    }

    // Draw cell borders
    doc.strokeColor("#CCCCCC");
    doc.lineWidth(0.5);

    // Draw horizontal line at the top of each row (except the first one which comes after header)
    if (rowIndex !== 0) {
      doc
        .moveTo(startX, currentY)
        .lineTo(startX + width, currentY)
        .stroke();
    }

    // Draw cell content
    doc.fillColor("#000000");
    currentX = startX;

    headers.forEach((header) => {
      const value = row[header] || "";
      const cellX = currentX + cellPadding;
      // Align text to the top of the cell, not the middle
      const cellY = currentY + cellPadding;

      doc.text(String(value), cellX, cellY, {
        width: columnWidths[header] - cellPadding * 2,
        align: "left",
        height: rowHeight - cellPadding * 2,
      });

      // Draw vertical lines between cells
      if (currentX > startX) {
        doc
          .moveTo(currentX, currentY)
          .lineTo(currentX, currentY + rowHeight)
          .stroke();
      }

      currentX += columnWidths[header];
    });

    // Draw the right border for the last cell
    doc
      .moveTo(currentX, currentY)
      .lineTo(currentX, currentY + rowHeight)
      .stroke();

    currentY += rowHeight;

    // Draw horizontal line at the bottom of the row
    doc
      .moveTo(startX, currentY)
      .lineTo(startX + width, currentY)
      .stroke();
  });

  // Draw the outer left and right borders
  doc.moveTo(startX, startY).lineTo(startX, currentY).stroke();
  doc
    .moveTo(startX + width, startY)
    .lineTo(startX + width, currentY)
    .stroke();

  // Return the new Y position
  return currentY;
};

export const generateReport = async (req, res) => {
  try {
    const { reportType, routeId, startDate, endDate, format } = req.body;

    if (!["route_modification", "route_performance"].includes(reportType)) {
      return res.status(400).json({ error: "Invalid report type" });
    }
    if (!["pdf", "csv"].includes(format)) {
      return res.status(400).json({ error: "Invalid format" });
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
    let filename = "";
    let reportTitle = "";

    if (reportType === "route_modification") {
      reportTitle = "Route Modification Report";

      // Find the route first to get its routeId
      let routeIdToSearch = routeId;
      let routeDetails = null;

     
      if (routeId) {
        const route = await Route.findOne({
          $or: [
            {
              _id: mongoose.isValidObjectId(routeId)
                ? new mongoose.Types.ObjectId(routeId)
                : null,
            },
            { routeId: routeId },
          ],
        });

        if (route) {
          console.log("Found route for route_modification:", route.routeName);
        
          routeIdToSearch = route.routeId;
          routeDetails = route;
        }
      }

      const query = {
        entityType: "Route",
        ...(routeIdToSearch ? { entityId: routeIdToSearch } : {}),
      };

      
      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const logs = await AuditLog.find(query)
        .populate("userId", "name email")
        .sort({ timestamp: -1 }) 
        .lean();

      console.log("Found logs count:", logs.length);

      data = logs.map((log) => ({
        "Date & Time": formatDateToLocal(log.timestamp),
        Action: formatActionDescription(log.action),
        "Modified By": log.userId ? `${log.userId.name}` : "System",
        "Changes Made": (() => {
          if (!log.details) return "No specific changes recorded";
      
          
          if (["add_stop", "remove_stop"].includes(log.action)) {
            const { stopName, order, stopType } = log.details;
            const routeName = log.routeName || "Unknown";
      
            return (
              `Route Name: ${routeName}\n` +
              `Stop Name: ${stopName || "Unknown"}\n` +
              (stopType ? `Stop Type: ${stopType}\n` : "") +
              (order !== undefined ? `Order: ${order}` : "")
            );
          }
      
          // Default rendering for other actions
          return Object.entries(log.details)
            .map(
              ([key, value]) =>
                `${key.replace(/([A-Z])/g, " $1").trim()}: ${value}`
            )
            .join("\n");
        })(),
      }));
      

      fields = ["Date & Time", "Action", "Modified By", "Changes Made"];
      filename = `route_modification_report_${
        new Date().toISOString().split("T")[0]
      }.${format}`;
    } else if (reportType === "route_performance") {
      reportTitle = "Route Performance Report";

      const bookingQuery = { status: "confirmed" };
      if (startDate && endDate) {
        bookingQuery.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // First, fetch the route to get its MongoDB ObjectId
      let routeObjectId = null;
      let routeDetails = null;

      if (routeId) {
        try {
          const route = await Route.findOne({
            $or: [
              {
                _id: mongoose.isValidObjectId(routeId)
                  ? new mongoose.Types.ObjectId(routeId)
                  : null,
              },
              { routeId: routeId },
            ],
          });

          if (route) {
            routeObjectId = route._id;
            routeDetails = route;
            console.log(
              "Found route for performance report:",
              route.routeName,
              "with _id:",
              routeObjectId
            );
          }
        } catch (err) {
          console.error("Error finding route:", err);
        }
      }

      // Prepare route matching condition
      const routeMatch = {};
      if (routeObjectId) {
        routeMatch["route._id"] = routeObjectId;
      }

      const bookings = await Booking.aggregate([
        { $match: bookingQuery },
        {
          $lookup: {
            from: "schedules",
            localField: "scheduleId",
            foreignField: "_id",
            as: "schedule",
          },
        },
        { $unwind: { path: "$schedule", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: "routes",
            localField: "schedule.routeId",
            foreignField: "_id",
            as: "route",
          },
        },
        { $unwind: { path: "$route", preserveNullAndEmptyArrays: false } },
        {
          $match: routeMatch,
        },
        {
          $group: {
            _id: "$route._id",
            routeName: { $first: "$route.routeName" },
            bookingCount: { $sum: 1 },
            totalRevenue: { $sum: "$fareTotal" },
            stopCount: { $first: { $size: "$route.stops" } },
            startLocation: { $first: "$route.startLocation" },
            endLocation: { $first: "$route.endLocation" },
            status: { $first: "$route.status" },
          },
        },
      ]);

      data = bookings.map((b) => ({
        "Route Name": b.routeName,
        From: b.startLocation,
        To: b.endLocation,
        Status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
        "Total Bookings": b.bookingCount,
        Revenue: formatCurrency(b.totalRevenue),
        "Number of Stops": b.stopCount,
      }));

      fields = [
        "Route Name",
        "From",
        "To",
        "Status",
        "Total Bookings",
        "Revenue",
        "Number of Stops",
      ];
      filename = `route_performance_report_${
        new Date().toISOString().split("T")[0]
      }.${format}`;
    }

    // Generate CSV response
    if (format === "csv") {
     
      if (data.length === 0) {
        data.push(
          Object.fromEntries(
            fields.map((field) => [
              field,
              field === fields[0]
                ? "No data available for the specified criteria"
                : "",
            ])
          )
        );
      }

      
      let routeName = "";
      if (routeId) {
        const route = await Route.findOne({
          $or: [
            {
              _id: mongoose.isValidObjectId(routeId)
                ? new mongoose.Types.ObjectId(routeId)
                : null,
            },
            { routeId: routeId },
          ],
        });
        routeName = route?.routeName || routeId;
      }

     
      const csvRows = [
        
        ["GoSync - Online Bus Ticket Booking System"],
        
        ["Generated At", formatDateToLocal(new Date())],
        
        ["Report Type", reportType.replace(/_/g, " ").toUpperCase()],
      ];

      
      if (startDate && endDate) {
        csvRows.push([
          "Period",
          `${formatDateToLocal(new Date(startDate))} to ${formatDateToLocal(
            new Date(endDate)
          )}`,
        ]);
      }

      
      if (routeId) {
        csvRows.push(["Route", routeName]);
      }

      
      csvRows.push([]);

    
      csvRows.push(fields);

      // Add data rows
      data.forEach((row) => {
        csvRows.push(fields.map((field) => row[field] || ""));
      });

      const csv = csvRows
        .map((row) => {
          const paddedRow = [...row];
          while (paddedRow.length < Math.max(...csvRows.map((r) => r.length))) {
            paddedRow.push("");
          }

          return paddedRow
            .map((cell) => {
              const stringCell = String(cell || "");

             
              if (
                stringCell.includes(",") ||
                stringCell.includes('"') ||
                stringCell.includes("\n")
              ) {
                return `"${stringCell.replace(/"/g, '""')}"`;
              }

              return stringCell;
            })
            .join(",");
        })
        .join("\n");

      res.header("Content-Type", "text/csv");
      res.attachment(filename);
      return res.send(csv);
    }
    // Generate PDF response
    else {
      // Create PDF document
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        size: "A4",
      });
      const stream = new PassThrough();
      doc.pipe(stream);

      
      doc.fillColor("#ff6b00").fontSize(24).font("Helvetica-Bold");
      doc.text("GoSync - Online Bus Ticket Booking System", {
        align: "center",
      });
      
      doc.moveDown(0.5);

      // Report header
      doc.fillColor("#000000").fontSize(18).font("Helvetica-Bold");
      doc.text(reportTitle, { align: "center" });
      doc.moveDown();

      // Report metadata section with a light background
      doc
        .rect(50, doc.y, doc.page.width - 100, 80)
        .fillAndStroke("#F2F2F2", "#CCCCCC");

      let metadataY = doc.y + 10;
      doc.fillColor("#000000").fontSize(11).font("Helvetica");

      // Left column of metadata
      doc.text(`Generated: ${formatDateToLocal(new Date())}`, 60, metadataY);
      doc.text(
        `Report Type: ${reportType.replace(/_/g, " ").toUpperCase()}`,
        60,
        metadataY + 20
      );

      // Right column of metadata
      if (startDate && endDate) {
        doc.text(
          `Period: ${formatDateToLocal(new Date(startDate))}`,
          doc.page.width / 2,
          metadataY
        );
        doc.text(
          `To: ${formatDateToLocal(new Date(endDate))}`,
          doc.page.width / 2,
          metadataY + 20
        );
      }

      // Route details if available
      if (routeId) {
        const route = await Route.findOne({
          $or: [
            {
              _id: mongoose.isValidObjectId(routeId)
                ? new mongoose.Types.ObjectId(routeId)
                : null,
            },
            { routeId: routeId },
          ],
        });

        if (route) {
          doc.text(`Route: ${route.routeName}`, 60, metadataY + 40);
        }
      }

      doc.moveDown(5); // Move down after the metadata box

      // Display data in table format if available
      if (data.length > 0) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Report Data", { align: "left" });
        doc.moveDown();

        // Format data as rows for the table
        const rows = data.map((item) => {
          // Create an array of values in the same order as fields
          return fields.reduce((obj, field) => {
            obj[field] = item[field] || "";
            return obj;
          }, {});
        });

        // Create the table with custom column widths for route modification report
        const customColumnWidths = {};

        // Apply custom column widths based on report type
        if (reportType === "route_modification") {
          // Give more space to Changes Made column
          customColumnWidths["Date & Time"] = 120;
          customColumnWidths["Action"] = 100;
          customColumnWidths["Modified By"] = 100;
          // Changes Made gets the rest
        }

        createTable(doc, fields, rows, {
          startY: doc.y,
          headerBgColor: "#4472C4", // Blue header
          zebraColor: "#E6F2FF", // Light blue zebra stripes
          fontSize: 9, // Smaller font for content
          headerFontSize: 10, // Slightly larger for headers
          minRowHeight: 35, // Minimum row height
          maxColumnWidths: customColumnWidths, // Custom column widths
        });
      }
      // No data available
      else {
        const pageHeight = doc.page.height;
        const margins = doc.page.margins;
        const contentHeight = 300; // Height of no-data box + margins
        const footerHeight = 40;
        const totalNeededHeight = contentHeight + footerHeight;

        // Ensure we're on a fresh page if needed
        if (doc.y > pageHeight - totalNeededHeight) {
          doc.addPage();
        }

        const boxWidth = doc.page.width - 100;
        const boxHeight = 100;
        const boxX = 50;
        const boxY = doc.y;

        // Create a centered yellow box
        doc
          .rect(boxX, boxY, boxWidth, boxHeight)
          .fillAndStroke("#FFF9E6", "#FFD966");

        // Center the text vertically within the box
        const textY = boxY + boxHeight / 2 - 30;

        doc
          .fillColor("#996600")
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("No Data Available", boxX, textY, {
            width: boxWidth,
            align: "center",
          });

        doc
          .fillColor("#664400")
          .fontSize(12)
          .font("Helvetica")
          .text(
            "No records were found matching the specified criteria.",
            boxX,
            textY + 25,
            {
              width: boxWidth,
              align: "center",
            }
          );

        doc
          .fillColor("#664400")
          .fontSize(11)
          .text(
            "Try adjusting your filters or date range to see more results.",
            boxX,
            textY + 50,
            {
              width: boxWidth,
              align: "center",
            }
          );

        // Force the y position to be after the box
        doc.y = boxY + boxHeight + 20;
      }

      // Add footer to the current page
      const pageHeight = doc.page.height;
      const margins = doc.page.margins;

      doc
        .fontSize(8)
        .fillColor("#999999")
        .text(
          `Page ${doc.bufferedPageRange().start + 1} of ${
            doc.bufferedPageRange().count
          } - Generated by GoSync System`,
          margins.left,
          pageHeight - margins.bottom - 20,
          {
            align: "center",
            width: doc.page.width - (margins.left + margins.right),
          }
        );

      doc.end();
      res.header("Content-Type", "application/pdf");
      res.attachment(filename);
      stream.pipe(res);
    }
  } catch (error) {
    console.error("Error generating report:", error);
    res
      .status(500)
      .json({ error: "Failed to generate report", details: error.message });
  }
};