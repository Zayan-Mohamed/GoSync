import React, { useEffect, useState } from "react";
import useRouteStore from "../store/routeStore";
import Button from "../components/Button";
import Table from "../components/Table";
import { Trash2, Edit, Map } from "lucide-react";
import AdminLayout from "../layouts/AdminLayout";
import SplashScreen from "../pages/SplashScreen";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

const CurrentRoutes = () => {
  const { routes, fetchRoutes, deleteRoute } = useRouteStore();
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  
  useEffect(() => {
    fetchRoutes()
      .then(() => {
        console.log("Routes fetched:", routes);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching routes:", error);
        setLoading(false);
      });
  }, [fetchRoutes]);

  // Show splash screen if data is still loading
  if (loading) {
    return <SplashScreen />;
  }

  if (!routes || routes.length === 0) {
    return (
      <AdminLayout>
        <div className="p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Current Routes</h2>
          <div className="text-center p-4">No routes available.</div>
        </div>
      </AdminLayout>
    );
  }

  const handleShowMap = (route) => {
    setSelectedRoute(route);
    setShowMapModal(true);
  };

  const RouteMap = ({ route }) => {
    // Default coordinates for Sri Lanka as fallback
    const defaultPosition = [7.8731, 80.7718]; // Approximate center of Sri Lanka
    
    // Check if route has valid coordinates
    const hasValidCoordinates = 
      route.startLocationCoordinates && 
      route.startLocationCoordinates.lat !== null && 
      route.endLocationCoordinates && 
      route.endLocationCoordinates.lat !== null;
    
    // If coordinates are missing, show a placeholder map
    if (!hasValidCoordinates) {
      return (
        <div>
          <p className="text-center mb-4">Route coordinates not available. Showing default map of Sri Lanka.</p>
          <MapContainer
            style={{ height: "400px", width: "100%" }}
            center={defaultPosition}
            zoom={7}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={defaultPosition}>
              <Popup>
                <strong>Note:</strong> Actual route coordinates not available
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      );
    }
    
    // Extract coordinates for start and end locations
    const startPosition = [
      route.startLocationCoordinates.lat,
      route.startLocationCoordinates.lng || route.startLocationCoordinates.lon
    ];

    const endPosition = [
      route.endLocationCoordinates.lat,
      route.endLocationCoordinates.lng || route.endLocationCoordinates.lon
    ];

    // Calculate a center position to show both markers
    const centerLat = (startPosition[0] + endPosition[0]) / 2;
    const centerLng = (startPosition[1] + endPosition[1]) / 2;

    return (
      <MapContainer
        style={{ height: "400px", width: "100%" }}
        center={[centerLat, centerLng]}
        zoom={9}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Start marker */}
        <Marker position={startPosition}>
          <Popup>Start: {route.startLocation}</Popup>
        </Marker>
        
        {/* End marker */}
        <Marker position={endPosition}>
          <Popup>End: {route.endLocation}</Popup>
        </Marker>
        
        {/* Route line */}
        <Polyline 
          positions={[startPosition, endPosition]} 
          color="blue" 
        />
      </MapContainer>
    );
  };

  const MapModal = ({ route, onClose }) => {
    if (!showMapModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg w-11/12 md:w-3/4 lg:w-2/3 max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Route Map: {route.routeName}</h3>
            <Button onClick={onClose}>Close</Button>
          </div>
          <RouteMap route={route} />
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Current Routes</h2>
        <Table>
          <thead>
            <tr>
              <th className="p-2 border-b text-left">Route Name</th>
              <th className="p-2 border-b text-left">Stops</th>
              <th className="p-2 border-b text-left">Other Details</th>
              <th className="p-2 border-b text-left">Map</th>
              <th className="p-2 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route._id} className="hover:bg-gray-100">
                <td className="p-2 border-b">
                  {route.routeName || "Unnamed Route"}
                  <div className="text-xs text-gray-500">ID: {route.routeId || route._id || "N/A"}</div>
                </td>
                <td className="p-2 border-b">
                  {route.stops && route.stops.length > 0 ? (
                    <div className="max-h-32 overflow-y-auto">
                      <ul className="list-disc pl-4">
                        {route.stops.map((stop, index) => {
                          if (stop && (stop.name || (typeof stop === 'string'))) {
                            return <li key={stop._id || index}>{stop.name || stop}</li>;
                          }
                          return null;
                        })}
                      </ul>
                    </div>
                  ) : (
                    <span className="text-gray-500">No stops</span>
                  )}
                </td>
                <td className="p-2 border-b">
                  <div><strong>From:</strong> {route.startLocation || route.routeName.split('→')[0]?.trim() || "N/A"}</div>
                  <div><strong>To:</strong> {route.endLocation || route.routeName.split('→')[1]?.trim() || "N/A"}</div>
                  <div><strong>Distance:</strong> {route.totalDistance || "N/A"} km</div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      route.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {route.status || "N/A"}
                    </span>
                  </div>
                </td>
                <td className="p-2 border-b">
                  <Button 
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => handleShowMap(route)}
                  >
                    <Map size={16} className="mr-1" />
                    View Map
                  </Button>
                </td>
                <td className="p-2 border-b">
                  <div className="flex gap-2">
                    <Button 
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={() => console.log("Edit route", route._id)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => deleteRoute(route._id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {selectedRoute && (
          <MapModal 
            route={selectedRoute} 
            onClose={() => {
              setShowMapModal(false);
              setSelectedRoute(null);
            }} 
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default CurrentRoutes;
