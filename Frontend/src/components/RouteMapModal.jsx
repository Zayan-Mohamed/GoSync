import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Button from "../components/Button";
import { X } from "lucide-react";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

const RouteMapModal = ({ route, onClose }) => {
  if (!route) return null;

  // Get start and end coordinates from the route
  const startCoords = route.startLocationCoordinates && 
    [route.startLocationCoordinates.latitude, route.startLocationCoordinates.longitude];
  
  const endCoords = route.endLocationCoordinates && 
    [route.endLocationCoordinates.latitude, route.endLocationCoordinates.longitude];

  // Create a simple straight line between start and end points
  const routePoints = [];
  if (startCoords && startCoords[0] && startCoords[1]) routePoints.push(startCoords);
  if (endCoords && endCoords[0] && endCoords[1]) routePoints.push(endCoords);

  // Determine map center and zoom
  const determineMapBounds = () => {
    if (routePoints.length === 0) {
      // Default center if no coordinates available
      return {
        center: [20.5937, 78.9629], // Center of India
        zoom: 5
      };
    } else if (routePoints.length === 1) {
      // If only one point is available, center on that
      return {
        center: routePoints[0],
        zoom: 12
      };
    } else {
      // If both points are available, calculate the center between them
      const lat = (routePoints[0][0] + routePoints[1][0]) / 2;
      const lng = (routePoints[0][1] + routePoints[1][1]) / 2;
      return {
        center: [lat, lng],
        zoom: 10 // Slightly zoomed out to show both points
      };
    }
  };

  const { center, zoom } = determineMapBounds();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold">
            {route.routeName || "Route Map"}
          </h3>
          <Button
            className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </div>

        <div className="p-4 flex-grow overflow-auto">
          <div className="h-96 w-full">
            <MapContainer 
              center={center} 
              zoom={zoom} 
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Add start marker */}
              {startCoords && startCoords[0] && startCoords[1] && (
                <Marker position={startCoords}>
                  <Popup>
                    <div>
                      <strong>Start:</strong> {route.startLocation || "Starting Point"}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Add end marker */}
              {endCoords && endCoords[0] && endCoords[1] && (
                <Marker position={endCoords}>
                  <Popup>
                    <div>
                      <strong>End:</strong> {route.endLocation || "Ending Point"}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Add route polyline */}
              {routePoints.length > 1 && (
                <Polyline 
                  positions={routePoints}
                  color="blue"
                  weight={4}
                  opacity={0.7}
                />
              )}
            </MapContainer>
          </div>

          {/* Route details */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Route Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>From:</strong> {route.startLocation || "N/A"}</p>
                <p><strong>To:</strong> {route.endLocation || "N/A"}</p>
                <p><strong>Total Distance:</strong> {route.totalDistance || "N/A"} km</p>
              </div>
              <div>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    route.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {route.status || "N/A"}
                  </span>
                </p>
                <p><strong>Route ID:</strong> {route.routeId || route._id || "N/A"}</p>
                <p><strong>Number of Stops:</strong> {route.stops?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMapModal;