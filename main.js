import * as THREE from "three";

import {
  OrbitCamera,
  Labyrinth,
  GamePhase,
  LaneAxis,
  Direction
} from "./gameObjects.js";

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let labyrinth = new Labyrinth(scene, 7, 1.25);

const target = (labyrinth.dimension - 1) / 2 * labyrinth.tileOffset;
const aspect = window.innerWidth / window.innerHeight;
let camera = new OrbitCamera(target, aspect, labyrinth, renderer);

window.addEventListener("resize", function() {
  camera.perspective.aspect = window.innerWidth / window.innerHeight
  camera.perspective.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.render(scene, camera.perspective);
});

document.addEventListener("keydown", function(event) {
  switch (labyrinth.gamePhase) {
    case GamePhase.SELECT_LANE: {
      switch (event.key) {
        case "ArrowUp": {
          if (labyrinth.selectedLaneY == -1) {
            labyrinth.selectedLaneY  = 1;
          }
          else if (labyrinth.selectedLaneY - 2 > 0) {
            labyrinth.selectedLaneY -= 2;
          }
          labyrinth.selectLane(LaneAxis.HORIZONTAL);
          labyrinth.fillSelectedLane("green");
        } break;

        case "ArrowDown": {
          if (labyrinth.selectedLaneY + 2 < labyrinth.dimension)
            labyrinth.selectedLaneY += 2;
          labyrinth.selectLane(LaneAxis.HORIZONTAL);
          labyrinth.fillSelectedLane("green");
        } break;

        case "ArrowLeft": {
          if (labyrinth.selectedLaneX == -1) {
            labyrinth.selectedLaneX  = 1;
          }
          else if (labyrinth.selectedLaneX - 2 > 0) {
            labyrinth.selectedLaneX -= 2;
          }
          labyrinth.selectLane(LaneAxis.VERTICAL);
          labyrinth.fillSelectedLane("green");
        } break;

        case "ArrowRight": {
          if (labyrinth.selectedLaneX + 2 < labyrinth.dimension)
            labyrinth.selectedLaneX += 2;
          labyrinth.selectLane(LaneAxis.VERTICAL);
          labyrinth.fillSelectedLane("green");
        } break;

        case "Enter": {
          labyrinth.gamePhase = GamePhase.MOVE_LANE;
          labyrinth.fillSelectedLane("yellow");
        } break;
      }
    } break;

    case GamePhase.MOVE_LANE: {
      switch (event.key) {
        case "Escape": {
          labyrinth.gamePhase = GamePhase.SELECT_LANE;
          labyrinth.fillSelectedLane("green");
        } break;

        case "ArrowLeft": {
          if (labyrinth.selectionAxis == LaneAxis.HORIZONTAL) {
            labyrinth.laneMoveDirection = Direction.LEFT;
            labyrinth.getTileOut().move(-1, labyrinth.selectedLaneY, labyrinth.tileOffset);
          }
        } break;

        case "ArrowRight": {
          if (labyrinth.selectionAxis == LaneAxis.HORIZONTAL) {
            labyrinth.laneMoveDirection = Direction.RIGHT;
            labyrinth.getTileOut().move(labyrinth.dimension, labyrinth.selectedLaneY, labyrinth.tileOffset);
          }
        } break;

        case "ArrowUp": {
          if (labyrinth.selectionAxis == LaneAxis.VERTICAL) {
            labyrinth.laneMoveDirection = Direction.UP;
            labyrinth.getTileOut().move(labyrinth.selectedLaneX, -1, labyrinth.tileOffset);
          }
        } break;

        case "ArrowDown": {
          if (labyrinth.selectionAxis == LaneAxis.VERTICAL) {
            labyrinth.laneMoveDirection = Direction.DOWN;
            labyrinth.getTileOut().move(labyrinth.selectedLaneX, labyrinth.dimension, labyrinth.tileOffset);
          }
        } break;

        case "Enter" : {          
          labyrinth.moveLane();
          labyrinth.fillSelectedLane("green");
          labyrinth.getTileOut().material.color.setColorName("white");
          //TODO: Player path finding and then GamePhase.MOVE_PLAYER 
        } break;
      }
    } break;    

    default: break;
  }
});

const raycaster = new THREE.Raycaster();
document.addEventListener('click', function(event) {
  let ndc = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  
  switch (labyrinth.gamePhase) {
    case GamePhase.MOVE_PLAYER: {
      raycaster.setFromCamera(ndc, camera.perspective);
      const intersects = raycaster.intersectObjects(labyrinth.selectedTiles);
      if (intersects.length > 0) {
        const tilePosition = intersects[0].object.position;
        labyrinth.pawns[0].move(tilePosition.x, tilePosition.z);
      }
    } break;
  }
});

function renderLoop() {
  requestAnimationFrame(renderLoop);
  renderer.render(scene, camera.perspective);
}

labyrinth.selectLane(LaneAxis.HORIZONTAL);
labyrinth.fillSelectedLane("green");
renderLoop();
