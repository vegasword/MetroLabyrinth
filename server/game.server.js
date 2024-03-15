"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var GamePhase;
(function (GamePhase) {
    GamePhase[GamePhase["PLACE_TILE"] = 0] = "PLACE_TILE";
    GamePhase[GamePhase["MOVE_PLAYER"] = 1] = "MOVE_PLAYER";
})(GamePhase || (GamePhase = {}));
;
var Direction;
(function (Direction) {
    Direction[Direction["UP"] = 0] = "UP";
    Direction[Direction["RIGHT"] = 1] = "RIGHT";
    Direction[Direction["DOWN"] = 2] = "DOWN";
    Direction[Direction["LEFT"] = 3] = "LEFT";
})(Direction || (Direction = {}));
;
var TileType;
(function (TileType) {
    TileType[TileType["STRAIGHT"] = 0] = "STRAIGHT";
    TileType[TileType["CORNER"] = 1] = "CORNER";
    TileType[TileType["TJUNCTION"] = 2] = "TJUNCTION";
})(TileType || (TileType = {}));
;
var Rotation;
(function (Rotation) {
    Rotation[Rotation["CLOCKWISE"] = -1] = "CLOCKWISE";
    Rotation[Rotation["COUNTERCLOCKWISE"] = 1] = "COUNTERCLOCKWISE";
})(Rotation || (Rotation = {}));
;
var Entity = /** @class */ (function () {
    function Entity(x, y) {
        this.x = x;
        this.y = y;
    }
    Entity.prototype.move = function (x, y) {
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
    };
    return Entity;
}());
var Treasure = /** @class */ (function (_super) {
    __extends(Treasure, _super);
    function Treasure(id, x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.id = id;
        return _this;
    }
    return Treasure;
}(Entity));
var Pawn = /** @class */ (function (_super) {
    __extends(Pawn, _super);
    function Pawn(x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.remainingTreasures = [];
        _this.hasMoved = false;
        return _this;
    }
    return Pawn;
}(Entity));
var Tile = /** @class */ (function (_super) {
    __extends(Tile, _super);
    function Tile() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = 0;
        _this.treasureId = 0;
        _this.directions = [];
        return _this;
    }
    //constructor(x : number, y : number) { super(x, y); }
    Tile.prototype.rotate = function (n, rotationDirection) {
        if (n === void 0) { n = 1; }
        if (rotationDirection === void 0) { rotationDirection = Rotation.CLOCKWISE; }
        for (var i = 0; i < n; ++i) {
            for (var j = 0; j < this.directions.length; ++j) {
                this.directions[j] -= rotationDirection;
                if (rotationDirection == Rotation.CLOCKWISE) {
                    if (this.directions[j] > Direction.LEFT) {
                        this.directions[j] = Direction.UP;
                    }
                }
                else {
                    if (this.directions[j] < Direction.UP) {
                        this.directions[j] = Direction.LEFT;
                    }
                }
            }
            /* TODO: Socket to client
            this.mesh.rotateY(rotationDirection * Math.PI / 2);
            */
        }
    };
    Tile.prototype.setType = function (type) {
        this.type = type;
        switch (type) {
            case TileType.STRAIGHT:
                {
                    this.directions.push(Direction.UP, Direction.DOWN);
                }
                break;
            case TileType.CORNER:
                {
                    this.directions.push(Direction.RIGHT, Direction.DOWN);
                }
                break;
            case TileType.TJUNCTION:
                {
                    this.directions.push(Direction.UP, Direction.DOWN, Direction.RIGHT);
                }
                break;
        }
    };
    Tile.prototype.setRandomType = function () {
        this.setType(Math.round(Math.random() * TileType.TJUNCTION));
    };
    Tile.prototype.rotateRandomly = function () {
        var doShuffle = Math.round(Math.random()) == 1;
        var nShuffle = Math.round(Math.random() * 4);
        switch (this.type) {
            case TileType.STRAIGHT:
                {
                    if (doShuffle)
                        this.rotate();
                }
                break;
            case TileType.CORNER:
                {
                    for (var i = 0; i < nShuffle; ++i) {
                        if (doShuffle)
                            this.rotate();
                        else
                            this.rotate(1, Rotation.COUNTERCLOCKWISE);
                    }
                }
                break;
            case TileType.TJUNCTION:
                {
                    for (var i = 0; i < nShuffle; ++i) {
                        if (doShuffle)
                            this.rotate();
                        else
                            this.rotate(1, Rotation.COUNTERCLOCKWISE);
                    }
                }
                break;
        }
    };
    return Tile;
}(Entity));
function shuffle(arr) {
    var _a;
    var i = arr.length;
    var j;
    while (i--) {
        j = Math.floor(Math.random() * (i + 1));
        _a = [arr[j], arr[i]], arr[i] = _a[0], arr[j] = _a[1];
    }
    return arr;
}
var Labyrinth = /** @class */ (function () {
    function Labyrinth(socket, dimension) {
        var _a;
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
        for (var x = 0; x < this.dim; ++x) {
            this.tiles[x] = [];
            for (var y = 0; y < this.dim; ++y) {
                this.tiles[x][y] = new Tile(x, y);
            }
        }
        var outerTile = new Tile(-1, dimension);
        outerTile.setRandomType();
        this.tiles[this.dim] = [outerTile];
        this.pawns = [];
        this.pawns.push(new Pawn(0, 0));
        this.pawns.push(new Pawn(this.maxDim, 0));
        this.pawns.push(new Pawn(this.maxDim, this.maxDim));
        this.pawns.push(new Pawn(0, this.maxDim));
        this.treasures = [];
        this.nTreasures = Math.floor(24 * this.dim / 7);
        var treasureId = 0;
        var everyTreasuresCoords = [];
        var availableTreasureRandomSlots = [];
        for (var x = 0; x < this.dim; x++) {
            for (var y = 0; y < this.dim; y++) {
                if ((x != 0 && x != this.maxDim) || (y != 0 && y != this.maxDim)) {
                    if (x % 2 == 0 && y % 2 == 0) {
                        this.tiles[x][y].setType(TileType.TJUNCTION);
                        everyTreasuresCoords.push({ x: x, y: y });
                    }
                    else {
                        availableTreasureRandomSlots.push({ x: x, y: y });
                    }
                }
            }
        }
        var randomTreasures = shuffle(availableTreasureRandomSlots)
            .slice(0, this.nTreasures / 2);
        for (var _i = 0, randomTreasures_1 = randomTreasures; _i < randomTreasures_1.length; _i++) {
            var t = randomTreasures_1[_i];
            everyTreasuresCoords.push({ x: t.x, y: t.y });
        }
        var treasuresPerPawn = Math.round(this.nTreasures / this.pawns.length);
        for (var i = 0; i < this.pawns.length; ++i) {
            var pawnTreasures = shuffle(everyTreasuresCoords)
                .splice(0, treasuresPerPawn);
            for (var j = 0; j < pawnTreasures.length; ++j) {
                this.treasures.push(new Treasure(treasureId, pawnTreasures[j].x, pawnTreasures[j].y));
                this.pawns[i].remainingTreasures.push(treasureId);
                this.tiles[pawnTreasures[j].x][pawnTreasures[j].y].treasureId = treasureId;
                treasureId++;
            }
            this.pawns[i].remainingTreasures[0] = i * treasuresPerPawn;
        }
        var randomTiles = [];
        var quotaRandomTiles = (_a = {},
            _a[TileType.STRAIGHT] = Math.round(this.dim * this.dim / 28 * this.dim),
            _a[TileType.CORNER] = Math.round(this.dim * this.dim / 21 * this.dim),
            _a[TileType.TJUNCTION] = Math.round(this.dim * this.dim / 57 * this.dim),
            _a);
        quotaRandomTiles[outerTile.type]--;
        function fillTilesType(type) {
            for (var i = 0; i < quotaRandomTiles[type]; ++i)
                randomTiles.push(type);
        }
        fillTilesType(TileType.STRAIGHT);
        fillTilesType(TileType.CORNER);
        fillTilesType(TileType.TJUNCTION);
        randomTiles = shuffle(randomTiles);
        this.tiles[0][0].type = TileType.CORNER;
        this.tiles[0][this.maxDim].type = TileType.CORNER;
        this.tiles[this.maxDim][0].type = TileType.CORNER;
        this.tiles[this.maxDim][this.maxDim].type = TileType.CORNER;
        var randomTileIndex = 0;
        for (var x = 0; x < this.dim; x++) {
            for (var y = 0; y < this.dim; y++) {
                if (this.tiles[x][y].type == undefined) {
                    this.tiles[x][y].setType(randomTiles[randomTileIndex]);
                    randomTileIndex++;
                }
                this.tiles[x][y].move(x, y);
                if ((x != 0 && x != this.maxDim) || (y != 0 && y != this.maxDim)) {
                    if (x % 2 == 0 && y % 2 == 0) {
                        if (y == 0)
                            this.tiles[x][y].rotate();
                        else if (x == 0)
                            this.tiles[x][y].rotate(-1);
                        else if (y == this.maxDim)
                            this.tiles[x][y].rotate(3);
                        else if (x == this.maxDim)
                            this.tiles[x][y].rotate(2);
                        else if (x < this.hDim && y < this.hDim)
                            this.tiles[x][y].rotate(-1);
                        else if (x < this.hDim && y > this.hDim)
                            this.tiles[x][y].rotate(3);
                        else if (x > this.hDim && y < this.hDim)
                            this.tiles[x][y].rotate();
                        else if (x > this.hDim && y > this.hDim)
                            this.tiles[x][y].rotate(2);
                    }
                    else if (x % 2 != 0 || y % 2 != 0) {
                        this.tiles[x][y].rotateRandomly();
                    }
                }
                else {
                    this.tiles[x][y].directions = [Direction.RIGHT, Direction.DOWN];
                    if (x == 0 && y == this.maxDim)
                        this.tiles[x][y].rotate(1, Rotation.COUNTERCLOCKWISE);
                    else if (x == this.maxDim && y == 0)
                        this.tiles[this.maxDim][0].rotate();
                    else if (x == this.maxDim && y == this.maxDim)
                        this.tiles[this.maxDim][this.maxDim].rotate(2);
                }
            }
        }
        outerTile.move(-1, 1);
        outerTile.rotateRandomly();
        socket.emit("game:create", {
            tiles: this.tiles, outerTile: outerTile, treasures: this.treasures
        });
    }
    Labyrinth.prototype.rotateOuterTile = function () { this.tiles[this.dim][0].rotate(); };
    Labyrinth.prototype.moveTreasureIfExists = function (tile, x, y) {
        if (tile.treasureId != undefined) {
            for (var _i = 0, _a = this.treasures; _i < _a.length; _i++) {
                var treasure = _a[_i];
                if (treasure.id == tile.treasureId) {
                    treasure.move(x, y);
                    return;
                }
            }
        }
    };
    Labyrinth.prototype.moveTile = function (entryDirection, fromX, fromY, toX, toY) {
        this.tiles[fromX][fromY].move(toX, toY);
        this.moveTreasureIfExists(this.tiles[fromX][fromY], toX, toY);
        for (var _i = 0, _a = this.pawns; _i < _a.length; _i++) {
            var pawn = _a[_i];
            if (pawn.hasMoved == false && pawn.x == fromX && pawn.y == fromY) {
                switch (entryDirection) {
                    case Direction.UP:
                        {
                            var delta = pawn.y + 1;
                            if (delta < this.dim)
                                pawn.move(pawn.x, delta);
                            else
                                pawn.move(pawn.x, 0);
                        }
                        break;
                    case Direction.DOWN:
                        {
                            var delta = pawn.y - 1;
                            if (delta > -1)
                                pawn.move(pawn.x, delta);
                            else
                                pawn.move(pawn.x, this.maxDim);
                        }
                        break;
                    case Direction.LEFT:
                        {
                            var delta = pawn.x + 1;
                            if (delta < this.dim)
                                pawn.move(delta, pawn.y);
                            else
                                pawn.move(0, pawn.y);
                        }
                        break;
                    case Direction.RIGHT:
                        {
                            var delta = pawn.x - 1;
                            if (delta > -1)
                                pawn.move(delta, pawn.y);
                            else
                                pawn.move(this.maxDim, pawn.y);
                        }
                        break;
                }
                pawn.hasMoved = true;
            }
        }
    };
    Labyrinth.prototype.swapTile = function (x1, y1, x2, y2) {
        var _a;
        _a = [this.tiles[x2][y2], this.tiles[x1][y1]], this.tiles[x1][y1] = _a[0], this.tiles[x2][y2] = _a[1];
    };
    Labyrinth.prototype.moveLane = function (entryDirection, selectedX, selectedY) {
        var outerTile = this.tiles[this.dim][0];
        switch (entryDirection) {
            case Direction.UP:
                {
                    outerTile.move(selectedX, 0);
                    this.moveTreasureIfExists(outerTile, selectedX, 0);
                    for (var y = 0; y < this.dim; ++y) {
                        this.moveTile(entryDirection, selectedX, y, selectedX, y + 1);
                        this.swapTile(selectedX, 0, selectedX, y);
                    }
                    this.swapTile(this.dim, 0, selectedX, 0);
                }
                break;
            case Direction.DOWN:
                {
                    outerTile.move(selectedX, this.maxDim);
                    this.moveTreasureIfExists(outerTile, selectedX, this.maxDim);
                    for (var y = this.maxDim; y >= 0; --y) {
                        this.moveTile(entryDirection, selectedX, y, selectedX, y - 1);
                        this.swapTile(selectedX, this.maxDim, selectedX, y);
                    }
                    this.swapTile(this.dim, 0, selectedX, this.maxDim);
                }
                break;
            case Direction.LEFT:
                {
                    outerTile.move(0, selectedY);
                    this.moveTreasureIfExists(outerTile, 0, selectedY);
                    for (var x = 0; x < this.dim; ++x) {
                        this.moveTile(entryDirection, x, selectedY, x + 1, selectedY);
                        this.swapTile(0, selectedY, x, selectedY);
                    }
                    this.swapTile(this.dim, 0, 0, selectedY);
                }
                break;
            case Direction.RIGHT:
                {
                    outerTile.move(this.maxDim, selectedY);
                    this.moveTreasureIfExists(outerTile, this.maxDim, selectedY);
                    for (var x = this.maxDim; x >= 0; --x) {
                        this.moveTile(entryDirection, x, selectedY, x - 1, selectedY);
                        this.swapTile(this.maxDim, selectedY, x, selectedY);
                    }
                    this.swapTile(this.dim, 0, this.maxDim, selectedY);
                }
                break;
        }
        for (var _i = 0, _a = this.pawns; _i < _a.length; _i++) {
            var pawn = _a[_i];
            pawn.hasMoved = false;
        }
    };
    Labyrinth.prototype.playerPathFinding = function (root, entry) {
        if (this.pathFoundTiles.includes(root))
            return;
        var newSize = this.pathFoundTiles.push(root);
        var last = this.pathFoundTiles[newSize - 1];
        for (var _i = 0, _a = last.directions; _i < _a.length; _i++) {
            var direction = _a[_i];
            if (entry === direction)
                continue;
            switch (direction) {
                case Direction.LEFT:
                    {
                        var prevRow = last.x - 1;
                        if (prevRow >= 0) {
                            var neighbour = this.tiles[prevRow][last.y];
                            if (neighbour.directions.includes(Direction.RIGHT)) {
                                this.playerPathFinding(neighbour, Direction.RIGHT);
                            }
                        }
                    }
                    break;
                case Direction.RIGHT:
                    {
                        var nextRow = last.x + 1;
                        if (nextRow <= this.maxDim) {
                            var neighbour = this.tiles[nextRow][last.y];
                            if (neighbour.directions.includes(Direction.LEFT)) {
                                this.playerPathFinding(neighbour, Direction.LEFT);
                            }
                        }
                    }
                    break;
                case Direction.UP:
                    {
                        var prevCol = last.y - 1;
                        if (prevCol >= 0) {
                            var neighbour = this.tiles[last.x][prevCol];
                            if (neighbour.directions.includes(Direction.DOWN)) {
                                this.playerPathFinding(neighbour, Direction.DOWN);
                            }
                        }
                    }
                    break;
                case Direction.DOWN:
                    {
                        var nextCol = last.y + 1;
                        if (nextCol <= this.maxDim) {
                            var neighbour = this.tiles[last.x][nextCol];
                            if (neighbour.directions.includes(Direction.UP)) {
                                this.playerPathFinding(neighbour, Direction.UP);
                            }
                        }
                    }
                    break;
            }
        }
    };
    Labyrinth.prototype.checkPlayerTreasures = function (currentPawn) {
        var seeked = this.treasures[this.pawns[currentPawn].remainingTreasures[0]];
        if (seeked.x == this.pawns[currentPawn].x &&
            seeked.y == this.pawns[currentPawn].y) {
            this.pawns[currentPawn].remainingTreasures.shift();
            if (this.pawns[currentPawn].remainingTreasures.length < 0) {
                console.log("Game over ! Player ".concat(currentPawn, " wins !"));
                /* TODO: Client socket (popup + redirection)
                alert(`Game over ! Player ${currentPawn} wins !`);
                window.location.reload();
                */
            }
        }
    };
    return Labyrinth;
}());
var GameServer = /** @class */ (function () {
    function GameServer(socket) {
        this.socket = socket;
        this.labyrinth = new Labyrinth(socket, 7);
        this.currentPawn = 0;
        this.phase = GamePhase.PLACE_TILE;
        this.entities = __spreadArray(__spreadArray(__spreadArray([], this.labyrinth.tiles.flat(), true), this.labyrinth.pawns, true), this.labyrinth.treasures, true);
    }
    GameServer.prototype.nextRound = function () {
        this.labyrinth.checkPlayerTreasures(this.currentPawn);
        this.labyrinth.pathFoundTiles = [];
        this.currentPawn++;
        if (this.currentPawn > 3)
            this.currentPawn = 0;
    };
    return GameServer;
}());
var server = new socket_io_1.Server((0, http_1.createServer)((0, express_1.default)()), {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
server.on("connection", function (socket) {
    console.log("Connected");
    var game = new GameServer(socket);
    //TODO: Broadcast socket
});
server.listen(3000);
