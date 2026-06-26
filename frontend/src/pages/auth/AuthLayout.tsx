import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import {
  Leaf, Zap, Droplets, Car, Trash2, Globe, Brain,
  TrendingUp, TrendingDown, Target, MapPin, Award,
  ChevronRight, Sparkles, Wind, TreePine, Home
} from 'lucide-react';

// ── Static demo data displayed on left panel ──────────────────────────────
const ECO_DATA = {
  userName: 'Aachal Pandey',
  location: 'Thane, Maharashtra 🇮🇳',
  ecoScore: 73,
  electricity: { value: 142, unit: 'kWh', trend: 'down', change: '8%' },
  water: { value: 3200, unit: 'L', trend: 'up', change: '5%' },
  travel: { value: 48.6, unit: 'kg CO₂', trend: 'down', change: '12%' },
  waste: { value: 9.4, unit: 'kg', trend: 'up', change: '3%' },
  totalCarbon: { value: 184.2, unit: 'kg CO₂e' },
  aiInsight: 'Your AC usage drives 34% of your electricity bill. Shifting peak usage to 9 PM saves you ₹820/month.',
  actions: [
    { icon: '🚲', label: 'Bike 3×/week instead of car', impact: '−14 kg CO₂' },
    { icon: '💡', label: 'Use AC on 24°C timer mode', impact: '−22 kWh' },
    { icon: '♻️', label: 'Segregate wet & dry waste', impact: '−4.2 kg waste' },
  ],
  predictedScore: 84,
  cityStatus: 'Growing 🌱',
};

// ── Animated ring for Eco Score ───────────────────────────────────────────
const EcoRing = ({ score }: { score: number }) => {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
      <motion.circle
        cx="50" cy="50" r={radius}
        fill="none" stroke={color} strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.6, ease: 'easeOut', delay: 0.4 }}
      />
    </svg>
  );
};

// ── Metric card ────────────────────────────────────────────────────────────
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  trend?: 'up' | 'down';
  change?: string;
  delay?: number;
  color?: string;
}

const MetricCard = ({ icon, label, value, unit, trend, change, delay = 0, color = 'brand' }: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
  >
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
      ${color === 'amber'  ? 'bg-amber-500/20 text-amber-400'   : ''}
      ${color === 'sky'    ? 'bg-sky-500/20 text-sky-400'       : ''}
      ${color === 'violet' ? 'bg-violet-500/20 text-violet-400' : ''}
      ${color === 'rose'   ? 'bg-rose-500/20 text-rose-400'     : ''}
      ${color === 'brand'  ? 'bg-brand-500/20 text-brand-400'   : ''}
    `}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 truncate">{label}</p>
      <p className="text-sm font-bold text-white">
        {value} <span className="text-xs font-normal text-slate-400">{unit}</span>
      </p>
    </div>
    {trend && change && (
      <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'down' ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
        {change}
      </div>
    )}
  </motion.div>
);

// ── Ticker questions cycling on left panel ─────────────────────────────────
const QUESTIONS = [
  '📍 Where am I now?',
  '🌍 What is my environmental impact?',
  '⚡ What is causing it?',
  '✅ What should I do next?',
];

const QuestionTicker = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % QUESTIONS.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="h-7 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="text-sm text-brand-300 font-medium"
        >
          {QUESTIONS[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

// ── Main Layout ────────────────────────────────────────────────────────────
const AuthLayout = () => {
  const d = ECO_DATA;
  const scoreColor = d.ecoScore >= 70 ? 'text-emerald-400' : d.ecoScore >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="flex min-h-screen bg-transparent">

      {/* ── LEFT: Environmental Dashboard Preview ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-slate-900 flex-col p-8 xl:p-12">

        {/* Animated background blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-brand-900/40 via-slate-900/10 to-slate-950" />
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 18, repeat: Infinity }}
            className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-brand-500/10 blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 22, repeat: Infinity, delay: 3 }}
            className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[100px]"
          />
        </div>

        <div className="relative z-10 flex flex-col h-full gap-5 overflow-y-auto scrollbar-hide">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <Logo />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30"
            >
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              <span className="text-xs text-brand-300 font-medium">Live Preview</span>
            </motion.div>
          </div>

          {/* Ticker */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <QuestionTicker />
          </motion.div>

          {/* ── User Identity + Score ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-5"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {d.userName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                <Leaf className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{d.userName}</h2>
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3 text-brand-400" />
                <span>{d.location}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500">This Month</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {d.totalCarbon.value} {d.totalCarbon.unit}
                </span>
              </div>
            </div>

            {/* Eco Score Ring */}
            <div className="relative shrink-0 flex flex-col items-center">
              <div className="relative w-24 h-24">
                <EcoRing score={d.ecoScore} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className={`text-2xl font-black ${scoreColor}`}
                  >
                    {d.ecoScore}
                  </motion.span>
                  <span className="text-[10px] text-slate-500 -mt-0.5">Eco Score</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Environmental Metrics Grid ─── */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">📊 Monthly Impact</p>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard
                icon={<Zap className="w-4 h-4" />}
                label="Electricity Used"
                value={String(d.electricity.value)}
                unit={d.electricity.unit}
                trend={d.electricity.trend as 'up' | 'down'}
                change={d.electricity.change}
                delay={0.35}
                color="amber"
              />
              <MetricCard
                icon={<Droplets className="w-4 h-4" />}
                label="Water Used"
                value={String(d.water.value)}
                unit={d.water.unit}
                trend={d.water.trend as 'up' | 'down'}
                change={d.water.change}
                delay={0.4}
                color="sky"
              />
              <MetricCard
                icon={<Car className="w-4 h-4" />}
                label="Travel Emissions"
                value={String(d.travel.value)}
                unit={d.travel.unit}
                trend={d.travel.trend as 'up' | 'down'}
                change={d.travel.change}
                delay={0.45}
                color="violet"
              />
              <MetricCard
                icon={<Trash2 className="w-4 h-4" />}
                label="Waste Generated"
                value={String(d.waste.value)}
                unit={d.waste.unit}
                trend={d.waste.trend as 'up' | 'down'}
                change={d.waste.change}
                delay={0.5}
                color="rose"
              />
            </div>
          </div>

          {/* ── AI Insight Card ─── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 to-emerald-500/5 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">AI Insight</span>
              <Sparkles className="w-3 h-3 text-brand-400 ml-auto" />
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{d.aiInsight}</p>
          </motion.div>

          {/* ── Recommended Actions ─── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.62 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Recommended Actions</span>
            </div>
            <div className="space-y-2">
              {d.actions.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.08 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-default"
                >
                  <span className="text-base shrink-0">{a.icon}</span>
                  <p className="text-xs text-slate-300 flex-1">{a.label}</p>
                  <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">{a.impact}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Future Score + City ─── */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-300 font-semibold">Predicted Score</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">If you follow recommendations</p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-purple-300">{d.predictedScore}</span>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold mb-1">
                  <TrendingUp className="w-3 h-3" />
                  +{d.predictedScore - d.ecoScore} pts
                </div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${d.predictedScore}%` }}
                  transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-brand-400"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-cyan-300 font-semibold">Digital City</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">Your eco city status</p>
              <div className="flex items-center gap-2">
                <TreePine className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-sm font-bold text-white">{d.cityStatus}</p>
                  <p className="text-xs text-slate-500">Level 3 city</p>
                </div>
              </div>
              <div className="mt-2 flex gap-1 items-end">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 1.1 + i * 0.08 }}
                    className={`flex-1 rounded-sm ${i < 3 ? 'bg-emerald-500' : 'bg-white/10'}`}
                    style={{ originY: 1, height: `${(i + 1) * 5 + 6}px` }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-2 flex items-center gap-2 text-xs text-slate-600">
            <Wind className="w-3 h-3" />
            <span>EcoSense AI · Real-time Environmental Intelligence</span>
            <Award className="w-3 h-3 ml-auto" />
          </div>

        </div>
      </div>

      {/* ── RIGHT: Login Form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Home button top-right */}
        <div className="absolute top-5 right-6">
          <a
            href="https://hack22-seven.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </a>
        </div>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          <Outlet />
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
