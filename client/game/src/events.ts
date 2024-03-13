//TODO: Replace all the game.labyrinth local stuff to sockets
import * as THREE from "three";
import {Game, GamePhase } from "./objects.js";
import { io } from "socket.io-client";

const socket = io("localhost:8080")

const gameViewport = document.getElementById("labyrinth")!;

const plane : THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export function moveTile(e : MouseEvent, game : Game) {      
  let ndc = new THREE.Vector2(
    (e.clientX / gameViewport.clientWidth) * 2 - 1.5,
    -(e.clientY / gameViewport.clientHeight) * 2 + 1
  );
  
  let outerTile = game.labyrinth.tiles[game.labyrinth.dim][0];
  let outerTileTarget = new THREE.Vector3(0, 0, 0);
  game.raycaster.setFromCamera(ndc, game.camera.perspective);
  game.raycaster.ray.intersectPlane(plane, outerTileTarget);
  outerTileTarget.y += 0.15;
  
  if (game.phase == GamePhase.PLACE_TILE) {
    for (let entryPoint of game.labyrinth.entryPoints) {
      if (outerTileTarget.distanceTo(entryPoint) < 1)
      {
        outerTile.move(entryPoint.x, entryPoint.z);
        game.labyrinth.moveTreasureIfExists(outerTile, entryPoint.x, entryPoint.z);
        game.labyrinth.selectLane(entryPoint);
        return;
      }
    }
  }
}
  
export function rotateTile(event : KeyboardEvent, game : Game) {
  if (event.key == " " || event.key == 'r') game.labyrinth.rotateOuterTile();
}
  
export function placeTile(event : MouseEvent, game : Game) {
  if (event.button == 0) {
    game.labyrinth.moveLane();
    game.labyrinth.playerPathFinding(game.getPlayerTile());
    if (game.labyrinth.pathFoundTiles.length == 1) {
      game.nextRound();
      game.phase = GamePhase.PLACE_TILE;
    } else {
      game.phase = GamePhase.MOVE_PLAYER;
    }
  }
}

export function movePlayer(e : MouseEvent, game : Game) {
  if (e.button == 0) {
    let ndc = new THREE.Vector2(
      (e.clientX / gameViewport.clientWidth) * 2 - 1.5,
      -(e.clientY / gameViewport.clientHeight) * 2 + 1
    );
    game.raycaster.setFromCamera(ndc, game.camera.perspective);
    
    const pathFoundTilesMeshes = game.labyrinth.pathFoundTiles.map(({mesh})=>mesh);
    let intersects = game.raycaster.intersectObjects(pathFoundTilesMeshes);
    if (intersects.length > 0) {
      let tilePosition = intersects[0].object.position;
      game.labyrinth.pawns[game.currentPawn].move(tilePosition.x, tilePosition.z);
      game.phase = GamePhase.PLACE_TILE;
      game.nextRound();
    }
  }
}
