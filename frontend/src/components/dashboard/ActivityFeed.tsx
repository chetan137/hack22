
import { motion } from 'framer-motion';
import { Car, Zap, Droplets, Trash2, ArrowRight } from 'lucide-react';
import { GlassPanel } from '../ui/Card';
import type { Activity } from '@/types';

interface ActivityFeedProps {
  activities: Activity[];
}

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'transportation':
      return <Car className="w-5 h-5 text-blue-400" />;
    case 'electricity':
      return <Zap className="w-5 h-5 text-amber-400" />;
    case 'water':
      return <Droplets className="w-5 h-5 text-cyan-400" />;
    case 'waste':
      return <Trash2 className="w-5 h-5 text-green-400" />;
    default:
      return <div className="w-5 h-5 rounded-full bg-slate-600" />;
  }
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <GlassPanel className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
        <button className="text-sm font-medium text-brand-400 hover:text-brand-300 flex items-center transition-colors">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <p>No recent activities.</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                <CategoryIcon category={activity.category} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate capitalize">
                  {activity.type.replace('_', ' ')}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(activity.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${activity.impact_score > 0 ? 'text-brand-400' : 'text-red-400'}`}>
                  {activity.impact_score > 0 ? '+' : ''}{activity.impact_score} pts
                </p>
                <p className="text-xs text-slate-500">{activity.value} {activity.unit}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </GlassPanel>
  );
}
