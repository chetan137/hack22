import { create } from 'zustand';
import { apiClient } from '@/api/client';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  points_required: number;
  earned: boolean;
}

export interface GamificationProfile {
  current_streak: number;
  highest_streak: number;
  total_eco_points: number;
  current_level: string;
  badges: Badge[];
}

interface GamificationState {
  profile: GamificationProfile | null;
  loading: boolean;
  error: string | null;
  newUnlocks: { level: string | null; badges: Badge[] } | null;
  
  fetchProfile: () => Promise<void>;
  checkAchievements: (points: number) => Promise<void>;
  clearUnlocks: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  newUnlocks: null,
  
  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/gamification/profile');
      set({ profile: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Failed to fetch gamification profile', loading: false });
    }
  },
  
  checkAchievements: async (points: number) => {
    try {
      const response = await apiClient.post(`/gamification/check-achievements?points_earned=${points}`);
      const data = response.data;
      
      if (data.new_level || data.new_badges.length > 0) {
        set({
          newUnlocks: {
            level: data.new_level,
            badges: data.new_badges
          }
        });
      }
      
      // Refresh profile to reflect new points/badges
      await get().fetchProfile();
      
    } catch (err) {
      console.error("Failed to check achievements", err);
    }
  },
  
  clearUnlocks: () => set({ newUnlocks: null })
}));
