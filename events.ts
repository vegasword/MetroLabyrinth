import * as THREE from "three";
import {Game, GamePhase, LaneAxis, Direction } from "./objects.js";

export function selectLane(event : KeyboardEvent, game : Game) {
  switch (event.key) {    
    case " ":
    case "r": {
      game.labyrinth.rotateOuterTile();
    } break;
      
    case "ArrowUp": {
      if (game.labyrinth.selectedLaneY - 2 > 0) {
        game.labyrinth.selectedLaneY -= 2;
      }
      else {
        game.labyrinth.selectedLaneY = game.labyrinth.dimension - 2;
      }
      game.labyrinth.selectLane(LaneAxis.HORIZONTAL);
      game.labyrinth.moveOuterTile(-1, game.labyrinth.selectedLaneY);
    } break;

    case "ArrowDown": {
      if (game.labyrinth.selectedLaneY + 2 < game.labyrinth.dimension) {
        game.labyrinth.selectedLaneY += 2;
      }
      else {
        game.labyrinth.selectedLaneY = 1;
      }
      game.labyrinth.selectLane(LaneAxis.HORIZONTAL);
      game.labyrinth.moveOuterTile(-1, game.labyrinth.selectedLaneY);
    } break;

    case "ArrowLeft": {
      if (game.labyrinth.selectedLaneX - 2 > 0) {
        game.labyrinth.selectedLaneX -= 2;
      }
      else {
        game.labyrinth.selectedLaneX = game.labyrinth.dimension - 2;
      }
      game.labyrinth.selectLane(LaneAxis.VERTICAL);
      game.labyrinth.moveOuterTile(game.labyrinth.selectedLaneX, -1);
    } break;

    case "ArrowRight": {
      if (game.labyrinth.selectedLaneX + 2 < game.labyrinth.dimension) {
        game.labyrinth.selectedLaneX += 2;
      }
      else {
        game.labyrinth.selectedLaneX = 1;
      }
      game.labyrinth.selectLane(LaneAxis.VERTICAL);
      game.labyrinth.moveOuterTile(game.labyrinth.selectedLaneX, -1);
    } break;

    case "Enter": {
      if (game.labyrinth.selectionAxis == LaneAxis.VERTICAL &&
          game.labyrinth.laneEntryPoint != Direction.UP  &&
          game.labyrinth.laneEntryPoint != Direction.DOWN) 
      {
        game.labyrinth.laneEntryPoint = Direction.UP
      }
      else if (game.labyrinth.selectionAxis == LaneAxis.HORIZONTAL &&
               game.labyrinth.laneEntryPoint != Direction.LEFT  &&
               game.labyrinth.laneEntryPoint != Direction.RIGHT)
      {
        game.labyrinth.laneEntryPoint = Direction.LEFT
      }
      game.labyrinth.moveOuterTileToEntryPoint();

      game.phase = GamePhase.MOVE_LANE;
    } break;
  }
}

export function moveLane(event : KeyboardEvent, game : Game) {
  switch (event.key) {
    case " ":
    case "r": {
      game.labyrinth.rotateOuterTile();
    } break;
    
    case "Escape": {
      game.phase = GamePhase.SELECT_LANE;
    } break;

    case "ArrowLeft": {
      if (game.labyrinth.selectionAxis == LaneAxis.HORIZONTAL) {
        game.labyrinth.laneEntryPoint = Direction.LEFT;
        game.labyrinth.moveOuterTileToEntryPoint();
      }
    } break;

    case "ArrowRight": {
      if (game.labyrinth.selectionAxis == LaneAxis.HORIZONTAL) {
        game.labyrinth.laneEntryPoint = Direction.RIGHT;
        game.labyrinth.moveOuterTileToEntryPoint();
      }
    } break;

    case "ArrowUp": {
      if (game.labyrinth.selectionAxis == LaneAxis.VERTICAL) {
        game.labyrinth.laneEntryPoint = Direction.UP;
        game.labyrinth.moveOuterTileToEntryPoint();
      }
    } break;

    case "ArrowDown": {
      if (game.labyrinth.selectionAxis == LaneAxis.VERTICAL) {
        game.labyrinth.laneEntryPoint = Direction.DOWN;
        game.labyrinth.moveOuterTileToEntryPoint();
      }
    } break;

    case "Enter": {
      game.phase = GamePhase.MOVE_PLAYER;
      game.labyrinth.moveLane();
      game.labyrinth.playerPathFinding(game.getPlayerTile());
      if (game.labyrinth.pathFoundTiles.length == 1) game.nextRound();
    } break;
  }
}

export function movePlayer(e : MouseEvent, game : Game) {
  if (game.phase == GamePhase.MOVE_PLAYER) {
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

const plane : THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export function moveOuterTile(e : MouseEvent, game : Game) {
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
  if (outerTile.treasureId != undefined)
    game.labyrinth.treasures[outerTile.treasureId].mesh.position.set(
      outerTile.mesh.position.x, planeTarget.y + 0.1, outerTile.mesh.position.z);
}  
