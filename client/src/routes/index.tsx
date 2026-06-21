import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AdminRoute from '@/components/layout/AdminRoute'
import AppLayout from '@/components/layout/AppLayout'
import ClubCoachLayout from '@/components/layout/ClubCoachLayout'
import AdminLayout from '@/components/layout/AdminLayout'

// ─── Page loader ──────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  )
}

// ─── Smart root: club mode — redirect to login (no public landing page) ───────

function SmartRoot() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Navigate to="/login" replace />
}

// ─── Lazy pages ───────────────────────────────────────────────────────────────

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const SharedPlanPage = lazy(() => import('@/pages/SharedPlanPage'))

// Protected — AppLayout
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const CompetitionsPage = lazy(() => import('@/pages/CompetitionsPage'))
const CompetitionFormPage = lazy(() => import('@/pages/CompetitionFormPage'))
const CompetitionDetailPage = lazy(() => import('@/pages/CompetitionDetailPage'))
const TrainingPlansPage = lazy(() => import('@/pages/TrainingPlansPage'))
const TrainingPlanFormPage = lazy(() => import('@/pages/TrainingPlanFormPage'))
const TrainingPlanDetailPage = lazy(() => import('@/pages/TrainingPlanDetailPage'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const WellnessPage = lazy(() => import('@/pages/WellnessPage'))
const PersonalRecordsPage = lazy(() => import('@/pages/PersonalRecordsPage'))
const AchievementsPage = lazy(() => import('@/pages/AchievementsPage'))
const GoalsPage = lazy(() => import('@/pages/GoalsPage'))
const StatisticsPage = lazy(() => import('@/pages/StatisticsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const RaceDayPage = lazy(() => import('@/pages/RaceDayPage'))
const PublicPlansPage = lazy(() => import('@/pages/PublicPlansPage'))
const ClubPage = lazy(() => import('@/pages/ClubPage'))
const MessagesPage = lazy(() => import('@/pages/MessagesPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))

// Protected — Onboarding (hors AppLayout)
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))

// Protected — ClubCoachLayout
const ClubCoachDashboardPage = lazy(() => import('@/pages/ClubCoachDashboardPage'))
const ClubCoachGroupsPage = lazy(() => import('@/pages/ClubCoachGroupsPage'))
const ClubCoachCalendarPage = lazy(() => import('@/pages/ClubCoachCalendarPage'))
const ClubCoachPlanWizardPage = lazy(() => import('@/pages/ClubCoachPlanWizardPage'))
const ClubCoachSeancesPage = lazy(() => import('@/pages/ClubCoachSeancesPage'))

// Athlete new pages
const SeancesClubPage = lazy(() => import('@/pages/SeancesClubPage'))
const AnnuairePage = lazy(() => import('@/pages/AnnuairePage'))

// Admin
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminContentPage = lazy(() => import('@/pages/admin/AdminContentPage'))
const AdminLogsPage = lazy(() => import('@/pages/admin/AdminLogsPage'))
const AdminMembresPage = lazy(() => import('@/pages/admin/AdminMembresPage'))
const AdminInvitationsPage = lazy(() => import('@/pages/admin/AdminInvitationsPage'))

// 404
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// ─── Helper to wrap lazy pages in Suspense ────────────────────────────────────

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <SmartRoot /> },
  { path: '/login', element: <S><LoginPage /></S> },
  { path: '/register', element: <S><RegisterPage /></S> },
  { path: '/forgot-password', element: <S><ForgotPasswordPage /></S> },
  { path: '/reset-password', element: <S><ResetPasswordPage /></S> },
  { path: '/plans/shared/:shareCode', element: <S><SharedPlanPage /></S> },

  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      // App layout routes
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <S><DashboardPage /></S> },
          { path: '/competitions', element: <S><CompetitionsPage /></S> },
          { path: '/competitions/new', element: <S><CompetitionFormPage /></S> },
          { path: '/competitions/:id', element: <S><CompetitionDetailPage /></S> },
          { path: '/competitions/:id/edit', element: <S><CompetitionFormPage /></S> },
          { path: '/training', element: <S><TrainingPlansPage /></S> },
          { path: '/training/new', element: <S><TrainingPlanFormPage /></S> },
          { path: '/training/:id', element: <S><TrainingPlanDetailPage /></S> },
          { path: '/calendar', element: <S><CalendarPage /></S> },
          { path: '/wellness', element: <S><WellnessPage /></S> },
          { path: '/records', element: <S><PersonalRecordsPage /></S> },
          { path: '/achievements', element: <S><AchievementsPage /></S> },
          { path: '/goals', element: <S><GoalsPage /></S> },
          { path: '/statistics', element: <S><StatisticsPage /></S> },
          { path: '/settings', element: <S><SettingsPage /></S> },
          { path: '/race-day/:id', element: <S><RaceDayPage /></S> },
          { path: '/discover', element: <S><PublicPlansPage /></S> },
          { path: '/club', element: <S><ClubPage /></S> },
          { path: '/messages', element: <S><MessagesPage /></S> },
          { path: '/profil', element: <S><ProfilePage /></S> },
          { path: '/seances-club', element: <S><SeancesClubPage /></S> },
          { path: '/annuaire', element: <S><AnnuairePage /></S> },
        ],
      },

      // Onboarding — hors AppLayout (plein écran sans sidebar)
      { path: '/onboarding', element: <S><OnboardingPage /></S> },

      // Club coach layout routes
      {
        element: <ClubCoachLayout />,
        children: [
          { path: '/club/coach', element: <S><ClubCoachDashboardPage /></S> },
          { path: '/club/coach/groupes', element: <S><ClubCoachGroupsPage /></S> },
          { path: '/club/coach/seances', element: <S><ClubCoachSeancesPage /></S> },
          { path: '/club/coach/calendrier', element: <S><ClubCoachCalendarPage /></S> },
          { path: '/club/coach/plans', element: <S><ClubCoachPlanWizardPage /></S> },
          { path: '/club/coach/plans/new', element: <S><ClubCoachPlanWizardPage /></S> },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <S><NotFoundPage /></S> },

  // Admin routes
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <S><AdminDashboardPage /></S> },
          { path: '/admin/users', element: <S><AdminUsersPage /></S> },
          { path: '/admin/content', element: <S><AdminContentPage /></S> },
          { path: '/admin/logs', element: <S><AdminLogsPage /></S> },
          { path: '/admin/membres', element: <S><AdminMembresPage /></S> },
          { path: '/admin/invitations', element: <S><AdminInvitationsPage /></S> },
        ],
      },
    ],
  },
])
