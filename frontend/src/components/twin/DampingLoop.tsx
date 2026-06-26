/**
 * DampingLoop — Phase 3 central damping system.
 *
 * This component runs a single useFrame loop that smoothly moves
 * every `displayed` value toward its corresponding `target` value
 * using THREE.MathUtils.damp (exponential decay toward the target).
 *
 * Must be placed inside a <Canvas> as a child of <Suspense>.
 * There should only ever be ONE of these in the entire scene tree.
 */

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTwinStore, ENV_KEYS } from '@/store/twinStore';

export const DampingLoop = () => {
  useFrame((_, delta) => {
    const { target, displayed, dampingLambda, setDisplayed } = useTwinStore.getState();

    // Clamp delta to avoid huge jumps when tab is backgrounded
    const dt = Math.min(delta, 0.1);

    let needsUpdate = false;
    const patch: Record<string, number> = {};

    for (const key of ENV_KEYS) {
      const current = displayed[key];
      const goal = target[key];

      // Skip if already close enough (epsilon = 0.01)
      if (Math.abs(current - goal) < 0.01) {
        if (current !== goal) {
          patch[key] = goal; // snap to exact target
          needsUpdate = true;
        }
        continue;
      }

      // THREE.MathUtils.damp(current, target, lambda, dt)
      // Exponential interpolation: smooth, frame-rate independent
      patch[key] = THREE.MathUtils.damp(current, goal, dampingLambda, dt);
      needsUpdate = true;
    }

    if (needsUpdate) {
      setDisplayed(patch);
    }
  });

  // This component renders nothing — it's purely a logic loop
  return null;
};
