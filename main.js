import * as THREE from "three";

const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.render(scene, camera);
}

class Tile {
    constructor(x, y, z) {
        this.geometry = new THREE.BoxGeometry(1, 0.1, 1);
        this.material = new THREE.MeshBasicMaterial({color: 0xffffff});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.geometry.translate(x, y, z);
    }

    move(x, y) { this.geometry.translate(x, 0, y); }
}

class Labyrinth {
    constructor(scene, camera, dimension, tileOffset) {
        if (dimension % 2 == 0) {
            alert("The dimension should be odd !");
            return; 
        }
                
        this.choosingLane = true;
        this.curX = 1;
        this.curY = 1;
        
        this.dimension = dimension;
        this.tileOffset = tileOffset;
        var hDimension = Math.floor(dimension / 2);
        this.tileOut = new Tile(hDimension * tileOffset, 0, dimension * tileOffset);
        this.tiles = [[]];
        
        camera.position.x = this.dimension / 2;
        camera.position.y = this.dimension;
        camera.position.z = this.dimension * this.tileOffset + 1;
        camera.rotateX(-1);
        
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
    
    getXY(index) {
        for (let x=0; x < dimension; x++)
            for (let y=0; y < dimension; y++)
                if (x * dimension + y === index)
                    return {x: x, y: y};
    }
}

let labyrinth = new Labyrinth(scene, camera, 7, 1.25);

document.addEventListener("keydown", function(event) {
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
                for (let x = 0; x < labyrinth.dimension; ++x)
                    for (let y = 0; y < labyrinth.dimension; ++y)
                        if (labyrinth.tiles[x][y].material.color.getHex() == 0x00ff00)
                            labyrinth.tiles[x][y].material.color.setHex(0xffff00);
                break;
        };
    }
    else {
        
    }
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
