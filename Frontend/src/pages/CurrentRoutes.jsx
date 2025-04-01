import React, { useEffect, useState } from "react";
import useRouteStore from "../store/routeStore";
import Button from "../components/Button";
import Table from "../components/Table";
import { Trash2, Edit, Map } from "lucide-react";
import AdminLayout from "../layouts/AdminLayout";
import SplashScreen from "../pages/SplashScreen";
import RouteMapModal from "../components/RouteMapModal"; // Import the new component

const CurrentRoutes = () => {
  const { routes, fetchRoutes, deleteRoute } = useRouteStore();
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  
  useEffect(() => {
    fetchRoutes()
      .then(() => {
        console.log("Routes fetched successfully");
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

  const handleCloseMap = () => {
    setShowMapModal(false);
    setSelectedRoute(null);
  };

  const handleDeleteRoute = async (routeId) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        await deleteRoute(routeId);
      } catch (error) {
        console.error("Error deleting route:", error);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Current Routes</h2>
        <Table>
          <thead>
            <tr>
              <th className="p-2 border-b text-left font-normal text-black">Route Name</th>
              <th className="p-2 border-b text-left font-normal text-black">Stops</th>
              <th className="p-2 border-b text-left font-normal text-black">Other Details</th>
              <th className="p-2 border-b text-left font-normal text-black">Map</th>
              <th className="p-2 border-b text-left font-normal text-black">Actions</th>
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
                        {route.stops.map((stopItem, index) => (
                          <li key={stopItem._id || index}>
                            {stopItem.stop?.stopName || // Use stopName instead of name
                             (typeof stopItem.stop === 'object' ? stopItem.stop.stopName : null) ||
                             stopItem.stopName ||
                             "Unknown Stop"} (Order: {stopItem.order})
                            {stopItem.stopType && (
                              <span className={`ml-2 text-xs px-1 py-0.5 rounded ${
                                stopItem.stopType === 'boarding' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {stopItem.stopType}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <span className="text-gray-500">No stops</span>
                  )}
                </td>
                <td className="p-2 border-b">
                  <div><strong>From:</strong> {route.startLocation || "N/A"}</div>
                  <div><strong>To:</strong> {route.endLocation || "N/A"}</div>
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
                      onClick={() => handleDeleteRoute(route._id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Render the map modal when showMapModal is true */}
      {showMapModal && selectedRoute && (
        <RouteMapModal 
          route={selectedRoute} 
          onClose={handleCloseMap} 
        />
      )}
    </AdminLayout>
  );
};

export default CurrentRoutes;