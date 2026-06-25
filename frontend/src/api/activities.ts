import { apiClient } from './client';
import type { Activity, DashboardStats } from '../types';

export const activitiesApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
    return data;
  },

  getActivities: async (limit: number = 50): Promise<Activity[]> => {
    const { data } = await apiClient.get<Activity[]>('/activities/', { params: { limit } });
    return data;
  },

  createActivity: async (activity: Partial<Activity>): Promise<Activity> => {
    const { data } = await apiClient.post<Activity>('/activities/', activity);
    return data;
  },

  deleteActivity: async (id: string): Promise<void> => {
    await apiClient.delete(`/activities/${id}`);
  }
};
