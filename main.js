import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Grid creation
const dimension = 7;
const offset = 1.25;
const tileMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00, 
    wireframe: true
});

for (let x = 0; x < dimension; x++) {
    for (let y = 0; y < dimension; y++) {
        let tileGeometry = new THREE.BoxGeometry(1, 0.1, 1);
        tileGeometry.translate(x * offset, 0, y * offset);
        scene.add(new THREE.Mesh(tileGeometry, tileMaterial));
    }
}

const controls = new OrbitControls( camera, renderer.domElement );
let targetCenter = (dimension) / 2 + 0.25;
controls.rotateSpeed = 0.5;
controls.target.set(targetCenter, 0, targetCenter);
controls.maxPolarAngle = 1;

camera.position.x = targetCenter;
camera.position.y = 6;
camera.position.z = 12;
camera.lookAt(targetCenter, 0, targetCenter)

function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}
animate();