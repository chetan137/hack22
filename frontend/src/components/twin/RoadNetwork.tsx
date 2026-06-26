import { useMemo } from 'react';
import * as THREE from 'three';

// Define the road network as data
export const ROAD_NETWORK = [
  // Horizontal roads (x from -100 to 100)
  { start: [-100, 0, -40], end: [100, 0, -40] },
  { start: [-100, 0, 0], end: [100, 0, 0] },
  { start: [-100, 0, 40], end: [100, 0, 40] },
  // Vertical roads (z from -100 to 100)
  { start: [-40, 0, -100], end: [-40, 0, 100] },
  { start: [0, 0, -100], end: [0, 0, 100] },
  { start: [40, 0, -100], end: [40, 0, 100] },
];

export const RoadNetwork = () => {
  const roadMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#111827', // very dark gray/black
      roughness: 0.9,
      metalness: 0.1,
    });
  }, []);

  const roadWidth = 8;

  return (
    <group>
      {ROAD_NETWORK.map((road, i) => {
        const start = new THREE.Vector3(...road.start);
        const end = new THREE.Vector3(...road.end);
        const distance = start.distanceTo(end);
        const center = start.clone().lerp(end, 0.5);
        
        // Determine rotation based on if it's horizontal or vertical
        // If x is different, it's horizontal
        const isHorizontal = Math.abs(start.x - end.x) > 0.1;
        const rotation: [number, number, number] = isHorizontal 
          ? [-Math.PI / 2, 0, 0] 
          : [-Math.PI / 2, 0, Math.PI / 2];

        return (
          <mesh 
            key={i} 
            position={[center.x, -0.48, center.z]} 
            rotation={rotation}
            material={roadMaterial}
            receiveShadow
          >
            <planeGeometry args={[distance, roadWidth]} />
          </mesh>
        );
      })}
    </group>
  );
};
