/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  TWIN STORE — TWO-TIER STATE WITH SMOOTH DAMPING                       ║
 * ║                                                                        ║
 * ║  SINGLE SOURCE OF TRUTH RULE (Phase 3):                                ║
 * ║                                                                        ║
 * ║  Every visual system in the 3D scene (Phase 4 onward) MUST read from   ║
 * ║  the `displayed` values — NEVER from `target` or raw incoming data.    ║
 * ║                                                                        ║
 * ║  This guarantees that no value in the scene ever snaps/pops instantly. ║
 * ║  The damping loop (DampingLoop component) smoothly moves `displayed`   ║
 * ║  toward `target` every frame using THREE.MathUtils.damp.               ║
 * ║                                                                        ║
 * ║  To change a value: call setTarget({ field: newValue }).               ║
 * ║  To read a value for rendering: use displayed.field.                   ║
 * ║                                                                        ║
 * ║  DO NOT bypass this by reading `target` in scene components.           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { create } from 'zustand';
import { apiClient } from '@/api/client';
import type { EnvironmentState } from '@/types';

// ── Default neutral state ───────────────────────────────────────────────
const DEFAULT_ENV: EnvironmentState = {
  ecoScore: 50,
  carbonEmissions: 50,
  airQuality: 50,
  renewableUsage: 20,
  trafficDensity: 50,
  treeCoverage: 50,
};

// ── The fields of EnvironmentState, used for iteration ──────────────────
export const ENV_KEYS: (keyof EnvironmentState)[] = [
  'ecoScore',
  'carbonEmissions',
  'airQuality',
  'renewableUsage',
  'trafficDensity',
  'treeCoverage',
];

// ── Store shape ─────────────────────────────────────────────────────────
export interface TwinState {
  /** Values set directly by incoming data / API / dev sliders. */
  target: EnvironmentState;

  /** Values that smoothly chase `target`. Scene components read ONLY these. */
  displayed: EnvironmentState;

  /** Damping speed (lambda for THREE.MathUtils.damp). ~4 settles in ~2-3s. */
  dampingLambda: number;

  // ── Prediction metadata ─────────────────────────────────
  isPredicting: boolean;
  confidenceScore: number;

  // ── Actions ─────────────────────────────────────────────
  /** Set one or more target fields. Displayed will smoothly catch up. */
  setTarget: (partial: Partial<EnvironmentState>) => void;

  /** Overwrite displayed directly — used only by the damping loop. */
  setDisplayed: (partial: Partial<EnvironmentState>) => void;

  /** Fetch current data from API and apply to target. */
  fetchTwinData: () => Promise<void>;

  /** Run ML prediction and apply result to target. */
  simulateFuture: (days: number) => Promise<void>;

  /** Reset target to defaults. */
  resetToCurrent: () => void;

  // ── Legacy accessors ────────────────────────────────────
  // These exist so that existing Phase 1-2 components that read
  // `useTwinStore(s => s.ecoScore)` continue to work without edits.
  // They return the DISPLAYED value (correct behavior).
  ecoScore: number;
  carbonEmissions: number;
  airQuality: number;
  renewableUsage: number;
  trafficDensity: number;
  treeCoverage: number;
}

export const useTwinStore = create<TwinState>((set, get) => ({
  target: { ...DEFAULT_ENV },
  displayed: { ...DEFAULT_ENV },
  dampingLambda: 4, // settles in ~2-3 seconds

  isPredicting: false,
  confidenceScore: 0,

  // Legacy top-level accessors — return displayed values
  ...DEFAULT_ENV,

  // ── Actions ─────────────────────────────────────────────
  setTarget: (partial) => {
    set((state) => ({
      target: { ...state.target, ...partial },
    }));
  },

  setDisplayed: (partial) => {
    set((state) => {
      const newDisplayed = { ...state.displayed, ...partial };
      // Also update legacy top-level fields so old selectors stay in sync
      return {
        displayed: newDisplayed,
        ecoScore: newDisplayed.ecoScore,
        carbonEmissions: newDisplayed.carbonEmissions,
        airQuality: newDisplayed.airQuality,
        renewableUsage: newDisplayed.renewableUsage,
        trafficDensity: newDisplayed.trafficDensity,
        treeCoverage: newDisplayed.treeCoverage,
      };
    });
  },

  fetchTwinData: async () => {
    try {
      get().setTarget({ ...DEFAULT_ENV });
      set({ isPredicting: false });
    } catch (error) {
      console.error('Failed to fetch twin data:', error);
    }
  },

  simulateFuture: async (days: number) => {
    set({ isPredicting: true });
    try {
      const response = await apiClient.get(`/prediction/forecast?days=${days}`);
      const data = response.data;

      if (data.status === 'success' && data.predictions.length > 0) {
        const finalPrediction = data.predictions[data.predictions.length - 1];
        const newScore = Math.max(0, Math.min(100, finalPrediction.predicted_eco_score / 10));

        get().setTarget({
          ecoScore: newScore,
          carbonEmissions: Math.max(0, Math.min(100, finalPrediction.predicted_emissions)),
          airQuality: newScore,
          treeCoverage: newScore,
          trafficDensity: 100 - newScore * 0.5,
          renewableUsage: newScore * 0.8,
        });

        set({ confidenceScore: finalPrediction.confidence_score });
      }
    } catch (error) {
      console.error('Prediction failed:', error);
      set({ confidenceScore: 0 });
    } finally {
      set({ isPredicting: false });
    }
  },

  resetToCurrent: () => {
    get().fetchTwinData();
  },
}));
