import { Game, GamePhase } from "./objects.js";
import * as EVENTS from "./events.js";

//TODO: Instanced based GLTF meshes rendering
// https://threejs.org/docs/#examples/en/loaders/GLTFLoader
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_instancing_performance.html

// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// let models : any[] = [];
// new GLTFLoader().load("data/straight.glb", (gltf) => models.push({name:"straight", geom: gltf.scene}));
// new GLTFLoader().load("data/corner.glb", (gltf) => models.push({name:"corner", geom: gltf.scene}));
// new GLTFLoader().load("data/tjunction.glb", (gltf) => models.push({name:"tjunction", geom: gltf.scene}));

let game = new Game(window);

window.addEventListener("resize", function() {
  game.camera.perspective.aspect = window.innerWidth / window.innerHeight;
  game.camera.perspective.updateProjectionMatrix();
  game.renderer.setSize(window.innerWidth, window.innerHeight);
  game.renderer.render(game.scene, game.camera.perspective);
});
    
document.addEventListener("keydown", function(event) {
  switch (game.phase) {
    case GamePhase.SELECT_LANE: EVENTS.selectLane(event, game); break;
    case GamePhase.MOVE_LANE: EVENTS.moveLane(event, game); break;
  }
});

document.addEventListener("click", (e) => EVENTS.movePlayer(e, game));

document.addEventListener("mousemove", (e) => EVENTS.moveOuterTile(e, game));

function render() {
  requestAnimationFrame(render);
  game.render();
} render();
