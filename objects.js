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
  "UP": 0,
  "RIGHT": 1,
  "DOWN": 2,
  "LEFT": 3,
});

const TileType = Object.freeze({
  "STRAIGHT": 0,
  "CORNER": 1,
  "TJUNCTION": 2
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
  constructor(x, y, offset) {
    this.geometry = new THREE.BoxGeometry(1, 0, 1);
    this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshBasicMaterial());
    this.mesh.position.set(x * offset, 0, y * offset);

    this.type = undefined;
    this.directions = [];
    this.haveTreasure = false;
  }

  move(x, y, offset) {
    this.mesh.position.setX(x * offset);
    this.mesh.position.setZ(y * offset);
  }

  rotateCounterClockwise(n = 1) {
    for (let i = 0; i < n; ++i) {
      for (let direction of this.directions) {
        direction++;
        if (direction > Direction.LEFT) direction = Direction.UP;
      }
      this.mesh.geometry.rotateY(Math.PI / 2);
    }
  }

  rotateClockwise(n = 1) {
    for (let i = 0; i < n; ++i) {
      for (let direction of this.directions) {
        direction--;
        if (direction < Direction.UP) direction = Direction.LEFT;
      }
      this.mesh.geometry.rotateY(-Math.PI / 2);
    }
  }

  setRandomType() {
    this.type = Math.round(Math.random() * TileType.TJUNCTION);
  }

  updateTexture(x, y) {
    switch (this.type) {
      case TileType.STRAIGHT:
        this.mesh.material.map = new THREE.TextureLoader().load("data/straight.jpg");
        break;

      case TileType.CORNER:
        this.mesh.material.map = new THREE.TextureLoader().load("data/corner.jpg");
        break;

      case TileType.TJUNCTION:
        this.mesh.material.map = new THREE.TextureLoader().load("data/tjunction.jpg");
        break;

      default:
        console.log(`Failed on ${x} ${y}: ${this.directions}`);
        break;
    }
  }

  rotateRandomly() {
    switch (this.type) {
      case TileType.STRAIGHT: {
        this.directions.push(Direction.UP);
        this.directions.push(Direction.DOWN);
        if (Math.round(Math.random()) == 1) {
          this.rotateClockwise();
        }
      } break;

      case TileType.CORNER: {
        this.directions.push(Direction.LEFT);
        this.directions.push(Direction.UP);

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
        this.directions.push(Direction.LEFT);
        this.directions.push(Direction.UP);
        this.directions.push(Direction.RIGHT);

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

function shuffle(arr) { // Used for tiles shuffling
  let i = arr.length, j;
  while (i--) {
    j = Math.floor(Math.random() * (i + 1));
    [arr[i] = arr[j]] = [arr[j] = arr[i]];
  }
  return arr;
}

class Labyrinth {

  constructor(scene, dimension, tileOffset = 1) {
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

    this.tiles = [];
    this.selectedTiles = [];

    const maxDim = this.dimension - 1;
    const hDim = maxDim / 2;

    // Build the labyrinth
    for (let x = 0; x < dimension; ++x) {
      this.tiles.push([]);
      for (let y = 0; y < dimension; ++y) {
        this.tiles[x].push(new Tile(x, y, this.tileOffset));
        scene.add(this.tiles[x][y].mesh);
      }
    }

    // Set spawn tile
    this.tiles[0][0].type = TileType.CORNER;
    this.tiles[0][0].directions = [Direction.RIGHT, Direction.DOWN];
    this.tiles[0][0].updateTexture();

    this.tiles[0][maxDim].type = TileType.CORNER;
    this.tiles[0][maxDim].directions = [Direction.RIGHT, Direction.DOWN];
    this.tiles[0][maxDim].updateTexture();
    this.tiles[0][maxDim].rotateCounterClockwise();

    this.tiles[maxDim][0].type = TileType.CORNER;
    this.tiles[maxDim][0].directions = [Direction.RIGHT, Direction.DOWN];
    this.tiles[maxDim][0].updateTexture();
    this.tiles[maxDim][0].rotateClockwise();

    this.tiles[maxDim][maxDim].type = TileType.CORNER;
    this.tiles[maxDim][maxDim].directions = [Direction.RIGHT, Direction.DOWN];
    this.tiles[maxDim][maxDim].updateTexture();
    this.tiles[maxDim][maxDim].rotateClockwise();
    this.tiles[maxDim][maxDim].rotateClockwise();

    // Create outer tile
    let outerTile = new Tile(-1, dimension, this.tileOffset);
    outerTile.setRandomType();
    outerTile.updateTexture();
    outerTile.rotateRandomly();
    this.tiles.push(outerTile);
    scene.add(outerTile.mesh);

    // Create pawns
    this.pawns = [];
    this.pawns.push(new Pawn(scene, 1, 0, this.tileOffset, "red"));
    this.pawns.push(new Pawn(scene, 0, maxDim, this.tileOffset, "blue"));
    this.pawns.push(new Pawn(scene, maxDim, 0, this.tileOffset, "green"));
    this.pawns.push(new Pawn(scene, maxDim, maxDim, this.tileOffset, "yellow"));

    // Create treasures (fixed and random ones)
    this.nTreasures = Math.floor(24 * this.dimension / 7);
    let availTreasuresSlots = [];

    // Assign fixed treasures and apply the right rotation to their T-junctions
    for (let x = 0; x < this.dimension; x++) {
      for (let y = 0; y < this.dimension; y++) {
        if ((x != 0 && x != maxDim) || (y != 0 && y != maxDim)) {
          if (x % 2 == 0 && y % 2 == 0) {
            this.tiles[x][y].type = TileType.TJUNCTION;
            this.tiles[x][y].updateTexture();
            this.tiles[x][y].haveTreasure = true;

            // Borders fixed T-junctions rotation
            if (x == 0) {
              this.tiles[x][y].rotateCounterClockwise();
              continue;
            }
            if (x == maxDim) {
              this.tiles[x][y].rotateClockwise();
              continue;
            }
            if (y == maxDim) {
              this.tiles[x][y].rotateClockwise(2);
              continue;
            }

            // Other fixed T-junctions rotation
            if (x < hDim && y < hDim) {
              this.tiles[x][y].rotateCounterClockwise();
              continue;
            }
            if (x < hDim && y > hDim) {
              this.tiles[x][y].rotateClockwise(2);
              continue;
            }
            if (x > hDim && y > hDim) {
              this.tiles[x][y].rotateClockwise();
              continue;
            }
          }
          else {
            availTreasuresSlots.push([x, y]);
          }
        }
      }
    }

    // Randomized treasures
    let rTreasures = shuffle(availTreasuresSlots).slice(0, this.nTreasures / 2);
    for (let i = 0; i < rTreasures.length; i++) {
      let x = rTreasures[i][0];
      let y = rTreasures[i][1];
      this.tiles[x][y].haveTreasure = true;
    }

    // Generate tiles type and direction randomly
    let tilesType = [];
    let quotaRandomTilesType = {
      [TileType.STRAIGHT]: Math.round(this.dimension * this.dimension / 28 * this.dimension),
      [TileType.CORNER]: Math.round(this.dimension * this.dimension / 21 * this.dimension),
      [TileType.TJUNCTION]: Math.round(this.dimension * this.dimension / 57  * this.dimension)
    };
    console.log(`12 = ${quotaRandomTilesType[TileType.STRAIGHT]}`);
    console.log(`16 = ${quotaRandomTilesType[TileType.CORNER]}`);
    console.log(`6 = ${quotaRandomTilesType[TileType.TJUNCTION]}`);
    console.log(`Total: ${quotaRandomTilesType[TileType.STRAIGHT]+quotaRandomTilesType[TileType.CORNER]+quotaRandomTilesType[TileType.TJUNCTION]}`);
    quotaRandomTilesType[outerTile.type]--;
    function fillTilesType(type) {
      for (let i = 0; i < quotaRandomTilesType[type]; ++i) tilesType.push(type);
    }
    fillTilesType(TileType.STRAIGHT);
    fillTilesType(TileType.CORNER);
    fillTilesType(TileType.TJUNCTION);
    tilesType = shuffle(tilesType);

    let n = 0;
    for (let x = 0; x < this.dimension; x++) {
      for (let y = 0; y < this.dimension; y++) {
        if (this.tiles[x][y].type == undefined) {
          this.tiles[x][y].type = tilesType[n];
          this.tiles[x][y].updateTexture(x, y);
          this.tiles[x][y].rotateRandomly();
          n++;
        }
      }
    }
  }

  selectLane(axis) {
    this.selectedTiles = [];
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

  backToSelectionMode() { //TODO: Remove after player's pawn movements impl.
    this.gamePhase = GamePhase.SELECT_LANE;
    this.selectedTiles = [];
    switch (this.selectionAxis) {
      case LaneAxis.HORIZONTAL: {
        for (let x = 0; x < this.dimension; ++x) {
          this.selectedTiles.push(this.tiles[x][this.selectedLaneY]);
        }
      } break;

      case LaneAxis.VERTICAL: {
        for (let y = 0; y < this.dimension; ++y) {
          this.selectedTiles.push(this.tiles[this.selectedLaneX][y]);
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
    this.tiles[this.dimension].move(x, y, this.tileOffset);
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
    switch (this.laneEntryPoint) {
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
          this.moveTile(this.selectedLaneX, i, this.selectedLaneX, i - 1);

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
          this.moveTile(i, this.selectedLaneY, i + 1, this.selectedLaneY);

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
          this.moveTile(i, this.selectedLaneY, i - 1, this.selectedLaneY);

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

    this.labyrinth = new Labyrinth(this.scene, 7);

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
