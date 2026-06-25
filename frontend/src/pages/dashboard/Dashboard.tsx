import { Droplets, Zap, Leaf, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { activitiesApi } from '@/api/activities';
import { KPICard } from '@/components/dashboard/KPICard';
import { EcoScoreCard } from '@/components/dashboard/EcoScoreCard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

export default function DashboardOverview() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: activitiesApi.getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-b-2 border-l-2 border-brand-500 animate-spin" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-red-400">
        <p>Failed to load dashboard data.</p>
        <Link to="/dashboard/track" className="mt-4 text-brand-400 hover:underline text-sm">
          Log your first activity →
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Row: EcoScore + KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <EcoScoreCard score={stats.current_eco_score} />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <KPICard
              title="Total Carbon Impact"
              value={`${stats.total_carbon_impact.toFixed(1)} kg`}
              icon={<Leaf className="w-5 h-5" />}
              trend="+2.4%"
              trendUp={false}
            />
            <KPICard
              title="Water Saved"
              value={`${stats.total_water_saved.toFixed(0)} gal`}
              icon={<Droplets className="w-5 h-5" />}
              trend="+15%"
              trendUp={true}
            />
            <KPICard
              title="Waste Recycled"
              value={`${stats.total_waste_recycled.toFixed(1)} lbs`}
              icon={<Zap className="w-5 h-5" />}
              trend="+5%"
              trendUp={true}
            />
            <KPICard
              title="Activities Logged"
              value={stats.total_activities}
              icon={<Plus className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Bottom Row: Chart + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 min-h-[400px]">
            <TrendChart data={stats.trend_data} title="Carbon Impact Trend (Last 30 Days)" />
          </div>
          <div className="min-h-[400px]">
            <ActivityFeed activities={stats.recent_activities} />
          </div>
        </div>

      </div>
    </div>
  );
}
