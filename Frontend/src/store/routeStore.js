import { create } from "zustand";
import axios from "axios";

const useRouteStore = create((set) => ({
  routes: [], // Store as an array
  fetchRoutes: async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/routes/routes");
      set({ routes: response.data.routes }); // ✅ Extract only the array
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
