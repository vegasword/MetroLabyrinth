import { io } from "socket.io-client";

document.addEventListener("DOMContentLoaded", function () {
  window.localStorage.clear();
  const socket = io("http://localhost:8001");

  const joinForm = document.getElementById("join") as HTMLFormElement;
  const createForm = document.getElementById("create") as HTMLFormElement;
  const usernameInputJoin = document.getElementById(
    "usernameJoin"
  ) as HTMLInputElement;
  const usernameInputCreate = document.getElementById(
    "usernameCreate"
  ) as HTMLInputElement;
  const roomIdInput = document.getElementById("roomId") as HTMLInputElement;

  createForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = usernameInputCreate?.value;
    createRoom(username);
  });

  function createRoom(username) {
    socket.on("room:created", (roomId) => {
      console.log("Room created: ", roomId);
      joinRoom(roomId, username);
    });

    socket.emit("room:create", username);
  }

  joinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = usernameInputJoin.value;
    const roomId = roomIdInput.value.toUpperCase();
    joinRoom(roomId, username);
  });

  function joinRoom(roomId, username) {
    socket.on("room:joined", ({ roomId, room, uid, username }) => {
      console.log("Room " + roomId + " joined as " + username, room);
      if (window.localStorage.getItem("user") == null)
        window.localStorage.setItem(
          "user",
          JSON.stringify({ id: uid, name: username })
        );
      window.localStorage.setItem(
        "room",
        JSON.stringify({ id: roomId, list: room })
      );
      window.location.href = "/waiting/?room=" + roomId;
    });

    socket.emit("room:join", { roomId: roomId, username: username });
  }

  socket.on("error", (message) => {
    alert(message);
  });
});
