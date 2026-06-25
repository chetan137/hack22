import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (earthRef.current) {
      earthRef.current.rotation.y = t * 0.1;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = t * 0.12;
      atmosphereRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
    }
  });

  return (
    <group>
      {/* Main Earth Sphere */}
      <Sphere ref={earthRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#10b981"
          roughness={0.6}
          metalness={0.2}
          wireframe={true}
        />
      </Sphere>

      {/* Atmospheric Glow */}
      <Sphere ref={atmosphereRef} args={[2.2, 64, 64]}>
        <MeshDistortMaterial
          color="#34d399"
          transparent
          opacity={0.15}
          distort={0.4}
          speed={2}
          roughness={0}
        />
      </Sphere>

      {/* Core light */}
      <pointLight color="#10b981" intensity={2} distance={10} />
    </group>
  );
}
