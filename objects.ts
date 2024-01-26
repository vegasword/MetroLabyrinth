import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

enum GamePhase { "SELECT_LANE", "MOVE_LANE", "MOVE_PLAYER" };
enum LaneAxis { "VERTICAL", "HORIZONTAL" };
enum Direction { "UP", "RIGHT", "DOWN", "LEFT" };
enum TileType { "STRAIGHT", "CORNER", "TJUNCTION" };

class Entity {
  x : number;
  y : number;
  mesh : THREE.Mesh;
  
  constructor(x : number, y : number, mesh : THREE.Mesh) {
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
    let material = new THREE.MeshBasicMaterial({color: 0x000000});
    let mesh =  new THREE.Mesh(geometry, material);
    mesh.position.setX(x);
    mesh.position.setY(0.01);
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
    let geometry = new THREE.BoxGeometry(1, 0, 1);
    let mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    mesh.position.set(x, 0, y);
    
    super(x, y, mesh);

    this.directions = [];
  }

  rotateCounterClockwise(n : number = 1) {
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < this.directions.length; ++j) {
        this.directions[j]--;
        if (this.directions[j] < Direction.UP) {
          this.directions[j] = Direction.LEFT;
        }
      }
      this.mesh.geometry.rotateY(Math.PI / 2);
    }
  }

  rotateClockwise(n : number = 1) {
    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < this.directions.length; ++j) {
        this.directions[j]++;
        if (this.directions[j] > Direction.LEFT) {
          this.directions[j] = Direction.UP;
        }
      }
      this.mesh.geometry.rotateY(-Math.PI / 2);
    }
  }

  setDefaultDirections(type : TileType) {    
    switch (type) {
      case TileType.STRAIGHT: {
        this.directions.push(Direction.UP);
        this.directions.push(Direction.DOWN);        
      } break;

      case TileType.CORNER: {
        this.directions.push(Direction.RIGHT);
        this.directions.push(Direction.DOWN);
      } break;

      case TileType.TJUNCTION: {
        this.directions.push(Direction.LEFT);
        this.directions.push(Direction.DOWN);
        this.directions.push(Direction.RIGHT);
      } break;
    }
  }
  
  setRandomType() {
    this.type = Math.round(Math.random() * TileType.TJUNCTION);
    this.setDefaultDirections(this.type);
  }

  updateTexture() {
    switch (this.type) {
      case TileType.STRAIGHT:
        this.mesh.material = new THREE.MeshBasicMaterial({
          map: new THREE.TextureLoader().load("data/straight.jpg")
        });
        break;

      case TileType.CORNER:
        this.mesh.material = new THREE.MeshBasicMaterial({
          map: new THREE.TextureLoader().load("data/corner.jpg")
        });
        break;

      case TileType.TJUNCTION:
        this.mesh.material = new THREE.MeshBasicMaterial({
          map: new THREE.TextureLoader().load("data/tjunction.jpg")
        });
        break;
    }
  }

  rotateRandomly() {
    switch (this.type) {
      case TileType.STRAIGHT: {        
        if (Math.round(Math.random()) == 1) {
          this.rotateClockwise();
        }
      } break;

      case TileType.CORNER: {
        let shuffle = Math.round(Math.random() * 4);
        for (let i = 0; i < shuffle; ++i) {
          if (Math.round(Math.random()) == 1) {
            this.rotateClockwise();
          } else {
            this.rotateCounterClockwise();
          }
        }
      } break;

      case TileType.TJUNCTION: {
        let shuffle = Math.round(Math.random() * 4);
        for (let i = 0; i < shuffle; ++i) {
          if (Math.round(Math.random()) == 1) {
            this.rotateClockwise();
          } else {
            this.rotateCounterClockwise();
          }
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
  selectionAxis : LaneAxis;
  laneEntryPoint : Direction;
  
  selectedLaneX : number;
  selectedLaneY : number;
  dimension : number;
  maxDim : number;
  hDim : number;
  tileOffset : number;
  totalTreasures : number;
  
  tiles : Tile[][];
  selectedTiles : Tile[];
  pathFoundTiles : Tile[];

  pawns : Pawn[]
  treasures : Treasure[];

  constructor(scene : THREE.Scene, dimension : number, tileOffset = 1) {
    if (dimension % 2 == 0 && dimension > 7) {
      alert("The dimension should be odd and superior to 7!");
      return;
    }

    this.selectionAxis = LaneAxis.HORIZONTAL;
    this.laneEntryPoint = Direction.LEFT;

    this.selectedLaneX = -1;
    this.selectedLaneY = 1;

    this.dimension = dimension;
    this.tileOffset = tileOffset;

    this.selectedTiles = [];
    this.pathFoundTiles = [];

    this.maxDim = this.dimension - 1;
    this.hDim = this.maxDim / 2;

    this.tiles = [];
    for (let x = 0; x < this.dimension; ++x) {
      this.tiles[x] = [];
      for (let y = 0; y < this.dimension; ++y) {
        this.tiles[x][y] = new Tile(x, y);
        scene.add(this.tiles[x][y].mesh);
      }
    }

    this.tiles[0][0].type = TileType.CORNER;
    this.tiles[0][0].directions = [Direction.RIGHT, Direction.DOWN];
    this.tiles[0][0].updateTexture();

    this.tiles[0][this.maxDim].type = TileType.CORNER;
    this.tiles[0][this.maxDim].updateTexture();
    this.tiles[0][this.maxDim].directions = [Direction.RIGHT, Direction.DOWN];
    this.tiles[0][this.maxDim].rotateCounterClockwise();

    this.tiles[this.maxDim][0].type = TileType.CORNER;
    this.tiles[this.maxDim][0].updateTexture();
    this.tiles[this.maxDim][0].directions = [Direction.RIGHT, Direction.DOWN];
    this.tiles[this.maxDim][0].rotateClockwise();

    this.tiles[this.maxDim][this.maxDim].type = TileType.CORNER;
    this.tiles[this.maxDim][this.maxDim].updateTexture();
    this.tiles[this.maxDim][this.maxDim].directions = [Direction.RIGHT, Direction.DOWN];
    this.tiles[this.maxDim][this.maxDim].rotateClockwise();
    this.tiles[this.maxDim][this.maxDim].rotateClockwise();

    let outerTile = new Tile(-1, dimension);
    outerTile.setRandomType();
    outerTile.updateTexture();
    outerTile.rotateRandomly();
    this.tiles[this.dimension] = [outerTile];
    scene.add(outerTile.mesh);

    this.pawns = [];
    this.pawns.push(new Pawn(0, 0, "red"));
    this.pawns.push(new Pawn(this.maxDim, 0, "green"));
    this.pawns.push(new Pawn(this.maxDim, this.maxDim, "orange"));
    this.pawns.push(new Pawn(0, this.maxDim, "blue"));
    scene.add(this.pawns[0].mesh);
    scene.add(this.pawns[1].mesh);
    scene.add(this.pawns[2].mesh);
    scene.add(this.pawns[3].mesh);
    
    this.treasures = [];
    this.totalTreasures = Math.floor(24 * this.dimension / 7);
    
    // Assign fixed treasures and apply the right rotation to their T-junctions
    let treasureId = 0;
    let everyTreasuresCoords : any[] = [];
    let availableTreasureRandomSlots : any[] = [];
    for (let x = 0; x < this.dimension; x++) {
      for (let y = 0; y < this.dimension; y++) {
        if ((x != 0 && x != this.maxDim) || (y != 0 && y != this.maxDim)) {
          if (x % 2 == 0 && y % 2 == 0) {
            this.tiles[x][y].type = TileType.TJUNCTION;
            this.tiles[x][y].setDefaultDirections(TileType.TJUNCTION);
            this.tiles[x][y].updateTexture();
            everyTreasuresCoords.push({x: x, y: y});

            if (y == 0) { continue; }
            if (x == 0) { this.tiles[x][y].rotateCounterClockwise(); continue; }
            if (y == this.maxDim) { this.tiles[x][y].rotateClockwise(2); continue; }
            if (x == this.maxDim) { this.tiles[x][y].rotateClockwise(); continue; }
            if (x < this.hDim && y < this.hDim) { this.tiles[x][y].rotateCounterClockwise(); continue; }
            if (x < this.hDim && y > this.hDim) { this.tiles[x][y].rotateClockwise(2); continue; }
            if (x > this.hDim && y > this.hDim) { this.tiles[x][y].rotateClockwise(); continue; }
          } 
          else {
            availableTreasureRandomSlots.push({x: x, y: y});
          }
        }
      }
    }

    let randomTreasures = shuffle(availableTreasureRandomSlots)
                          .slice(0, this.totalTreasures / 2);
    
    for (let t of randomTreasures) everyTreasuresCoords.push({x: t.x, y: t.y});
        
    const treasuresPerPawn = Math.round(this.totalTreasures / this.pawns.length);
    for (let i = 0; i < this.pawns.length; ++i) {
      let pawnTreasures = shuffle(everyTreasuresCoords).splice(0, treasuresPerPawn);
      for (let j = 0; j < pawnTreasures.length; ++j) {
        this.treasures.push(new Treasure(treasureId, pawnTreasures[j].x, pawnTreasures[j].y));        
        scene.add(this.treasures[i * pawnTreasures.length + j].mesh);
        this.pawns[i].remainingTreasures.push(treasureId);
        this.tiles[pawnTreasures[j].x][pawnTreasures[j].y].treasureId = treasureId;
        treasureId++;
      }
      this.pawns[i].remainingTreasures[0] = i * treasuresPerPawn;
    }

    for (let i = 0; i < this.pawns.length; ++i) {
      for (let j = 0; j < this.pawns[i].remainingTreasures.length; ++j) {
        const id = this.pawns[i].remainingTreasures[j];
        (this.treasures[id].mesh.material as THREE.MeshBasicMaterial).color =
        (this.pawns[i].mesh.material as THREE.MeshBasicMaterial).color;
      }
      (this.treasures[this.pawns[i].remainingTreasures[0]]
       .mesh.material as THREE.MeshBasicMaterial).wireframe = true;
    }

    let randomTiles : TileType[] = [];
    let quotaRandomTiles = {
      [TileType.STRAIGHT]: Math.round(this.dimension * this.dimension / 28 * this.dimension),
      [TileType.CORNER]: Math.round(this.dimension * this.dimension / 21 * this.dimension),
      [TileType.TJUNCTION]: Math.round(this.dimension * this.dimension / 57  * this.dimension)
    };
    quotaRandomTiles[outerTile.type]--;
    
    function fillTilesType(type : TileType) {
      for (let i = 0; i < quotaRandomTiles[type]; ++i) randomTiles.push(type);
    }
    fillTilesType(TileType.STRAIGHT);
    fillTilesType(TileType.CORNER);
    fillTilesType(TileType.TJUNCTION);
    randomTiles = shuffle(randomTiles);

    let n = 0;
    for (let x = 0; x < this.dimension; x++) {
      for (let y = 0; y < this.dimension; y++) {
        if (this.tiles[x][y].type == undefined) {
          this.tiles[x][y].type = randomTiles[n];
          this.tiles[x][y].setDefaultDirections(randomTiles[n]);
          this.tiles[x][y].updateTexture();
          this.tiles[x][y].rotateRandomly();
          n++;
        }
      }
    }
  }

  selectLane(axis : LaneAxis) {
    this.selectedTiles = [];
    this.selectionAxis = axis;
    if (axis === LaneAxis.HORIZONTAL) {
      this.laneEntryPoint = Direction.LEFT;
      for (let x = 0; x < this.dimension; ++x) {
        this.selectedTiles.push(this.tiles[x][this.selectedLaneY]);
      }
    }
    else if (axis === LaneAxis.VERTICAL) {
      this.laneEntryPoint = Direction.UP;
      for (let y = 0; y < this.dimension; ++y) {
        this.selectedTiles.push(this.tiles[this.selectedLaneX][y]);
      }
    }
  }

  rotateOuterTile() {
    this.tiles[this.dimension][0].rotateClockwise();
  }

  moveTreasureIfExists(tile : Tile, x : number, y : number) {
    if (tile.treasureId != undefined) {
      for (let treasure of this.treasures) {
        if (treasure.id == tile.treasureId) {
          treasure.move(x, y);
        }
      }
    }
  }
  
  moveOuterTile(x : number, y : number) {
    this.tiles[this.dimension][0].move(x, y);
    this.moveTreasureIfExists(this.tiles[this.dimension][0], x, y);
  }

  moveOuterTileToEntryPoint() {
    switch (this.laneEntryPoint) {
      case Direction.UP: this.moveOuterTile(this.selectedLaneX, -1); break;
      case Direction.DOWN: this.moveOuterTile(this.selectedLaneX, this.dimension); break;
      case Direction.LEFT: this.moveOuterTile(-1, this.selectedLaneY); break;
      case Direction.RIGHT: this.moveOuterTile(this.dimension, this.selectedLaneY); break;
    }
  }

  moveTiles(fromX : number, fromY : number, toX : number, toY : number) {
    this.tiles[fromX][fromY].move(toX, toY);
    this.moveTreasureIfExists(this.tiles[fromX][fromY], toX, toY);
    
    for (let pawn of this.pawns) {
      if (pawn.hasMoved == false && pawn.x === fromX && pawn.y === fromY) {
        switch (this.laneEntryPoint) {
          case Direction.UP: {
            let delta = pawn.y + 1;
            if (delta < this.dimension) pawn.move(pawn.x, delta);
            else pawn.move(pawn.x, 0);
          } break;

          case Direction.DOWN: {
            let delta = pawn.y - 1;
            if (delta > -1) pawn.move(pawn.x, delta);
            else pawn.move(pawn.x, this.maxDim);
          } break;

          case Direction.LEFT: {
            let delta = pawn.x + 1;
            if (delta < this.dimension) pawn.move(delta, pawn.y);
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

  moveLane() {
    switch (this.laneEntryPoint) {
      case Direction.UP: {
        this.moveOuterTile(this.selectedLaneX, 0);
        for (let i = 0; i < this.dimension; i++) {
          this.moveTiles(this.selectedLaneX, i, this.selectedLaneX, i + 1); 
          [this.tiles[this.selectedLaneX][0],this.tiles[this.selectedLaneX][i]]=
          [this.tiles[this.selectedLaneX][i],this.tiles[this.selectedLaneX][0]];
        }
        [this.tiles[this.dimension][0],this.tiles[this.selectedLaneX][0]]=
        [this.tiles[this.selectedLaneX][0],this.tiles[this.dimension][0]];
      } break;

      case Direction.DOWN: {
        this.moveOuterTile(this.selectedLaneX, this.maxDim);
        for (let i = this.maxDim; i >= 0; i--) {
          this.moveTiles(this.selectedLaneX, i, this.selectedLaneX, i - 1);
          [this.tiles[this.selectedLaneX][this.maxDim],this.tiles[this.selectedLaneX][i]]=
          [this.tiles[this.selectedLaneX][i],this.tiles[this.selectedLaneX][this.maxDim]];
        }
        [this.tiles[this.dimension][0],this.tiles[this.selectedLaneX][this.maxDim]]=
        [this.tiles[this.selectedLaneX][this.maxDim],this.tiles[this.dimension][0]];
        this.moveOuterTile(this.selectedLaneX, -1);
      } break;

      case Direction.LEFT: {
        this.moveOuterTile(0, this.selectedLaneY);
        for (let i = 0; i < this.dimension; i++) {
          this.moveTiles(i, this.selectedLaneY, i + 1, this.selectedLaneY);
          [this.tiles[0][this.selectedLaneY],this.tiles[i][this.selectedLaneY]]=
          [this.tiles[i][this.selectedLaneY],this.tiles[0][this.selectedLaneY]];
        }
        [this.tiles[this.dimension][0],this.tiles[0][this.selectedLaneY]]=
        [this.tiles[0][this.selectedLaneY],this.tiles[this.dimension][0]];
      } break;

      case Direction.RIGHT: {
        this.moveOuterTile(this.maxDim, this.selectedLaneY);
        for (let i = this.maxDim; i >= 0; i--) {
          this.moveTiles(i, this.selectedLaneY, i - 1, this.selectedLaneY);
          [this.tiles[this.maxDim][this.selectedLaneY],this.tiles[i][this.selectedLaneY]]=
          [this.tiles[i][this.selectedLaneY],this.tiles[this.maxDim][this.selectedLaneY]];
        }
        [this.tiles[this.dimension][0],this.tiles[this.maxDim][this.selectedLaneY]]=
        [this.tiles[this.maxDim][this.selectedLaneY],this.tiles[this.dimension][0]];
        this.moveOuterTile(-1, this.selectedLaneY);
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
      if (this.pawns[currentPawn].remainingTreasures.length > 0) {
        (seeked.mesh.material as THREE.MeshBasicMaterial).wireframe = false;      
        this.pawns[currentPawn].remainingTreasures[0] = this.pawns[currentPawn].remainingTreasures[0];
        (this.treasures[this.pawns[currentPawn].remainingTreasures[0]].mesh.material as THREE.MeshBasicMaterial).wireframe = true;
      } else {
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
    const target = (labyrinth.dimension - 1) / 2 * labyrinth.tileOffset;
    this.perspective = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.controller = new OrbitControls(this.perspective, renderer.domElement);
    this.controller.enablePan = false;
    this.controller.target = new THREE.Vector3(target, 0, target);
    this.controller.rotateSpeed = 0.5;
    this.controller.maxPolarAngle = 1;
    this.controller.minDistance = labyrinth.dimension;
    this.controller.maxDistance = labyrinth.dimension * labyrinth.tileOffset + 1;
    this.perspective.position.x = this.controller.target.x;
    this.perspective.position.y = labyrinth.dimension;
    this.perspective.position.z = labyrinth.dimension + 4;
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
  currentPawn : number;
  phase : GamePhase;
  
  constructor(window : Window) {
    this.window = window;
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.labyrinth = new Labyrinth(this.scene, 7);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new OrbitCamera(aspect, this.labyrinth, this.renderer);

    this.currentPawn = 0;
    (this.labyrinth.pawns[this.currentPawn].mesh.material as THREE.MeshBasicMaterial).wireframe = true;
    this.phase = GamePhase.SELECT_LANE;
  }
  
  getPlayerTile() {
    return this.labyrinth.tiles
      [this.labyrinth.pawns[this.currentPawn].x]
      [this.labyrinth.pawns[this.currentPawn].y];
  }
  
  nextRound() {
    this.labyrinth.checkPlayerTreasures(this.currentPawn, this.window);
    this.labyrinth.pathFoundTiles = [];
    (this.labyrinth.pawns[this.currentPawn].mesh.material as THREE.MeshBasicMaterial)
      .wireframe = false;
    this.currentPawn++;
    if (this.currentPawn > 3) this.currentPawn = 0;
    (this.labyrinth.pawns[this.currentPawn].mesh.material as THREE.MeshBasicMaterial)
      .wireframe = true;
    this.phase = GamePhase.SELECT_LANE;  
  }

  render() {
    this.renderer.render(this.scene, this.camera.perspective);
  }
}

export { Game, GamePhase, LaneAxis, Direction };
