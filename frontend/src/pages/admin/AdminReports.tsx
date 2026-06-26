import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Users, Activity, Leaf, CheckCircle } from 'lucide-react';
import { adminApi } from '@/api/admin';
import type { AdminStats } from '@/api/admin';
import { useAuthStore } from '@/store/authStore';

export default function AdminReports() {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    adminApi.getStats().then(s => setStats(s)).catch(() => {});
  }, []);

  const downloadCSV = (url: string, filename: string) => {
    // Create a temp link with auth header workaround — use token in URL for simplicity
    const link = document.createElement('a');
    link.href = url + `?token=${accessToken}`;
    link.download = filename;
    link.click();
  };

  const reports = [
    {
      id: 'users',
      title: 'Users Report',
      description: 'All registered users with role, status, onboarding state, and join date.',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      iconColor: 'text-blue-400',
      stats: stats ? `${stats.total_users.toLocaleString()} users` : '…',
      filename: 'ecosense_users.csv',
      url: adminApi.exportUsersCSV(),
    },
    {
      id: 'activities',
      title: 'Activities Report',
      description: 'All logged activities across all users with carbon impact data.',
      icon: Activity,
      color: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
      iconColor: 'text-brand-400',
      stats: stats ? `${stats.total_activities.toLocaleString()} activities` : '…',
      filename: 'ecosense_activities.csv',
      url: adminApi.exportActivitiesCSV(),
    },
    {
      id: 'carbon',
      title: 'Carbon Report',
      description: 'Total carbon tracked across all categories and users.',
      icon: Leaf,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      iconColor: 'text-emerald-400',
      stats: stats ? `${stats.total_carbon_kg.toLocaleString()} kg CO₂` : '…',
      filename: 'ecosense_activities.csv',
      url: adminApi.exportActivitiesCSV(),
    },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Export platform data as CSV files</p>
      </div>

      {/* Summary */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Records', value: (stats.total_users + stats.total_activities).toLocaleString() },
            { label: 'Last Export', value: 'On demand' },
            { label: 'Format', value: 'CSV (UTF-8)' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0d1117]/80 border border-white/5 rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Report Cards */}
      <div className="space-y-3">
        {reports.map(({ id, title, description, icon: Icon, color, iconColor, stats: s, filename, url }, i) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0d1117]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 flex items-center gap-5 hover:border-white/10 transition-all group"
          >
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              <p className={`text-xs font-medium mt-1.5 ${iconColor}`}>{s}</p>
            </div>
            <button
              onClick={() => downloadCSV(url, filename)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </motion.div>
        ))}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-500/5 border border-brand-500/15">
        <CheckCircle className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Reports are generated in real-time from the database. CSV files are UTF-8 encoded and compatible with Excel, Google Sheets, and all major BI tools.
        </p>
      </div>
    </div>
  );
}
