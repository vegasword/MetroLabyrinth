import { io } from "socket.io-client";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import * as EVENTS from "./events";
import { 
  GameClient, 
  GamePhase,
  Labyrinth,
  Entity,
  Tile,
  TileType,
  Treasure,
  Direction,
  OrbitCamera
} from "./objects";

const socket = io("http://localhost:8002");

const gameViewport = document.getElementById("labyrinth")!;

let client = new GameClient(window);

type OnGameCreateData = {
  dimension : number
  tiles : Tile[][],
  treasures : Treasure[]
};

socket.on("game:create", (data : OnGameCreateData) => {
  const dim : number = data.dimension;
  const maxDim : number = dim - 1;
  const hDim : number = maxDim / 2;
  let loader = new GLTFLoader();
  const modelsPath = {
    [TileType.STRAIGHT]: "data/straight.glb",
    [TileType.CORNER]: "data/corner.glb",
    [TileType.TJUNCTION]: "data/tjunction.glb",
  };

  client.labyrinth.dimension = dim;
  client.labyrinth.maxDim = maxDim;
  client.labyrinth.hDim = hDim;  
  
  console.log(data.tiles);
  client.labyrinth.tiles = Array.from(data.tiles);
  for (let x = 0; x < dim; ++x) {
    // client.labyrinth.tiles = [];
    for (let y = 0; y < dim; ++y) {
      // client.labyrinth.tiles[x] = [new Tile(x, y)];
      // client.labyrinth.tiles[x][y].type = data.tiles[x][y].type;
      // client.labyrinth.tiles[x][y].treasureId = data.tiles[x][y].treasureId;
      // client.labyrinth.tiles[x][y].directions = Array.from(data.tiles[x][y].directions);
      loader.load(modelsPath[client.labyrinth.tiles[x][y].type], (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.type == "Mesh") client.labyrinth.tiles[x][y].mesh = child;
          client.scene.add(client.labyrinth.tiles[x][y].mesh);
        });
      });
      client.labyrinth.tiles[x][y].move(x, y, false);
    }
  }
  
  const aspect = gameViewport.clientWidth / window.innerHeight;
  client.camera = new OrbitCamera(aspect, client.labyrinth, client.renderer);
  gameViewport.appendChild(client.renderer.domElement);
  
  // client.entities = [
  //   ...client.labyrinth.tiles.flat(), 
  //   ...client.labyrinth.pawns, 
  //   ...client.labyrinth.treasures
  // ];
});

window.addEventListener("resize", function () {
  if (client.camera.perspective) {
    client.camera.perspective.aspect = gameViewport.clientWidth / window.innerHeight;
    client.camera.perspective.updateProjectionMatrix();
  }
  if (client.renderer) {
    client.renderer.setSize(gameViewport.clientWidth, window.innerHeight);
    client.renderer.render(client.scene, client.camera.perspective);
  }
});

document.addEventListener("keydown", function(event) {
  if (client.phase == GamePhase.PLACE_TILE) EVENTS.rotateTile(event, client);
});

gameViewport.addEventListener("click", (event) => {
  switch (client.phase) {
    case GamePhase.PLACE_TILE: EVENTS.placeTile(event, client); break;
    case GamePhase.MOVE_PLAYER: EVENTS.movePlayer(event, client); break;
  }
});

gameViewport.addEventListener("mousemove", (e) => {
  if (client.phase == GamePhase.PLACE_TILE) EVENTS.moveTile(e, client);
});

function render() {
  requestAnimationFrame(render);
  //client.update();
  // client.render();
} render();
