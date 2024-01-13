function shuffle(arr) {
    let i = arr.length, j;
    while (i--) {
      j = Math.floor(Math.random() * (i+1));
      [arr[i] = arr[j]] = [arr[j] = arr[i]];
    }
    return arr;
}

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

class Pawn {
  constructor(scene, x, y, offset, color) {
    this.geometry = new THREE.CapsuleGeometry(0.25, 0.5, 1, 4);
    this.material = new THREE.MeshBasicMaterial();
    this.material.color.setColorName(color);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(x * offset, this.geometry.parameters.length, y * offset);
    scene.add(this.mesh);
  }

  move(x, y, offset) {
    this.mesh.position.setX(x * offset);
    this.mesh.position.setZ(y * offset);
  }
}

class Tile {
  constructor(x, y, offset, i) {
    // let canvas = document.createElement("canvas");
    // let context = canvas.getContext("2d");
    // context.fillStyle = "white";
    // context.font = "100px sans-serif";
    // context.textAlign = "center";
    // context.fillText(i.toString(), 100, 100);    
    // const texture = new THREE.Texture(canvas)
    // texture.needsUpdate = true
    // let material = new THREE.MeshBasicMaterial({map: texture})
    
    this.geometry = new THREE.BoxGeometry(1, 0, 1);
    // this.material = material;
    this.material = new THREE.MeshBasicMaterial({ wireframe: true });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(x * offset, 0, y * offset);
  }

  move(x, y, offset) {
    this.mesh.position.setX(x * offset);
    this.mesh.position.setZ(y * offset);
  }
}

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

class Labyrinth {
  constructor(scene, dimension, tileOffset) {
    if (dimension % 2 == 0) {
      alert("The dimension should be odd !");
      return;
    }

    this.selectionAxis = LaneAxis.HORIZONTAL;
    this.laneMoveDirection = Direction.LEFT;

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

    // Create outter tile
    let outterTile = new Tile(-1, dimension, this.tileOffset, "YUP");
    this.tiles.push(outterTile)
    scene.add(outterTile.mesh);

    // Create players' pawn
    this.players = [];
    const maxPos = this.dimension - 1;
    this.players.push(
      new Pawn(scene, 0, 0, this.tileOffset, "red"),
      new Pawn(scene, 0, maxPos, this.tileOffset, "blue"),
      new Pawn(scene, maxPos, 0, this.tileOffset, "green"),
      new Pawn(scene, maxPos, maxPos, this.tileOffset, "yellow")
    );

    // Create treasures (fixed and random ones)
    this.nTreasures = Math.floor(24 * this.dimension / 7);
    this.treasures = [];
    let availTreasuresSlots = [];

    // Fixed treasures
    for (let x = 0; x < this.dimension; x++) {
      for (let y = 0; y < this.dimension; y++) {
        if ((x != 0 && x != this.dimension - 1) ||
            (y != 0 && y != this.dimension - 1)) {
          if (x % 2 == 0 && y % 2 == 0) {
            this.treasures.push(new Pawn(scene, x, y, this.tileOffset, "white"));
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
      this.treasures.push(
        new Pawn(scene, rTreasures[i][0], rTreasures[i][1], this.tileOffset, "purple")
      );
      //TODO: Link moving treasures to its tiles
    }
    
    // Default lane selection color
    for (let x = 0; x < this.dimension; ++x)
      this.tiles[x][this.selectedLaneY].material.color.setHex(0x00ff00);
  }

  _getOutterTile() {
    return this.tiles[this.dimension];
  }

  moveOutterTileToEntryPoint() {
    switch (this.laneMoveDirection) {
      case Direction.UP:
        this._getOutterTile().move(this.selectedLaneX, -1, this.tileOffset);
        break;
        
      case Direction.DOWN:
        this._getOutterTile().move(this.selectedLaneX, this.dimension, this.tileOffset);
        break;

      case Direction.LEFT:
        this._getOutterTile().move(-1, this.selectedLaneY, this.tileOffset);
        break;

      case Direction.RIGHT:
        this._getOutterTile().move(this.dimension, this.selectedLaneY, this.tileOffset);
        break;
    }
  }

  selectLane(axis) {
    this.selectedTiles = [];
    for (let x = 0; x < this.dimension; ++x)
      for (let y = 0; y < this.dimension; ++y)
        this.tiles[x][y].material.color.setColorName("white");

    this.selectionAxis = axis;
    if (axis === LaneAxis.HORIZONTAL) {
      this.laneMoveDirection = Direction.LEFT;
      for (let x = 0; x < this.dimension; ++x) {
        this.selectedTiles.push(this.tiles[x][this.selectedLaneY]);
      }
    }
    else if (axis === LaneAxis.VERTICAL) {
      this.laneMoveDirection = Direction.TOP;
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

  moveLane() {
    switch(this.laneMoveDirection) {
      case Direction.UP: {
        this._getOutterTile().move(this.selectedLaneX, 0, this.tileOffset);
        
        for (let i = 0; i < this.dimension; i++) {
          this.tiles[this.selectedLaneX][i].move(this.selectedLaneX, i + 1, this.tileOffset);
          
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
        this._getOutterTile()
          .move(this.selectedLaneX, this.dimension - 1, this.tileOffset);
        
        for (let i = this.dimension - 1; i >= 0; i--) {
          this.tiles[this.selectedLaneX][i]
            .move(this.selectedLaneX, i-1, this.tileOffset);
          
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
        
        this._getOutterTile().move(this.selectedLaneX, -1, this.tileOffset);
        this.backToSelectionMode();
      } break;
        
      case Direction.LEFT: {
        this._getOutterTile().move(0, this.selectedLaneY, this.tileOffset);
        
        for (let i = 0; i < this.dimension; i++) {
          this.tiles[i][this.selectedLaneY]
            .move(i+1, this.selectedLaneY, this.tileOffset);
          
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
        this._getOutterTile()
          .move(this.dimension - 1, this.selectedLaneY, this.tileOffset);
        
        for (let i = this.dimension - 1; i >= 0; i--) {
          this.tiles[i][this.selectedLaneY]
            .move(i-1, this.selectedLaneY, this.tileOffset);
          
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
        
        this._getOutterTile().move(-1, this.selectedLaneY, this.tileOffset);
        this.backToSelectionMode();
      } break;
    }
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
    this.labyrinth.selectLane(LaneAxis.HORIZONTAL);
    this.labyrinth.fillSelectedLane("green");
    
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
