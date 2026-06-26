import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';

export const Water = () => {
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    // Subtle sine wave for a very gentle stylized breathing/rippling effect
    if (materialRef.current) {
      materialRef.current.roughness = 0.1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} receiveShadow>
      {/* 800x800 to fully enclose the 400x400 grid */}
      <planeGeometry args={[800, 800]} />
      <MeshReflectorMaterial
        ref={materialRef}
        blur={[400, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={20}
        roughness={0.1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0369a1" // deep blue tint
        metalness={0.6}
        mirror={0.7}
      />
    </mesh>
  );
};
