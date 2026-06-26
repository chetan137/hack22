import { useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import { useTwinStore } from '@/store/twinStore';

// Helper to generate tree positions
const generateTrees = (maxCount: number) => {
  const trees = [];
  for (let i = 0; i < maxCount; i++) {
    let x = (Math.random() - 0.5) * 190;
    let z = (Math.random() - 0.5) * 190;
    
    // Avoid roads
    if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;
    
    trees.push({
      position: [x, 0, z] as [number, number, number],
      scale: 0.5 + Math.random() * 1.5,
    });
  }
  return trees;
};

export const Trees = () => {
  const treeCoverage = useTwinStore((state) => state.treeCoverage);
  const treeData = useMemo(() => generateTrees(500), []);
  
  // treeCoverage is 0 to 100
  const visibleCount = Math.floor((treeCoverage / 100) * treeData.length);

  const customUniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    customUniforms.uTime.value = state.clock.elapsedTime;
  });

  const onBeforeCompile = useCallback((shader: any) => {
    shader.uniforms.uTime = customUniforms.uTime;
    
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform float uTime;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      // Gentle sway based on instance world position so trees are out of phase
      float sway = sin(uTime * 1.5 + (instanceMatrix[3][0] * 0.2) + (instanceMatrix[3][2] * 0.2)) * 0.1;
      
      // Scale sway by local Y so the top of the leaves sways more than the bottom
      float heightFactor = (position.y + 1.5) / 3.0; // Normalized height roughly 0 to 1
      transformed.x += sway * heightFactor;
      transformed.z += sway * 0.5 * heightFactor;
      `
    );
  }, [customUniforms]);

  return (
    <group>
      {/* Tree Trunks */}
      <Instances limit={treeData.length} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.4, 2]} />
        <meshStandardMaterial color="#3d2817" />
        {treeData.map((t, i) => (
          <Instance
            key={`trunk-${i}`}
            position={[t.position[0], 1, t.position[2]]}
            scale={i < visibleCount ? t.scale : 0}
          />
        ))}
      </Instances>
      
      {/* Tree Leaves */}
      <Instances limit={treeData.length} castShadow receiveShadow>
        <sphereGeometry args={[1.5, 7, 7]} />
        <meshStandardMaterial 
          color="#2d5a27" 
          onBeforeCompile={onBeforeCompile}
          customProgramCacheKey={() => 'tree-leaves-sway'}
        />
        {treeData.map((t, i) => (
          <Instance
            key={`leaves-${i}`}
            position={[t.position[0], 2.5 * t.scale, t.position[2]]}
            scale={i < visibleCount ? t.scale : 0}
          />
        ))}
      </Instances>
    </group>
  );
};
