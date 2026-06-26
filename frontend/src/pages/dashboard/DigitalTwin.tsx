import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CityScene } from '@/components/twin/CityScene';
import { DevSliders } from '@/components/twin/DevSliders';
import { useTwinStore } from '@/store/twinStore';
import { Brain, TreePine, Factory, Zap, TrendingUp, TrendingDown, RotateCcw, Loader2 } from 'lucide-react';

const DigitalTwin = () => {
  const {
    airQuality,
    treeCoverage,
    renewableUsage,
    trafficDensity,
    ecoScore,
    carbonEmissions,
    confidenceScore,
    isPredicting,
    simulateFuture,
    resetToCurrent,
    fetchTwinData,
  } = useTwinStore();

  const [horizon, setHorizon] = useState(30);

  useEffect(() => {
    fetchTwinData();
  }, [fetchTwinData]);

  const handleSimulate = () => {
    simulateFuture(horizon);
  };

  const metrics = [
    {
      label: 'Air Quality',
      value: `${airQuality.toFixed(0)}%`,
      icon: Factory,
      color: airQuality < 50 ? '#ef4444' : '#22c55e',
    },
    {
      label: 'Tree Coverage',
      value: `${treeCoverage.toFixed(0)}%`,
      icon: TreePine,
      color: treeCoverage > 50 ? '#22c55e' : '#ef4444',
    },
    {
      label: 'Renewables',
      value: `${renewableUsage.toFixed(0)}%`,
      icon: Zap,
      color: renewableUsage > 30 ? '#22c55e' : '#f59e0b',
    },
    {
      label: 'Traffic Density',
      value: `${trafficDensity.toFixed(0)}%`,
      icon: TrendingUp,
      color: trafficDensity > 60 ? '#ef4444' : '#22c55e',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Environmental Digital Twin</h1>
            <p className="text-sm text-slate-400">AI-powered 3D simulation of your environmental impact</p>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* 3D Scene - Takes 3 columns */}
        <div className="xl:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl overflow-hidden relative"
            style={{ height: '520px' }}
          >
            <CityScene />
            <DevSliders />
          </motion.div>
        </div>

        {/* Controls Panel - 1 column */}
        <div className="space-y-4">
          {/* Eco Score Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-2">Predicted Eco Score</h3>
            <div className="text-4xl font-bold text-white">{ecoScore.toFixed(0)}</div>
            <div className="flex items-center gap-1 mt-1">
              {carbonEmissions < 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingUp className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm ${carbonEmissions < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {carbonEmissions.toFixed(1)} impact/day
              </span>
            </div>
            {confidenceScore > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>ML Confidence</span>
                  <span>{confidenceScore.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${confidenceScore}%`,
                      background: `linear-gradient(90deg, #f59e0b, #22c55e)`,
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* City Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-3">City Metrics</h3>
            <div className="space-y-3">
              {metrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <m.icon className="w-4 h-4" style={{ color: m.color }} />
                    <span className="text-sm text-slate-300">{m.label}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: m.color }}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Simulation Controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-3">Prediction Controls</h3>
            
            <label className="block text-xs text-slate-500 mb-1">Forecast Horizon</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>

            <button
              onClick={handleSimulate}
              disabled={isPredicting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              {isPredicting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Simulate Future
                </>
              )}
            </button>

            <button
              onClick={resetToCurrent}
              className="w-full flex items-center justify-center gap-2 mt-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2 px-4 rounded-xl transition-all text-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Current
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;
