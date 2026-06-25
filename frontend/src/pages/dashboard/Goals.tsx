import { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle2, XCircle, Trash2, Clock, Leaf } from 'lucide-react';
import type { Goal, GoalStatus } from '../../types';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', target_date: '', eco_score_reward: 50 });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await apiClient.get('/goals');
      setGoals(response.data);
    } catch (err) {
      console.error("Failed to fetch goals", err);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...newGoal, target_date: newGoal.target_date || null };
      await apiClient.post('/goals', payload);
      setShowModal(false);
      setNewGoal({ title: '', description: '', target_date: '', eco_score_reward: 50 });
      fetchGoals();
    } catch (err) {
      console.error("Failed to create goal", err);
    }
  };

  const updateGoalStatus = async (id: string, status: GoalStatus) => {
    try {
      await apiClient.patch(`/goals/${id}`, { status });
      // If completed, update user score in authStore ideally. For now, fetch profile again or just let user see it elsewhere.
      fetchGoals();
    } catch (err) {
      console.error("Failed to update goal", err);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await apiClient.delete(`/goals/${id}`);
      fetchGoals();
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Target className="text-emerald-400" />
            Sustainability Goals
          </h1>
          <p className="text-gray-400 mt-1">Set personal challenges and earn eco score points.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          New Goal
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700/50">
          <Target className="w-16 h-16 text-emerald-500/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-200 mb-2">No Active Goals</h3>
          <p className="text-gray-400 mb-6">Start your sustainability journey by setting your first eco-goal.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative group overflow-hidden">
              {goal.status === 'completed' && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 rounded-bl-full flex items-start justify-end p-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              )}
              {goal.status === 'failed' && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full flex items-start justify-end p-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <h3 className={`text-lg font-semibold pr-8 ${goal.status === 'completed' ? 'text-emerald-400 line-through opacity-70' : 'text-gray-100'}`}>
                  {goal.title}
                </h3>
              </div>
              
              {goal.description && (
                <p className={`text-sm mb-4 line-clamp-2 ${goal.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
                  {goal.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs font-medium mt-auto pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                  <Leaf size={14} />
                  +{goal.eco_score_reward} pts
                </div>
                {goal.target_date && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock size={14} />
                    {new Date(goal.target_date).toLocaleDateString()}
                  </div>
                )}
              </div>

              {goal.status === 'active' && (
                <div className="mt-6 flex items-center gap-2">
                  <button 
                    onClick={() => updateGoalStatus(goal.id, 'completed')}
                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2 rounded-lg text-sm font-medium transition-colors border border-emerald-500/20"
                  >
                    Complete
                  </button>
                  <button 
                    onClick={() => updateGoalStatus(goal.id, 'failed')}
                    className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-gray-300 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Give Up
                  </button>
                  <button 
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 overflow-hidden shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-100 mb-6">Create New Goal</h2>
              <form onSubmit={createGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Goal Title</label>
                  <input
                    required
                    type="text"
                    value={newGoal.title}
                    onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                    placeholder="e.g. Meatless Mondays"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
                  <textarea
                    value={newGoal.description}
                    onChange={e => setNewGoal({...newGoal, description: e.target.value})}
                    placeholder="Details about your goal..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target Date</label>
                    <input
                      type="date"
                      value={newGoal.target_date}
                      onChange={e => setNewGoal({...newGoal, target_date: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Eco Reward</label>
                    <input
                      type="number"
                      value={newGoal.eco_score_reward}
                      onChange={e => setNewGoal({...newGoal, eco_score_reward: parseInt(e.target.value) || 50})}
                      min="10" max="500" step="10"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 text-gray-400 hover:text-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2.5 font-medium transition-colors"
                  >
                    Create Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
