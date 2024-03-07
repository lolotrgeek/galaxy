import { gaussianRandom, spiral } from './utils.js';
import { ARMS, ARM_X_DIST, ARM_X_MEAN, ARM_Y_DIST, ARM_Y_MEAN, CORE_X_DIST, CORE_Y_DIST, GALAXY_THICKNESS, NUM_ARMS } from './config/galaxyConfig.js';

/**
 * 
 * @param {array} data 
 * @returns 
 */
export function dataToSpheres(data) {
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
        // normalize the mass to be between 1 and 11
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