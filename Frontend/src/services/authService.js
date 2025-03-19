import axios from "axios";
import useAuthStore from "../store/authStore";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001" });

// Attach token to requests
API.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
