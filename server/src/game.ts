import { Socket } from "socket.io";

namespace ServerSocketData {
  export interface OnConnected {
    dimension : number;
    phase : Phase;
    tiles : Tile[][];
    pawns : Pawn[];
    treasures : Treasure[];
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
    directions : Direction[],
    rotation : number
  }
}

export enum Phase {"PLACE_TILE", "MOVE_PLAYER"};
export enum Direction {"UP", "RIGHT", "DOWN", "LEFT"};
export enum TileType {"STRAIGHT", "CORNER", "TJUNCTION"};
export enum Rotation {"CLOCKWISE" = -1,"COUNTERCLOCKWISE" = 1};

class Entity {
  id : string;
  x : number;
  y : number;
  
  constructor(x : number, y : number) { 
    this.id = crypto.randomUUID();
    this.x = x;
    this.y = y;
  }

  move(x : number, y : number, animated : boolean = false, socket ?: Socket) {
    const fromX = this.x;
    const fromY = this.y;
    
    this.x = x;
    this.y = y;

    const data : ServerSocketData.MoveEntity = {
      id: this.id,
      fromX: fromX,
      fromY: fromY,
      x: this.x,
      y: this.y,
      animated: animated
    };    
    socket?.emit("server:moveEntity", data);
    socket?.broadcast.emit("server:moveEntity", data);
  }
}

class Treasure extends Entity { };

class Pawn extends Entity {
  remainingTreasures : string[] = [];
  hasMoved : boolean = false;
}
  
class Tile extends Entity {
  type !: TileType;
  treasureId !: string;
  
  rotation : number = 0;
  directions : Direction[] = [];
      
  rotate(n : number = 1, rotationDirection : Rotation = Rotation.CLOCKWISE, socket ?: Socket) {
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
      this.rotation = rotationDirection * Math.PI / 2;
      
      const data : ServerSocketData.RotateTile = {
        directions: this.directions,
        rotation: this.rotation
      };
      socket?.emit("server:rotateTile", data);
      socket?.broadcast.emit("server:rotateTile", data);
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
  dimension !: number;
  maxDim !: number; //TODO: Get rid of this
  halfDim !: number;
  
  nTreasures !: number;
  pathFoundTiles !: Tile[];
  
  tiles !: Tile[][];
  pawns !: Pawn[]
  treasures !: Treasure[];

  constructor(dimension : number) {    
    this.dimension = dimension;
    this.maxDim = this.dimension - 1;
    this.halfDim = this.maxDim / 2;
    this.pathFoundTiles = [];

    this.tiles = [];
    for (let x = 0; x < this.dimension; ++x) {
      this.tiles[x] = [];
      for (let y = 0; y < this.dimension; ++y) {
        this.tiles[x][y] = new Tile(x, y);
      }
    }

    let outerTile = new Tile(-1, dimension);
    outerTile.setRandomType();
    this.tiles[this.dimension] = [outerTile];

    this.pawns = [];
    this.pawns.push(new Pawn(0, 0));
    this.pawns.push(new Pawn(this.maxDim, 0));
    this.pawns.push(new Pawn(0, this.maxDim));
    this.pawns.push(new Pawn(this.maxDim, this.maxDim));
    
    this.treasures = [];
    this.nTreasures = Math.floor(24 * this.dimension / 7);
    
    let everyTreasuresCoords : any[] = [];
    let availableTreasureRandomSlots : any[] = [];
    
    for (let x = 0; x < this.dimension; x++) {
      for (let y = 0; y < this.dimension; y++) {
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
        const index = this.treasures.push(new Treasure(pawnTreasures[j].x, pawnTreasures[j].y)) - 1;        
        this.pawns[i].remainingTreasures.push(this.treasures[index].id);
        this.tiles[pawnTreasures[j].x][pawnTreasures[j].y].treasureId = this.treasures[index].id;
      }
      this.pawns[i].remainingTreasures[0] = this.treasures[i * treasuresPerPawn].id;
    }

    let randomTiles : TileType[] = [];
    let sqrDim = this.dimension * this.dimension;
    let quotaRandomTiles = {
      [TileType.STRAIGHT]: Math.round(sqrDim / 28 * this.dimension),
      [TileType.CORNER]: Math.round(sqrDim / 21 * this.dimension),
      [TileType.TJUNCTION]: Math.round(sqrDim / 57  * this.dimension)
    };
    quotaRandomTiles[outerTile.type]--;
    
    const fillTilesType = (type : TileType) => {
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
        
    let randomTileIndex = 0;
    for (let x = 0; x < this.dimension; x++) {
      for (let y = 0; y < this.dimension; y++) {
        if (this.tiles[x][y].type == undefined) {
          this.tiles[x][y].setType(randomTiles[randomTileIndex]);
          randomTileIndex++;
        }
                  
        let tile : Tile = this.tiles[x][y];
        tile.move(x, y);
        
        if ((x != 0 && x != this.maxDim) || (y != 0 && y != this.maxDim)) {
          if (x % 2 == 0 && y % 2 == 0) {
            if (y == 0) tile.rotate();
            else if (x == 0) tile.rotate(-1);
            else if (y == this.maxDim) tile.rotate(3);
            else if (x == this.maxDim) tile.rotate(2);
            else if (x < this.halfDim && y < this.halfDim) tile.rotate(-1);
            else if (x < this.halfDim && y > this.halfDim) tile.rotate(3);
            else if (x > this.halfDim && y < this.halfDim) tile.rotate();
            else if (x > this.halfDim && y > this.halfDim) tile.rotate(2);
          } else {
            tile.rotateRandomly();
          }
        } else {
          tile.directions = [Direction.RIGHT, Direction.DOWN];
          if (x == 0 && y == this.maxDim) {
            tile.rotate(1, Rotation.COUNTERCLOCKWISE);
          } else if (x == this.maxDim && y == 0) {
            this.tiles[this.maxDim][0].rotate();
          } else if (x == this.maxDim && y == this.maxDim) {
           this.tiles[this.maxDim][this.maxDim].rotate(2); 
          }
        }
      }
    }

    outerTile.move(-1, this.dimension);
    outerTile.rotateRandomly();    
  }

  getOuterTile() { return this.tiles[this.dimension][0]; }

  rotateOuterTile() { this.getOuterTile().rotate(); }

  moveTreasureIfExists(tile : Tile, x : number, y : number, socket : Socket) {
    if (tile.treasureId != undefined) {
      for (let treasure of this.treasures) {
        if (treasure.id === tile.treasureId) {
          treasure.move(x, y, true, socket);
          return;
        }
      }
    }
  }
  
  moveTile(entryDirection : Direction, fromX : number, fromY : number, toX : number, toY : number, socket : Socket) {
    this.tiles[fromX][fromY].move(toX, toY, true);
    this.moveTreasureIfExists(this.tiles[fromX][fromY], toX, toY, socket);
    
    for (let pawn of this.pawns) {
      if (pawn.hasMoved == false && pawn.x == fromX && pawn.y == fromY) {
        switch (entryDirection) {
          case Direction.UP: {
            let delta = pawn.y + 1;
            if (delta < this.dimension) pawn.move(pawn.x, delta, true);
            else pawn.move(pawn.x, 0, true);
          } break;

          case Direction.DOWN: {
            let delta = pawn.y - 1;
            if (delta > -1) pawn.move(pawn.x, delta, true);
            else pawn.move(pawn.x, this.maxDim, true);
          } break;

          case Direction.LEFT: {
            let delta = pawn.x + 1;
            if (delta < this.dimension) pawn.move(delta, pawn.y, true);
            else pawn.move(0, pawn.y, true);
          } break;

          case Direction.RIGHT: {
            let delta = pawn.x - 1;
            if (delta > -1) pawn.move(delta, pawn.y, true);
            else pawn.move(this.maxDim, pawn.y, true);
          } break;
        }
        pawn.hasMoved = true;
      }
    }
  }

  swapTile(x1 : number, y1 : number, x2 : number, y2 : number) {
    [this.tiles[x1][y1], this.tiles[x2][y2]] =
    [this.tiles[x2][y2], this.tiles[x1][y1]];
  }
  
  moveLane(entryDirection : Direction, selectedX : number, selectedY : number, socket : Socket) {
    let outerTile = this.getOuterTile();
    switch (entryDirection) {
      case Direction.UP: {
        outerTile.move(selectedX, 0, true);
        this.moveTreasureIfExists(outerTile, selectedX, 0, socket);
        for (let y = 0; y < this.dimension; ++y) {
          this.moveTile(entryDirection, selectedX, y, selectedX, y + 1, socket); 
          this.swapTile(selectedX, 0, selectedX, y);
        }        
        this.swapTile(this.dimension, 0,selectedX, 0);
      } break;

      case Direction.DOWN: {
        outerTile.move(selectedX, this.maxDim, true);
        this.moveTreasureIfExists(outerTile, selectedX, this.maxDim, socket);
        for (let y = this.maxDim; y >= 0; --y) {
          this.moveTile(entryDirection, selectedX, y, selectedX, y - 1, socket);
          this.swapTile(selectedX, this.maxDim, selectedX, y);
        }        
        this.swapTile(this.dimension, 0, selectedX, this.maxDim);
      } break;

      case Direction.LEFT: {
        outerTile.move(0, selectedY, true);
        this.moveTreasureIfExists(outerTile, 0, selectedY, socket);
        for (let x = 0; x < this.dimension; ++x) {
          this.moveTile(entryDirection, x, selectedY, x + 1, selectedY, socket);
          this.swapTile(0, selectedY, x , selectedY);
        }        
        this.swapTile(this.dimension, 0, 0, selectedY);
      } break;

      case Direction.RIGHT: {
        outerTile.move(this.maxDim, selectedY, true);
        this.moveTreasureIfExists(outerTile, this.maxDim, selectedY, socket);
        for (let x = this.maxDim; x >= 0; --x) {
          this.moveTile(entryDirection, x, selectedY, x - 1, selectedY, socket);
          this.swapTile(this.maxDim, selectedY, x, selectedY);
        }
        this.swapTile(this.dimension, 0, this.maxDim, selectedY);
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

  checkPlayerTreasures(currentPawn : number) {
    let seeked = this.treasures.find((e) => { 
      if (e.id === this.pawns[currentPawn].remainingTreasures[0]) return e;
    })!;
    
    if (seeked.x == this.pawns[currentPawn].x && 
        seeked.y == this.pawns[currentPawn].y)
    {
      this.pawns[currentPawn].remainingTreasures.shift();
      if (this.pawns[currentPawn].remainingTreasures.length < 0) {
        console.log(`Game over ! Player ${currentPawn} wins !`);
        // TODO: Client socket (popup + redirection)
      }
    }
  }
}

export class Instance {
  labyrinth : Labyrinth;
  entities : Entity[];  
  
  currentPawn : number;
  phase : Phase;
    
  constructor() {
    this.labyrinth = new Labyrinth(7);

    this.currentPawn = 0;
    this.phase = Phase.PLACE_TILE;
    
    this.entities = [
      ...this.labyrinth.tiles.flat(), 
      ...this.labyrinth.pawns, 
      ...this.labyrinth.treasures
    ];    
  }
    
  nextRound() {
    this.labyrinth.checkPlayerTreasures(this.currentPawn);
    this.labyrinth.pathFoundTiles = [];
    this.currentPawn++;
    if (this.currentPawn > 3) this.currentPawn = 0;
  }
}
