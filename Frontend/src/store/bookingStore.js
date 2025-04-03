import { create } from "zustand";

export const useBookingStore = create((set) => ({
  showBookingContainer: true, // Initially visible on homepage
  setShowBookingContainer: (value) => set({ showBookingContainer: value }),
}));

export default useBookingStore;