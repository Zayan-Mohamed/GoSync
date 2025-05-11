// src/websocket.js
import { Server } from "socket.io";

export const setupWebSocket = (server) => {
  console.log("Setting up WebSocket server...");
  console.log("Node environment:", process.env.NODE_ENV);
  console.log("Client URL from env:", process.env.CLIENT_URL);

  // IMPORTANT: For Socket.io with credentials, we must use exact matching origins
  const socketIoOptions = {
    cors: {
      // Specify exact origins rather than using a wildcard
      origin: [
        "http://localhost",
        "http://localhost:80",
        "http://127.0.0.1",
        process.env.CLIENT_URL,
      ].filter(Boolean),
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    },
    allowEIO3: true,
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 60000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e8,
    path: "/socket.io/",
  };

  console.log("Socket.IO configuration:", JSON.stringify(socketIoOptions.cors));

  const io = new Server(server, socketIoOptions);

  // Listen for new connections
  io.on("connection", (socket) => {
    console.log(
      `User connected: ${socket.id} from ${
        socket.handshake.headers.origin || "unknown origin"
      }`
    );
    console.log(`Socket connection details:`, {
      transport: socket.conn.transport.name,
      headers: socket.handshake.headers,
      query: socket.handshake.query,
    });

    // Send confirmation
    socket.emit("serverMessage", "Connected to WebSocket Server!");

    // Listen for client joining a trip room
    socket.on("joinTrip", ({ busId, scheduleId }) => {
      if (!busId || !scheduleId) {
        console.error("Invalid joinTrip parameters:", { busId, scheduleId });
        return;
      }
      const room = `${busId}-${scheduleId}`;
      socket.join(room);
      console.log(`User ${socket.id} joined room: ${room}`);

      // Send confirmation to client
      socket.emit("joinedTrip", { busId, scheduleId, room });
    });

    // Handle client disconnections
    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    // Handle connection errors
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });
  });

  // Listen for server errors - safely check if engine exists first
  if (io.engine && typeof io.engine.on === "function") {
    io.engine.on("connection_error", (err) => {
      console.error(
        "Socket.IO connection error:",
        err.req?.url,
        err.code,
        err.message,
        err.context
      );
    });
  } else {
    console.log(
      "io.engine is not available in this Socket.IO version - skipping engine error listener"
    );

    // Add a server-level error handler instead
    io.on("connect_error", (err) => {
      console.error("Socket.IO server connection error:", err);
    });
  }

  return io;
};
