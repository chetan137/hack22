import { apiClient } from './client';

export interface AdminStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  total_activities: number;
  total_carbon_kg: number;
  new_users_week: number;
  activities_by_category: { category: string; count: number }[];
  user_growth: { day: string; count: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
  is_verified: boolean;
  has_completed_onboarding: boolean;
  created_at: string;
  activity_count?: number;
}

export interface AdminEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  location: string;
  latitude: number;
  longitude: number;
  event_date: string;
  max_participants: number;
  current_participants: number;
  is_active: boolean;
  created_at: string;
}

export interface EmissionFactor {
  id: string;
  category: string;
  type: string;
  factor_value: number;
  unit: string;
  updated_at: string;
}

export const adminApi = {
  getStats: () => apiClient.get<AdminStats>('/admin/stats').then(r => r.data),

  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    apiClient.get<{ total: number; page: number; limit: number; users: AdminUser[] }>('/admin/users', { params }).then(r => r.data),

  getUser: (id: string) => apiClient.get<AdminUser>(`/admin/users/${id}`).then(r => r.data),

  updateUser: (id: string, data: Partial<{ role: string; is_active: boolean; full_name: string }>) =>
    apiClient.patch(`/admin/users/${id}`, data).then(r => r.data),

  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),

  getEmissionFactors: () => apiClient.get<EmissionFactor[]>('/admin/emission-factors').then(r => r.data),

  updateEmissionFactor: (id: string, data: { factor_value?: number; unit?: string }) =>
    apiClient.patch(`/admin/emission-factors/${id}`, data).then(r => r.data),

  getEvents: () => apiClient.get<AdminEvent[]>('/admin/events').then(r => r.data),

  updateEvent: (id: string, data: any) => apiClient.patch(`/admin/events/${id}`, data).then(r => r.data),

  deleteEvent: (id: string) => apiClient.delete(`/admin/events/${id}`),

  exportUsersCSV: () => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1'}/admin/reports/users/export`,
  exportActivitiesCSV: () => `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1'}/admin/reports/activities/export`,
};
