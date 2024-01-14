import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const GamePhase = Object.freeze({
  "SELECT_LANE": 0,
  "MOVE_LANE": 1,
  "MOVE_PLAYER": 2
});

const LaneAxis = Object.freeze({
  "VERTICAL": 0,
  "HORIZONTAL": 1,
});

const Direction = Object.freeze({
  "UP": 1,
  "DOWN": 2,
  "LEFT": 3,
  "RIGHT": 4
});


class Pawn {
  constructor(scene, x, y, offset, color) {
    this.x = x;
    this.y = y;
    this.hasMoved = false;
    this.geometry = new THREE.CapsuleGeometry(0.25, 0.5, 1, 4);
    this.material = new THREE.MeshBasicMaterial();
    this.material.color.setColorName(color);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(x * offset, this.geometry.parameters.length, y * offset);
    scene.add(this.mesh);
  }

  checkPosition(x, y) {
    return (this.x == x && this.y == y);
  }

  move(x, y, offset) {
    this.x = x;
    this.y = y;
    this.mesh.position.setX(x * offset);
    this.mesh.position.setZ(y * offset);
  }
}

class Tile {
  constructor(x, y, offset, debugText) {
    // let canvas = document.createElement("canvas");
    // let context = canvas.getContext("2d");
    // context.fillStyle = "white";
    // context.font = "100px sans-serif";
    // context.textAlign = "center";
    // context.fillText(debugText.toString(), 100, 100);    
    // const texture = new THREE.Texture(canvas)
    // texture.needsUpdate = true
    // let material = new THREE.MeshBasicMaterial({map: texture})
    
    this.geometry = new THREE.BoxGeometry(1, 0, 1);
    // this.material = material;
    this.material = new THREE.MeshBasicMaterial({ wireframe: true });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(x * offset, 0, y * offset);
    this.haveTreasure = false;
  }

  move(x, y, offset) {
    this.mesh.position.setX(x * offset);
    this.mesh.position.setZ(y * offset);
  }
}

function shuffle(arr) { // Used for tiles shuffling
    let i = arr.length, j;
    while (i--) {
      j = Math.floor(Math.random() * (i+1));
      [arr[i] = arr[j]] = [arr[j] = arr[i]];
    }
    return arr;
}

class Labyrinth {

  constructor(scene, dimension, tileOffset) {
    if (dimension % 2 == 0) {
      alert("The dimension should be odd !");
      return;
    }

    this.selectionAxis = LaneAxis.HORIZONTAL;
    this.laneEntryPoint = Direction.LEFT;

    this.selectedLaneX = -1;
    this.selectedLaneY = 1;

    this.dimension = dimension;
    this.tileOffset = tileOffset;
    
    this.tiles = [];
    this.selectedTiles = [];

    // Build the labyrinth
    for (let x = 0; x < dimension; ++x) {
      this.tiles.push([]);
      for (let y = 0; y < dimension; ++y) {
        this.tiles[x].push(new Tile(x, y, this.tileOffset, `${x}, ${y}`));
        scene.add(this.tiles[x][y].mesh);
      }
    }

    // Create outer tile
    let outerTile = new Tile(-1, dimension, this.tileOffset, "YUP");
    this.tiles.push(outerTile)
    scene.add(outerTile.mesh);

    // Create pawns
    this.pawns = [];
    const maxPos = this.dimension - 1;
    this.pawns.push(new Pawn(scene, 1, 0, this.tileOffset, "red"));
    this.pawns.push(new Pawn(scene, 0, maxPos, this.tileOffset, "blue"));
    this.pawns.push(new Pawn(scene, maxPos, 0, this.tileOffset, "green"));
    this.pawns.push(new Pawn(scene, maxPos, maxPos, this.tileOffset, "yellow"));    

    // Create treasures (fixed and random ones)
    this.nTreasures = Math.floor(24 * this.dimension / 7);
    let availTreasuresSlots = [];

    // Fixed treasures
    for (let x = 0; x < this.dimension; x++) {
      for (let y = 0; y < this.dimension; y++) {
        if ((x != 0 && x != this.dimension - 1) ||
            (y != 0 && y != this.dimension - 1))
        {
          if (x % 2 == 0 && y % 2 == 0) {
            this.tiles[x][y].haveTreasure = true;
            this.tiles[x][y].material.color.setColorName("gold");
          }
          else {
            availTreasuresSlots.push([x, y]);
          }
        }
      }
    }
    
    // Randomize moving treasures
    let rTreasures = shuffle(availTreasuresSlots).slice(0, this.nTreasures / 2);
    for (let i = 0; i < rTreasures.length; i++) {
      let x = rTreasures[i][0];
      let y = rTreasures[i][1];
      this.tiles[x][y].haveTreasure = true;
      this.tiles[x][y].material.color.setColorName("gold");
    }
    
    // Default lane selection color
    for (let x = 0; x < this.dimension; ++x) {
      this.tiles[x][this.selectedLaneY].material.color.setColorName("green");
    }
  }

  getOuterTile() {
    return this.tiles[this.dimension];
  }

  selectLane(axis) {
    this.selectedTiles = [];
    for (let x = 0; x < this.dimension; ++x) {
      for (let y = 0; y < this.dimension; ++y) {
        if (this.tiles[x][y].haveTreasure) {
          this.tiles[x][y].material.color.setColorName("gold");
        }
        else {
          this.tiles[x][y].material.color.setColorName("white");
        }
      }
    }

    this.selectionAxis = axis;
    if (axis === LaneAxis.HORIZONTAL) {
      this.laneEntryPoint = Direction.LEFT;
      for (let x = 0; x < this.dimension; ++x) {
        this.selectedTiles.push(this.tiles[x][this.selectedLaneY]);
      }
    }
    else if (axis === LaneAxis.VERTICAL) {
      this.laneEntryPoint = Direction.TOP;
      for (let y = 0; y < this.dimension; ++y) {
        this.selectedTiles.push(this.tiles[this.selectedLaneX][y]);
      }
    }
  }

  fillSelectedLane(color) {
    this.selectedTiles.forEach(tile=>{tile.material.color.setColorName(color);});
  }

  backToSelectionMode() { // TMP: Remove after impl path finding for player movements
    this.gamePhase = GamePhase.SELECT_LANE;
    this.selectedTiles = [];
    switch (this.selectionAxis) {
      case LaneAxis.HORIZONTAL: {
        for (let x = 0; x < this.dimension; ++x) {
          let selectedTile = this.tiles[x][this.selectedLaneY];
          selectedTile.material.color.setHex(0x00ff00);
          this.selectedTiles.push(selectedTile);
        }
      } break;

      case LaneAxis.VERTICAL: {
      for (let y = 0; y < this.dimension; ++y) {
        let selectedTile = this.tiles[this.selectedLaneX][y];
        selectedTile.material.color.setHex(0xccff00);
        this.selectedTiles.push(selectedTile);
      } break;
    }
    }
  }

  movePawn(fromX, fromY) {
    for (let pawn of this.pawns) {
      if (pawn.hasMoved == false && pawn.checkPosition(fromX, fromY)) {
        switch (this.laneEntryPoint) {
          case Direction.UP: {
            let delta = pawn.y + 1;
            if (delta < this.dimension) {
              pawn.move(pawn.x, delta, this.tileOffset);
            } else {
              pawn.move(pawn.x, 0, this.tileOffset);
            }
          } break;
          
          case Direction.DOWN: {
            let delta = pawn.y - 1;
            if (delta > -1) {
              pawn.move(pawn.x, delta, this.tileOffset);
            } else {
              pawn.move(pawn.x, this.dimension - 1, this.tileOffset);
            }
          } break;
          
          case Direction.LEFT: {
            let delta = pawn.x + 1;
            if (delta < this.dimension) {
              pawn.move(delta, pawn.y, this.tileOffset);
            } else {
              pawn.move(0, pawn.y, this.tileOffset);
            }
          } break;
          
          case Direction.RIGHT: {
            let delta = pawn.x - 1;
            if (delta > -1) {
              pawn.move(delta, pawn.y, this.tileOffset);
            } else {
              pawn.move(this.dimension - 1, pawn.y, this.tileOffset);
            }
          } break;
          
        }
        pawn.hasMoved = true;
      }
    }
  }

  moveOuterTile(x, y) {
    this.getOuterTile().move(x, y, this.tileOffset);
  }
  
  moveOuterTileToEntryPoint() {
    switch (this.laneEntryPoint) {
      case Direction.UP:
        this.moveOuterTile(this.selectedLaneX, -1);
        break;
        
      case Direction.DOWN:
        this.moveOuterTile(this.selectedLaneX, this.dimension);
        break;

      case Direction.LEFT:
        this.moveOuterTile(-1, this.selectedLaneY);
        break;

      case Direction.RIGHT:
        this.moveOuterTile(this.dimension, this.selectedLaneY);
        break;
    }
  }


  moveTile(fromX, fromY, toX, toY) {
    this.tiles[fromX][fromY].move(toX, toY, this.tileOffset);
    this.movePawn(fromX, fromY);
  }
  
  moveLane() {
    switch(this.laneEntryPoint) {
      case Direction.UP: {
        this.moveOuterTile(this.selectedLaneX, 0, this.tileOffset);
        
        for (let i = 0; i < this.dimension; i++) {
          this.moveTile(this.selectedLaneX, i, this.selectedLaneX, i + 1);
          
          [
            this.tiles[this.selectedLaneX][0],
            this.tiles[this.selectedLaneX][i]
          ]
            =
          [
            this.tiles[this.selectedLaneX][i],
            this.tiles[this.selectedLaneX][0]
          ];
        }
        
        [
          this.tiles[this.dimension],
          this.tiles[this.selectedLaneX][0]
        ]
          =
        [
          this.tiles[this.selectedLaneX][0],
          this.tiles[this.dimension]
        ];
        
        this.backToSelectionMode();
      } break;
        
      case Direction.DOWN: {
        this.moveOuterTile(this.selectedLaneX, this.dimension - 1);
        
        for (let i = this.dimension - 1; i >= 0; i--) {
          this.moveTile(this.selectedLaneX, i, this.selectedLaneX, i-1);
          
          [
            this.tiles[this.selectedLaneX][this.dimension - 1],
            this.tiles[this.selectedLaneX][i]
          ]
            =
          [
            this.tiles[this.selectedLaneX][i],
            this.tiles[this.selectedLaneX][this.dimension - 1]
          ];
        }
        
        [
          this.tiles[this.dimension],
          this.tiles[this.selectedLaneX][this.dimension - 1]
        ]
          =
        [
          this.tiles[this.selectedLaneX][this.dimension - 1],
          this.tiles[this.dimension]
        ];
        
        this.moveOuterTile(this.selectedLaneX, -1);
        this.backToSelectionMode();
      } break;
        
      case Direction.LEFT: {
        this.moveOuterTile(0, this.selectedLaneY);
        
        for (let i = 0; i < this.dimension; i++) {
          this.moveTile(i, this.selectedLaneY, i+1, this.selectedLaneY);
          
          [
            this.tiles[0][this.selectedLaneY],
            this.tiles[i][this.selectedLaneY]
          ]
            =
          [
            this.tiles[i][this.selectedLaneY],
            this.tiles[0][this.selectedLaneY]
          ];
        }
        
        [
          this.tiles[this.dimension],
          this.tiles[0][this.selectedLaneY]
        ]
          =
        [
          this.tiles[0][this.selectedLaneY],
          this.tiles[this.dimension]
        ];
        
        this.backToSelectionMode();
      } break;
        
      case Direction.RIGHT: {
        this.moveOuterTile(this.dimension - 1, this.selectedLaneY);
        
        for (let i = this.dimension - 1; i >= 0; i--) {
          this.moveTile(i, this.selectedLaneY, i-1, this.selectedLaneY);
          
          [
            this.tiles[this.dimension - 1][this.selectedLaneY],
            this.tiles[i][this.selectedLaneY]
          ]
            =
          [
            this.tiles[i][this.selectedLaneY],
            this.tiles[this.dimension - 1][this.selectedLaneY]
          ];
        }
        
        [
          this.tiles[this.dimension],
          this.tiles[this.dimension - 1][this.selectedLaneY]
        ]
          =
        [
          this.tiles[this.dimension - 1][this.selectedLaneY],
          this.tiles[this.dimension]
        ];
        
        this.moveOuterTile(-1, this.selectedLaneY);
        this.backToSelectionMode();
      } break;
    }
    for (let pawn of this.pawns) pawn.hasMoved = false;
  }
}

class OrbitCamera {
  constructor(target, aspect, labyrinth, renderer) {
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
  constructor() {
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.labyrinth = new Labyrinth(this.scene, 7, 1.25);
    
    const target = (this.labyrinth.dimension - 1) / 2 * this.labyrinth.tileOffset;
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new OrbitCamera(target, aspect, this.labyrinth, this.renderer);
    
    this.playerTurn = 0;
    this.gamePhase = GamePhase.SELECT_LANE;
  }

  render() {
    this.renderer.render(this.scene, this.camera.perspective);  
  }
}

export { Game, GamePhase, LaneAxis, Direction };
