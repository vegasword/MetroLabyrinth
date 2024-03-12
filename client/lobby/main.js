const socket = io('http://localhost:8080');

const joinForm = document.getElementById("join");
const createForm = document.getElementById("create");
const usernameInputJoin = document.getElementById("usernameJoin");
const usernameInputCreate = document.getElementById("usernameCreate");
const roomIdInput = document.getElementById("roomId");
const main = document.getElementById("main");

createForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = usernameInputCreate.value;
  createRoom(username);
});

function createRoom(username) {
  socket.emit("createRoom", username);
  socket.on("roomCreated", (roomId) => {
    console.log("Room created: ", roomId);
    joinRoom(roomId, username);
  });
}

joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = usernameInputJoin.value;
  const roomId = roomIdInput.value.toUpperCase();
  joinRoom(roomId, username);
});

function joinRoom(roomId, username) {
  socket.emit("joinRoom", { roomId, username })
  socket.on("roomJoined", (room) => {
    console.log("Room joined: ", room);
    main.innerHTML = "<div>Players " + room.length + "/4" + room.map((player) => `<div>${player.username}</div>`).join("") + "</div>";
  });
}

socket.on("error", (message) => {
  alert(message);
});