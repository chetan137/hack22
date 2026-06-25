import { LogOut, LayoutDashboard, Settings, User, Plus, Camera, Sparkles, Target, Users } from 'lucide-react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

const navItems = [
  {
    to: '/dashboard',
    label: 'Overview',
    icon: <LayoutDashboard className="w-5 h-5" />,
    exact: true,
  },
  {
    to: '/dashboard/track',
    label: 'Log Activity',
    icon: <Plus className="w-5 h-5" />,
    exact: false,
  },
  {
    to: '/dashboard/ocr',
    label: 'Bill Analyzer',
    icon: <Camera className="w-5 h-5" />,
    exact: false,
  },
  {
    to: '/dashboard/coach',
    label: 'AI Coach',
    icon: <Sparkles className="w-5 h-5" />,
    exact: false,
  },
  {
    to: '/dashboard/goals',
    label: 'Goals',
    icon: <Target className="w-5 h-5" />,
    exact: false,
  },
  {
    to: '/dashboard/community',
    label: 'Community',
    icon: <Users className="w-5 h-5" />,
    exact: false,
  },
];

export default function DashboardLayout() {
  const { user, refreshToken, logout } = useAuthStore();
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
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 hidden md:flex flex-col shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
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
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <span className={`${active ? 'text-brand-400' : 'group-hover:text-brand-400 transition-colors'}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-1">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md shrink-0">
          <h1 className="text-xl font-semibold text-white">
            {navItems.find((n) => isActive(n.to, n.exact))?.label ?? 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <Link to="/dashboard/track" className="hidden sm:block">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> Log Activity
              </Button>
            </Link>
            <div className="text-right hidden sm:block ml-4">
              <p className="text-sm font-medium text-white">{user?.full_name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            {/* Mobile actions */}
            <Link to="/dashboard/track" className="md:hidden text-brand-400">
              <Plus className="w-6 h-6" />
            </Link>
            <button onClick={handleLogout} className="md:hidden text-slate-400 hover:text-red-400">
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
