import * as React from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../ui/Card';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export function KPICard({ title, value, icon, trend, trendUp }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassPanel className="p-6 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-white/5 flex items-center justify-center text-brand-400">
            {icon}
          </div>
          {trend && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-brand-500/10 text-brand-400' : 'bg-red-500/10 text-red-400'}`}>
              {trend}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
