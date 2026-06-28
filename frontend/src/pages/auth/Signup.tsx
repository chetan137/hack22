import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GlassPanel } from '@/components/ui/Card';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { GoogleLogin } from '@react-oauth/google';
import { useSettingsStore } from '@/store/settingsStore';

const Signup = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const loginAction = useAuthStore(state => state.login);
  const theme = useSettingsStore(state => state.theme);

  const handleGoogleToken = async (idToken: string) => {
    setIsLoading(true);
    setError('');
    try {
      const tokens = await authApi.googleLogin(idToken);
      useAuthStore.getState().setTokens(tokens);
      const user = await authApi.getMe();
      loginAction(tokens, user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Google sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirm_password) {
      setError("Passwords don't match");
      return;
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 1. Register
      await authApi.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name
      });
      
      // 2. Auto-login after registration (as decided)
      const tokens = await authApi.login({ 
        email: formData.email, 
        password: formData.password 
      });
      
      useAuthStore.getState().setTokens(tokens);
      const user = await authApi.getMe();
      
      loginAction(tokens, user);
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setError(detail[0].msg || 'Invalid data format. Please check your inputs.');
      } else {
        setError('Failed to create account. Please try again.');
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
        {/* Home Link */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-2">Create an account</h2>
          <p className="text-[var(--muted-foreground)]">Join Ecosense AI to get started</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="full_name"
            type="text"
            placeholder="John Doe"
            value={formData.full_name}
            onChange={handleChange}
            icon={<User className="w-5 h-5" />}
            required
          />
          
          <Input
            label="Email address"
            name="email"
            type="email"
            placeholder="name@company.com"
            value={formData.email}
            onChange={handleChange}
            icon={<Mail className="w-5 h-5" />}
            required
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock className="w-5 h-5" />}
              required
            />
            
            <Input
              label="Confirm Password"
              name="confirm_password"
              type="password"
              placeholder="••••••••"
              value={formData.confirm_password}
              onChange={handleChange}
              icon={<CheckCircle2 className="w-5 h-5" />}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
            Create account
          </Button>
          
          <div className="relative flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--foreground)]0">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <div className="w-full h-[44px]">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  handleGoogleToken(credentialResponse.credential);
                }
              }}
              onError={() => {
                console.error('Login Failed');
              }}
              theme={theme === 'dark' ? 'filled_black' : 'outline'}
              text="signup_with"
              shape="rectangular"
              width="400"
            />
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium text-[var(--primary)] hover:text-brand-300 transition-colors">
            Sign in
          </Link>
        </div>
      </GlassPanel>
    </motion.div>
  );
};

export default Signup;
