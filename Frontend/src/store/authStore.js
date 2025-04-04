import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // Will hold { _id, name, email, role }
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const { data } = await axios.post(
            "http://localhost:5000/api/auth/login",
            { email, password },
            { withCredentials: true } // Ensures cookie is sent/stored
          );
          console.log("Login API response:", data); // Debug response
          set({
            user: {
              _id: data._id,
              name: data.name,
              email: data.email,
              phone:data.phone,
              role: data.role,
            },
            isAuthenticated: true,
          });
          return { success: true };
        } catch (error) {
          console.error("Login error:", error.response?.data);
          return {
            success: false,
            message: error.response?.data?.message || "Login failed",
          };
        }
      },

      logout: async () => {
        try {
          await axios.post(
            "http://localhost:5000/api/auth/logout",
            {},
            { withCredentials: true }
          );
        } catch (error) {
          console.error("Logout failed:", error);
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      updateUserState: (updatedUser) =>
        set((state) => ({
          user: { ...state.user, ...updatedUser },
        })),
    }),
    { name: "auth-storage" }
  )
);

export default useAuthStore;