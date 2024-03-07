import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { data } from './data_beta.js';
import { gaussianRandom, normalizeValues, spiral } from './utils.js';
import { ARMS, ARM_X_DIST, ARM_X_MEAN, ARM_Y_DIST, ARM_Y_MEAN, CORE_X_DIST, CORE_Y_DIST, GALAXY_THICKNESS, NUM_ARMS } from './config/galaxyConfig.js';
// import RAPIER from '@dimforge/rapier3d';

import('@dimforge/rapier3d').then(RAPIER => {
    console.log('RAPIER loaded');
    console.log(RAPIER);
    // Create a physics world
    let gravity = { x: 0.0, y: -9.81, z: 0.0 };
    const physicsWorld = new RAPIER.World(gravity);

    // Create a scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight); // Set the size of the renderer
    document.body.appendChild(renderer.domElement); // Append the renderer to the body of the HTML document

    // set the controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = true;
    controls.enablePan = true;

    // Create a single geometry and material
    const geometry = new THREE.SphereGeometry(1, 32, 32); // Unit sphere
    const material = new THREE.MeshBasicMaterial({ color: 0xd3d3d3 });

    // Create an instanced mesh
    const mesh = new THREE.InstancedMesh(geometry, material, data.length);

    /**
     * 
     * @param {array} data 
     * @returns 
     */
    function dataToSpheres(data) {
        // const values = data.map(item => Object.values(item)[0]);
        const values = data.map(item => item[1]);
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
            // let speed = .5; // Adjust this value as needed
            let speed = data[i][2]
            let magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
            velocity.x = velocity.x / magnitude * speed;
            velocity.y = velocity.y / magnitude * speed;
            velocity.z = velocity.z / magnitude * speed;

            return { mass, position, velocity }
        });

        dataSpheres.unshift(centerSphere);
        return dataSpheres;
    }
    const all_spheres = dataToSpheres(data);
    const spheres = all_spheres.splice(0, 100);

    // Add rigid bodies for each sphere
    spheres.forEach(sphere => {
        if (sphere.position) {
            let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(sphere.position.x, sphere.position.y, sphere.position.z)
                .setLinvel(sphere.velocity.x, sphere.velocity.y, sphere.velocity.z)
                .setAngularDamping(0.7)

            let rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

            let colliderDesc = RAPIER.ColliderDesc.ball(sphere.mass)
                .setDensity(1.0)
            physicsWorld.createCollider(colliderDesc, rigidBody);
        } else {
            console.warn('Undefined position for sphere:', sphere);
        }
    });

    console.log(physicsWorld.bodies.get(1))


    function renderSpheres() {
        // Update the positions of the spheres to match the physics simulation
        spheres.forEach((sphere, i) => {
            const sphereBody = physicsWorld.bodies.get(i);
            const translation = sphereBody.translation();

            if (!isNaN(translation.x) && !isNaN(translation.y) && !isNaN(translation.z)) {
                sphere.position.x = translation.x;
                sphere.position.y = translation.y;
                sphere.position.z = translation.z;
            }

            // Create a matrix for this instance
            const matrix = new THREE.Matrix4();
            matrix.makeScale(sphere.mass, sphere.mass, sphere.mass); // Scale based on value
            matrix.setPosition(sphere.position); // Position

            // Set the matrix for this instance
            mesh.setMatrixAt(i, matrix);
        });
        // Tell Three.js that the instance matrices have changed
        mesh.instanceMatrix.needsUpdate = true;
    }

    // Add the instanced mesh to the scene
    scene.add(mesh);

    // Position the camera and render the scene
    // Set the camera's z-position based on the number of spheres and their maximum size
    camera.position.z = 100;
    const animate = function () {
        // Update the physics simulation
        requestAnimationFrame(animate);
        physicsWorld.step();
        renderSpheres();        
        renderer.render(scene, camera);
    };
    animate();
})