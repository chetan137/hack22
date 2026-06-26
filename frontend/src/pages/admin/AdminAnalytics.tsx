import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { adminApi } from '@/api/admin';
import type { AdminStats } from '@/api/admin';
import { Leaf, Users, Activity, TrendingUp } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const ChartCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-[#0d1117]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5">
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    {subtitle && <p className="text-xs text-slate-500 mt-0.5 mb-4">{subtitle}</p>}
    {!subtitle && <div className="mb-4" />}
    {children}
  </div>
);

export default function AdminAnalytics() {
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

  if (!stats) return <p className="text-slate-400">Failed to load analytics.</p>;

  const tooltipStyle = {
    contentStyle: { background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 12 }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Platform-wide performance insights</p>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Total Users', value: stats.total_users, icon: Users, color: 'text-brand-400' },
          { label: 'Activities Logged', value: stats.total_activities, icon: Activity, color: 'text-blue-400' },
          { label: 'CO₂ Tracked', value: `${stats.total_carbon_kg.toLocaleString()} kg`, icon: Leaf, color: 'text-emerald-400' },
          { label: 'Weekly New Users', value: stats.new_users_week, icon: TrendingUp, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 bg-[#0d1117]/80 border border-white/5 rounded-xl">
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-sm font-bold text-white ml-1">{typeof value === 'number' ? value.toLocaleString() : value}</span>
          </div>
        ))}
      </div>

      {/* User Growth (large) */}
      <ChartCard title="User Growth — Last 30 Days" subtitle="Cumulative new user signups per day">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={stats.user_growth}>
            <defs>
              <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#ag1)" name="New Users" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Activities by Category (bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Activities by Category" subtitle="Total activity count per category">
          {stats.activities_by_category.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.activities_by_category} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="category" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} name="Count">
                  {stats.activities_by_category.map((_, i) => (
                    <rect key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data yet</div>
          )}
        </ChartCard>

        {/* Platform Health */}
        <ChartCard title="Platform Health" subtitle="Key ratios and health metrics">
          <div className="space-y-4 mt-2">
            {[
              { label: 'User Activation Rate', value: stats.total_users ? Math.round((stats.active_users / stats.total_users) * 100) : 0, color: '#10b981' },
              { label: 'Onboarding Completion', value: stats.total_users ? Math.round(((stats.total_users - stats.admin_users) / stats.total_users) * 100) : 0, color: '#3b82f6' },
              { label: 'Admin:User Ratio', value: stats.total_users ? Math.round((stats.admin_users / stats.total_users) * 100) : 0, color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs font-bold text-white">{value}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${value}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
