import { io } from "socket.io-client";

// Get the API URL from the environment or use fallbacks
const getApiUrl = () => {
  // Check if we have a runtime API URL (set by the container)
  if (window.RUNTIME_API_URL) {
    console.log("Using runtime API URL:", window.RUNTIME_API_URL);
    return window.RUNTIME_API_URL;
  }

  // Try to get from environment variable
  const envApiUrl = import.meta.env.VITE_API_URL;

  // Log for debugging
  console.log("Socket connection - API URL from env:", envApiUrl);

  // Check if we're running in Docker/production or development
  const isProduction = import.meta.env.PROD === true;
  const hostname = window.location.hostname;

  // Choose appropriate fallback based on environment and hostname
  let fallbackUrl;
  if (isProduction) {
    // In production, use the same hostname as the frontend but with backend port
    fallbackUrl = `//${hostname}:5000`;
  } else {
    // In development
    fallbackUrl = "http://localhost:5000";
  }

  console.log(
    `Socket using ${envApiUrl || fallbackUrl} (${isProduction ? "production" : "development"} mode)`
  );

  // Use environment variable if available, otherwise use fallback
  return envApiUrl || fallbackUrl;
};

// Create socket instance with robust error handling
const createSocket = () => {
  const apiUrl = getApiUrl();
  console.log("Creating socket connection to:", apiUrl);

  if (!apiUrl || apiUrl === "undefined") {
    console.error("Invalid API URL for socket connection:", apiUrl);
    return null;
  }

  try {
    // More robust configuration for Socket.io with credential handling
    const socket = io(apiUrl, {
      withCredentials: true, // This requires specific origin CORS config
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
      // Try websocket first to avoid CORS preflight issues
      transports: ["websocket", "polling"],
    });

    // Add global error handlers with more information
    socket.on("connect_error", (error) => {
      console.error(
        "Socket connection error:",
        error.message,
        "Transport:",
        socket.io.engine.transport.name
      );
      console.log("Attempting to reconnect with a different transport...");

      // On connect error, try switching transports if possible
      if (socket.io.engine.transport.name === "websocket") {
        console.log("Trying polling transport instead");
        socket.io.opts.transports = ["polling"];
      } else {
        console.log("Trying websocket transport instead");
        socket.io.opts.transports = ["websocket"];
      }
    });

    socket.on("connect", () => {
      console.log(
        "Socket connected successfully with ID:",
        socket.id,
        "using transport:",
        socket.io.engine.transport.name
      );
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("serverMessage", (message) => {
      console.log("Server message received:", message);
    });

    return socket;
  } catch (error) {
    console.error("Error creating socket connection:", error);
    return null;
  }
};

// Export the socket instance
const socket = createSocket();

export default socket;
