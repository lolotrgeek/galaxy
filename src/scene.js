import { Project, Scene3D, PhysicsLoader } from "enable3d";
import { data } from './data.js';
import { dataToSpheres } from "./dataToSpheres";
import { spiral } from "./utils.js";

class MainScene extends Scene3D {
  constructor() {
    super("MainScene");
  }

  init() {
    console.log("Init");
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.updates = 0;
    this.reverse = true
  }

  preload() {
    console.log("Preload");
    this.spheres = dataToSpheres(data);
  }

  create() {
    // Resize window.
    const resize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      this.renderer.setSize(newWidth, newHeight);
      //@ts-ignore
      this.camera.aspect = newWidth / newHeight;
      this.camera.updateProjectionMatrix();
    };

    window.onresize = resize;
    resize();

    // Set up scene (light, ground, grid, sky, orbitControls)
    this.warpSpeed('-ground', '-sky');

    // Disable shadows for all lights
    this.lights.ambientLight.castShadow = false;
    this.lights.spotLight.castShadow = false;
    this.lights.hemisphereLight.castShadow = false;
    this.lights.pointLight.castShadow = false;
    this.lights.rectAreaLight.castShadow = false;

    // Create galaxy

    this.physics.add.sphere({ x: 0, y: 0, z: 0, radius: 10, mass: 1000 }, { lambert: { color: 'yellow' } })
      .receiveShadow = false
    this.spheres.map(sphere => {
      const star = this.physics.add.sphere(sphere, { lambert: { color: 'white' } });
      // star.body.applyForce(sphere.velocity.x, sphere.velocity.y, sphere.velocity.z);
      // star.body.setVelocity(sphere.velocity.x, sphere.velocity.y, sphere.velocity.z);
      star.body.setCollisionFlags(0)
      star.receiveShadow = false
    })

    // Position camera
    this.camera.position.set(-5.002615143220774, -1004.7458175642857, 557.5310053119003);
    this.camera.near = 0.1;
    this.camera.far = 10000;
    this.camera.lookAt(0, 0, 0);

  }

  gravity() {
    // Gravitational constant
    const G = 6.67430e-11 / 10;

    // Iterate over all stars
    this.physics.rigidBodies.forEach((body, index) => {
      let mass = this.spheres[index]?.mass;
      // Calculate distance to center
      const distance = body.position.length();
      // Calculate gravitational force (F = G * (m1 * m2) / r^2)
      // We'll assume a large mass for the center point and a small mass for the star
      const force = G * (1e12 * mass) / (distance * distance);

      // Calculate direction to center
      const direction = body.position.clone().negate().normalize();

      // Apply gravitational force towards center
      body.body.applyForce(force * direction.x, force * direction.y, force * direction.z);


    });
  }

  spiral(reverse=true) {
    this.physics.rigidBodies.forEach((body, index) => {
      const {x,y,z} = spiral(body.position.x, body.position.y, body.position.z, index)
      let speed = .01
      if (reverse) speed *= -1
      body.body.setVelocity(x*speed, y*speed, z*speed);
    });
  }

  update() {
    
    this.spiral(this.reverse);
  }
}

PhysicsLoader(
  "lib/ammo/kripken",
  () => new Project({ scenes: [MainScene], antialias: true, gravity: { x: 0, y: 0, z: 0 } })
);
