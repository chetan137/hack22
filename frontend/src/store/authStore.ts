import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, TokenPair } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingDraft: Partial<import('../types').OnboardingData>;
  
  // Actions
  login: (tokens: TokenPair, user: User) => void;
  logout: () => void;
  setTokens: (tokens: TokenPair) => void;
  setUser: (user: User) => void;
  setLoading: (isLoading: boolean) => void;
  setOnboardingDraft: (data: Partial<import('../types').OnboardingData>) => void;
  clearOnboardingDraft: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true, // Initially true while hydrating/checking session
      onboardingDraft: {},
      
      login: (tokens, user) => set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user,
        isAuthenticated: true,
        isLoading: false,
      }),
      
      logout: () => set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }),
      
      setTokens: (tokens) => set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      }),
      
      setUser: (user) => set({ user }),
      
      setLoading: (isLoading) => set({ isLoading }),

      setOnboardingDraft: (data) => set((state) => ({ 
        onboardingDraft: { ...state.onboardingDraft, ...data } 
      })),

      clearOnboardingDraft: () => set({ onboardingDraft: {} }),
    }),
    {
      name: 'ecosense-auth',
    }
  )
);
