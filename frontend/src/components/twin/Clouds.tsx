import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CLOUD_COUNT = 30;

export const Clouds = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-generate cloud data
  const cloudsData = useMemo(() => {
    return Array.from({ length: CLOUD_COUNT }).map(() => {
      return {
        x: (Math.random() - 0.5) * 400,
        y: 40 + Math.random() * 30, // High above the city
        z: (Math.random() - 0.5) * 400,
        speed: 0.02 + Math.random() * 0.04,
        scaleX: 3 + Math.random() * 5,
        scaleY: 1 + Math.random() * 2,
        scaleZ: 2 + Math.random() * 4,
      };
    });
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < CLOUD_COUNT; i++) {
      const cloud = cloudsData[i];
      
      // Drift slowly across the X axis
      cloud.x += cloud.speed;
      
      // Wrap around
      if (cloud.x > 250) {
        cloud.x = -250;
      }

      dummy.position.set(cloud.x, cloud.y, cloud.z);
      dummy.scale.set(cloud.scaleX, cloud.scaleY, cloud.scaleZ);
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CLOUD_COUNT]} receiveShadow>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        color="#ffffff" 
        transparent 
        opacity={0.8}
        roughness={1} 
        flatShading 
      />
    </instancedMesh>
  );
};
