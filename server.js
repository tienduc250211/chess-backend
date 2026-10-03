const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on("connection", (socket) => {
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [] };
    }

    const room = rooms[roomId];
    if (room.players.length < 2) {
      room.players.push(socket.id);
      const role = room.players.length === 1 ? "white" : "black";
      socket.emit("playerRole", role);

      if (room.players.length === 2) {
        io.to(roomId).emit("startGame", "Bắt đầu ván đấu!");
      }
    } else {
      socket.emit("roomFull", "Phòng đã đủ người!");
    }
  });

  socket.on("makeMove", ({ roomId, move }) => {
    socket.to(roomId).emit("opponentMove", move);
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const index = room.players.indexOf(socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
        socket.to(roomId).emit("playerLeft", "Đối thủ đã rời phòng.");
        if (room.players.length === 0) {
          delete rooms[roomId];
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});