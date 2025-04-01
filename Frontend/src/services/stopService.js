import axios from "axios";

const API_URL = "http://localhost:5000/api/stops";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Unified error handler
const handleServiceError = (error, action) => {
  console.error(`Error ${action}:`, error);
  
  let errorInfo = {
    message: `Error ${action}`,
    status: null,
    data: null
  };

  if (error.response) {
    errorInfo = {
      message: error.response.data.message || errorInfo.message,
      status: error.response.status,
      data: error.response.data
    };
    
    if (error.response.status === 404) {
      errorInfo.message = "Stop not found";
    } else if (error.response.status === 409) {
      errorInfo.message = error.response.data.error || "Stop name already exists";
    }
  } else if (error.request) {
    errorInfo.message = "No response received from server";
  } else {
    errorInfo.message = error.message;
  }

  throw errorInfo;
};

// Fetch all stops
export const getAllStops = async () => {
  try {
    const response = await api.get('/get');
    return response.data?.stops || response.data || [];
  } catch (error) {
    handleServiceError(error, "fetching stops");
  }
};

// Get single stop
export const getStop = async (stopId) => {
  try {
    const response = await api.get(`/${stopId}`);
    return response.data;
  } catch (error) {
    handleServiceError(error, "fetching stop");
  }
};

// Create a new stop
export const createStop = async (stopData) => {
  try {
    const response = await api.post('/create', stopData);
    return response.data;
  } catch (error) {
    handleServiceError(error, "creating stop");
  }
};

// Update the updateStop function
export const updateStop = async (id, updatedData) => {
  try {
    // First check if the new name already exists
    if (updatedData.stopName) {
      const allStops = await getAllStops();
      const nameExists = allStops.some(
        stop => stop._id !== id && 
        stop.stopName.toLowerCase() === updatedData.stopName.toLowerCase().trim()
      );
      
      if (nameExists) {
        throw {
          response: {
            status: 409,
            data: { error: "Stop name already exists" }
          }
        };
      }
    }

    // Use the new route
    const response = await api.put(`/id/${id}`, updatedData);
    
    return response.data;
  } catch (error) {
    handleServiceError(error, "updating stop");
  }
};

export const toggleStopStatus = async (id) => {
  try {
    const response = await api.put(`/id/${id}/status`);
    return response.data;
  } catch (error) {
    handleServiceError(error, "toggling stop status");
  }
};

// Delete a stop
export const deleteStop = async (id) => {
  try {
    const response = await api.delete(`/id/${id}`);
    return response.data;
  } catch (error) {
    handleServiceError(error, "deleting stop");
  }
};

// Create multiple stops
export const createMultipleStops = async (stopsData) => {
  try {
    const response = await api.post('/bulk', stopsData);
    return response.data;
  } catch (error) {
    handleServiceError(error, "creating multiple stops");
  }
};