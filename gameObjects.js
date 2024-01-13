import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

class Pawn {
  constructor(scene, x, y, hexColor) {
    this.geometry = new THREE.CapsuleGeometry(0.25, 0.5, 1, 4);
    this.material = new THREE.MeshBasicMaterial({ color: hexColor });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(x, this.geometry.parameters.length, y);
    scene.add(this.mesh);
  }

  move(x, y) {
    this.mesh.position.setX(x);
    this.mesh.position.setZ(y);
  }
}

class Tile {
  constructor(x, y, i) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.font = '120px sans-serif';
    context.textAlign = 'center';
    context.fillText(i.toString(), 120, 120);    
    const texture = new THREE.Texture(canvas)
    texture.needsUpdate = true
    var material = new THREE.MeshBasicMaterial({map: texture})
    
    this.geometry = new THREE.BoxGeometry(1, 0, 1);
    this.material = material;//new THREE.MeshBasicMaterial({ color: color });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(x, 0, y);
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

    this.gamePhase = GamePhase.SELECT_LANE;
    this.selectionAxis = LaneAxis.HORIZONTAL;
    this.laneMoveDirection = Direction.LEFT;

    // this.currentPawnId = 0;
    this.selectedLaneX = -1;
    this.selectedLaneY = 1;

    this.dimension = dimension;
    this.tileOffset = tileOffset;
    this.pawns = [];

    this.tiles = [];
    this.selectedTiles = [];

    // Build the labyrinth
    for (let x = 0; x < dimension; ++x) {
      this.tiles.push([]);
      for (let y = 0; y < dimension; ++y) {
        this.tiles[x].push(new Tile(x * tileOffset, y * tileOffset, `${x}, ${y}`));
        scene.add(this.tiles[x][y].mesh);
      }
    }
    let tileOut = new Tile(-1 * tileOffset, dimension * tileOffset, "YUP");
    this.tiles.push(tileOut)
    scene.add(tileOut.mesh);

    // Default lane selection color
    for (let x = 0; x < this.dimension; ++x)
      this.tiles[x][this.selectedLaneY].material.color.setHex(0x00ff00);

    // Init pawns
    const maxPos = (this.dimension - 1) * this.tileOffset;
    this.pawns.push(
      new Pawn(scene, 0, 0, 0xffcc00),
      new Pawn(scene, 0, maxPos, 0xccff00),
      new Pawn(scene, maxPos, 0, 0x00ccff),
      new Pawn(scene, maxPos, maxPos, 0xfccffc)
    );
  }

  getTileOut() {
    return this.tiles[this.dimension];
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
        this.getTileOut().move(this.selectedLaneX, 0, this.tileOffset);
        
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
        this.getTileOut()
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
        
        this.getTileOut().move(this.selectedLaneX, -1, this.tileOffset);
        this.backToSelectionMode();
      } break;
        
      case Direction.LEFT: {
        this.getTileOut().move(0, this.selectedLaneY, this.tileOffset);
        
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
        this.getTileOut()
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
        
        this.getTileOut().move(-1, this.selectedLaneY, this.tileOffset);
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

export {
  OrbitCamera,
  Labyrinth,
  GamePhase,
  LaneAxis,
  Direction
};
