import axios from "axios";

const API_URL = "/api/schedules";

// Get All Schedules
export const getSchedules = async () => {
  try {
    const response = await axios.get(API_URL, {
      withCredentials: true,
    });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return [];
  }
};

// Get Schedules by Date
export const getSchedulesByDate = async (date) => {
  try {
    const response = await axios.get(`${API_URL}/search?date=${date}`, {
      withCredentials: true,
    });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching schedules by date:", error);
    return [];
  }
};

// Get a Schedule By ID
export const getScheduleById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching the schedule:", error);
    return null;
  }
};

// Add a New Schedule
export const addSchedule = async (scheduleData) => {
  try {
    const response = await axios.post(API_URL, scheduleData, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding schedule:", error);
    throw error;
  }
};

// Update Schedule
export const updateSchedule = async (id, scheduleData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, scheduleData, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating schedule:", error);
    throw error;
  }
};

// Delete Schedule
export const deleteSchedule = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    throw error;
  }
};
