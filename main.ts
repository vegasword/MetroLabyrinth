import { Game, GamePhase } from "./objects.js";
import * as EVENTS from "./events.js";

//TODO: Instanced based rendering
// https://threejs.org/docs/?q=scene#examples/en/utils/SceneUtils.createMeshesFromInstancedMesh
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_instancing_performance.html

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
    default: break;
  }
});

document.addEventListener("click", (e) => {
  if (game.phase == GamePhase.MOVE_PLAYER) EVENTS.movePlayer(e, game);
});

document.addEventListener("mousemove", (e) => {
  if (game.phase == GamePhase.SELECT_LANE) EVENTS.moveOuterTile(e, game);
});

function render() {
  requestAnimationFrame(render);
  game.render();
} render();
