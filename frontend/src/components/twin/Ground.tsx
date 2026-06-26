import { useMemo } from 'react';
import * as THREE from 'three';

export const Ground = () => {
  // Create a subtle grid texture for the ground procedurally
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.fillStyle = '#1e293b'; // slate-800 base
      context.fillRect(0, 0, 512, 512);
      
      context.strokeStyle = '#334155'; // slate-700 grid lines
      context.lineWidth = 2;
      
      const gridSize = 64;
      for (let i = 0; i <= 512; i += gridSize) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, 512);
        context.stroke();
        
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(512, i);
        context.stroke();
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial 
        map={gridTexture} 
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};
