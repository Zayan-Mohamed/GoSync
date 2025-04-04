import { create } from "zustand";
import axios from "axios";
import { updateRoute } from "../services/routeService";

const useRouteStore = create((set) => ({
  routes: [], // Store as an array
  fetchRoutes: async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/routes/routes");
      console.log("Raw API response:", response.data);
      
      // If first route has stops, log the first stop structure
      if (response.data.routes && 
          response.data.routes.length > 0 && 
          response.data.routes[0].stops && 
          response.data.routes[0].stops.length > 0) {
        console.log("Sample stop structure:", response.data.routes[0].stops[0]);
      }
      
      set({ routes: response.data.routes });
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  },
  editRoute: async (routeId, updatedData) => {
    try {
      const updatedRoute = await updateRoute(routeId, updatedData);
      set((state) => ({
        routes: state.routes.map((route) =>
          route._id === routeId ? updatedRoute : route
        ),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },
  deleteRoute: async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/routes/${id}`);
      set((state) => ({
        routes: state.routes.filter((route) => route._id !== id),
      }));
    } catch (error) {
      console.error("Error deleting route:", error);
    }
  },
}));


export default useRouteStore;
