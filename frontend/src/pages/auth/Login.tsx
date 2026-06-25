import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GlassPanel } from '@/components/ui/Card';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const loginAction = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const tokens = await authApi.login({ email, password });
      // Immediately fetch user data using the new token
      useAuthStore.getState().setTokens(tokens);
      const user = await authApi.getMe();
      
      loginAction(tokens, user);
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setError(detail[0].msg || 'Invalid data format.');
      } else {
        setError('Failed to login. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassPanel>
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-slate-400">Enter your details to access your account</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-5 h-5" />}
            required
          />
          
          <div className="space-y-2">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              required
            />
            <div className="flex justify-end">
              <Link 
                to="/auth/forgot-password" 
                className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Sign in
          </Button>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full mt-2 border-brand-500/50 hover:bg-brand-500/10 text-brand-400"
            onClick={async () => {
              const demoEmail = 'testuser_e2e@example.com';
              const demoPassword = 'password123';
              
              setEmail(demoEmail);
              setPassword(demoPassword);
              setError('');
              setIsLoading(true);
              
              try {
                let tokens;
                try {
                  tokens = await authApi.login({ email: demoEmail, password: demoPassword });
                } catch (loginErr: any) {
                  // If unauthorized, the demo user might not exist yet. Let's auto-register them!
                  if (loginErr.response?.status === 401) {
                    await authApi.register({ 
                      email: demoEmail, 
                      password: demoPassword, 
                      full_name: 'Demo User' 
                    });
                    // Try login again after registering
                    tokens = await authApi.login({ email: demoEmail, password: demoPassword });
                  } else {
                    throw loginErr;
                  }
                }
                
                useAuthStore.getState().setTokens(tokens);
                const user = await authApi.getMe();
                
                loginAction(tokens, user);
                navigate('/dashboard');
              } catch (err: any) {
                const detail = err.response?.data?.detail;
                if (typeof detail === 'string') {
                  setError(detail);
                } else if (Array.isArray(detail) && detail.length > 0) {
                  setError(detail[0].msg || 'Invalid data format.');
                } else {
                  setError('Failed to login. Please check your credentials.');
                }
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            Quick Demo Login
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/auth/signup" className="font-medium text-brand-400 hover:text-brand-300 transition-colors">
            Create an account
          </Link>
        </div>
      </GlassPanel>
    </motion.div>
  );
};

export default Login;
