const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = 8080;

const availableRooms = [];

io.on('connection', (socket) => {
  socket.on('server:reconnect', ({ roomId, uid, username }) => {
    if (availableRooms[roomId]) {
      socket.join(roomId);
      availableRooms[roomId].push({ id: uid, username: username });

      socket.on('players:get', () => {
        console.log('getPlayers', availableRooms[roomId])
        io.to(roomId).emit('player:new', { room: availableRooms[roomId] })
      });

      socket.on('disconnect', () => {
        socket.leave(roomId);
        availableRooms[roomId] = availableRooms[roomId].filter(player => player.id !== uid);
        io.to(roomId).emit('player:left', { uid: uid });
      });

      socket.emit('server:reconnected', { room: availableRooms[roomId] });
    } else {
      socket.emit('error', 'Room does not exist.');
    }
  });

  socket.on('room:create', () => {
    const roomId = generateRoomId();
    availableRooms[roomId] = [];
    socket.emit('room:created', roomId);
  });

  socket.on('room:join', ({ roomId, username }) => {
    if (availableRooms[roomId] && availableRooms[roomId].length < 4) {
      const uid = Math.random().toString(36).substring(2, 10);
      socket.emit('room:joined', { roomId: roomId, room: availableRooms[roomId], uid: uid, username: username });
    } else {
      socket.emit('error', 'Room is full or does not exist.');
    }
  });


});

function generateRoomId() {
  const roomId = Math.random().toString(36).substring(2, 10).toUpperCase();

  if (availableRooms[roomId]) {
    return generateRoomId();
  }
  return roomId;
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})
