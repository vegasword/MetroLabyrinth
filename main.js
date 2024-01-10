import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
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
        tileGeometry.translate(x * offset + offset / 2, 0, y * offset + offset / 2);
        const tileMesh = new THREE.Mesh(tileGeometry, tileMaterial);
        scene.add(tileMesh);
        tiles.push(tileMesh);
    }
}

const pawnGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const pawnMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const pawn = new THREE.Mesh(pawnGeometry, pawnMaterial);
scene.add(pawn);

camera.position.x = 3.5;
camera.position.y = 6;
camera.position.z = 12;
camera.rotateX(-0.5);

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

        // Trouver les coordonnées de la case cible
        const targetX = Math.floor(intersectionPoint.x / offset) * offset + offset / 2;
        const targetZ = Math.floor(intersectionPoint.z / offset) * offset + offset / 2;

        // Ajuster la position du pion pour qu'il soit centré au milieu de la case
        pawn.position.set(targetX, pawn.geometry.parameters.height / 2, targetZ);
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
