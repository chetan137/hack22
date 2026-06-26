import { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { useTwinStore } from '@/store/twinStore';

const generatePanels = (maxCount: number) => {
  const panels = [];
  for (let i = 0; i < maxCount; i++) {
    // Distribute across the grid, sometimes on buildings (higher up) or fields
    let x = (Math.random() - 0.5) * 160;
    let z = (Math.random() - 0.5) * 160;
    let y = Math.random() > 0.5 ? 15 : 0.5; // Rooftop or ground
    
    // Avoid roads
    if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;
    
    panels.push({
      position: [x, y, z] as [number, number, number],
      rotation: [(Math.PI / 4) + (Math.random() * 0.1), 0, 0] as [number, number, number],
    });
  }
  return panels;
};

export const SolarPanels = () => {
  const renewableUsage = useTwinStore((state) => state.renewableUsage);
  const panelsData = useMemo(() => generatePanels(40), []);
  
  // renewableUsage is 0 to 100
  const activeCount = Math.floor((renewableUsage / 100) * panelsData.length);

  return (
    <Instances limit={panelsData.length} castShadow receiveShadow>
      <boxGeometry args={[3, 0.1, 4]} />
      <meshStandardMaterial color="#1a3b5c" metalness={0.8} roughness={0.2} />
      {panelsData.map((p, i) => (
        <Instance
          key={`panel-${i}`}
          position={p.position}
          rotation={p.rotation}
          visible={i < activeCount}
        />
      ))}
    </Instances>
  );
};
