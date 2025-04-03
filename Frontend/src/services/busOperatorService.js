import axios from "axios";

const API_URL = "http://localhost:5000/api/operator"; // Adjust based on your backend

// Fetch all bus operators
export const getBusOperators = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching bus operators:", error);
    throw error;
  }
};

// Add a new bus operator
export const addBusOperator = async (operatorData) => {
  try {
    const response = await axios.post(API_URL, operatorData);
    return response.data;
  } catch (error) {
    console.error("Error adding bus operator:", error);
    throw error;
  }
};

// Update an existing bus operator
export const updateBusOperator = async (id, updatedData) => {
  try {
    const response = await axios.put(`${API_URL}/update/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating bus operator:", error);
    throw error;
  }
};

// Delete a bus operator
export const deleteBusOperator = async (id) => {
  try {
    await axios.delete(`${API_URL}/delete/${id}`);
  } catch (error) {
    console.error("Error deleting bus operator:", error);
    throw error;
  }
};
