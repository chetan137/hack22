import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Define the intersections based on road network
const intersections = [
  [-40, -40], [0, -40], [40, -40],
  [-40, 0],   [0, 0],   [40, 0],
  [-40, 40],  [0, 40],  [40, 40]
];

// Global state machine for traffic lights that Cars can read without React re-renders
export const trafficState = {
  lights: intersections.map((pos) => ({
    x: pos[0],
    z: pos[1],
    state: Math.random() > 0.5 ? 'green' : 'red', // Random initial state
    timer: Math.random() * 10,
    radius: 12 // Cars within this distance will check the light
  }))
};

const STATE_DURATIONS = {
  green: 10,
  yellow: 2,
  red: 10
};

export const TrafficLights = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // We'll use 4 boxes per intersection (to look like a traffic light post)
  // But to keep it super simple and performant, just one colored floating box/sphere above the intersection
  const totalInstances = intersections.length;
  
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < totalInstances; i++) {
      const light = trafficState.lights[i];
      light.timer += delta;
      
      // State transitions
      if (light.state === 'green' && light.timer >= STATE_DURATIONS.green) {
        light.state = 'yellow';
        light.timer = 0;
      } else if (light.state === 'yellow' && light.timer >= STATE_DURATIONS.yellow) {
        light.state = 'red';
        light.timer = 0;
      } else if (light.state === 'red' && light.timer >= STATE_DURATIONS.red) {
        light.state = 'green';
        light.timer = 0;
      }
      
      // Update instanced mesh color
      const color = new THREE.Color();
      if (light.state === 'green') color.setHex(0x10b981); // emerald-500
      else if (light.state === 'yellow') color.setHex(0xf59e0b); // amber-500
      else color.setHex(0xef4444); // red-500
      
      meshRef.current.setColorAt(i, color);
    }
    
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  // Initialize positions once
  const tempMatrix = new THREE.Matrix4();
  
  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, totalInstances]} 
      onPointerOver={() => {}} // dummy to force initialization if needed, but we'll do it via ref setup
      onUpdate={(self) => {
        for (let i = 0; i < totalInstances; i++) {
          const light = trafficState.lights[i];
          tempMatrix.makeTranslation(light.x, 3, light.z);
          self.setMatrixAt(i, tempMatrix);
        }
        self.instanceMatrix.needsUpdate = true;
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial emissiveIntensity={0.8} />
    </instancedMesh>
  );
};
