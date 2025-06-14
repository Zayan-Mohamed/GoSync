import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const { data } = await axios.post(
            `${API_URL}/api/auth/login`,
            { email, password },
            { withCredentials: true }
          );
          console.log("Login API response:", data); // Debug response
          set({
            user: {
              _id: data._id,
              name: data.name,
              email: data.email,
              phone: data.phone,
              role: data.role,
              profilePicture: data.profilePicture || null,
              profilePictureData: data.profilePictureData || null,
              address: data.address || null,
              notificationPreferences: data.notificationPreferences || null,
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
            `${API_URL}/api/auth/logout`,
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
