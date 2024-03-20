import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export enum Phase {"PLACE_TILE", "MOVE_PLAYER"};
export enum Direction {"UP", "RIGHT", "DOWN", "LEFT"};
export enum TileType {"STRAIGHT", "CORNER", "TJUNCTION"};
export enum Rotation {"CLOCKWISE" = -1,"COUNTERCLOCKWISE" = 1};

export class Entity {
  id : string;
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
  constructor(x : number, y : number) {        
    let geometry = new THREE.CircleGeometry(0.15, 8);
    let material = new THREE.MeshBasicMaterial({color: 0xffffff});
    let mesh =  new THREE.Mesh(geometry, material);
    mesh.position.set(x, 0.1, y);
    mesh.rotateX(-Math.PI / 2);    
  
    super(x, y, mesh);
  }
}

export class Pawn extends Entity {
  remainingTreasures : string[];
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

export class OrbitCamera {
  perspective : THREE.PerspectiveCamera;
  controller : OrbitControls;
  
  constructor(aspect : number, labyrinth : Labyrinth, renderer : THREE.WebGLRenderer) {
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
  
  labyrinth : Labyrinth;
  entities : Entity[];
  moveAnimations : MoveAnimation[]
  
  camera : OrbitCamera;
  outerTileLerpTimer : THREE.Clock;
  
  currentPawn : number;
  phase : Phase;
    
  constructor(window : Window) {
    this.window = window;
    
    this.labyrinth = new Labyrinth();
    this.moveAnimations = [];
    
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.DirectionalLight());
    this.raycaster = new THREE.Raycaster();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(document.getElementById("labyrinth")!.clientWidth, window.innerHeight);
    
    this.outerTileLerpTimer = new THREE.Clock(false);
  }  

  getEntityById(id : string) {
    return this.entities.find((e) => { if (e.id = id) return e; });
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
        this.moveAnimations.push(new MoveAnimation(entity));
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
