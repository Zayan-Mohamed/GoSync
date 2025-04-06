// src/websocket.js
import { Server } from "socket.io";

export const setupWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.emit("serverMessage", "Connected to WebSocket Server!");

    // Optional: Join a room based on busId or scheduleId for targeted updates
    socket.on("joinTrip", ({ busId, scheduleId }) => {
      const room = `${busId}-${scheduleId}`;
      socket.join(room);
      console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  return io;
};