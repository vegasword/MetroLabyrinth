import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";




// Fonction pour créer un trésor
function createTreasury(scene, existingTreasuries, tiles) {
    const geometry = new THREE.SphereGeometry(0.5, 6, 6);
    const material = new THREE.MeshBasicMaterial({ color: 0xffa0e6 });
    const mesh = new THREE.Mesh(geometry, material);

    positionTreasuryOnRandomTile(mesh, existingTreasuries, tiles);

    scene.add(mesh);
    return mesh;
}

// Fonction pour positionner un trésor sur une tuile aléatoire non occupée
function positionTreasuryOnRandomTile(treasuryMesh, existingTreasuries, tiles) {
    if (!tiles || tiles.length === 0 || !tiles[0] || tiles[0].length === 0) {
        console.error("Invalid tiles array");
        return;
    }

    let randomX, randomY, tile;

    // Boucle jusqu'à ce qu'une tuile non occupée soit trouvée
    do {
        randomX = Math.floor(Math.random() * tiles.length);
        randomY = Math.floor(Math.random() * tiles[0].length);
        tile = tiles[randomX][randomY];
    } while (isTileOccupied(tile, existingTreasuries));

    if (!tile || !tile.mesh) {
        console.error("Invalid tile or mesh");
        return;
    }

    const tilePos = tile.mesh.position;
    treasuryMesh.position.set(tilePos.x, tilePos.y + 0.1, tilePos.z);
}

// Fonction pour vérifier si une tuile est occupée par un trésor
function isTileOccupied(tile, existingTreasuries) {
    if (!tile || !tile.mesh) {
        console.error("Invalid tile or mesh");
        return true;
    }

    for (const treasury of existingTreasuries) {
        if (treasury && treasury.position.equals(tile.mesh.position)) {
            return true;
        }
    }
    return false;
}


const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
});

const pawnGeometry = new THREE.CapsuleGeometry(0.25, 0.5, 1, 4);
const pawnMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const pawn = new THREE.Mesh(pawnGeometry, pawnMaterial);
pawn.position.setY(pawnGeometry.parameters.length);
scene.add(pawn);

class Tile {
    constructor(x, y, z) {
        this.geometry = new THREE.BoxGeometry(1, 0.1, 1);
        this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(x, y, z);
    }
}

class Labyrinth {
    constructor(scene, dimension, tileOffset) {
        if (dimension % 2 === 0) {
            alert("The dimension should be odd !");
            return;
        }

        this.choosingLane = true;
        this.curX = 1;
        this.curY = 1;

        this.dimension = dimension;
        this.tileOffset = tileOffset;

        const hDim = Math.floor(dimension / 2);
        this.tileOut = new Tile(hDim * tileOffset, 0, dimension * tileOffset);
        this.tiles = [[]];
        this.tilesAvailable = [];

        // Build the labyrinth
        for (let x = 0; x < dimension; x++) {
            this.tiles.push([]);
            for (let y = 0; y < dimension; y++) {
                this.tiles[x].push(new Tile(x * tileOffset, 0, y * tileOffset));
                scene.add(this.tiles[x][y].mesh);
            }
        }
        scene.add(this.tileOut.mesh);

        // Default lane selection color
        for (let x = 0; x < this.dimension; ++x)
            this.tiles[x][this.curY].material.color.setHex(0x00ff00);
    }

    clearTilesColor() {
        for (let x = 0; x < this.dimension; ++x)
            for (let y = 0; y < this.dimension; ++y)
                this.tiles[x][y].material.color.setHex(0xffffff);
    }

    selectHorizontalLane() {
        for (let x = 0; x < this.dimension; ++x)
            this.tiles[x][this.curY].material.color.setHex(0x00ff00);
    }

    selectVerticalLane() {
        for (let y = 0; y < this.dimension; ++y)
            this.tiles[this.curX][y].material.color.setHex(0x00ff00);
    }
}

let labyrinth = new Labyrinth(scene, 11, 1.25);

const controls = new OrbitControls(camera, renderer.domElement);
const targetCenter = (labyrinth.dimension - 1) / 2 * labyrinth.tileOffset;
controls.rotateSpeed = 0.5;
controls.target.set(targetCenter, 0, targetCenter);
controls.maxPolarAngle = 1;
controls.maxDistance = labyrinth.dimension * labyrinth.tileOffset + 1;
camera.position.x = targetCenter;
camera.position.y = labyrinth.dimension;
camera.position.z = labyrinth.dimension + 4;
controls.update(0);


// nombre de trésor 
const treasuries = [];
for (let i = 0; i < 4; i++) {
    const treasury = createTreasury(scene, treasuries, labyrinth.tiles);
    treasuries.push(treasury);
}

document.addEventListener("keydown", function (event) {
    if (labyrinth.choosingLane) {
        switch (event.key) {
            case "ArrowUp":
                if (labyrinth.curY - 2 > 0)
                    labyrinth.curY -= 2;
                labyrinth.clearTilesColor();
                labyrinth.selectHorizontalLane();
                break;

            case "ArrowDown":
                if (labyrinth.curY + 2 < labyrinth.dimension)
                    labyrinth.curY += 2;
                labyrinth.clearTilesColor();
                labyrinth.selectHorizontalLane();
                break;

            case "ArrowLeft":
                if (labyrinth.curX - 2 > 0) labyrinth.curX -= 2;
                labyrinth.clearTilesColor();
                labyrinth.selectVerticalLane();
                break;

            case "ArrowRight":
                if (labyrinth.curX + 2 < labyrinth.dimension)
                    labyrinth.curX += 2;
                labyrinth.clearTilesColor();
                labyrinth.selectVerticalLane();
                break;
            case "Enter":
                labyrinth.choosingLane = false;
                labyrinth.tilesAvailable = [];
                for (let x = 0; x < labyrinth.dimension; ++x)
                    for (let y = 0; y < labyrinth.dimension; ++y)
                        if (labyrinth.tiles[x][y].material.color.getHex() == 0x00ff00) {
                            labyrinth.tiles[x][y].material.color.setHex(0xffff00);
                            labyrinth.tilesAvailable.push(labyrinth.tiles[x][y].mesh);
                        }
                break;
        }
        ;
    }
});

document.addEventListener('click', function (event) {
    if (!labyrinth.choosingLane) {
        const raycaster = new THREE.Raycaster();
        const ndc = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(ndc, camera);
        const intersects = raycaster.intersectObjects(labyrinth.tilesAvailable);
        if (intersects.length > 0) {
            const tilePos = intersects[0].object.position;
            pawn.position.set(tilePos.x, pawnGeometry.parameters.length, tilePos.z);
        }
    }
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
