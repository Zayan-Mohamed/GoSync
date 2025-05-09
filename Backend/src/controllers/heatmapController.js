import Booking from "../models/bookingModel.js";
import Route from "../models/routeModel.js";

export const getUserHeatmapCoordinates = async (req, res) => {
  const userId = req.user.id;

  try {
    console.log(`Generating heatmap for user ID: ${userId}`);
    
    const bookings = await Booking.find({ userId })
      .populate({
        path: "busId",
        select: "routeId",
      });
      
    console.log(`Found ${bookings.length} bookings for user`);

    let coordinates = [];

    if (bookings.length) {
      const routeIds = bookings.map((b) => b.busId?.routeId).filter(Boolean);
      
      if (routeIds.length) {
        console.log(`Looking up routes with IDs: ${routeIds.join(', ')}`);
        const routes = await Route.find({ routeId: { $in: routeIds } }).populate("stops.stop");
        console.log(`Found ${routes.length} routes`);

        for (const route of routes) {
          if (route.startLocationCoordinates)
            coordinates.push([route.startLocationCoordinates.latitude, route.startLocationCoordinates.longitude, 0.7]);

          if (route.endLocationCoordinates)
            coordinates.push([route.endLocationCoordinates.latitude, route.endLocationCoordinates.longitude, 0.7]);

          for (const stop of route.stops) {
            if (stop.stop?.coordinates) {
              coordinates.push([stop.stop.coordinates.latitude, stop.stop.coordinates.longitude, 0.5]);
            }
          }
        }
      }
    }
    
    // Convert coordinates to JSON string for embedding in HTML
    const coordinatesJSON = JSON.stringify(coordinates);
    
    // Debug info
    console.log(`User ${userId} heatmap: Found ${coordinates.length} coordinates`);
    
    // Return HTML directly
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Route Heatmap</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            overflow: hidden;
          }
          #map {
            width: 100%;
            height: 100%;
          }
          .message-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 1000;
          }
          .message-box {
            background-color: rgba(255, 255, 255, 0.8);
            padding: 10px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            color: #333;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div id="overlay" class="message-overlay" style="display: none;">
          <div class="message-box">No route history to show.</div>
        </div>
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js"></script>
        <script>
          // Initialize map centered on Sri Lanka
          const map = L.map('map').setView([7.8731, 80.7718], 7);
          
          // Add OpenStreetMap layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          
          // Parse the coordinates data
          const points = ${coordinatesJSON};
          
          if (points.length === 0) {
            document.getElementById('overlay').style.display = 'flex';
          } else {
            // Create heatmap layer
            const heat = L.heatLayer(points, {
              radius: 25,
              blur: 15,
              maxZoom: 15,
              gradient: {0.4: 'yellow', 0.65: 'orange', 0.85: 'red', 1.0: 'darkred'},
              minOpacity: 0.5
            }).addTo(map);
            
            // Fit map to bounds of all points
            if (points.length > 0) {
              const latLngs = points.map(p => [p[0], p[1]]);
              map.fitBounds(L.latLngBounds(latLngs));
            }
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error generating heatmap:", error);
    res.status(500).setHeader('Content-Type', 'text/html').send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Heatmap Error</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .error-container {
            text-align: center;
            padding: 30px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #e53935;
          }
          p {
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>Error Generating Heatmap</h1>
          <p>We encountered a problem while generating your route heatmap.</p>
          <p>Please try again later or contact support if the problem persists.</p>
          <p><small>Error details: ${error.message}</small></p>
        </div>
      </body>
      </html>
    `);
  }
};