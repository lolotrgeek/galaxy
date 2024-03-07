import { Project, Scene3D, THREE, PhysicsLoader } from 'enable3d';
import { data } from './data_beta.js';
import { dataToSpheres } from './dataToSpheres.js';

class MainScene extends Scene3D {
    constructor() {
        super('MainScene')
    }
    async init() {
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }
    async create() {
        this.warpSpeed('-light', '-ground', '-sky')
        // Create a single geometry and material
        const geometry = new THREE.SphereGeometry(1, 32, 32); // Unit sphere
        const material = new THREE.MeshBasicMaterial({ color: 0xd3d3d3 });

        // Create an instanced mesh
        const mesh = new THREE.InstancedMesh(geometry, material, data.length);
        this.three.scene.add(mesh);

        // Set the camera
        this.three.camera.position.set(0, 0, 10);
        this.three.camera.lookAt(0, 0, 0);

        // Set the controls
        const controls = new OrbitControls(this.three.camera, this.three.renderer.domElement);
        controls.enableRotate = true;
        controls.enablePan = true;

        // Call the dataToSpheres function
        const spheres = dataToSpheres(data);
        spheres.map((sphere, i) => {
            this.physics.add.sphere({ radius: sphere.mass, x: sphere.position.x, y: sphere.position.y, z: sphere.position.z, mass: 1 });
        });
    }
    update() {
        // Rotate the instanced mesh
        this.three.scene.children[0].rotation.y += 0.01;
    }
}

// set your project configs
const config = { scenes: [MainScene] }

// load the ammo.js file from the /lib folder and start the project
PhysicsLoader('/lib', () => new Project(config))