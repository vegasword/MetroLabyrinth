import * as EVENTS from "./events";
import * as CLIENT from "./client";

import { io } from "socket.io-client";
const socket = io("http://localhost:8002");

let client = new CLIENT.Instance(window);

socket.on(
  "server:onConnected",
  (data : CLIENT.SocketEvents.OnConnectedData) => client.onConnected(data)
);

socket.on(
  "disconnect",
  () => { client = new CLIENT.Instance(window); }
);

socket.on(
  "server:onOuterTileMoved",
  (data : CLIENT.SocketEvents.OnEntityMoveData) => {
    client.labyrinth.getOuterTile().move(data.toX, data.toY, data.animated);
  }
);

const viewport = document.getElementById("labyrinth")!;
window.addEventListener("resize", () => {
  client.camera.perspective.aspect = viewport.clientWidth / window.innerHeight;
  client.camera.perspective.updateProjectionMatrix();
  client.renderer.setSize(viewport.clientWidth, window.innerHeight);
  client.renderer.render(client.scene, client.camera.perspective);
});

// document.addEventListener("keydown", (e) {
  // if (client.phase == GamePhase.PLACE_TILE) EVENTS.rotateTile(event, client);
// });

// gameViewport.addEventListener("click", (e) => {
  // switch (client.phase) {
  //   case GamePhase.PLACE_TILE: EVENTS.placeTile(event, client); break;
  //   case GamePhase.MOVE_PLAYER: EVENTS.movePlayer(event, client); break;
  // }
// });

viewport.addEventListener("mousemove", (e) => EVENTS.selectEntry(e, socket, client));

function render() {
  requestAnimationFrame(render);
  if (client.isInitialized) {
    client.update();
    client.render();
  }
} render();
