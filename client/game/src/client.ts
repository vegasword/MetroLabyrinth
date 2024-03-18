import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export namespace Game {
  export enum Phase {"PLACE_TILE", "MOVE_PLAYER"};
  export enum Direction {"UP", "RIGHT", "DOWN", "LEFT"};
  export enum TileType {"STRAIGHT", "CORNER", "TJUNCTION"};
  export enum Rotation {"CLOCKWISE" = -1,"COUNTERCLOCKWISE" = 1};
  
  export class Entity {
    x : number;
    y : number;
    moving : boolean
    mesh : THREE.Object3D;
  
    constructor(x : number, y : number, mesh : THREE.Object3D) {
      this.x = x;
      this.y = y; 
      this.mesh = mesh;
    }

    move(x : number, y : number, animated : boolean = true) {
      this.x = x;
      this.y = y;    
    
      if (animated) {
        this.moving = true;
      } else {
        this.mesh.position.setX(x);
        this.mesh.position.setZ(y);
      }
    }
  }
  
  export class Treasure extends Entity {
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

  export class Pawn extends Entity {
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

  export class Tile extends Entity {
    type : TileType;
    rotation : number;
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
  }

  export class Labyrinth {
    dimension : number = 0;
    maxDim : number = 0; //TODO: Get rid of this
    hDim : number = 0;
    nTreasures : number = 0;
  
    tiles : Tile[][] = [];
    pawns : Pawn[] = [];
    treasures : Treasure[] = [];
  
    selectedTile : THREE.Vector2 = new THREE.Vector2();
    entryDirection : Direction = 0;
    entryPoints : THREE.Vector3[];
  
    pathFoundTiles : Tile[];

    getOuterTile() { return this.tiles[this.dimension][0]; }
  }

  export class MoveAnimation {
    entity : Entity;
    target : THREE.Vector3;
    speed : number;
    done : boolean;
  
    _clock : THREE.Clock;

    constructor(entity : Entity, speed : number = 3) {
      this.entity = entity;
      this.target = new THREE.Vector3(entity.x, entity.mesh.position.y, entity.y);
      this.speed = speed;
      this._clock = new THREE.Clock(true);
    }

    update() {
      let alpha =
        THREE.MathUtils.clamp(this.speed * this._clock.getElapsedTime(), 0, 1);
      if (Math.round(alpha) < 1) { 
        this.entity.mesh.position.lerp(this.target, alpha);
      } else {
        this.done = true; 
        this.entity.mesh.position.copy(this.target);
      }
    }
  }
}

export namespace SocketEvents {
  export interface OnConnectedData {
    dimension : number;
    phase : Game.Phase;
    tiles : Game.Tile[][];
    treasures : Game.Treasure[];
  }
  
  export interface OnEntityMoveData { 
    fromX : number;
    fromY : number;
    toX : number;
    toY : number;
    animated : boolean;
  }  
}

class OrbitCamera {
  perspective : THREE.PerspectiveCamera;
  controller : OrbitControls;
  
  constructor(aspect : number, labyrinth : Game.Labyrinth, renderer : THREE.WebGLRenderer) {
    const target = (labyrinth.dimension - 1) / 2;
    
    this.perspective = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.controller = new OrbitControls(this.perspective, renderer.domElement);
    
    this.controller.enablePan = false;
    this.controller.target = new THREE.Vector3(target, 0, target);    
    this.controller.mouseButtons = { LEFT: 2, MIDDLE: 1, RIGHT: 0 };
    this.controller.maxPolarAngle = 1;
    this.controller.minDistance = labyrinth.dimension;
    this.controller.maxDistance = labyrinth.dimension + labyrinth.hDim;
    
    this.perspective.position.x = this.controller.target.x;
    this.perspective.position.y = labyrinth.dimension;
    this.perspective.position.z = labyrinth.dimension + 4;
    
    this.controller.update(0);
  }
}

export class Instance {
  isInitialized : boolean;
  
  window : Window;
  scene : THREE.Scene;
  raycaster : THREE.Raycaster;
  renderer : THREE.WebGLRenderer;
  
  labyrinth : Game.Labyrinth;
  entities : Game.Entity[];
  moveAnimations : Game.MoveAnimation[]
  
  camera : OrbitCamera;
  outerTileLerpTimer : THREE.Clock;
  
  currentPawn : number;
  phase : Game.Phase;
    
  constructor(window : Window) {
    this.window = window;
    
    this.labyrinth = new Game.Labyrinth();
    this.moveAnimations = [];
    
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.DirectionalLight());
    this.raycaster = new THREE.Raycaster();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(document.getElementById("labyrinth")!.clientWidth, window.innerHeight);
    
    this.outerTileLerpTimer = new THREE.Clock(false);
  }

  onConnected(data : SocketEvents.OnConnectedData) {
    this.phase = data.phase;
    
    const dim : number = data.dimension;
    const maxDim : number = dim - 1;
    const hDim : number = maxDim / 2;

    this.labyrinth.dimension = dim;
    this.labyrinth.maxDim = maxDim;
    this.labyrinth.hDim = hDim;  
  
    let loader = new GLTFLoader();
    const modelsPath = {
      [Game.TileType.STRAIGHT]: "data/straight.glb",
      [Game.TileType.CORNER]: "data/corner.glb",
      [Game.TileType.TJUNCTION]: "data/tjunction.glb",
    };
  
    this.labyrinth.tiles = [];
    this.labyrinth.entryPoints = [];
    for (let x = 0; x < dim; ++x) {
      this.labyrinth.tiles[x] = [];
      for (let y = 0; y < dim; ++y) {
        this.labyrinth.tiles[x][y] = new Game.Tile(x, y);
        this.labyrinth.tiles[x][y].type = data.tiles[x][y].type;
        this.labyrinth.tiles[x][y].rotation = data.tiles[x][y].rotation;
        this.labyrinth.tiles[x][y].treasureId = data.tiles[x][y].treasureId;
        this.labyrinth.tiles[x][y].directions = data.tiles[x][y].directions;
        loader.load(modelsPath[this.labyrinth.tiles[x][y].type], (gltf) => {
          gltf.scene.traverse((e) => { if (e.type === "Mesh") this.labyrinth.tiles[x][y].mesh = e; });
          this.labyrinth.tiles[x][y].move(x, y, false);
          this.labyrinth.tiles[x][y].mesh.rotateY(this.labyrinth.tiles[x][y].rotation);
          this.scene.add(this.labyrinth.tiles[x][y].mesh);
        });

        if (((x != 0 && x != this.labyrinth.maxDim) ||
             (y != 0 && y != this.labyrinth.maxDim)) &&
             (x % 2 != 0 || y % 2 != 0))
        {
          if (y == 0) {
            this.labyrinth.entryPoints.push(new THREE.Vector3(x, 0, -1));
          } else if (x == 0) {
            this.labyrinth.entryPoints.push(new THREE.Vector3(-1, 0, y));
          } else if (y ==this.labyrinth.maxDim) {
            this.labyrinth.entryPoints.push(new THREE.Vector3(x, 0, this.labyrinth.dimension));
          } else if (x == this.labyrinth.maxDim) {
            this.labyrinth.entryPoints.push(new THREE.Vector3(this.labyrinth.dimension, 0, y));
          }
        }
      }
    }  
    
    this.labyrinth.tiles[dim] = [new Game.Tile(-1, dim)];
    this.labyrinth.tiles[dim][0].type = data.tiles[dim][0].type
    this.labyrinth.tiles[dim][0].rotation = data.tiles[dim][0].rotation;
    loader.load(modelsPath[this.labyrinth.tiles[dim][0].type], (gltf) => {
      gltf.scene.traverse((e) => { if (e.type === "Mesh") this.labyrinth.tiles[dim][0].mesh = e; });
      this.labyrinth.tiles[dim][0].move(-1, dim, false);
      this.labyrinth.tiles[dim][0].mesh.rotateY(this.labyrinth.tiles[dim][0].rotation);
      this.scene.add(this.labyrinth.tiles[dim][0].mesh);
    });

    this.labyrinth.treasures = []
    for (let t of data.treasures) {
      let treasure : Game.Treasure = new Game.Treasure(t.id, t.x, t.y);
      this.labyrinth.treasures.push(treasure);
      this.scene.add(treasure.mesh);
    }
  
    this.labyrinth.pawns = [];
    this.labyrinth.pawns.push(new Game.Pawn(0, 0, "red"));
    this.labyrinth.pawns.push(new Game.Pawn(maxDim, 0, "green"));
    this.labyrinth.pawns.push(new Game.Pawn(maxDim, maxDim, "orange"));
    this.labyrinth.pawns.push(new Game.Pawn(0, maxDim, "blue"));
    for (let pawn of this.labyrinth.pawns) this.scene.add(pawn.mesh);
  
    const viewport : HTMLElement = document.getElementById("labyrinth")!;
    const aspect = viewport.clientWidth / window.innerHeight;
    this.camera = new OrbitCamera(aspect, this.labyrinth, this.renderer);
    
    const canvas  = viewport.querySelector("canvas");
    if (canvas) {
      viewport.replaceChild<HTMLCanvasElement>(this.renderer.domElement, canvas);
    } else {
      viewport.appendChild(this.renderer.domElement);
    }
  
    this.entities = [
      ...this.labyrinth.tiles.flat(), 
      ...this.labyrinth.pawns, 
      ...this.labyrinth.treasures
    ];
  
    this.isInitialized = true;
  }  
  
  getPlayerTile() {
    return this.labyrinth.tiles
      [this.labyrinth.pawns[this.currentPawn].x]
      [this.labyrinth.pawns[this.currentPawn].y];
  }
  
  nextRound() {
    // this.labyrinth.checkPlayerTreasures(this.currentPawn, this.window);
    this.labyrinth.pathFoundTiles = [];
    this.currentPawn++;
    if (this.currentPawn > 3) this.currentPawn = 0;
  }

  updateMoveAnimations() {
    for (let entity of this.entities) {
      if (entity.moving) {
        this.moveAnimations.push(new Game.MoveAnimation(entity));
        entity.moving = false;
      }
    }
    
    this.moveAnimations.forEach((animation) => {
      if (!animation.done) {
        animation.update()
      } else {
        const index = this.moveAnimations.indexOf(animation, 0);
        if (index > -1) this.moveAnimations.splice(index, 1);
      }
    });
  }

  update() {
    this.updateMoveAnimations();
  }
  
  render() {
    this.renderer.render(this.scene, this.camera.perspective);
  }
}
