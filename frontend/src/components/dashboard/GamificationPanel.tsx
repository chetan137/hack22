import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Star, Award, ChevronRight, X } from 'lucide-react';
import { useGamificationStore } from '@/store/gamificationStore';
import * as Icons from 'lucide-react';

export default function GamificationPanel() {
  const { profile, loading, fetchProfile, newUnlocks, clearUnlocks } = useGamificationStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading || !profile) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const levelProgress = () => {
    const pts = profile.total_eco_points;
    if (pts < 500) return (pts / 500) * 100;
    if (pts < 1500) return ((pts - 500) / 1000) * 100;
    if (pts < 3000) return ((pts - 1500) / 1500) * 100;
    return 100;
  };

  const nextLevelPts = () => {
    const pts = profile.total_eco_points;
    if (pts < 500) return 500 - pts;
    if (pts < 1500) return 1500 - pts;
    if (pts < 3000) return 3000 - pts;
    return 0;
  };

  return (
    <>
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 overflow-hidden relative">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          
          {/* Level Circle */}
          <div className="flex-shrink-0 relative group">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-700"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="58"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="364.4"
                initial={{ strokeDashoffset: 364.4 }}
                animate={{ strokeDashoffset: 364.4 - (364.4 * levelProgress()) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-emerald-500"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Trophy className="w-8 h-8 text-yellow-400 mb-1" />
              <span className="text-sm font-bold text-gray-200">Lv. {
                profile.current_level === 'Eco Rookie' ? 1 :
                profile.current_level === 'Green Explorer' ? 2 :
                profile.current_level === 'Climate Guardian' ? 3 : 4
              }</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                {profile.current_level}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {nextLevelPts() > 0 ? `${nextLevelPts()} pts to next level` : 'Max level reached!'}
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-slate-900/50 rounded-xl p-3 flex-1 border border-slate-700/50 flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Current Streak</p>
                  <p className="text-lg font-bold text-white">{profile.current_streak} days</p>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 flex-1 border border-slate-700/50 flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Points</p>
                  <p className="text-lg font-bold text-white">{profile.total_eco_points}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Preview */}
        <div className="mt-8 pt-6 border-t border-slate-700/50 relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> Recent Badges
            </h3>
            <button className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center transition-colors">
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {profile.badges.slice(0, 5).map((badge) => {
              // @ts-ignore
              const Icon = Icons[badge.icon_name] || Award;
              return (
                <div 
                  key={badge.id}
                  className={`flex-shrink-0 w-24 p-3 rounded-2xl border ${
                    badge.earned 
                      ? 'bg-slate-800/80 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale'
                  } flex flex-col items-center text-center gap-2 transition-all hover:scale-105`}
                  title={badge.description}
                >
                  <div className={`p-2 rounded-xl ${badge.earned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-gray-300 leading-tight">{badge.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Achievement Unlock Modal */}
      <AnimatePresence>
        {newUnlocks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center"
            >
              <button 
                onClick={clearUnlocks}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
              
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)] relative z-10"
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-2 relative z-10">
                {newUnlocks.level ? 'Level Up!' : 'Achievement Unlocked!'}
              </h2>
              
              {newUnlocks.level && (
                <p className="text-emerald-400 font-medium text-lg mb-4 relative z-10">
                  You are now a <span className="text-white font-bold">{newUnlocks.level}</span>
                </p>
              )}

              {newUnlocks.badges.length > 0 && (
                <div className="space-y-3 relative z-10">
                  {newUnlocks.badges.map(b => {
                    // @ts-ignore
                    const BIcon = Icons[b.icon_name] || Award;
                    return (
                      <div key={b.id} className="bg-slate-800/80 rounded-xl p-3 flex items-center gap-4 text-left border border-slate-700">
                        <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
                          <BIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-200">{b.name}</p>
                          <p className="text-xs text-slate-400">{b.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              <button 
                onClick={clearUnlocks}
                className="mt-8 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors relative z-10"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
