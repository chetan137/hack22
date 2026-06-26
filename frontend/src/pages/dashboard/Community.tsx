import { useState, useEffect } from 'react';
import { Users, Trophy, Medal, Award, TrendingUp, Map as MapIcon } from 'lucide-react';
import type { LeaderboardEntry } from '../../types';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useGamificationStore } from '@/store/gamificationStore';
import GamificationPanel from '@/components/dashboard/GamificationPanel';
import CommunityMap from '@/components/dashboard/CommunityMap';

export default function Community() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'leaderboard'>('map');
  const user = useAuthStore(state => state.user);
  const { checkAchievements } = useGamificationStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lbRes, eventsRes] = await Promise.all([
        apiClient.get('/community/leaderboard'),
        apiClient.get('/community/events')
      ]);
      setLeaderboard(lbRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      console.error("Failed to fetch community data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    setJoiningId(eventId);
    try {
      await apiClient.post(`/community/events/${eventId}/join`);
      
      // Update local event state
      const event = events.find(e => e.id === eventId);
      setEvents(events.map(e => 
        e.id === eventId ? { ...e, joined: true, participants_count: e.participants_count + 1 } : e
      ));
      
      // Trigger gamification check for joining an event
      if (event) {
        await checkAchievements(event.points_reward);
      }
      
      // Refresh leaderboard
      const lbRes = await apiClient.get('/community/leaderboard');
      setLeaderboard(lbRes.data);
    } catch (err) {
      console.error("Failed to join event", err);
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Gamification Stats Panel */}
      <GamificationPanel />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/50 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Users className="text-emerald-400" />
            Impact Network
          </h1>
          <p className="text-gray-400 mt-1">Connect, participate, and rise through the ranks.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'map' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-gray-200'
            }`}
          >
            <MapIcon className="w-4 h-4" /> Map
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'leaderboard' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-gray-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> Leaderboard
          </button>
        </div>
      </div>

      {activeTab === 'map' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CommunityMap 
            events={events} 
            onJoinEvent={handleJoinEvent} 
            joiningId={joiningId}
          />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          {/* Podium for Top 3 */}
          {top3.length > 0 && (
            <div className="flex justify-center items-end h-64 gap-2 sm:gap-6 pt-10">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="w-24 sm:w-32 flex flex-col items-center group">
                  <div className="relative mb-3">
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center border-4 border-slate-600/50 group-hover:border-slate-500 transition-colors">
                      <span className="text-xl font-bold text-gray-300">{top3[1].full_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-800 rounded-full p-1 border border-slate-700">
                      <Medal className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                  <div className="text-center w-full bg-slate-800/80 border border-slate-700 rounded-t-xl pt-4 pb-2 h-24 flex flex-col justify-end">
                    <p className="text-sm font-semibold text-gray-200 truncate px-2">{top3[1].full_name}</p>
                    <p className="text-xs text-emerald-400 font-medium">{top3[1].eco_score} pts</p>
                    <div className="mt-2 text-2xl font-bold text-slate-500">2</div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div className="w-28 sm:w-36 flex flex-col items-center group -mt-10">
                  <div className="relative mb-3">
                    <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center border-4 border-yellow-500/50 group-hover:border-yellow-400 transition-colors shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                      <span className="text-2xl font-bold text-gray-200">{top3[0].full_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-800 rounded-full p-1.5 border border-slate-700">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                  </div>
                  <div className="text-center w-full bg-slate-800/90 border border-yellow-500/20 rounded-t-xl pt-4 pb-2 h-32 flex flex-col justify-end">
                    <p className="text-base font-bold text-gray-100 truncate px-2">{top3[0].full_name}</p>
                    <p className="text-sm text-emerald-400 font-medium">{top3[0].eco_score} pts</p>
                    <div className="mt-2 text-3xl font-black text-yellow-500/80">1</div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="w-24 sm:w-32 flex flex-col items-center group">
                  <div className="relative mb-3">
                    <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center border-4 border-amber-700/50 group-hover:border-amber-600 transition-colors">
                      <span className="text-xl font-bold text-gray-300">{top3[2].full_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-800 rounded-full p-1 border border-slate-700">
                      <Award className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="text-center w-full bg-slate-800/80 border border-slate-700 rounded-t-xl pt-4 pb-2 h-20 flex flex-col justify-end">
                    <p className="text-sm font-semibold text-gray-200 truncate px-2">{top3[2].full_name}</p>
                    <p className="text-xs text-emerald-400 font-medium">{top3[2].eco_score} pts</p>
                    <div className="mt-2 text-xl font-bold text-amber-700/80">3</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ranked List */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden mt-8">
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                <TrendingUp size={18} className="text-gray-400" />
                Global Rankings
              </h3>
            </div>
            <div className="divide-y divide-slate-700/50">
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.id === user?.id;
                return (
                  <div 
                    key={entry.id} 
                    className={`flex items-center px-6 py-4 hover:bg-slate-700/30 transition-colors ${
                      isCurrentUser ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <div className="w-8 font-bold text-gray-500 text-center mr-4">
                      {entry.rank}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-gray-300 font-medium mr-4 border border-slate-600">
                      {entry.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isCurrentUser ? 'text-emerald-400' : 'text-gray-200'}`}>
                        {entry.full_name} {isCurrentUser && <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">You</span>}
                      </p>
                      <p className="text-xs text-gray-400">{entry.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-100">{entry.eco_score.toLocaleString()}</p>
                      <p className="text-xs text-emerald-500 font-medium">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
