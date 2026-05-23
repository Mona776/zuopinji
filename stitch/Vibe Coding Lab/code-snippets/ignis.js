// iginis.vercel.app — inline module (excerpt)

import * as THREE from 'three';

const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector2(width, height) },
    u_handPos: { value: new THREE.Vector2(0.5, 0.5) },
    u_handVisible: { value: 0.0 },
    u_handScale: { value: 1.0 },
    u_extProgress: { value: 0.0 },
    u_velocity: { value: 0.0 }
};

const fragmentShader = `
    uniform float u_handVisible;
    uniform float u_extProgress;

    float flame(vec3 p) {
        float noiseVal = noise(p * 3.0 + vec3(0.0, iTime * 2.0, 0.0));
        return sphere(p, vec4(u_handPos, u_handScale)) - noiseVal * 0.5;
    }
`;

// MediaPipe Hands → u_handVisible, palm open / fist → summon & extinguish
