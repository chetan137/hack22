import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useTwinStore } from '@/store/twinStore';

// City blocks based on the ROAD_NETWORK gaps
// Roads are at -40, 0, 40 on both X and Z axes.
// Block centers would be roughly at +/-20, +/-60, etc.
const BLOCKS = [
  [-20, -20], [20, -20], [-20, 20], [20, 20],
  [-60, -20], [60, -20], [-60, 20], [60, 20],
  [-20, -60], [20, -60], [-20, 60], [20, 60],
  [-60, -60], [60, -60], [-60, 60], [60, 60],
];

export const InstancedCity = () => {
  const ecoScore = useTwinStore((state) => state.ecoScore);
  
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const { geometry, count, instanceData } = useMemo(() => {
    // Generate a set of instances based on the blocks
    const data: Array<{ position: THREE.Vector3; scale: THREE.Vector3; color: THREE.Color }> = [];
    const baseGeo = new THREE.BoxGeometry(1, 1, 1);
    // Shift geometry so origin is at the bottom
    baseGeo.translate(0, 0.5, 0);
    
    let instanceCount = 0;
    
    BLOCKS.forEach((block) => {
      // In each block, place a grid of buildings
      for (let x = -10; x <= 10; x += 6) {
        for (let z = -10; z <= 10; z += 6) {
          // Skip some to create gaps
          if (Math.random() > 0.8) continue;
          
          const posX = block[0] + x + (Math.random() - 0.5) * 2;
          const posZ = block[1] + z + (Math.random() - 0.5) * 2;
          
          // Taller buildings closer to center (0,0)
          const distToCenter = Math.sqrt(posX * posX + posZ * posZ);
          const heightProb = Math.max(0.1, 1 - distToCenter / 100);
          
          // Random height between 2 and 15, weighted by distance to center
          const height = 2 + Math.random() * (20 * heightProb);
          
          const width = 2 + Math.random() * 2;
          const depth = 2 + Math.random() * 2;
          
          data.push({
            position: new THREE.Vector3(posX, 0, posZ),
            scale: new THREE.Vector3(width, height, depth),
            // We will tint buildings slightly based on their height
            color: new THREE.Color().setHSL(0, 0, 0.2 + Math.random() * 0.4),
          });
          
          instanceCount++;
        }
      }
    });
    
    return { geometry: baseGeo, count: instanceCount, instanceData: data };
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    
    const dummy = new THREE.Object3D();
    
    instanceData.forEach((data, i) => {
      dummy.position.copy(data.position);
      dummy.scale.copy(data.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, data.color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [instanceData]);

  // Phase 4 reactive tinting
  // Lower ecoScore -> muted, darker, slightly orange tinted
  // Higher ecoScore -> cleaner, brighter, cooler tint
  const buildingColor = useMemo(() => {
    const t = ecoScore / 100;
    return new THREE.Color().lerpColors(
      new THREE.Color('#453d36'), // Poor: muddy, warm
      new THREE.Color('#e2e8f0'), // Excellent: crisp, bright
      t
    );
  }, [ecoScore]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial 
        color={buildingColor}
        roughness={0.7}
        metalness={0.3}
      />
    </instancedMesh>
  );
};
