import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_NETWORK } from './RoadNetwork';
import { trafficState } from './TrafficLights';

const CAR_COUNT = 100;

export const Cars = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate curves for each road
  const roadCurves = useMemo(() => {
    return ROAD_NETWORK.map(road => {
      return new THREE.CatmullRomCurve3([
        new THREE.Vector3(...road.start),
        new THREE.Vector3(...road.end)
      ], false);
    });
  }, []);

  const carsData = useMemo(() => {
    return Array.from({ length: CAR_COUNT }).map((_, i) => {
      const roadIndex = i % roadCurves.length;
      const isReverse = Math.random() > 0.5;
      return {
        roadIndex,
        t: Math.random(),
        speed: (0.002 + Math.random() * 0.002) * (isReverse ? -1 : 1),
        laneOffset: 1.5, // Shift right from center
        color: new THREE.Color().setHSL(Math.random(), 0.8, Math.random() * 0.5 + 0.2),
      };
    });
  }, [roadCurves.length]);

  useFrame(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < CAR_COUNT; i++) {
      const car = carsData[i];
      const curve = roadCurves[car.roadIndex];
      
      const pos = curve.getPointAt(car.t);
      const tangent = curve.getTangentAt(car.t).normalize();
      if (car.speed < 0) tangent.negate(); // Face the actual direction of travel
      
      // Check traffic lights
      let shouldStop = false;
      for (let j = 0; j < trafficState.lights.length; j++) {
        const light = trafficState.lights[j];
        if (light.state !== 'green') {
          const dx = light.x - pos.x;
          const dz = light.z - pos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          
          // If close to the light
          if (dist < light.radius) {
            // Check if heading towards it
            const toLightX = dx / dist;
            const toLightZ = dz / dist;
            const dot = tangent.x * toLightX + tangent.z * toLightZ;
            
            // If facing the light, STOP
            if (dot > 0.5) {
              shouldStop = true;
              break;
            }
          }
        }
      }

      if (!shouldStop) {
        car.t += car.speed;
        if (car.t > 1) car.t = 0;
        else if (car.t < 0) car.t = 1;
      }

      // Re-evaluate pos/tangent if we moved
      const newPos = curve.getPointAt(car.t);
      const newTangent = curve.getTangentAt(car.t).normalize();
      if (car.speed < 0) newTangent.negate();

      dummy.position.copy(newPos);
      
      // Shift to the right lane
      const right = new THREE.Vector3(0, 1, 0).cross(newTangent).normalize();
      dummy.position.add(right.multiplyScalar(car.laneOffset));
      dummy.position.y = 0.5;

      dummy.lookAt(dummy.position.clone().add(newTangent));
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, car.color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CAR_COUNT]} castShadow>
      <boxGeometry args={[1.8, 1, 3.5]} />
      <meshStandardMaterial roughness={0.3} metalness={0.8} />
    </instancedMesh>
  );
};
