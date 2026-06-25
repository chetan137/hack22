import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, setLoading, setUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      // If we're authenticated in store (we have tokens), verify with server
      if (isAuthenticated) {
        try {
          const user = await authApi.getMe();
          setUser(user);
        } catch (error) {
          // If token refresh fails, the interceptor will call logout()
          // But just in case, if getMe fails and we still think we're auth'd:
          console.error("Auth check failed", error);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [isAuthenticated, setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
