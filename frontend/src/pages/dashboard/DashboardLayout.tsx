import { LogOut, LayoutDashboard, Settings, User, Plus, Camera, Sparkles, Target, Users, Brain, Shield, Home } from 'lucide-react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';

const navItems = [
  {
    to: '/dashboard',
    labelKey: 'dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    exact: true,
  },
  {
    to: '/dashboard/track',
    labelKey: 'logActivity',
    icon: <Plus className="w-5 h-5" />,
    exact: false,
  },
  {
    to: '/dashboard/ocr',
    labelKey: 'billAnalyzer',
    icon: <Camera className="w-5 h-5" />,
    exact: false,
  },
  {
    to: '/dashboard/coach',
    labelKey: 'aiCoach',
    icon: <Sparkles className="w-5 h-5" />,
    exact: false,
  },
  {
    to: '/dashboard/goals',
    labelKey: 'goals',
    icon: <Target className="w-5 h-5" />,
    exact: false,
  },
  {
    to: '/dashboard/community',
    labelKey: 'community',
    icon: <Users className="w-5 h-5" />,
    exact: false,
  },
  {
    to: '/dashboard/twin',
    labelKey: 'digitalTwin',
    icon: <Brain className="w-5 h-5" />,
    exact: false,
  },
];

export default function DashboardLayout() {
  const { user, refreshToken, logout } = useAuthStore();
  const { language } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (error) {
        console.error('Failed to logout from server', error);
      }
    }
    logout();
    navigate('/auth/login');
  };

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-transparent flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--border)] bg-[var(--card)] hidden md:flex flex-col shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-[var(--border)]">
          <Logo className="scale-75 origin-left" />
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${
                  active
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                <span className={`${active ? 'text-brand-400' : 'group-hover:text-brand-400 transition-colors'}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{t(language, item.labelKey as TranslationKey)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--border)] space-y-1">
          {/* Home button */}
          <a
            href="https://hack22-seven.vercel.app"
            className="flex items-center gap-3 px-4 py-3 text-[var(--muted-foreground)] hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </a>
          {user && (user.role === 'admin' || user.role === 'super_admin') && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 rounded-lg transition-colors border border-brand-500/20"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Admin Panel</span>
            </Link>
          )}
          <Link
            to="/dashboard/profile"
            className="flex items-center gap-3 px-4 py-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">{t(language, 'profile')}</span>
          </Link>
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">{t(language, 'settings')}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-[var(--muted-foreground)] hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t(language, 'signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-[var(--border)] flex items-center justify-between px-8 bg-[var(--card)] backdrop-blur-md shrink-0">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {navItems.find((n) => isActive(n.to, n.exact)) ? t(language, navItems.find((n) => isActive(n.to, n.exact))!.labelKey as TranslationKey) : t(language, 'dashboard')}
          </h1>
          <div className="flex items-center gap-4">
            {/* Home button in header */}
            <a
              href="https://hack22-seven.vercel.app"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all duration-200"
              title="Go to Home"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </a>
            <Link to="/dashboard/track" className="hidden sm:block">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> {t(language, 'logActivity')}
              </Button>
            </Link>
            <div className="text-right hidden sm:block ml-4">
              <p className="text-sm font-medium text-[var(--foreground)]">{user?.full_name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{user?.email}</p>
            </div>
            <Link
              to="/dashboard/profile"
              className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold hover:bg-brand-500/30 transition-colors"
              title="My Profile"
            >
              {user?.full_name?.charAt(0).toUpperCase()}
            </Link>
            {/* Mobile actions */}
            <Link to="/dashboard/track" className="md:hidden text-brand-400">
              <Plus className="w-6 h-6" />
            </Link>
            <button onClick={handleLogout} className="md:hidden text-[var(--muted-foreground)] hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content — child routes render here */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
