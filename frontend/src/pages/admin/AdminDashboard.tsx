import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Activity, Leaf, TrendingUp,
  Shield, BarChart3, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { adminApi } from '@/api/admin';
import type { AdminStats } from '@/api/admin';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const KpiCard = ({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#0d1117]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex items-start justify-between hover:border-white/10 transition-colors group"
  >
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5" />
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then(s => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!stats) return <p className="text-slate-400">Failed to load admin stats.</p>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time EcoSense AI platform analytics</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Users" value={stats.total_users} icon={Users} color="bg-brand-500/15 text-brand-400" sub={`${stats.new_users_week} new this week`} />
        <KpiCard label="Active Users" value={stats.active_users} icon={Activity} color="bg-blue-500/15 text-blue-400" sub={`${Math.round((stats.active_users / stats.total_users) * 100)}% of total`} />
        <KpiCard label="Total Activities" value={stats.total_activities} icon={BarChart3} color="bg-purple-500/15 text-purple-400" />
        <KpiCard label="Carbon Tracked" value={`${stats.total_carbon_kg.toLocaleString()} kg`} icon={Leaf} color="bg-emerald-500/15 text-emerald-400" sub="CO₂ equivalent" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Growth */}
        <div className="lg:col-span-2 bg-[#0d1117]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">User Growth</h3>
          <p className="text-xs text-slate-500 mb-4">New signups over the last 30 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.user_growth}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#growthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activities by Category */}
        <div className="bg-[#0d1117]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Activities by Category</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution</p>
          {stats.activities_by_category.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.activities_by_category}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  strokeWidth={0}
                >
                  {stats.activities_by_category.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No activity data yet</div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Admin Users', value: stats.admin_users, icon: Shield, color: 'text-amber-400' },
          { label: 'New This Week', value: stats.new_users_week, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Activity Types', value: stats.activities_by_category.length, icon: Zap, color: 'text-blue-400' },
          { label: 'Avg Carbon/User', value: stats.total_users ? `${(stats.total_carbon_kg / stats.total_users).toFixed(1)} kg` : '0', icon: Leaf, color: 'text-brand-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#0d1117]/80 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-base font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
