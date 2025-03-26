import axios from "axios";

const API_URL = "http://localhost:5000/api/buses"; // Correct backend URL (Note: The server is running on port 5001)

// Get All Buses
export const getBuses = async () => {
  try {
    const response = await axios.get(`${API_URL}/buses`, {
      withCredentials: true, // Ensure cookies are sent for authentication
    });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching buses:", error);
    return [];
  }
};

// Get a Bus By ID
export const getBusById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/buses/${id}`, {
      withCredentials: true, // Ensure cookies are sent for authentication
    });
    return response.data; // ✅ Should return a single bus object
  } catch (error) {
    console.error("Error fetching the bus:", error);
    return null;
  }
};

// Add a New Bus
export const addBus = async (busData) => {
  try {
    const response = await axios.post(API_URL, busData, {
      withCredentials: true, // Ensure cookies are sent for authentication
    });
    return response.data;
  } catch (error) {
    console.error("Error adding bus:", error);
  }
};

// Update Bus
export const updateBus = async (id, busData) => {
  try {
    const response = await axios.put(`${API_URL}/buses/${id}`, busData, {
      withCredentials: true, // Ensure cookies are sent for authentication
    });
    return response.data;
  } catch (error) {
    console.error("Error updating bus:", error);
  }
};

// Delete Bus
export const deleteBus = async (id) => {
  try {
    await axios.delete(`${API_URL}/buses/${id}`, {
      withCredentials: true, // Ensure cookies are sent for authentication
    });
  } catch (error) {
    console.error("Error deleting bus:", error);
  }
};
