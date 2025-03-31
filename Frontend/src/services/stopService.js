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
      errorInfo.message = "Stop name already exists";
    }
  } else if (error.request) {
    errorInfo.message = "No response from server";
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

// Update a stop
export const updateStop = async (stopId, updatedData) => {
  try {
    const response = await api.put(`/${stopId}`, updatedData);
    return response.data;
  } catch (error) {
    handleServiceError(error, "updating stop");
  }
};

// Toggle stop status
export const toggleStopStatus = async (stopId) => {
  try {
    const response = await api.put(`/${stopId}/status`);
    return response.data;
  } catch (error) {
    handleServiceError(error, "toggling stop status");
  }
};

// Delete a stop
export const deleteStop = async (stopId) => {
  try {
    const response = await api.delete(`/${stopId}`);
    return response.data;
  } catch (error) {
    handleServiceError(error, "deleting stop");
  }
};