import { io } from "socket.io-client";

document.addEventListener("DOMContentLoaded", function () {
  const socket = io("http://localhost:8001");
  const playersList = document.getElementById("playersList");
  const user = JSON.parse(window.localStorage.getItem("user") || "");
  const room = JSON.parse(window.localStorage.getItem("room") || "");
  const urlParams = new URLSearchParams(window.location.search);
  const urlRoomId = urlParams.get("room");

  if (urlRoomId == null) {
    alert("Room ID not found");
    window.location.href = "/lobby/";
    return;
  }
  if (room == null) {
    alert("Room not found");
    window.location.href = "/lobby/";
    return;
  }
  if (urlRoomId != room.id) {
    alert("Room ID does not match");
    window.location.href = "/lobby/";
    return;
  }

  socket.on("server:reconnected", () => {
    socket.on("player:new", ({ room }) => {
      if (playersList) {
        playersList.innerHTML = "";
        room.map((player) => {
          const li = document.createElement("li");
          li.appendChild(document.createTextNode(player.username));
          li.id = player.id;
          playersList.appendChild(li);
        });
      }
    });
    socket.on("player:left", ({ uid }) => {
      const player = document.getElementById(uid);
      if (player) {
        player.remove();
      }
    });
    socket.emit("players:get");
  });

  socket.emit("server:reconnect", {
    roomId: urlRoomId,
    uid: user.id,
    username: user.name,
  });

  socket.on("error", (message) => {
    alert(message);
  });
});
