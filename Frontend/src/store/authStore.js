import { create } from "zustand";
import { persist } from "zustand/middleware";
import API from "../services/authService";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // ✅ Login function (cookies will be handled automatically)
      login: async (email, password) => {
        try {
          const { data } = await API.post("/api/users/login", { email, password });
          set({ user: data, isAuthenticated: true }); // ✅ No need to store token
          return { success: true };
        } catch (error) {
          return { success: false, message: error.response?.data?.message || "Login failed" };
        }
      },

      logout: async () => {
        try {
          await API.post("/api/users/logout"); // ✅ Send request to clear the cookie
        } catch (error) {
          console.error("Logout failed:", error);
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      updateUserState: (updatedUser) => {
        set((state) => ({
          user: { ...state.user, ...updatedUser, phone: updatedUser.phone  }, 
        }));
      },
    }),
    { name: "auth-storage" }
  )
);

export default useAuthStore;
