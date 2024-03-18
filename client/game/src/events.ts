import { Socket } from "socket.io-client";

import * as THREE from "three";
import * as CLIENT from "./client";

const viewport = document.getElementById("labyrinth")!;
const floor : THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const clamp = (val : number, min : number, max : number) => Math.min(Math.max(val, min), max)

export function selectEntry(e : MouseEvent, socket : Socket, client : CLIENT.Instance) {
  if (client.phase == CLIENT.Game.Phase.PLACE_TILE) {
    let ndc = new THREE.Vector2(
      (e.clientX / viewport.clientWidth) * 2 - 1.5,
      -(e.clientY / viewport.clientHeight) * 2 + 1
    );
  
    let outerTileTarget = new THREE.Vector3(0, 0, 0);
    client.raycaster.setFromCamera(ndc, client.camera.perspective);
    client.raycaster.ray.intersectPlane(floor, outerTileTarget);
    outerTileTarget.y += 0.15;
  
    let labyrinth = client.labyrinth;
    for (let entryPoint of labyrinth.entryPoints) {
      if (outerTileTarget.distanceTo(entryPoint) < 1) {
        labyrinth.selectedTile.x = clamp(entryPoint.x, 0, labyrinth.maxDim);
        labyrinth.selectedTile.y = clamp(entryPoint.z, 0, labyrinth.maxDim);
        
        if (entryPoint.x == -1 || entryPoint.x == this.dim) {
          if (entryPoint.x == -1) {
            labyrinth.entryDirection = CLIENT.Game.Direction.LEFT;
          } else if (entryPoint.x == this.dim) {
            labyrinth.entryDirection = CLIENT.Game.Direction.RIGHT;
          }
        }
        else if (entryPoint.z == -1 || entryPoint.z == this.dim) {
          if (entryPoint.z == -1) {
            labyrinth.entryDirection = CLIENT.Game.Direction.UP;
          } else if (entryPoint.z == this.dim) {
            labyrinth.entryDirection = CLIENT.Game.Direction.DOWN;
          }
        }
        
        socket.emit("client:onSelectEntry", entryPoint);
        
        return;
      }
    }
  }
}
  
/*
export function rotateTile(event : KeyboardEvent, client : GameClient) {
  if (client.phase == CLIENT.GamePhase.PLACE_TILE && event.key == " " || event.key == 'r') 
    client.labyrinth.rotateOuterTile();
}
  
export function placeTile(event : MouseEvent, client : GameClient) {
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

export function movePlayer(e : MouseEvent, client : GameClient) {
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
*/
