import { create } from 'zustand';
import axios from '../services/authService';

const useStopStore = create((set, get) => ({
  stops: [],
  loading: false,
  error: null,

  // Fetch all stops
fetchStops: async () => {
  set({ loading: true, error: null });
  try {
    const response = await axios.get('/api/stops/get');
    set({ 
      stops: response.data.stops || [], 
      loading: false 
    });
  } catch (error) {
    set({ 
      error: error.response?.data?.message || 'Failed to fetch stops', 
      loading: false 
    });
  }
},

  // Toggle stop status
  toggleStopStatus: async (stopId) => {
    try {
      // Find the current stop
      const currentStop = get().stops.find(stop => stop.stopId === stopId);
      
      if (!currentStop) {
        throw new Error('Stop not found');
      }

      // Determine new status
      const newStatus = currentStop.status === 'active' ? 'inactive' : 'active';

      // Call backend to update status
      const response = await axios.put(`/api/stops/id/${stopId}/status`, {
        status: newStatus
      });

      // Update local state
      set(state => ({
        stops: state.stops.map(stop => 
          stop.stopId === stopId 
            ? { ...stop, status: newStatus } 
            : stop
        )
      }));

      return response.data;
    } catch (error) {
      console.error('Error toggling stop status:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to toggle stop status' 
      });
      throw error;
    }
  },

  // Add a new stop
  addStop: async (stopData) => {
    try {
      const response = await axios.post('/api/stops/create', stopData);
      
      set(state => ({
        stops: [...state.stops, response.data]
      }));

      return response.data;
    } catch (error) {
      console.error('Error adding stop:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to add stop' 
      });
      throw error;
    }
  },

  // Remove a stop
  removeStop: async (stopId) => {
    try {
      await axios.delete(`/api/stops/${stopId}`);
      
      set(state => ({
        stops: state.stops.filter(stop => stop.stopId !== stopId)
      }));
    } catch (error) {
      console.error('Error removing stop:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to remove stop' 
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useStopStore;