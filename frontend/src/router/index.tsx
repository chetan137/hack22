import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './routes';
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

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
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
        ],
      },
    ],
  },
]);
