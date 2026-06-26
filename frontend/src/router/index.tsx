import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, AdminRoute } from './routes';
import AuthLayout from '../pages/auth/AuthLayout';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import DashboardLayout from '../pages/dashboard/DashboardLayout';
import DashboardOverview from '../pages/dashboard/Dashboard';
import TrackActivity from '../pages/dashboard/TrackActivity';
import OCRAnalyzer from '../pages/dashboard/OCRAnalyzer';
import GreenCoach from '../pages/dashboard/GreenCoach';
import Goals from '../pages/dashboard/Goals';
import Community from '../pages/dashboard/Community';
import OnboardingWizard from '../pages/onboarding/OnboardingWizard';
import LandingPage from '../pages/landing/LandingPage';
import DigitalTwin from '../pages/dashboard/DigitalTwin';
import Profile from '../pages/dashboard/Profile';
import Settings from '../pages/dashboard/Settings';

// Admin Pages
import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminReports from '../pages/admin/AdminReports';
import AdminEvents from '../pages/admin/AdminEvents';
import AdminEmissionFactors from '../pages/admin/AdminEmissionFactors';

export const router = createBrowserRouter([
  // Landing page — always accessible, even when logged in
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/auth',
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <Login /> },
          { path: 'signup', element: <Signup /> },
          { path: 'forgot-password', element: <ForgotPassword /> },
          { path: 'reset-password', element: <ResetPassword /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/onboarding',
        element: <OnboardingWizard />,
      },
      {
        // All dashboard pages share the layout (sidebar + header)
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardOverview /> },
          { path: 'track', element: <TrackActivity /> },
          { path: 'ocr', element: <OCRAnalyzer /> },
          { path: 'coach', element: <GreenCoach /> },
          { path: 'goals', element: <Goals /> },
          { path: 'community', element: <Community /> },
          { path: 'twin', element: <DigitalTwin /> },
          { path: 'profile', element: <Profile /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
    ],
  },
  {
    element: <AdminRoute />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'analytics', element: <AdminAnalytics /> },
          { path: 'reports', element: <AdminReports /> },
          { path: 'events', element: <AdminEvents /> },
          { path: 'emission-factors', element: <AdminEmissionFactors /> },
        ],
      },
    ],
  },
]);
