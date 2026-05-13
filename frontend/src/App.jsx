/**
 * App — routing principal
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute, defaultPathForRole } from '@/components/common/ProtectedRoute';

// Auth pages
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const Landing = lazy(() => import('@/pages/auth/Landing'));

// Owner
const OwnerLayout = lazy(() => import('@/components/layout/OwnerLayout'));
const OwnerDashboard = lazy(() => import('@/pages/owner/Dashboard'));
const MembersList = lazy(() => import('@/pages/owner/MembersList'));
const MemberDetail = lazy(() => import('@/pages/owner/MemberDetail'));
const PlansPage = lazy(() => import('@/pages/owner/PlansPage'));
const SubscriptionsList = lazy(() => import('@/pages/owner/SubscriptionsList'));
const PaymentsList = lazy(() => import('@/pages/owner/PaymentsList'));
const CheckInsPage = lazy(() => import('@/pages/owner/CheckInsPage'));
const CoachesList = lazy(() => import('@/pages/owner/CoachesList'));
const ClassesPage = lazy(() => import('@/pages/owner/ClassesPage'));
const ProgramsPage = lazy(() => import('@/pages/owner/ProgramsPage'));
const SettingsPage = lazy(() => import('@/pages/owner/SettingsPage'));

// Coach
const CoachLayout = lazy(() => import('@/components/layout/CoachLayout'));
const CoachDashboard = lazy(() => import('@/pages/coach/Dashboard'));
const CoachClasses = lazy(() => import('@/pages/coach/MyClasses'));
const CoachPrograms = lazy(() => import('@/pages/coach/MyPrograms'));

// Member
const MemberLayout = lazy(() => import('@/components/layout/MemberLayout'));
const MemberDashboard = lazy(() => import('@/pages/member/Dashboard'));
const MemberSubscription = lazy(() => import('@/pages/member/MySubscription'));
const MemberClasses = lazy(() => import('@/pages/member/BrowseClasses'));
const MemberPrograms = lazy(() => import('@/pages/member/MyPrograms'));

// Super admin
const SuperAdminLayout = lazy(() => import('@/components/layout/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/Dashboard'));
const SuperAdminGyms = lazy(() => import('@/pages/superadmin/GymsList'));

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/landing" replace />;
  return <Navigate to={defaultPathForRole(user.role)} replace />;
}

export default function App() {
  const { gym } = useAuth();
  return (
    <ThemeProvider gym={gym}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Owner */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OwnerDashboard />} />
            <Route path="members" element={<MembersList />} />
            <Route path="members/:id" element={<MemberDetail />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="subscriptions" element={<SubscriptionsList />} />
            <Route path="payments" element={<PaymentsList />} />
            <Route path="checkins" element={<CheckInsPage />} />
            <Route path="coaches" element={<CoachesList />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Coach */}
          <Route
            path="/coach"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CoachDashboard />} />
            <Route path="classes" element={<CoachClasses />} />
            <Route path="programs" element={<CoachPrograms />} />
          </Route>

          {/* Member */}
          <Route
            path="/member"
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <MemberLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MemberDashboard />} />
            <Route path="subscription" element={<MemberSubscription />} />
            <Route path="classes" element={<MemberClasses />} />
            <Route path="programs" element={<MemberPrograms />} />
          </Route>

          {/* Super admin */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SuperAdminDashboard />} />
            <Route path="gyms" element={<SuperAdminGyms />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
