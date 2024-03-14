import { io } from "socket.io-client";
const socket = io("http://localhost:3000")

import * as EVENTS from "./events";
import { GameClient, GamePhase } from "./objects";

const gameViewport = document.getElementById("labyrinth")!;

let game = new GameClient(window, socket);

game.socket.on("game:create", (game) => {
  console.log(game);
});

window.addEventListener("resize", function () {
  game.camera.perspective.aspect = gameViewport.clientWidth / window.innerHeight;
  game.camera.perspective.updateProjectionMatrix();
  game.renderer.setSize(gameViewport.clientWidth, window.innerHeight);
  game.renderer.render(game.scene, game.camera.perspective);
});

document.addEventListener("keydown", function(event) {
  if (game.phase == GamePhase.PLACE_TILE) EVENTS.rotateTile(event, game);
});

gameViewport.addEventListener("click", (event) => {
  switch (game.phase) {
    case GamePhase.PLACE_TILE: EVENTS.placeTile(event, game); break;
    case GamePhase.MOVE_PLAYER: EVENTS.movePlayer(event, game); break;
  }
});

gameViewport.addEventListener("mousemove", (e) => {
  if (game.phase == GamePhase.PLACE_TILE) EVENTS.moveTile(e, game);
});

function render() {
  requestAnimationFrame(render);
  game.update();
  game.render();
} render();

let understoodButton = document.getElementById("understoodButton");
let main = document.getElementsByTagName("main")[0];
let howToPlayPopup = document.getElementById("howToPlay-popup");

understoodButton?.addEventListener("click", () => {
  howToPlayPopup?.classList.remove("fadeFromTopOpacity");
  howToPlayPopup?.classList.add("fadeFromBottomOpacity");
  main.classList.remove("darken");
});
