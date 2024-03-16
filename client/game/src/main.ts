import { io } from "socket.io-client";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// import * as EVENTS from "./events";
import { 
  GameClient,
  GamePhase, 
  Pawn,
  Tile,
  TileType,
  Treasure,
  OrbitCamera
} from "./game";

const gameViewport = document.getElementById("labyrinth")!;

let client = new GameClient(window);
const socket = io("http://localhost:8002");

type OnGameCreateData = {
  dimension : number
  tiles : Tile[][],
  treasures : Treasure[]
};

socket.on("game:create", (data : OnGameCreateData) => {
  const dim : number = data.dimension;
  const maxDim : number = dim - 1;
  const hDim : number = maxDim / 2;

  client.labyrinth.dimension = dim;
  client.labyrinth.maxDim = maxDim;
  client.labyrinth.hDim = hDim;  
  
  let loader = new GLTFLoader();
  const modelsPath = {
    [TileType.STRAIGHT]: "data/straight.glb",
    [TileType.CORNER]: "data/corner.glb",
    [TileType.TJUNCTION]: "data/tjunction.glb",
  };
  
  client.labyrinth.tiles = [];
  for (let x = 0; x < dim; ++x) {
    client.labyrinth.tiles[x] = [];
    for (let y = 0; y < dim; ++y) {
      client.labyrinth.tiles[x][y] = new Tile(x, y);
      client.labyrinth.tiles[x][y].type = data.tiles[x][y].type;
      client.labyrinth.tiles[x][y].rotation = data.tiles[x][y].rotation;
      client.labyrinth.tiles[x][y].treasureId = data.tiles[x][y].treasureId;
      client.labyrinth.tiles[x][y].directions = data.tiles[x][y].directions;
      loader.load(modelsPath[client.labyrinth.tiles[x][y].type], (gltf) => {
        gltf.scene.traverse((e) => { if (e.type === "Mesh") client.labyrinth.tiles[x][y].mesh = e; });
        client.labyrinth.tiles[x][y].move(x, y, false);
        client.labyrinth.tiles[x][y].mesh.rotateY(client.labyrinth.tiles[x][y].rotation);
        client.scene.add(client.labyrinth.tiles[x][y].mesh);
      });
    }
  }
  
  client.labyrinth.tiles[dim] = [new Tile(-1, dim)];
  client.labyrinth.tiles[dim][0].type = data.tiles[dim][0].type
  client.labyrinth.tiles[dim][0].rotation = data.tiles[dim][0].rotation;
  loader.load(modelsPath[client.labyrinth.tiles[dim][0].type], (gltf) => {
    gltf.scene.traverse((e) => { if (e.type === "Mesh") client.labyrinth.tiles[dim][0].mesh = e; });
    client.labyrinth.tiles[dim][0].move(-1, dim, false);
    client.labyrinth.tiles[dim][0].mesh.rotateY(client.labyrinth.tiles[dim][0].rotation);
    client.scene.add(client.labyrinth.tiles[dim][0].mesh);
  });

  client.labyrinth.treasures = []
  for (let t of data.treasures) {
    let treasure : Treasure = new Treasure(t.id, t.x, t.y);
    client.labyrinth.treasures.push(treasure);
    client.scene.add(treasure.mesh);
  }
  
  client.labyrinth.pawns = [];
  client.labyrinth.pawns.push(new Pawn(0, 0, "red"));
  client.labyrinth.pawns.push(new Pawn(maxDim, 0, "green"));
  client.labyrinth.pawns.push(new Pawn(maxDim, maxDim, "orange"));
  client.labyrinth.pawns.push(new Pawn(0, maxDim, "blue"));
  for (let pawn of client.labyrinth.pawns) client.scene.add(pawn.mesh);
  
  const aspect = gameViewport.clientWidth / window.innerHeight;
  client.camera = new OrbitCamera(aspect, client.labyrinth, client.renderer);
  gameViewport.appendChild(client.renderer.domElement);
  
  client.entities = [
    ...client.labyrinth.tiles.flat(), 
    ...client.labyrinth.pawns, 
    ...client.labyrinth.treasures
  ];
  
  client.isInitialized = true;
});

window.addEventListener("resize", function () {
  client.camera.perspective.aspect = gameViewport.clientWidth / window.innerHeight;
  client.camera.perspective.updateProjectionMatrix();
  client.renderer.setSize(gameViewport.clientWidth, window.innerHeight);
  client.renderer.render(client.scene, client.camera.perspective);
});

document.addEventListener("keydown", function(event) {
  // if (client.phase == GamePhase.PLACE_TILE) EVENTS.rotateTile(event, client);
});

gameViewport.addEventListener("click", (event) => {
  // switch (client.phase) {
  //   case GamePhase.PLACE_TILE: EVENTS.placeTile(event, client); break;
  //   case GamePhase.MOVE_PLAYER: EVENTS.movePlayer(event, client); break;
  // }
});

gameViewport.addEventListener("mousemove", (e) => {
  // if (client.phase == GamePhase.PLACE_TILE) EVENTS.moveTile(e, client);
});

function render() {
  requestAnimationFrame(render);
  if (client.isInitialized) {
    client.update();
    client.render();
  }
} render();
