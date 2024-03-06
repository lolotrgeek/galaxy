import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { data } from './data_all.js';
import { gaussianRandom, normalizeValues, spiral } from './utils.js';
import { ARMS, ARM_X_DIST, ARM_X_MEAN, ARM_Y_DIST, ARM_Y_MEAN, CORE_X_DIST, CORE_Y_DIST, GALAXY_THICKNESS, NUM_ARMS } from './config/galaxyConfig.js';

// Create a scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Disable rotation
controls.enableRotate = true;

// Enable panning
controls.enablePan = true;

// Create a single geometry and material
const geometry = new THREE.SphereGeometry(1, 32, 32); // Unit sphere
const material = new THREE.MeshBasicMaterial({ color: 0xd3d3d3 });

// Create an instanced mesh
const mesh = new THREE.InstancedMesh(geometry, material, data.length);

let gridSize = Math.ceil(Math.sqrt(data.length)); // Calculate grid size
let maxRadius = 0; // Keep track of the maximum radius

/**
 * 
 * @param {array} data 
 * @returns 
 */
function dataToSpheres(data) {
    const values = data.map(item => Object.values(item)[0]);
    // Find the minimum and maximum values in the array
    const min = Math.min(...values);
    const max = Math.max(...values);

    let centerSphere = {
        mass: max * 2,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 }
    };

    const dataSpheres = values.map((num, i) => {
        let mass = 1 + (num - min) / (max - min) * 10
        let position = spiral(gaussianRandom(ARM_X_MEAN, ARM_X_DIST), gaussianRandom(ARM_Y_MEAN, ARM_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS), i * 2 * Math.PI / ARMS)
        // let position = {x: (i % gridSize) * 2 - gridSize, y: Math.floor(i / gridSize) * 2 - gridSize, z: 0}

        // Calculate the direction towards the center
        let directionToCenter = { x: -position.x, y: -position.y, z: -position.z };

        // Calculate a vector that is perpendicular to the direction towards the center
        let velocity = {
            x: -directionToCenter.y,
            y: directionToCenter.x,
            z: 0
        }

        // Normalize the velocity vector and scale it to the desired initial speed
        let speed = .5; // Adjust this value as needed
        let magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
        velocity.x = velocity.x / magnitude * speed;
        velocity.y = velocity.y / magnitude * speed;
        velocity.z = velocity.z / magnitude * speed;

        return { mass, position, velocity }
    });

    dataSpheres.unshift(centerSphere);
    return dataSpheres;
}

function showAsGrid() {
    const values = data.map(item => Object.values(item)[0]);
    const normalizedValues = normalizeValues(values);

    normalizedValues.map((value, i) => {

        // Update the maximum radius if necessary
        if (value > maxRadius) {
            maxRadius = value;
        }

        // Calculate x and y positions based on index
        let xPos = (i % gridSize) * 2 - gridSize;
        let yPos = Math.floor(i / gridSize) * 2 - gridSize;

        // Create a matrix for this instance
        const matrix = new THREE.Matrix4();
        matrix.makeScale(value, value, value); // Scale based on value
        matrix.setPosition(xPos, yPos, 0); // Position

        // Set the matrix for this instance
        mesh.setMatrixAt(i, matrix);
    })
}

function showAsSpiral() {
    const values = data.map(item => Object.values(item)[0]);
    const normalizedValues = normalizeValues(values);

    normalizedValues.map((value, i) => {
        value > 1 ? console.log(value) : null
        // Calculate theta and radius for spiral galaxy formation
        let armOffset = (i % ARMS) * (2 * Math.PI / ARMS); // Offset for each arm
        // let theta = 2 * Math.PI * i / NUM_ARMS + armOffset; // Distribute spheres evenly around the circle
        // let radius = Math.sqrt(i) * 2 + gaussianRandom(0, 20); // Add Gaussian randomness to radius

        // Convert polar coordinates to Cartesian coordinates
        // let x = radius * Math.cos(theta) + gaussianRandom(0, CORE_X_DIST); 
        // let y = radius * Math.sin(theta) + gaussianRandom(0, CORE_Y_DIST); 
        // let z = gaussianRandom(0, GALAXY_THICKNESS);

        let position = spiral(gaussianRandom(ARM_X_MEAN, ARM_X_DIST), gaussianRandom(ARM_Y_MEAN, ARM_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS), i * 2 * Math.PI / ARMS)

        // Create a matrix for this instance
        const matrix = new THREE.Matrix4();
        matrix.makeScale(value, value, value); // Scale based on value
        matrix.setPosition(position); // Position

        // Set the matrix for this instance
        mesh.setMatrixAt(i, matrix);
    })

}


// Define gravitational constant
const G = 6.67430e-11 / 10

// Function to calculate gravitational force
function calculateGravity(sphere1, sphere2) {
    // Calculate distance between spheres
    let dx = sphere2.position.x - sphere1.position.x;
    let dy = sphere2.position.y - sphere1.position.y;
    let dz = sphere2.position.z - sphere1.position.z;
    let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // If the distance is zero, return a force of zero
    if (distance === 0) {
        return { x: 0, y: 0, z: 0 };
    }

    // Calculate gravitational force (F = G * (m1 * m2) / r^2)
    let force = G * (sphere1.mass * sphere2.mass) / (distance * distance);

    // Calculate direction of force
    let forceDirection = { x: dx / distance, y: dy / distance, z: dz / distance };

    // Return force as vector
    return { x: force * forceDirection.x, y: force * forceDirection.y, z: force * forceDirection.z };
}

const all_spheres = dataToSpheres(data);
const spheres = all_spheres.splice(0, 2000);
let lastUpdateTime = Date.now();
const maxVelocity = 5;
const maxDistance = 700;

function showAsGravitational() {
    let currentTime = Date.now();
    let deltaTime = (currentTime - lastUpdateTime) / 5000;

    spheres.forEach((sphere1, i) => {
        let netForce = { x: 0, y: 0, z: 0 };
        spheres.forEach((sphere2, j) => {
            if (i !== j) {
                let force = calculateGravity(sphere1, sphere2);
                // Add force to net force
                netForce.x += force.x;
                netForce.y += force.y;
                netForce.z += force.z;
            }
        });

        // Apply net force to sphere (F = ma, so a = F / m)
        let acceleration = { x: netForce.x / sphere1.mass, y: netForce.y / sphere1.mass, z: netForce.z / sphere1.mass };

        // Update velocity
        sphere1.velocity.x += acceleration.x;
        sphere1.velocity.y += acceleration.y;
        sphere1.velocity.z += acceleration.z;

        let currentVelocity = Math.sqrt(sphere1.velocity.x * sphere1.velocity.x + sphere1.velocity.y * sphere1.velocity.y + sphere1.velocity.z * sphere1.velocity.z);
        if (currentVelocity > maxVelocity) {
            // Scale velocity back to maximum
            let scale = maxVelocity / currentVelocity;
            sphere1.velocity.x *= scale;
            sphere1.velocity.y *= scale;
            sphere1.velocity.z *= scale;
        }

        // Update position
        sphere1.position.x += sphere1.velocity.x;
        sphere1.position.y += sphere1.velocity.y;
        sphere1.position.z += sphere1.velocity.z;

        // Check if distance from center exceeds maximum
        let currentDistance = Math.sqrt(sphere1.position.x * sphere1.position.x + sphere1.position.y * sphere1.position.y + sphere1.position.z * sphere1.position.z);
        if (currentDistance > maxDistance) {
            // Scale position back to maximum distance
            let scale = maxDistance / currentDistance;
            sphere1.position.x *= scale;
            sphere1.position.y *= scale;
            sphere1.position.z *= scale;
        }
        

        // Create a matrix for this instance
        const matrix = new THREE.Matrix4();
        matrix.makeScale(sphere1.mass, sphere1.mass, sphere1.mass); // Scale based on value
        matrix.setPosition(sphere1.position); // Position

        // Set the matrix for this instance
        mesh.setMatrixAt(i, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
}

// Add the instanced mesh to the scene
scene.add(mesh);
camera.position.z = Math.max(gridSize, maxRadius * 2);

// Position the camera and render the scene
// Set the camera's z-position based on the number of spheres and their maximum size
camera.position.z = 100;
const animate = function () {
    requestAnimationFrame(animate);
    showAsGravitational()

    renderer.render(scene, camera);
};
animate();