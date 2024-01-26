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
  switch (game.phase) {      
    case GamePhase.SELECT_LANE: EVENTS.selectLane(event, game); break;
    case GamePhase.MOVE_LANE: EVENTS.moveLane(event, game); break;    
  }
});

document.addEventListener("click", (event) => EVENTS.movePlayer(event, game));

function render() {
  requestAnimationFrame(render);
  game.render();
} render();
