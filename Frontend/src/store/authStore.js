import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "../services/authService";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const { data } = await axios.post("/api/users/login", { email, password });
          set({ user: data, token: data.token, isAuthenticated: true });
          return { success: true };
        } catch (error) {
          return { success: false, message: error.response?.data?.message || "Login failed" };
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      }
    }),
    { name: "auth-storage" }
  )
);

export default useAuthStore;
