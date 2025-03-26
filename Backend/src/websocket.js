import { Server } from "socket.io";

export const setupWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: import.meta.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔗 User connected: ${socket.id}`);

    socket.emit("serverMessage", "Connected to WebSocket Server!");

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });

    // ✅ Handle real-time events (Example: seat booking update)
    socket.on("seatBooked", (data) => {
      io.emit("updateSeats", data); // Broadcast update to all clients
    });
  });

  return io;
};
