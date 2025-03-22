import { create } from "zustand";
import { getRoutes, updateRoute, deleteRoute } from "../services/routeService";

const useRouteStore = create((set) => ({
  routes: [],
  loading: false,
  error: null,

  fetchRoutes: async () => {
    set({ loading: true });
    try {
      const data = await getRoutes();
      set({ routes: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
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

  removeRoute: async (routeId) => {
    try {
      await deleteRoute(routeId);
      set((state) => ({
        routes: state.routes.filter((route) => route._id !== routeId),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },
}));

export default useRouteStore;
