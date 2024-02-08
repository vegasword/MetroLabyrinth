import * as THREE from "three";
import {Game, GamePhase } from "./objects.js";

const plane : THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export function moveTile(e : MouseEvent, game : Game) {      
  let ndc = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
  
  let planeTarget = new THREE.Vector3(0, 0, 0);
  game.raycaster.setFromCamera(ndc, game.camera.perspective);
  game.raycaster.ray.intersectPlane(plane, planeTarget);
  planeTarget.y += 0.15;
  
  let outerTile = game.getOuterTile();
  outerTile.mesh.position.copy(planeTarget);
  if (outerTile.treasureId != undefined) {
    game.labyrinth.treasures[outerTile.treasureId].mesh.position.set(
      outerTile.mesh.position.x, planeTarget.y + 0.1, outerTile.mesh.position.z);
  }

  if (game.phase == GamePhase.PLACE_TILE) {
    if (game.currentEntry == undefined) {
      for (let entryPoint of game.labyrinth.entryPoints) {
        if (outerTile.mesh.position.distanceTo(entryPoint) < 1) {
          game.currentEntry = entryPoint;
          game.time.start();
          break;
        }
      }
    } else if (outerTile.mesh.position.distanceTo(game.currentEntry) > 1) {
      game.time.stop();
      game.currentEntry = undefined;
    }
  }
}  
  
export function rotateTile(event : KeyboardEvent, game : Game) {
  if (event.key == " " || event.key == 'r') game.labyrinth.rotateOuterTile();
}
  
export function placeTile(event : MouseEvent, game : Game) {
  if (event.button == 0) {
    game.phase = GamePhase.MOVE_PLAYER;
    game.labyrinth.moveLane();
    game.labyrinth.playerPathFinding(game.getPlayerTile());
    if (game.labyrinth.pathFoundTiles.length == 1) game.nextRound();
  }
}

export function movePlayer(e : MouseEvent, game : Game) {
  if (e.button == 0) {
    let ndc = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    game.raycaster.setFromCamera(ndc, game.camera.perspective);
    
    const pathFoundTilesMeshes = game.labyrinth.pathFoundTiles.map(({mesh})=>mesh);
    let intersects = game.raycaster.intersectObjects(pathFoundTilesMeshes);
    if (intersects.length > 0) {
      let tilePosition = intersects[0].object.position;
      game.labyrinth.pawns[game.currentPawn].move(tilePosition.x, tilePosition.z);
      game.nextRound();
    }
  }
}
