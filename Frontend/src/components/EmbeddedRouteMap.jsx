import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EmbeddedRouteMap = ({ route }) => {
  // Default center of India if no route is selected
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 2;
  
  // Get center coordinates based on route data
  const getMapCenter = () => {
    if (!route) return defaultCenter;
    
    const startCoords = route.startLocationCoordinates && 
      [route.startLocationCoordinates.latitude, route.startLocationCoordinates.longitude];
    
    const endCoords = route.endLocationCoordinates && 
      [route.endLocationCoordinates.latitude, route.endLocationCoordinates.longitude];
    
    if (startCoords && startCoords[0] && startCoords[1]) {
      if (endCoords && endCoords[0] && endCoords[1]) {
        // If both coordinates are available, calculate center
        return [
          (startCoords[0] + endCoords[0]) / 2,
          (startCoords[1] + endCoords[1]) / 2
        ];
      }
      return startCoords; // Only start coordinates available
    } else if (endCoords && endCoords[0] && endCoords[1]) {
      return endCoords; // Only end coordinates available
    }
    
    return defaultCenter; // Default fallback
  };
  
  // Get an appropriate zoom level based on route distance
  const getZoomLevel = () => {
    if (!route) return defaultZoom;
    
    const startCoords = route.startLocationCoordinates && 
      [route.startLocationCoordinates.latitude, route.startLocationCoordinates.longitude];
    
    const endCoords = route.endLocationCoordinates && 
      [route.endLocationCoordinates.latitude, route.endLocationCoordinates.longitude];
    
    if (startCoords && startCoords[0] && startCoords[1] && 
        endCoords && endCoords[0] && endCoords[1]) {
      // Calculate distance between points to determine zoom
      const lat1 = startCoords[0];
      const lon1 = startCoords[1];
      const lat2 = endCoords[0];
      const lon2 = endCoords[1];
      
      // Simple distance calculation
      const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
      
      // Adjust zoom based on distance
      if (distance > 5) return 6;
      if (distance > 2) return 8;
      if (distance > 1) return 10;
      if (distance > 0.5) return 12;
      return 14;
    }
    
    return defaultZoom;
  };

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden">
      {!route ? (
        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">
          Select a route to view on map
        </div>
      ) : (
        <MapContainer 
          center={getMapCenter()} 
          zoom={getZoomLevel()} 
          style={{ height: '100%', width: '100%' }} 
          whenCreated={(map) => {
            map.invalidateSize();
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {route.startLocationCoordinates && 
           route.startLocationCoordinates.latitude && 
           route.startLocationCoordinates.longitude && (
            <Marker position={[
              route.startLocationCoordinates.latitude, 
              route.startLocationCoordinates.longitude
            ]}>
              <Popup>
                <div><strong>Start:</strong> {route.startLocation || "Starting Point"}</div>
              </Popup>
            </Marker>
          )}
          
          {route.endLocationCoordinates && 
           route.endLocationCoordinates.latitude && 
           route.endLocationCoordinates.longitude && (
            <Marker position={[
              route.endLocationCoordinates.latitude, 
              route.endLocationCoordinates.longitude
            ]}>
              <Popup>
                <div><strong>End:</strong> {route.endLocation || "Ending Point"}</div>
              </Popup>
            </Marker>
          )}
          
          {route.startLocationCoordinates && 
           route.startLocationCoordinates.latitude && 
           route.startLocationCoordinates.longitude &&
           route.endLocationCoordinates && 
           route.endLocationCoordinates.latitude && 
           route.endLocationCoordinates.longitude && (
            <Polyline 
              positions={[
                [route.startLocationCoordinates.latitude, route.startLocationCoordinates.longitude],
                [route.endLocationCoordinates.latitude, route.endLocationCoordinates.longitude]
              ]}
              color="blue"
              weight={4}
              opacity={0.7}
            />
          )}
          
          {/* Render stops if available */}
          {route.stops && route.stops.map((stop, index) => (
            stop.coordinates && stop.coordinates.latitude && stop.coordinates.longitude && (
              <Marker 
                key={index}
                position={[stop.coordinates.latitude, stop.coordinates.longitude]}
              >
                <Popup>
                  <div><strong>Stop:</strong> {stop.name || `Stop ${index + 1}`}</div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      )}
    </div>
  );
};

export default EmbeddedRouteMap;