import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AdminRoute from '@/components/layout/AdminRoute'
import AppLayout from '@/components/layout/AppLayout'
import ClubCoachLayout from '@/components/layout/ClubCoachLayout'
import ClubAthleteLayout from '@/components/layout/ClubAthleteLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import CompetitionsPage from '@/pages/CompetitionsPage'
import CompetitionFormPage from '@/pages/CompetitionFormPage'
import CompetitionDetailPage from '@/pages/CompetitionDetailPage'
import TrainingPlansPage from '@/pages/TrainingPlansPage'
import TrainingPlanFormPage from '@/pages/TrainingPlanFormPage'
import TrainingPlanDetailPage from '@/pages/TrainingPlanDetailPage'
import CalendarPage from '@/pages/CalendarPage'
import StatisticsPage from '@/pages/StatisticsPage'
import SettingsPage from '@/pages/SettingsPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminContentPage from '@/pages/admin/AdminContentPage'
import AdminLogsPage from '@/pages/admin/AdminLogsPage'
import WellnessPage from '@/pages/WellnessPage'
import PersonalRecordsPage from '@/pages/PersonalRecordsPage'
import AchievementsPage from '@/pages/AchievementsPage'
import GoalsPage from '@/pages/GoalsPage'
import RaceDayPage from '@/pages/RaceDayPage'
import SharedPlanPage from '@/pages/SharedPlanPage'
import PublicPlansPage from '@/pages/PublicPlansPage'
import ClubPage from '@/pages/ClubPage'
import ClubCoachPage from '@/pages/ClubCoachPage'
import ClubAthletePage from '@/pages/ClubAthletePage'
import MessagesPage from '@/pages/MessagesPage'
import ProfilePage from '@/pages/ProfilePage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/plans/shared/:shareCode', element: <SharedPlanPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/competitions', element: <CompetitionsPage /> },
          { path: '/competitions/new', element: <CompetitionFormPage /> },
          { path: '/competitions/:id', element: <CompetitionDetailPage /> },
          { path: '/competitions/:id/edit', element: <CompetitionFormPage /> },
          { path: '/training', element: <TrainingPlansPage /> },
          { path: '/training/new', element: <TrainingPlanFormPage /> },
          { path: '/training/:id', element: <TrainingPlanDetailPage /> },
          { path: '/calendar', element: <CalendarPage /> },
          { path: '/wellness', element: <WellnessPage /> },
          { path: '/records', element: <PersonalRecordsPage /> },
          { path: '/achievements', element: <AchievementsPage /> },
          { path: '/goals', element: <GoalsPage /> },
          { path: '/statistics', element: <StatisticsPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/race-day/:id', element: <RaceDayPage /> },
          { path: '/discover', element: <PublicPlansPage /> },
          { path: '/club', element: <ClubPage /> },
          { path: '/messages', element: <MessagesPage /> },
          { path: '/profil', element: <ProfilePage /> },
        ],
      },
      {
        element: <ClubCoachLayout />,
        children: [
          { path: '/club/coach', element: <ClubCoachPage /> },
        ],
      },
      {
        element: <ClubAthleteLayout />,
        children: [
          { path: '/club/athlete', element: <ClubAthletePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/users', element: <AdminUsersPage /> },
          { path: '/admin/content', element: <AdminContentPage /> },
          { path: '/admin/logs', element: <AdminLogsPage /> },
        ],
      },
    ],
  },
])
