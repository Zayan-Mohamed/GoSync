import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const useRouteStore = create((set) => ({
  routes: [],
  routeStops: [],
  currentRoute: null,
  loading: false,
  error: null,
  
  clearCurrentRoute: () => set({ 
    currentRoute: null, 
    routeStops: [] 
  }),

  setRouteStops: (stops) => set({ routeStops: stops }),

  // Fetch all routes
  fetchRoutes: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/routes/routes`);
      set({ routes: response.data.routes }); // ✅ Extract only the array
    } catch (error) {
      console.error("Error fetching routes:", error);
      throw error;
    }
  },

  // Update route (distance and status)
  updateRoute: async (routeId, updateData) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/routes/${routeId}`,
        updateData
      );

      set((state) => ({
        routes: state.routes.map((route) =>
          route._id === routeId ? response.data.route : route
        ),
        currentRoute: response.data.route,
      }));

      return response.data.route;
    } catch (error) {
      console.error("Error updating route:", error);
      throw error;
    }
  },

  // Toggle route status
  toggleRouteStatus: async (routeId) => {
    try {
      await axios.delete(`${API_URL}/api/routes/${routeId}`);
      set((state) => ({
        routes: state.routes.filter((route) => route._id !== routeId),
        currentRoute: null,
      }));

      return true;
    } catch (error) {
      console.error("Error toggling route status:", error);
      throw error;
    }
  },

  // Delete route
  deleteRoute: async (routeId) => {
    try {
      await axios.delete(`${API_URL}/api/routes/routes/${routeId}`);
      set((state) => ({
        routes: state.routes.filter((route) => route._id !== routeId),
        currentRoute: null,
      }));

      return true;
    } catch (error) {
      console.error("Error deleting route:", error);
      throw error;
    }
  },

  // Get route by ID
  getRouteById: async (routeId) => {
    try {
      const response = await axios.get(`${API_URL}/api/routes/${routeId}`);
      set({ currentRoute: response.data.route });
      return response.data.route;
    } catch (error) {
      console.error("Error fetching route:", error);
      throw error;
    }
  },

  getStopsForRoute: async (routeId) => {
    try {
      // Add validation
      if (!routeId || !/^[0-9a-fA-F]{24}$/.test(routeId)) {
        throw new Error('Invalid route ID format');
      }
  
      // Notice the corrected endpoint with /routes/routes
      const response = await axios.get(`${API_URL}/api/routes/routes/${routeId}/stops`, {
        validateStatus: (status) => status < 500, // Don't throw for 404
        timeout: 8000
      });
  
      if (response.status === 404) {
        console.warn('Route not found, returning empty stops array');
        set({ routeStops: [] });
        return [];
      }
  
      if (!response.data?.stops) {
        throw new Error('Invalid response format - missing stops array');
      }
  
      // Transform the data to match your frontend expectations
      const formattedStops = response.data.stops.map(stop => ({
        ...stop,
        stopId: stop.stop._id, // Ensure stopId is available
        stopName: stop.stop.stopName // Flatten the name
      }));
  
      set({ routeStops: formattedStops });
      return formattedStops;
    } catch (error) {
      console.error('Failed to fetch stops:', {
        error: error.message,
        routeId,
        url: `${API_URL}/api/routes/routes/${routeId}/stops`,
        response: error.response?.data
      });
      set({ routeStops: [] });
      throw error;
    }
  },

// In your route store (Zustand)
addStopToRoute: async (routeId, stopData) => {
  try {
    set({ loading: true, error: null });
    
    const requestData = {
      routeId,  // Include routeId in the request body
      stopId: stopData.stopId,  // Make sure this matches backend expectation
      order: stopData.order,
      stopType: stopData.stopType
    };

    const response = await axios.post(
      `${API_URL}/api/routes/add-stop`,
      requestData
    );

    // Optimistic update
    set(state => ({
      routes: state.routes.map(route => 
        (route._id === routeId || route.routeId === routeId)
          ? { ...route, stops: [...route.stops, response.data.addedStop] }
          : route
      ),
      routeStops: [...state.routeStops, response.data.addedStop],
      loading: false
    }));

    return response.data;
  } catch (error) {
    set({ 
      error: error.response?.data?.error || 'Failed to add stop',
      loading: false 
    });
    throw error;
  }
},


  // Add multiple stops to a route
  addMultipleStops: async (stopsData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/routes/add-multiple-stops`,
        stopsData
      );

      set((state) => ({
        routes: state.routes.map((route) =>
          route._id === response.data.route._id ? response.data.route : route
        ),
      }));

      return response.data.route;
    } catch (error) {
      console.error("Error adding multiple stops:", error);
      throw error;
    }
  },

  // Update stop type
  updateStopType: async (updateData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/routes/update-stop-type`,
        updateData
      );

      set((state) => ({
        routes: state.routes.map((route) =>
          route._id === response.data.route._id ? response.data.route : route
        ),
      }));

      return response.data.route;
    } catch (error) {
      console.error("Error updating stop type:", error);
      throw error;
    }
  },


 // Fix for the deleteStopFromRoute function
deleteStopFromRoute: async (routeId, stopId) => {
  try {
    set({ loading: true, error: null });
    
    // Defensive approach - first check if the route and stops exist before filtering
    set((state) => {
      // Find the route to update
      const routeToUpdate = state.routes.find(route => 
        route._id === routeId || route.routeId === routeId
      );
      
      // Only update if route exists and has stops
      if (routeToUpdate && Array.isArray(routeToUpdate.stops)) {
        return {
          routes: state.routes.map((route) =>
            route._id === routeId || route.routeId === routeId
              ? {
                  ...route,
                  stops: route.stops.filter((stop) =>
                    (stop._id?.toString() !== stopId) &&
                    (stop.stop?.toString() !== stopId)
                  ),
                }
              : route
          ),
        };
      }
      
      // Also update routeStops for immediate UI update
      return {
        routeStops: state.routeStops.filter((stop) => 
          (stop._id?.toString() !== stopId) && 
          (stop.stop?._id?.toString() !== stopId)
        )
      };
    });
    
    // Make API call to delete the stop
    const response = await axios.delete(
      `${API_URL}/api/routes/routes/${routeId}/stops/${stopId}`
    );
    
    // Get the updated data from response
    const updatedRoute = response.data.route || response.data;
    
    // Update state with the API response
    set((state) => {
      // First update the routes array
      const updatedRoutes = state.routes.map((route) =>
        (route._id === routeId || route.routeId === routeId)
          ? {
              ...route,
              stops: updatedRoute.stops || []
            }
          : route
      );
      
      // Then update routeStops separately to ensure UI consistency
      return {
        routes: updatedRoutes,
        routeStops: updatedRoute.stops || state.routeStops.filter(s => 
          (s._id?.toString() !== stopId) && 
          (s.stop?._id?.toString() !== stopId)
        ),
        loading: false,
      };
    });
    
    return updatedRoute;
  } catch (error) {
    console.error("Error deleting stop from route:", error);
    set({
      error: error.response?.data?.error || error.message || "Failed to delete stop",
      loading: false
    });
    throw error;
  }
},
  // Create a new route
  createRoute: async (routeData) => {
    try {
      const response = await axios.post(`${API_URL}/api/routes/create`, routeData);
      
      set((state) => ({
        routes: [...state.routes, response.data.route],
      }));

      return response.data.route;
    } catch (error) {
      console.error("Error creating route:", error);
      throw error;
    }
  },

    // Update a stop within a route
    updateRouteStop: async (routeId, stopId, { order, stopType }) => {
      try {
        set({ loading: true, error: null });
  
        const response = await axios.put(
          `${API_URL}/api/routes/${routeId}/stops/${stopId}`,
          { order, stopType }
        );
  
        // Optimistic update
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route._id === routeId || route.routeId === routeId) {
              const updatedStops = route.stops.map((stop) => {
                const stopIdentifier = stop.stop?._id?.toString() || stop.stop?.toString();
                return stopIdentifier === stopId
                  ? { ...stop, order, stopType }
                  : stop;
              });
              return { ...route, stops: updatedStops };
            }
            return route;
          }),
          currentRoute: response.data.updatedRoute,
          loading: false
        }));
  
        return response.data;
      } catch (error) {
        let errorMessage = error.response?.data?.message || "Failed to update stop";
        
        // Handle duplicate order error specifically
        if (error.response?.data?.conflict) {
          errorMessage = `Order ${order} is already used by ${error.response.data.conflict.existingStop.name}`;
        }
  
        set({ error: errorMessage, loading: false });
        throw new Error(errorMessage);
      }
    },
}));

export default useRouteStore;
