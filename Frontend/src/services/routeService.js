import axios from "axios";

const API_URI = import.meta.env.VITE_API_URL

const API_URL = `${API_URI}/api/routes`; // Adjust this based on your backend

// Fetch all routes
export const getRoutes = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching routes:", error);
    throw error;
  }
};

// Update a route
export const updateRoute = async (routeId, updatedData) => {
  try {
    const response = await axios.put(`${API_URL}/${routeId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating route:", error);
    throw error;
  }
};

// Delete a route
export const deleteRoute = async (routeId) => {
  try {
    await axios.delete(`${API_URL}/${routeId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting route:", error);
    throw error;
  }
};
