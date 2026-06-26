import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function AmbientShapes() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = clock.getElapsedTime() * 0.05;
      group.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <group ref={group}>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[1.5, 64, 64]} position={[-4, 2, -5]}>
          <MeshDistortMaterial color="#10b981" envMapIntensity={0.4} clearcoat={0.8} clearcoatRoughness={0} roughness={0.1} metalness={0.8} distort={0.4} speed={2} />
        </Sphere>
      </Float>
      <Float speed={2} rotationIntensity={0.8} floatIntensity={1.5}>
        <Sphere args={[2, 64, 64]} position={[5, -1, -8]}>
          <MeshDistortMaterial color="#0ea5e9" envMapIntensity={0.4} clearcoat={0.8} clearcoatRoughness={0} roughness={0.2} metalness={0.9} distort={0.3} speed={1.5} />
        </Sphere>
      </Float>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
        <Sphere args={[1, 64, 64]} position={[0, -4, -4]}>
          <MeshDistortMaterial color="#8b5cf6" envMapIntensity={0.4} clearcoat={0.8} clearcoatRoughness={0} roughness={0.1} metalness={0.7} distort={0.5} speed={3} />
        </Sphere>
      </Float>
    </group>
  );
}

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-[var(--background)]">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#0ea5e9" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.2} color="#10b981" />
        <AmbientShapes />
      </Canvas>
    </div>
  );
}
