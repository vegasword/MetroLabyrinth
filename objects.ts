import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

enum GamePhase {"PLACE_TILE", "MOVE_PLAYER"};
enum Direction {"UP", "RIGHT", "DOWN", "LEFT"};
enum TileType {"STRAIGHT", "CORNER", "TJUNCTION"};
enum Rotation {"CLOCKWISE" = -1,"COUNTERCLOCKWISE" = 1};

class Entity {
  x : number;
  y : number;
  mesh : THREE.Object3D;
  
  constructor(x : number, y : number, mesh : THREE.Object3D) {
    this.x = x;
    this.y = y; 
    this.mesh = mesh;
  }

  move(x : number, y : number) {
    this.x = x;
    this.y = y;
    this.mesh.position.setX(x);
    this.mesh.position.setZ(y);
  }
}

class Treasure extends Entity {
  id : number;
  
  constructor(id : number, x : number, y : number) {        
    let geometry = new THREE.CircleGeometry(0.15, 8);
    let material = new THREE.MeshBasicMaterial({color: 0xffffff});
    let mesh =  new THREE.Mesh(geometry, material);
    mesh.position.setX(x);
    mesh.position.setY(0.1);
    mesh.position.setZ(y);
    mesh.rotateX(-Math.PI / 2);    
    super(x, y, mesh);
    this.id = id;
  }
}

class Pawn extends Entity {
  remainingTreasures : number[];
  hasMoved : boolean;
  
  constructor(x : number, y : number, color : string) {    
    let geometry = new THREE.CapsuleGeometry(0.25, 0.5, 1, 4);
    let material = new THREE.MeshBasicMaterial();
    material.color.setColorName(color);
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, geometry.parameters.length, y);
    
    super(x, y, mesh);
    
    this.remainingTreasures = [];
    this.hasMoved = false;
  }
}

class Tile extends Entity {
  type : TileType;
  treasureId : number;
  directions : Direction[];
  
  constructor(x : number, y : number) {    
    super(x, y, new THREE.Object3D());
    this.directions = [];
  }

  rotate(n : number = 1, rotationDirection : Rotation = Rotation.CLOCKWISE) {
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < this.directions.length; ++j) {
        this.directions[j] -= rotationDirection;
        if (rotationDirection == Rotation.CLOCKWISE) {
          if (this.directions[j] > Direction.LEFT) {
            this.directions[j] = Direction.UP;
          }
        } else {
          if (this.directions[j] < Direction.UP) {
            this.directions[j] = Direction.LEFT;
          }
        }
      }
      this.mesh.rotateY(rotationDirection * Math.PI / 2);
    }
  }

  setType(type : TileType) {    
    this.type = type;
    switch (type) {
      case TileType.STRAIGHT: {
        this.directions.push(Direction.UP, Direction.DOWN);
      } break;
        
      case TileType.CORNER: {
        this.directions.push(Direction.RIGHT, Direction.DOWN);
      } break;
        
      case TileType.TJUNCTION: {
        this.directions.push(Direction.UP, Direction.DOWN, Direction.RIGHT);
      } break;
    }
  }
  
  setRandomType() {
    this.setType(Math.round(Math.random() * TileType.TJUNCTION));
  }

  rotateRandomly() {
    let doShuffle : boolean = Math.round(Math.random()) == 1;
    let nShuffle = Math.round(Math.random() * 4);
    
    switch (this.type) {
      case TileType.STRAIGHT: {        
        if (doShuffle) this.rotate();
      } break;

      case TileType.CORNER: {
        for (let i = 0; i < nShuffle; ++i) {
          if (doShuffle) this.rotate();
          else this.rotate(1, Rotation.COUNTERCLOCKWISE);
        }
      } break;

      case TileType.TJUNCTION: {
        for (let i = 0; i < nShuffle; ++i) {
          if (doShuffle) this.rotate();
          else this.rotate(1, Rotation.COUNTERCLOCKWISE);
        }
      } break;
    }
  }
}

function shuffle(arr : any[]) {
  let i : number = arr.length;
  let j : number;
  while (i--) {
    j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

class Labyrinth {
  laneEntryPoint : Direction;  
  selectedX : number;
  selectedY : number;
  
  dim : number;
  maxDim : number;
  hDim : number;
  nTreasures : number;
  
  tiles : Tile[][];
  selectedTiles : Tile[];
  pathFoundTiles : Tile[];
  entryPoints : THREE.Vector3[]
  pawns : Pawn[]
  treasures : Treasure[];

  constructor(scene : THREE.Scene, dimension : number) {
    if (dimension % 2 == 0 && dimension > 7) {
      alert("The dimension should be odd and superior to 7!");
      return;
    }

    this.laneEntryPoint = Direction.LEFT;

    this.selectedX = -1;
    this.selectedY = 1;
    this.dim = dimension;
    this.maxDim = this.dim - 1;
    this.hDim = this.maxDim / 2;

    this.selectedTiles = [];
    this.pathFoundTiles = [];
    this.entryPoints = [];

    this.tiles = [];
    for (let x = 0; x < this.dim; ++x) {
      this.tiles[x] = [];
      for (let y = 0; y < this.dim; ++y) {
        this.tiles[x][y] = new Tile(x, y);
      }
    }

    let outerTile = new Tile(-1, dimension);
    outerTile.setRandomType();
    this.tiles[this.dim] = [outerTile];

    this.pawns = [];
    this.pawns.push(new Pawn(0, 0, "red"));
    this.pawns.push(new Pawn(this.maxDim, 0, "green"));
    this.pawns.push(new Pawn(this.maxDim, this.maxDim, "orange"));
    this.pawns.push(new Pawn(0, this.maxDim, "blue"));
    for (let pawn of this.pawns) scene.add(pawn.mesh);
    
    this.treasures = [];
    this.nTreasures = Math.floor(24 * this.dim / 7);
    
    let treasureId = 0;
    let everyTreasuresCoords : any[] = [];
    let availableTreasureRandomSlots : any[] = [];
    
    for (let x = 0; x < this.dim; x++) {
      for (let y = 0; y < this.dim; y++) {
        if ((x != 0 && x != this.maxDim) || (y != 0 && y != this.maxDim)) {
          if (x % 2 == 0 && y % 2 == 0) {
            this.tiles[x][y].setType(TileType.TJUNCTION);
            everyTreasuresCoords.push({x: x, y: y})
          } else {
            availableTreasureRandomSlots.push({x: x, y: y});
          }
        }
      }
    }

    let randomTreasures = shuffle(availableTreasureRandomSlots)
                          .slice(0, this.nTreasures / 2);
    
    for (let t of randomTreasures) everyTreasuresCoords.push({x: t.x, y: t.y});
        
    const treasuresPerPawn = Math.round(this.nTreasures / this.pawns.length);
    for (let i = 0; i < this.pawns.length; ++i) {
      
      let pawnTreasures = shuffle(everyTreasuresCoords)
                         .splice(0, treasuresPerPawn);
      
      for (let j = 0; j < pawnTreasures.length; ++j) {
        this.treasures.push(
          new Treasure(treasureId, pawnTreasures[j].x, pawnTreasures[j].y));        
        
        scene.add(this.treasures[i * pawnTreasures.length + j].mesh);
        
        this.pawns[i].remainingTreasures.push(treasureId);
        this.tiles[pawnTreasures[j].x][pawnTreasures[j].y].treasureId = treasureId;
        treasureId++;
      }
      this.pawns[i].remainingTreasures[0] = i * treasuresPerPawn;
    }

    let randomTiles : TileType[] = [];
    let quotaRandomTiles = {
      [TileType.STRAIGHT]: Math.round(this.dim * this.dim / 28 * this.dim),
      [TileType.CORNER]: Math.round(this.dim * this.dim / 21 * this.dim),
      [TileType.TJUNCTION]: Math.round(this.dim * this.dim / 57  * this.dim)
    };
    quotaRandomTiles[outerTile.type]--;
    
    function fillTilesType(type : TileType) {
      for (let i = 0; i < quotaRandomTiles[type]; ++i) randomTiles.push(type);
    }
    fillTilesType(TileType.STRAIGHT);
    fillTilesType(TileType.CORNER);
    fillTilesType(TileType.TJUNCTION);
    randomTiles = shuffle(randomTiles);

    this.tiles[0][0].type = TileType.CORNER;
    this.tiles[0][this.maxDim].type = TileType.CORNER;
    this.tiles[this.maxDim][0].type = TileType.CORNER;
    this.tiles[this.maxDim][this.maxDim].type = TileType.CORNER;
    
    let loader = new GLTFLoader();
    const modelsPath = {
      [TileType.STRAIGHT]: "data/straight.glb",
      [TileType.CORNER]: "data/corner.glb",
      [TileType.TJUNCTION]: "data/tjunction.glb",
    };
        
    let randomTileIndex = 0;
    for (let x = 0; x < this.dim; x++) {
      for (let y = 0; y < this.dim; y++) {
        if (this.tiles[x][y].type == undefined) {
          this.tiles[x][y].setType(randomTiles[randomTileIndex]);
          randomTileIndex++;
        }
        
        loader.load(modelsPath[this.tiles[x][y].type], (gltf) => {
          gltf.scene.traverse((child) => {
            if (child.type == "Mesh") this.tiles[x][y].mesh = child;
          });
          
          this.tiles[x][y].move(x, y);
          
          if ((x != 0 && x != this.maxDim) || (y != 0 && y != this.maxDim)) {
            if (x % 2 == 0 && y % 2 == 0) {
              if (y == 0) this.tiles[x][y].rotate();
              else if (x == 0) this.tiles[x][y].rotate(-1);
              else if (y == this.maxDim) this.tiles[x][y].rotate(3);
              else if (x == this.maxDim) this.tiles[x][y].rotate(2);
              else if (x < this.hDim && y < this.hDim) this.tiles[x][y].rotate(-1);
              else if (x < this.hDim && y > this.hDim) this.tiles[x][y].rotate(3);
              else if (x > this.hDim && y < this.hDim) this.tiles[x][y].rotate();
              else if (x > this.hDim && y > this.hDim) this.tiles[x][y].rotate(2);
            } else if (x % 2 != 0 || y % 2 != 0) {
              this.tiles[x][y].rotateRandomly();
              if (y == 0) this.entryPoints.push(new THREE.Vector3(x, 0, -1));
              else if (x == 0) this.entryPoints.push(new THREE.Vector3(-1, 0, y));
              else if (y == this.maxDim) this.entryPoints.push(new THREE.Vector3(x, 0, this.dim));
              else if (x == this.maxDim) this.entryPoints.push(new THREE.Vector3(this.dim, 0, y));
            }
          } else {
            this.tiles[x][y].directions = [Direction.RIGHT, Direction.DOWN];
            if (x == 0 && y == this.maxDim) this.tiles[x][y].rotate(1, Rotation.COUNTERCLOCKWISE);
            else if (x == this.maxDim && y == 0) this.tiles[this.maxDim][0].rotate();
            else if (x == this.maxDim && y == this.maxDim) this.tiles[this.maxDim][this.maxDim].rotate(2);
          }
          
          scene.add(this.tiles[x][y].mesh);
        });
      }
    }

    loader.load(modelsPath[outerTile.type], (gltf) => {
      gltf.scene.traverse((child) => {
        if (child.type == "Mesh") outerTile.mesh = child;
      });
      outerTile.move(-1, 1);
      outerTile.rotateRandomly();
      scene.add(outerTile.mesh);    
    });
  }

  selectLane(entryPoint : THREE.Vector3) {
    this.selectedX = THREE.MathUtils.clamp(entryPoint.x, 0, this.maxDim);
    this.selectedY = THREE.MathUtils.clamp(entryPoint.z, 0, this.maxDim);
    
    this.selectedTiles = [];
    if (entryPoint.x == -1 || entryPoint.x == this.dim) {
      if (entryPoint.x == -1) this.laneEntryPoint = Direction.LEFT;
      else if (entryPoint.x == this.dim) this.laneEntryPoint = Direction.RIGHT;
      for (let y = 0; y < this.dim; ++y) {
        this.selectedTiles.push(this.tiles[this.selectedX][y]);
      }
    }
    else if (entryPoint.z == -1 || entryPoint.z == this.dim) {
      if (entryPoint.z == -1) this.laneEntryPoint = Direction.UP;
      else if (entryPoint.z == this.dim) this.laneEntryPoint = Direction.DOWN;
      for (let x = 0; x < this.dim; ++x) {
        this.selectedTiles.push(this.tiles[x][this.selectedY]);
      }
    }
  }

  rotateOuterTile() { this.tiles[this.dim][0].rotate(); }

  moveTreasureIfExists(tile : Tile, x : number, y : number) {
    if (tile.treasureId != undefined) {
      for (let treasure of this.treasures) {
        if (treasure.id == tile.treasureId) {
          treasure.move(x, y);
          return;
        }
      }
    }
  }
  
  moveTiles(fromX : number, fromY : number, toX : number, toY : number) {
    this.tiles[fromX][fromY].move(toX, toY);
    this.moveTreasureIfExists(this.tiles[fromX][fromY], toX, toY);
    
    for (let pawn of this.pawns) {
      if (pawn.hasMoved == false && pawn.x == fromX && pawn.y == fromY) {
        switch (this.laneEntryPoint) {
          case Direction.UP: {
            let delta = pawn.y + 1;
            if (delta < this.dim) pawn.move(pawn.x, delta);
            else pawn.move(pawn.x, 0);
          } break;

          case Direction.DOWN: {
            let delta = pawn.y - 1;
            if (delta > -1) pawn.move(pawn.x, delta);
            else pawn.move(pawn.x, this.maxDim);
          } break;

          case Direction.LEFT: {
            let delta = pawn.x + 1;
            if (delta < this.dim) pawn.move(delta, pawn.y);
            else pawn.move(0, pawn.y);
          } break;

          case Direction.RIGHT: {
            let delta = pawn.x - 1;
            if (delta > -1) pawn.move(delta, pawn.y);
            else pawn.move(this.maxDim, pawn.y);
          } break;
        }
        pawn.hasMoved = true;
      }
    }
  }

  swapTiles(x1 : number, y1 : number, x2 : number, y2 : number) {
    [this.tiles[x1][y1], this.tiles[x2][y2]] =
    [this.tiles[x2][y2], this.tiles[x1][y1]];
  }
  
  moveLane() {
    let outerTile = this.tiles[this.dim][0];
    switch (this.laneEntryPoint) {
      case Direction.UP: {
        outerTile.move(this.selectedX, 0);
        this.moveTreasureIfExists(outerTile, this.selectedX, 0);
        for (let y = 0; y < this.dim; ++y) {
          this.moveTiles(this.selectedX, y, this.selectedX, y + 1); 
          this.swapTiles(this.selectedX, 0, this.selectedX, y);
        }        
        this.swapTiles(this.dim, 0, this.selectedX, 0);
      } break;

      case Direction.DOWN: {
        outerTile.move(this.selectedX, this.maxDim);
        this.moveTreasureIfExists(outerTile, this.selectedX, this.maxDim);
        for (let y = this.maxDim; y >= 0; --y) {
          this.moveTiles(this.selectedX, y, this.selectedX, y - 1);
          this.swapTiles(this.selectedX, this.maxDim, this.selectedX, y);
        }        
        this.swapTiles(this.dim, 0, this.selectedX, this.maxDim);
      } break;

      case Direction.LEFT: {
        outerTile.move(0, this.selectedY);
        this.moveTreasureIfExists(outerTile, 0, this.selectedY);        
        for (let x = 0; x < this.dim; ++x) {
          this.moveTiles(x, this.selectedY, x + 1, this.selectedY);
          this.swapTiles(0, this.selectedY, x , this.selectedY);
        }        
        this.swapTiles(this.dim, 0, 0, this.selectedY);
      } break;

      case Direction.RIGHT: {
        outerTile.move(this.maxDim, this.selectedY);
        this.moveTreasureIfExists(outerTile, this.maxDim, this.selectedY);        
        for (let x = this.maxDim; x >= 0; --x) {
          this.moveTiles(x, this.selectedY, x - 1, this.selectedY);
          this.swapTiles(this.maxDim, this.selectedY, x, this.selectedY);
        }
        this.swapTiles(this.dim, 0, this.maxDim, this.selectedY);
      } break;
    }
    
    for (let pawn of this.pawns) pawn.hasMoved = false;
  }
  
  playerPathFinding(root : Tile, entry? : Direction) {
    if (this.pathFoundTiles.includes(root)) return;
    
    const newSize = this.pathFoundTiles.push(root);
    let last = this.pathFoundTiles[newSize - 1];
    
    for (let direction of last.directions) {
      if (entry === direction) continue;
      
      switch (direction) {
        case Direction.LEFT: {
          const prevRow =  last.x - 1;
          if (prevRow >= 0) {
            let neighbour = this.tiles[prevRow][last.y];
            if (neighbour.directions.includes(Direction.RIGHT)) {
              this.playerPathFinding(neighbour, Direction.RIGHT);
            }
          }
        } break;
          
        case Direction.RIGHT: {
          const nextRow =  last.x + 1;
          if (nextRow <= this.maxDim) {
            let neighbour = this.tiles[nextRow][last.y];
            if (neighbour.directions.includes(Direction.LEFT)) {
              this.playerPathFinding(neighbour, Direction.LEFT);
            }
          }
        } break;

        case Direction.UP: {
          const prevCol =  last.y - 1;
          if (prevCol >= 0) {
            let neighbour = this.tiles[last.x][prevCol];
            if (neighbour.directions.includes(Direction.DOWN)) {
              this.playerPathFinding(neighbour, Direction.DOWN);
            }
          }
        } break;
          
        case Direction.DOWN: {
          const nextCol =  last.y + 1;
          if (nextCol <= this.maxDim) {
            let neighbour = this.tiles[last.x][nextCol];
            if (neighbour.directions.includes(Direction.UP)) {
              this.playerPathFinding(neighbour, Direction.UP);
            }
          }
        } break;
      }
    }
  }

  checkPlayerTreasures(currentPawn : number, window : Window) {
    let seeked = this.treasures[this.pawns[currentPawn].remainingTreasures[0]];
    if (seeked.x == this.pawns[currentPawn].x && 
        seeked.y == this.pawns[currentPawn].y)
    {
      this.pawns[currentPawn].remainingTreasures.shift();
      if (this.pawns[currentPawn].remainingTreasures.length < 0) {
        alert(`Game over ! Player ${currentPawn} wins !`);
        window.location.reload();
      }
    }
  }
}

class OrbitCamera {
  perspective : THREE.PerspectiveCamera;
  controller : OrbitControls;
  
  constructor(aspect : number, labyrinth : Labyrinth, renderer : THREE.WebGLRenderer) {
    const target = (labyrinth.dim - 1) / 2;
    this.perspective = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.controller = new OrbitControls(this.perspective, renderer.domElement);
    this.controller.enablePan = false;
    this.controller.target = new THREE.Vector3(target, 0, target);    
    this.controller.mouseButtons = { LEFT: 2, MIDDLE: 1, RIGHT: 0 };
    this.controller.maxPolarAngle = 1;
    this.controller.minDistance = labyrinth.dim;
    this.controller.maxDistance = labyrinth.dim + labyrinth.hDim;
    this.perspective.position.x = this.controller.target.x;
    this.perspective.position.y = labyrinth.dim;
    this.perspective.position.z = labyrinth.dim + 4;
    this.controller.update(0);
  }
}

class Game {
  window : Window;
  scene : THREE.Scene;
  raycaster : THREE.Raycaster;
  renderer : THREE.WebGLRenderer;
  
  labyrinth : Labyrinth;
  camera : OrbitCamera;
  outerTileLerpTimer : THREE.Clock;
  
  currentEntry? : THREE.Vector3  
  currentPawn : number;
  phase : GamePhase;
    
  constructor(window : Window) {
    this.window = window;
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.DirectionalLight());
    this.raycaster = new THREE.Raycaster();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x123456);
    document.body.appendChild(this.renderer.domElement);

    this.labyrinth = new Labyrinth(this.scene, 7);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new OrbitCamera(aspect, this.labyrinth, this.renderer);

    this.currentPawn = 0;
    this.phase = GamePhase.PLACE_TILE;
    this.outerTileLerpTimer = new THREE.Clock(false);
  }
  
  getPlayerTile() {
    return this.labyrinth.tiles
      [this.labyrinth.pawns[this.currentPawn].x]
      [this.labyrinth.pawns[this.currentPawn].y];
  }
  
  nextRound() {
    this.labyrinth.checkPlayerTreasures(this.currentPawn, this.window);
    this.labyrinth.pathFoundTiles = [];
    this.currentPawn++;
    if (this.currentPawn > 3) this.currentPawn = 0;
  }

  moveOuterTileToNearestEntryPoint() {
    if (this.currentEntry != undefined) {
      const speed = 3;
      let alpha = THREE.MathUtils.clamp(
        speed * this.outerTileLerpTimer.getElapsedTime(), 0, 1);
      
      let outerTile = this.labyrinth.tiles[this.labyrinth.dim][0];
      outerTile.mesh.position.lerp(this.currentEntry, alpha);
      if (outerTile.treasureId != undefined) {
        this.labyrinth.treasures[outerTile.treasureId].mesh.position.set(
          outerTile.mesh.position.x, 
          outerTile.mesh.position.y + 0.2,
          outerTile.mesh.position.z
        );
      }
      
      this.labyrinth.selectLane(this.currentEntry);
    } else {
      this.outerTileLerpTimer.start();
    }
  }
  
  update() {
    if (this.phase == GamePhase.PLACE_TILE) {
      this.moveOuterTileToNearestEntryPoint();
    }
  }
  
  render() {
    this.renderer.render(this.scene, this.camera.perspective);
  }
}

export { Game, GamePhase, Direction };
