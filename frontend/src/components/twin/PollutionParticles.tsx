import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTwinStore } from '@/store/twinStore';

export const PollutionParticles = () => {
  const carbonEmissions = useTwinStore((state) => state.carbonEmissions);
  
  const particlesRef = useRef<THREE.Points>(null);
  
  // carbonEmissions is 0 to 100
  // More emissions = more particles
  const particleCount = useMemo(() => {
    return Math.floor(100 + (carbonEmissions / 100) * 1000);
  }, [carbonEmissions]);
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Spawn mainly around factory locations or center
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      
      vel[i * 3] = (Math.random() - 0.5) * 0.05;
      vel[i * 3 + 1] = 0.05 + Math.random() * 0.1; // Float up
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }
    
    return [pos, vel];
  }, [particleCount]);

  useFrame(() => {
    if (!particlesRef.current) return;
    
    const positionsAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const pos = positionsAttr.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];
      
      // Reset if too high
      if (pos[i * 3 + 1] > 60) {
        pos[i * 3 + 1] = 0;
      }
    }
    
    positionsAttr.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.8}
        color={carbonEmissions > 50 ? '#52525b' : '#a1a1aa'}
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
