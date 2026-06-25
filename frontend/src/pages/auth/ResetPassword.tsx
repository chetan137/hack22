import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GlassPanel } from '@/components/ui/Card';
import { authApi } from '@/api/auth';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authApi.resetPassword({ token, new_password: password });
      setIsSuccess(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setError(detail[0].msg || 'Invalid data format.');
      } else {
        setError('Failed to reset password. The link might have expired.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <GlassPanel className="text-center p-10">
          <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password reset</h2>
          <p className="text-slate-400 mb-8">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <Link to="/auth/login">
            <Button className="w-full">Continue to login</Button>
          </Link>
        </GlassPanel>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassPanel>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Set new password</h2>
          <p className="text-slate-400">Must be at least 8 characters long.</p>
        </div>

        {!token && (
          <div className="mb-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-sm text-orange-400">No reset token found in the URL. Please use the link from your email.</p>
          </div>
        )}

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
            label="New password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-5 h-5" />}
            required
            disabled={!token}
          />
          
          <Input
            label="Confirm new password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<CheckCircle2 className="w-5 h-5" />}
            required
            disabled={!token}
          />

          <Button type="submit" className="w-full mt-2" isLoading={isLoading} disabled={!token}>
            Reset password
          </Button>
        </form>
      </GlassPanel>
    </motion.div>
  );
};

export default ResetPassword;
