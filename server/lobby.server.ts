import express, { Express } from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app: Express = express();
export const lobbyServer = createServer(app);
const io = new Server(lobbyServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

type Room = { id: string; username: string }[];

const availableRooms: Room[] = [];

io.on("connection", (socket) => {
  socket.on("room:create", () => {
    const roomId: any = generateRoomId();
    availableRooms[roomId] = [];
    socket.emit("room:created", roomId);
  });

  socket.on("room:join", ({ roomId, username }) => {
    if (availableRooms[roomId] && availableRooms[roomId].length < 4) {
      const uid = Math.random().toString(36).substring(2, 10);
      socket.emit("room:joined", {
        roomId: roomId,
        room: availableRooms[roomId],
        uid: uid,
        username: username,
      });
    } else {
      socket.emit("error", "Room is full or does not exist.");
    }
  });

  socket.on("server:reconnect", ({ roomId, uid, username }) => {
    if (availableRooms[roomId]) {
      socket.join(roomId);
      availableRooms[roomId].push({ id: uid, username: username });

      socket.on("players:get", () => {
        console.log("getPlayers", availableRooms[roomId]);
        io.to(roomId).emit("player:new", { room: availableRooms[roomId] });
      });

      socket.on("disconnect", () => {
        socket.leave(roomId);
        availableRooms[roomId] = availableRooms[roomId].filter(
          (player) => player.id !== uid
        );
        io.to(roomId).emit("player:left", { uid: uid });
      });

      socket.emit("server:reconnected", { room: availableRooms[roomId] });
    } else {
      socket.emit("error", "Room does not exist.");
    }
  });
});

function generateRoomId() {
  const roomId: any = Math.random().toString(36).substring(2, 10).toUpperCase();

  if (availableRooms[roomId]) {
    return generateRoomId();
  }
  return roomId;
}
