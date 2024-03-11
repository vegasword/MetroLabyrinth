import { Game, GamePhase } from "./objects.js";
import * as EVENTS from "./events.js";

let game = new Game(window);

window.addEventListener("resize", function() {
  game.camera.perspective.aspect = window.innerWidth / window.innerHeight;
  game.camera.perspective.updateProjectionMatrix();
  game.renderer.setSize(window.innerWidth, window.innerHeight);
  game.renderer.render(game.scene, game.camera.perspective);
});
    
document.addEventListener("keydown", function(event) {
  if (game.phase == GamePhase.PLACE_TILE) EVENTS.rotateTile(event, game);
});

document.addEventListener("click", (event) => {
  switch (game.phase) {
    case GamePhase.PLACE_TILE: EVENTS.placeTile(event, game); break;
    case GamePhase.MOVE_PLAYER: EVENTS.movePlayer(event, game); break;
  }
});

document.addEventListener("mousemove", (e) => {
  if (game.phase == GamePhase.PLACE_TILE) EVENTS.moveTile(e, game);
});

function render() {
  requestAnimationFrame(render);
  game.update();
  game.render();
} render();
