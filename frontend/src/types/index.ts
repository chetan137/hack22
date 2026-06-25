export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingData {
  household_size: string;
  location: string;
  vehicle_type: string;
  diet_pattern: string;
  electricity_usage: string;
}

export interface Activity {
  id: string;
  user_id: string;
  category: string;
  type: string;
  value: number;
  unit: string;
  impact_score: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  current_eco_score: number;
  total_activities: number;
  total_carbon_impact: number;
  total_water_saved: number;
  total_waste_recycled: number;
  recent_activities: Activity[];
  trend_data: { name: string; impact: number }[];
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type GoalStatus = 'active' | 'completed' | 'failed';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  target_date: string | null;
  eco_score_reward: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  eco_score: number;
  level: number;
  rank: number;
}
