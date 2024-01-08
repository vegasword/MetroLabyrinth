import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
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

camera.position.x = 3.5;
camera.position.y = 6;
camera.position.z = 12;
camera.rotateX(-0.5);

function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);
}
animate();