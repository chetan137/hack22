import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loops
    if (error.response?.status === 401 && originalRequest.url === '/auth/refresh') {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }
    
    // Try refresh if 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          // If no refresh token, just reject with the original 401 error
          return Promise.reject(error);
        }
        
        // Call refresh endpoint directly using axios to avoid interceptor loop
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });
        
        const newTokens = response.data;
        useAuthStore.getState().setTokens(newTokens);
        
        // Update original request with new token and retry
        originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        useAuthStore.getState().logout();
        // If refresh fails, still reject with the original 401 error so components can handle it properly
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);
