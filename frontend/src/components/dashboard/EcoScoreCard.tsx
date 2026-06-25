
import { motion } from 'framer-motion';
import { GlassPanel } from '../ui/Card';
import { Leaf } from 'lucide-react';

interface EcoScoreCardProps {
  score: number;
}

export function EcoScoreCard({ score }: EcoScoreCardProps) {
  // Assuming max score is 2000 based on backend logic
  const percentage = Math.min(100, Math.max(0, (score / 2000) * 100));
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <GlassPanel className="p-6 h-full flex flex-col items-center justify-center text-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-brand-500/5 blur-3xl rounded-full scale-150 group-hover:bg-brand-500/10 transition-colors" />
      
      <h3 className="text-lg font-medium text-slate-300 mb-8 relative z-10">Current Eco Score</h3>
      
      <div className="relative w-48 h-48 flex items-center justify-center mb-6 z-10">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-800"
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="96"
            cy="96"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            className="text-brand-500"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Leaf className="w-6 h-6 text-brand-400 mb-1 opacity-80" />
          <span className="text-4xl font-bold text-white">{score}</span>
        </div>
      </div>
      
      <p className="text-sm text-slate-400 max-w-[200px] relative z-10">
        You're in the top 15% of users this month. Keep it up!
      </p>
    </GlassPanel>
  );
}
