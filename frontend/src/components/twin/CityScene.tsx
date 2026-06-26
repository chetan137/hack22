import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

import { Ground } from './Ground';
import { RoadNetwork } from './RoadNetwork';
import { InstancedCity } from './InstancedCity';
import { Trees } from './Trees';
import { SolarPanels } from './SolarPanels';
import { Cars } from './Cars';
import { TrafficLights } from './TrafficLights';
import { Water } from './Water';
import { Clouds } from './Clouds';
import { PollutionParticles } from './PollutionParticles';
import { DampingLoop } from './DampingLoop';
import { Perf } from 'r3f-perf';
import { useTwinStore } from '@/store/twinStore';

export const CityScene = () => {
  const ecoScore = useTwinStore((state) => state.ecoScore);

  // Phase 4 overall mood color grade based on ecoScore
  // Poor score: Warm orange, dusky, hazy
  // Excellent score: Bright blue, clean
  const fogColor = useMemo(() => {
    const t = ecoScore / 100;
    return new THREE.Color().lerpColors(
      new THREE.Color('#78350f'), // amber-900 for poor
      new THREE.Color('#38bdf8'), // sky-400 for excellent
      t
    );
  }, [ecoScore]);

  // Fog density is higher when air quality is low (which corresponds to low ecoScore)
  const fogDensity = 0.005 + ((100 - ecoScore) / 100) * 0.015;

  return (
    <Canvas
      shadows
      camera={{ position: [50, 50, 50], fov: 45, near: 0.1, far: 1000 }}
      style={{ width: '100%', height: '100%', borderRadius: '1rem' }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={[fogColor]} />
      <fogExp2 attach="fog" args={[fogColor, fogDensity]} />

      <Suspense fallback={null}>
        <Perf position="top-left" />
        {/* Phase 3: central damping loop — smoothly moves displayed → target */}
        <DampingLoop />
        {/* Environment HDRI provides realistic reflections and ambient light */}
        <Environment preset="city" />

        {/* Directional Sun Light */}
        <directionalLight
          castShadow
          position={[100, 100, 50]}
          intensity={1.5}
          color={ecoScore < 50 ? '#fbbf24' : '#ffffff'} // Warmer sun for poor scores
          shadow-mapSize={[2048, 2048]}
        >
          <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100, 1, 400]} />
        </directionalLight>

        {/* Ambient Light for base visibility */}
        <ambientLight intensity={0.2} color={fogColor} />

        {/* Scene Components */}
        <Water />
        <Ground />
        <RoadNetwork />
        <InstancedCity />
        
        {/* Motion Layer */}
        <Clouds />
        <Trees />
        <SolarPanels />
        <TrafficLights />
        <Cars />
        <PollutionParticles />

        {/* Soft Contact Shadows on the ground */}
        <ContactShadows
          position={[0, -0.49, 0]}
          opacity={0.8}
          scale={200}
          blur={2}
          far={10}
        />

        {/* Post Processing */}
        <EffectComposer>
          <Bloom 
            luminanceThreshold={1} 
            mipmapBlur 
            intensity={1.5} 
          />
        </EffectComposer>

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          enablePan
          enableZoom
          enableRotate
          minDistance={20}
          maxDistance={300}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0]}
        />
      </Suspense>
    </Canvas>
  );
};

