import express from "express";
import { createServer } from "http";
import { join } from "path";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
  
const io = new Server(server, {
  connectionStateRecovery: {}
});

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    io.emit("chat message", msg);
  });
  
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
