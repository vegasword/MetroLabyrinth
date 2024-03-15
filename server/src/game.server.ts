import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

enum GamePhase {"PLACE_TILE", "MOVE_PLAYER"};
enum Direction {"UP", "RIGHT", "DOWN", "LEFT"};
enum TileType {"STRAIGHT", "CORNER", "TJUNCTION"};
enum Rotation {"CLOCKWISE" = -1,"COUNTERCLOCKWISE" = 1};

class Entity {
  x : number;
  y : number;
  
  constructor(x : number, y : number) { this.x = x; this.y = y; }

  move(x : number, y : number) {
    this.x = x;
    this.y = y;    
    
    /* TODO: Socket to client
    if (animated) {
      this.moving = true;
    } else {
      this.mesh.position.setX(x);
      this.mesh.position.setZ(y);
    }
    */
  }
}

class Treasure extends Entity {
  id : number;
  
  constructor(id : number, x : number, y : number) { 
    super(x, y);
    this.id = id;
  }
}

class Pawn extends Entity {
  remainingTreasures : number[];
  hasMoved : boolean;
  
  constructor(x : number, y : number) {    
    super(x, y);
    this.remainingTreasures = [];
    this.hasMoved = false;
  }
}

class Tile extends Entity {
  type : TileType = 0;
  rotation : number = 0 // In radians
  treasureId : number = 0;
  directions : Direction[] = [];
  
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
      this.rotation += rotationDirection * Math.PI / 2;
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
  dim !: number;
  maxDim !: number;
  hDim !: number;
  nTreasures !: number;
  tiles !: Tile[][];
  selectedTiles !: Tile[];
  pathFoundTiles !: Tile[];
  pawns !: Pawn[]
  treasures !: Treasure[];

  constructor(server : Server, dimension : number) {
    if (dimension % 2 == 0 && dimension > 7) {
      alert("The dimension should be odd and superior to 7!");
      return;
    }
    
    this.dim = dimension;
    this.maxDim = this.dim - 1;
    this.hDim = this.maxDim / 2;

    this.selectedTiles = [];
    this.pathFoundTiles = [];

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
    this.pawns.push(new Pawn(0, 0));
    this.pawns.push(new Pawn(this.maxDim, 0));
    this.pawns.push(new Pawn(this.maxDim, this.maxDim));
    this.pawns.push(new Pawn(0, this.maxDim));
    
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
            
    let randomTileIndex = 0;
    for (let x = 0; x < this.dim; x++) {
      for (let y = 0; y < this.dim; y++) {
        if (this.tiles[x][y].type == undefined) {
          this.tiles[x][y].setType(randomTiles[randomTileIndex]);
          randomTileIndex++;
        }
                  
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
          }
        } else {
          this.tiles[x][y].directions = [Direction.RIGHT, Direction.DOWN];
          if (x == 0 && y == this.maxDim) this.tiles[x][y].rotate(1, Rotation.COUNTERCLOCKWISE);
          else if (x == this.maxDim && y == 0) this.tiles[this.maxDim][0].rotate();
          else if (x == this.maxDim && y == this.maxDim) this.tiles[this.maxDim][this.maxDim].rotate(2);
        } 
      }
    }

    outerTile.move(-1, 1);
    outerTile.rotateRandomly();
    
    server.emit("game:create", { 
      dimension: this.dim, 
      tiles: this.tiles,
      treasures: this.treasures
    });
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
  
  moveTile(entryDirection : Direction, fromX : number, fromY : number, toX : number, toY : number) {
    this.tiles[fromX][fromY].move(toX, toY);
    this.moveTreasureIfExists(this.tiles[fromX][fromY], toX, toY);
    
    for (let pawn of this.pawns) {
      if (pawn.hasMoved == false && pawn.x == fromX && pawn.y == fromY) {
        switch (entryDirection) {
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

  swapTile(x1 : number, y1 : number, x2 : number, y2 : number) {
    [this.tiles[x1][y1], this.tiles[x2][y2]] =
    [this.tiles[x2][y2], this.tiles[x1][y1]];
  }
  
  moveLane(entryDirection : Direction, selectedX : number, selectedY : number) {
    let outerTile = this.tiles[this.dim][0];
    switch (entryDirection) {
      case Direction.UP: {
        outerTile.move(selectedX, 0);
        this.moveTreasureIfExists(outerTile, selectedX, 0);
        for (let y = 0; y < this.dim; ++y) {
          this.moveTile(entryDirection, selectedX, y, selectedX, y + 1); 
          this.swapTile(selectedX, 0, selectedX, y);
        }        
        this.swapTile(this.dim, 0,selectedX, 0);
      } break;

      case Direction.DOWN: {
        outerTile.move(selectedX, this.maxDim);
        this.moveTreasureIfExists(outerTile, selectedX, this.maxDim);
        for (let y = this.maxDim; y >= 0; --y) {
          this.moveTile(entryDirection, selectedX, y, selectedX, y - 1);
          this.swapTile(selectedX, this.maxDim, selectedX, y);
        }        
        this.swapTile(this.dim, 0, selectedX, this.maxDim);
      } break;

      case Direction.LEFT: {
        outerTile.move(0, selectedY);
        this.moveTreasureIfExists(outerTile, 0, selectedY);        
        for (let x = 0; x < this.dim; ++x) {
          this.moveTile(entryDirection, x, selectedY, x + 1, selectedY);
          this.swapTile(0, selectedY, x , selectedY);
        }        
        this.swapTile(this.dim, 0, 0, selectedY);
      } break;

      case Direction.RIGHT: {
        outerTile.move(this.maxDim, selectedY);
        this.moveTreasureIfExists(outerTile, this.maxDim, selectedY);        
        for (let x = this.maxDim; x >= 0; --x) {
          this.moveTile(entryDirection, x, selectedY, x - 1, selectedY);
          this.swapTile(this.maxDim, selectedY, x, selectedY);
        }
        this.swapTile(this.dim, 0, this.maxDim, selectedY);
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
    let seeked = this.treasures[this.pawns[currentPawn].remainingTreasures[0]];
    if (seeked.x == this.pawns[currentPawn].x && 
        seeked.y == this.pawns[currentPawn].y)
    {
      this.pawns[currentPawn].remainingTreasures.shift();
      if (this.pawns[currentPawn].remainingTreasures.length < 0) {
        console.log(`Game over ! Player ${currentPawn} wins !`);
        /* TODO: Client socket (popup + redirection)
        alert(`Game over ! Player ${currentPawn} wins !`);
        window.location.reload();
        */
      }
    }
  }
}

class GameServer {
  server : Server;
  labyrinth : Labyrinth;
  entities : Entity[];  
  
  currentPawn : number;
  phase : GamePhase;
    
  constructor(server : Server) {
    this.server = server;
    this.labyrinth = new Labyrinth(server, 7);

    this.currentPawn = 0;
    this.phase = GamePhase.PLACE_TILE;
    
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

export const gameServer = createServer(express());
const io = new Server(gameServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on("connection", () => {
  console.log("Connected");
  let gameServer = new GameServer(io);
});
