import { apiClient } from './client';
import type { User, TokenPair } from '../types';

export const authApi = {
  login: async (credentials: any) => {
    const { data } = await apiClient.post<TokenPair>('/auth/login', credentials);
    return data;
  },
  
  register: async (userData: any) => {
    const { data } = await apiClient.post<User>('/auth/register', userData);
    return data;
  },
  
  getMe: async () => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },
  
  forgotPassword: async (email: string) => {
    const { data } = await apiClient.post<{message: string}>('/auth/forgot-password', { email });
    return data;
  },
  
  resetPassword: async (payload: any) => {
    const { data } = await apiClient.post<{message: string}>('/auth/reset-password', payload);
    return data;
  },
  
  logout: async (refreshToken: string) => {
    await apiClient.post('/auth/logout', { refresh_token: refreshToken });
  },

  submitOnboarding: async (onboardingData: any) => {
    const { data } = await apiClient.post('/onboarding/', onboardingData);
    return data;
  }
};
