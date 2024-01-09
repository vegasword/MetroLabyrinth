import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const dimension = 7;
const offset = 1.25;
const tileMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true
});



const tiles = [];

for (let x = 0; x < dimension; x++) {
    for (let y = 0; y < dimension; y++) {
        let tileGeometry = new THREE.BoxGeometry(1, 0.1, 1);
        tileGeometry.translate(x * offset, 0, y * offset);
        const tileMesh = new THREE.Mesh(tileGeometry, tileMaterial);
        scene.add(tileMesh);
        tiles.push(tileMesh);
    }
}



const pawnGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const pawnMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const pawn = new THREE.Mesh(pawnGeometry, pawnMaterial);
scene.add(pawn);



const pawnOffsetY = 0.25; 

// Ajout des fonctionnalités du pion et du onclick
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('click', onClick);

function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;


        const minX = 0;
        const maxX = (dimension - 1) * offset;
        const minZ = 0;
        const maxZ = (dimension - 1) * offset;

        pawn.position.x = Math.max(minX, Math.min(maxX, intersectionPoint.x));
        pawn.position.z = Math.max(minZ, Math.min(maxZ, intersectionPoint.z));


        pawn.position.y = pawnOffsetY;
    }
}



const controls = new OrbitControls( camera, renderer.domElement );
let targetCenter = (dimension) / 2 + 0.25;
controls.rotateSpeed = 0.5;
controls.target.set(targetCenter, 0, targetCenter);
controls.maxPolarAngle = 1;

camera.position.x = targetCenter;
camera.position.y = 5.3;
camera.position.z = 12;
camera.lookAt(targetCenter, 0, targetCenter)


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
