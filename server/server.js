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
  console.log('New client connected');

  socket.on('createRoom', () => {
    console.log('Creating room');
    const roomId = generateRoomId();
    availableRooms[roomId] = [];
    socket.emit('roomCreated', roomId);
  });

  socket.on('joinRoom', ({ roomId, username }) => {
    if (availableRooms[roomId] && availableRooms[roomId].length < 4) {
      console.log(Date.now().toString() + " " + username + 'has joinded the room', roomId);
      availableRooms[roomId].push({ id: socket.id, username: username });
      socket.join(roomId);
      io.to(roomId).emit('roomJoined', availableRooms[roomId]);
      socket.on('disconnect', () => {
        console.log(Date.now().toString() + " " + username + 'has been disconnected');
        availableRooms[roomId] = availableRooms[roomId].filter((player) => player.id !== socket.id);
        socket.leave(roomId);
        io.to(roomId).emit('roomJoined', availableRooms[roomId]);
        if (availableRooms[roomId].length === 0) {
          delete availableRooms[roomId];
        }
      });
    } else {
      console.log('Room is full or does not exist');
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
