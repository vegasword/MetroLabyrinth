import * as THREE from "three";
import { Game, GamePhase } from "./objects.js";
import * as EVENTS from "./events.js";

let game = new Game();

window.addEventListener("resize", function() {
  game.camera.perspective.aspect = window.innerWidth / window.innerHeight
  game.camera.perspective.updateProjectionMatrix()
  game.renderer.setSize(window.innerWidth, window.innerHeight)
  game.renderer.render(game.scene, game.camera.perspective);
});
    
document.addEventListener("keydown", function(event) {
  switch (game.gamePhase) {
    case GamePhase.SELECT_LANE:
      EVENTS.selectLaneFromKeyboard(event, game);
      break;

    case GamePhase.MOVE_LANE:
      EVENTS.moveLaneFromKeyboard(event, game);
      break;    
  }
});

document.addEventListener("click", function(event) {
  if (game.gamePhase == GamePhase.MOVE_PLAYER) {
    let ndc = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    game.raycaster.setFromCamera(ndc, camera.perspective);
    const intersects = game.raycaster.intersectObjects(labyrinth.selectedTiles);
    if (intersects.length > 0) {
      const tilePosition = intersects[0].object.position;
      labyrinth.pawns[0].move(tilePosition.x, tilePosition.z);
    }
  }
});

function render() {
  requestAnimationFrame(render);
  game.render();
} render();
