/**
 * DevSliders — Phase 3 temporary dev-only UI.
 *
 * Plain HTML overlay with one slider per EnvironmentState field.
 * Moving a slider updates the TARGET value; the damping loop
 * smoothly catches up the DISPLAYED value over ~2-3 seconds.
 *
 * Shows both target and displayed values side by side for verification.
 *
 * TODO: Remove or gate behind a feature flag before production.
 */

import { useState, useEffect, useRef } from 'react';
import { useTwinStore, ENV_KEYS } from '@/store/twinStore';

const LABELS: Record<string, string> = {
  ecoScore: 'Eco Score',
  carbonEmissions: 'Carbon Emissions',
  airQuality: 'Air Quality',
  renewableUsage: 'Renewable Usage',
  trafficDensity: 'Traffic Density',
  treeCoverage: 'Tree Coverage',
};

export const DevSliders = () => {
  const { target, displayed, setTarget } = useTwinStore();
  const [collapsed, setCollapsed] = useState(false);

  // Force a re-render every frame so we see the displayed values update smoothly
  const [, setTick] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      setTick((t) => t + 1);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8,
        padding: collapsed ? '6px 12px' : '12px 16px',
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#e2e8f0',
        minWidth: collapsed ? 'auto' : 320,
        backdropFilter: 'blur(8px)',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: collapsed ? 0 : 8,
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <span style={{ fontWeight: 'bold', color: '#facc15' }}>
          ⚙ DEV SLIDERS {collapsed ? '▸' : '▾'}
        </span>
        <span style={{ fontSize: 9, color: '#64748b' }}>Phase 3 debug</span>
      </div>

      {!collapsed && (
        <div>
          {/* Header row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr 55px 55px',
              gap: 4,
              marginBottom: 6,
              paddingBottom: 4,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: 9 }}>FIELD</span>
            <span style={{ color: '#94a3b8', fontSize: 9 }}>SLIDER</span>
            <span style={{ color: '#f59e0b', fontSize: 9, textAlign: 'right' }}>TARGET</span>
            <span style={{ color: '#10b981', fontSize: 9, textAlign: 'right' }}>DISPLAY</span>
          </div>

          {ENV_KEYS.map((key) => (
            <div
              key={key}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 55px 55px',
                gap: 4,
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <span style={{ color: '#cbd5e1', fontSize: 10 }}>{LABELS[key]}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={target[key]}
                onChange={(e) => setTarget({ [key]: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#f59e0b', height: 4 }}
              />
              <span
                style={{
                  color: '#f59e0b',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                {target[key].toFixed(1)}
              </span>
              <span
                style={{
                  color: '#10b981',
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                {displayed[key].toFixed(1)}
              </span>
            </div>
          ))}

          <div
            style={{
              marginTop: 8,
              paddingTop: 6,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              color: '#64748b',
              fontSize: 9,
              lineHeight: '14px',
            }}
          >
            Drag any slider → watch the green "DISPLAY" column smoothly chase the amber "TARGET".
          </div>
        </div>
      )}
    </div>
  );
};
