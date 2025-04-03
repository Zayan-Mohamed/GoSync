import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL

const useRouteStore = create((set) => ({
  routes: [],
  currentRoute: null,
  routeStops: [],

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
        `${API_URL}/api/routes/${_id}`,
        updateData
      );
      
      set((state) => ({
        routes: state.routes.map((route) =>
          route._id === routeId ? response.data.route : route
        ),
        currentRoute: response.data.route
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
      await axios.delete(`${API_URL}/api/routes/${id}`);
      set((state) => ({
        routes: state.routes.map((route) =>
          route._id === routeId ? response.data.route : route
        ),
        currentRoute: response.data.route
      }));
      
      return response.data.route;
    } catch (error) {
      console.error("Error toggling route status:", error);
      throw error;
    }
  },

  // Delete route
  deleteRoute: async (routeId) => {
    try {
      await axios.delete(`${API_URL}/api/routes/routes/${_id}`);
      set((state) => ({
        routes: state.routes.filter((route) => route._id !== routeId),
        currentRoute: null
      }));
      return true;
    } catch (error) {
      console.error("Error deleting route:", error);
      throw error;
    }
  },
// In your routeStore.js
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
    const response = await axios.get(
      `${API_URL}/api/routes/routes/${routeId}/stops`
    );
    set({ routeStops: response.data.stops });
    return response.data.stops;
  } catch (error) {
    console.error("Error fetching route stops:", error);
    throw error;
  }
},

  addStopToRoute: async (routeId, stopData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/routes/add-stop`,
        { routeId, ...stopData }
      );
      return response.data.route;
    } catch (error) {
      console.error("Error adding stop to route:", error);
      throw error;
    }
  },

  addMultipleStops: async (stopsData) => {
    try {
      const response = await axios.post(
        `${API_URL}}/api/routes/add-multiple-stops`,
        stopsData
      );
      return response.data.route;
    } catch (error) {
      console.error("Error adding multiple stops:", error);
      throw error;
    }
  },

  updateStopType: async (updateData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/routes/update-stop-type`,
        updateData
      );
      return response.data.route;
    } catch (error) {
      console.error("Error updating stop type:", error);
      throw error;
    }
  },

  deleteStopFromRoute: async (routeId, stopId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/routes/routes/${routeId}/stops/${stopId}`
      );
      return response.data.route;
    } catch (error) {
      console.error("Error deleting stop from route:", error);
      throw error;
    }
  },

  // Create new route
  createRoute: async (routeData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/routes/create`,
        routeData
      );
      set((state) => ({
        routes: [...state.routes, response.data.route]
      }));
      return response.data.route;
    } catch (error) {
      console.error("Error creating route:", error);
      throw error;
    }
  }
}));

export default useRouteStore;