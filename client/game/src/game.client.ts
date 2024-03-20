import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { io } from "socket.io-client";

import * as GAME from "./game";

let game = new GAME.Instance(window);
const socket = io("http://localhost:8002");
const viewport = document.getElementById("labyrinth")!;

window.addEventListener("resize", () => {
  game.camera.perspective.aspect = viewport.clientWidth / window.innerHeight;
  game.camera.perspective.updateProjectionMatrix();
  game.renderer.setSize(viewport.clientWidth, window.innerHeight);
  game.renderer.render(game.scene, game.camera.perspective);
});

document.addEventListener("keydown", (e) => {
  if (game.phase == GAME.Phase.PLACE_TILE && e.key == ' ' || e.key == 'r') {
    socket.emit("client:rotateTile");
  }
});

const floor : THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const clamp = (val : number, min : number, max : number) => Math.min(Math.max(val, min), max)

viewport.addEventListener("mousemove", (e) => {
  if (game.phase == GAME.Phase.PLACE_TILE) {
    let ndc = new THREE.Vector2(
      (e.clientX / viewport.clientWidth) * 2 - 1.5,
      -(e.clientY / viewport.clientHeight) * 2 + 1
    );
  
    let outerTileTarget = new THREE.Vector3(0, 0, 0);
    game.raycaster.setFromCamera(ndc, game.camera.perspective);
    game.raycaster.ray.intersectPlane(floor, outerTileTarget);
    outerTileTarget.y += 0.15;
  
    let labyrinth = game.labyrinth;
    for (let entryPoint of labyrinth.entryPoints) {
      if (outerTileTarget.distanceTo(entryPoint) < 1) {
        labyrinth.selectedTile.x = clamp(entryPoint.x, 0, labyrinth.maxDim);
        labyrinth.selectedTile.y = clamp(entryPoint.z, 0, labyrinth.maxDim);
        
        if (entryPoint.x == -1 || entryPoint.x == game.labyrinth.dimension) {
          if (entryPoint.x == -1) {
            labyrinth.entryDirection = GAME.Direction.LEFT;
          } else if (entryPoint.x == game.labyrinth.dimension) {
            labyrinth.entryDirection = GAME.Direction.RIGHT;
          }
        }
        else if (entryPoint.z == -1 || entryPoint.z == game.labyrinth.dimension) {
          if (entryPoint.z == -1) {
            labyrinth.entryDirection = GAME.Direction.UP;
          } else if (entryPoint.z == game.labyrinth.dimension) {
            labyrinth.entryDirection = GAME.Direction.DOWN;
          }
        }
        
        socket.emit("client:selectEntry", entryPoint);
        
        return;
      }
    }
  }
});

// viewport.addEventListener("click", (e) => {
  // switch (game.phase) {
  //   case GamePhase.PLACE_TILE: EVENTS.placeTile(event, game); break;
  //   case GamePhase.MOVE_PLAYER: EVENTS.movePlayer(event, game); break;
  // }
// });

namespace ServerSocketData {
  export interface OnConnected {
    dimension : number;
    phase : GAME.Phase;
    tiles : GAME.Tile[][];
    pawns : GAME.Pawn[];
    treasures : GAME.Treasure[];
  }
  
  export interface MoveEntity {
    id : string;
    fromX ?: number;
    fromY ?: number;
    x : number;
    y : number;
    animated ?: boolean;
  }
  
  export interface RotateTile {
    directions : GAME.Direction[],
    rotation : number
  }
}

socket.on(
  "server:onConnected",
  (data : ServerSocketData.OnConnected) => {
    game.phase = data.phase;
    
    const dim : number = data.dimension;
    const maxDim : number = dim - 1;
    const hDim : number = maxDim / 2;

    game.labyrinth.dimension = dim;
    game.labyrinth.maxDim = maxDim;
    game.labyrinth.hDim = hDim;  
  
    let loader = new GLTFLoader();
    const modelsPath = {
      [GAME.TileType.STRAIGHT]: "data/straight.glb",
      [GAME.TileType.CORNER]: "data/corner.glb",
      [GAME.TileType.TJUNCTION]: "data/tjunction.glb",
    };
  
    game.labyrinth.tiles = [];
    game.labyrinth.entryPoints = [];
    for (let x = 0; x < dim; ++x) {
      game.labyrinth.tiles[x] = [];
      for (let y = 0; y < dim; ++y) {
        let gameTile = game.labyrinth.tiles[x][y];
        let tileData = data.tiles[x][y];
        gameTile = new GAME.Tile(x, y);
        gameTile.id = tileData.id;
        gameTile.type = tileData.type;
        gameTile.rotation = tileData.rotation;
        gameTile.treasureId = tileData.treasureId;
        gameTile.directions = tileData.directions;
        loader.load(modelsPath[gameTile.type], (gltf) => {
          gltf.scene.traverse((e) => { 
            if (e.type == "Mesh") gameTile.mesh = e; 
          });
          gameTile.move(x, y, false);
          gameTile.mesh.rotateY(gameTile.rotation);
          game.scene.add(gameTile.mesh);
        });

        if (((x != 0 && x != game.labyrinth.maxDim) ||
             (y != 0 && y != game.labyrinth.maxDim)) &&
             (x % 2 != 0 || y % 2 != 0))
        {
          if (y == 0) {
            game.labyrinth.entryPoints.push(new THREE.Vector3(x, 0, -1));
          } else if (x == 0) {
            game.labyrinth.entryPoints.push(new THREE.Vector3(-1, 0, y));
          } else if (y == game.labyrinth.maxDim) {
            game.labyrinth.entryPoints.push(new THREE.Vector3(x, 0, game.labyrinth.dimension));
          } else if (x == game.labyrinth.maxDim) {
            game.labyrinth.entryPoints.push(new THREE.Vector3(game.labyrinth.dimension, 0, y));
          }
        }
      }
    }  
    
    game.labyrinth.tiles[dim] = [new GAME.Tile(-1, dim)];
    let outerTile = game.labyrinth.tiles[dim][0];
    let outerTileData = data.tiles[dim][0];
    outerTile.id = outerTileData.id;
    outerTile.type = outerTileData.type
    outerTile.rotation = outerTileData.rotation;
    loader.load(modelsPath[outerTile.type], (gltf) => {
      gltf.scene.traverse((e) => { if (e.type == "Mesh") outerTile.mesh = e; });
      outerTile.move(-1, dim, false);
      outerTile.mesh.rotateY(outerTile.rotation);
      game.scene.add(outerTile.mesh);
    });

    game.labyrinth.treasures = []
    for (let t of data.treasures) {
      let treasure = new GAME.Treasure(t.x, t.y);
      treasure.id = t.id;
      game.labyrinth.treasures.push(treasure);
      game.scene.add(treasure.mesh);
    }
  
    game.labyrinth.pawns = [];
    game.labyrinth.pawns.push(new GAME.Pawn(0, 0, "red"));
    game.labyrinth.pawns.push(new GAME.Pawn(maxDim, 0, "green"));
    game.labyrinth.pawns.push(new GAME.Pawn(maxDim, maxDim, "orange"));
    game.labyrinth.pawns.push(new GAME.Pawn(0, maxDim, "blue"));
    for (let i = 0; i < 4; ++i) game.labyrinth.pawns[i].id = data.pawns[i].id;
    for (let pawn of game.labyrinth.pawns) game.scene.add(pawn.mesh);
  
    const viewport : HTMLElement = document.getElementById("labyrinth")!;
    const aspect = viewport.clientWidth / window.innerHeight;
    game.camera = new GAME.OrbitCamera(aspect, game.labyrinth, game.renderer);
    
    const canvas  = viewport.querySelector("canvas");
    if (canvas) {
      viewport.replaceChild<HTMLCanvasElement>(game.renderer.domElement, canvas);
    } else {
      viewport.appendChild(game.renderer.domElement);
    }
  
    game.entities = [
      ...game.labyrinth.tiles.flat(), 
      ...game.labyrinth.pawns, 
      ...game.labyrinth.treasures
    ];
  
    game.isInitialized = true;
  }
);

socket.on(
  "disconnect",
  () => { game = new GAME.Instance(window); }
);

socket.on(
  "server:moveEntity",
  (data : ServerSocketData.MoveEntity) => {
    game.getEntityById(data.id)?.move(data.x, data.y, data.animated);
  }
);

socket.on(
  "server:rotateTile",
  (data : ServerSocketData.RotateTile) => {
    let outerTile = game.labyrinth.getOuterTile();
    outerTile.directions = data.directions;
    outerTile.rotation = data.rotation;
    outerTile.mesh.rotateY(data.rotation);
  }
)

function render() {
  requestAnimationFrame(render);
  if (game.isInitialized) {
    game.update();
    game.render();
  }
} render();
