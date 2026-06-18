import api from './client'

export interface WeeklySportStats {
  duration: number
  distance: number
  sessions: number
}

export interface WeeklyStats {
  week: string
  weekStart: string
  weekEnd: string
  swim: WeeklySportStats
  bike: WeeklySportStats
  run: WeeklySportStats
  other: WeeklySportStats
  total: WeeklySportStats & { completed: number }
}

export interface SportDistribution {
  type: string
  duration: number
  distance: number
  sessions: number
  percentage: number
}

export interface OverallStats {
  totalSessions: number
  completedSessions: number
  completionRate: number
  totalDuration: number
  totalDistance: number
  averageSessionDuration: number
  currentStreak: number
  longestStreak: number
}

export interface UpcomingSession {
  id: number
  date: string
  type: string
  title: string | null
  duration: number | null
  distance: number | null
  intensity: string | null
  plan: { name: string }
}

export interface RecentActivity {
  id: number
  date: string
  type: string
  title: string | null
  actualDuration: number | null
  actualDistance: number | null
  plan: { name: string }
}

export interface DashboardData {
  overall: OverallStats
  weekly: WeeklyStats[]
  distribution: SportDistribution[]
  upcoming: UpcomingSession[]
  recent: RecentActivity[]
}

export interface TrainingLoadPoint {
  date: string
  tss: number
  ctl: number
  atl: number
  tsb: number
}

export const statisticsApi = {
  getWeeklyStats: (weeks = 12) =>
    api.get<WeeklyStats[]>(`/statistics/weekly?weeks=${weeks}`),

  getSportDistribution: (days = 90) =>
    api.get<SportDistribution[]>(`/statistics/distribution?days=${days}`),

  getOverallStats: () =>
    api.get<OverallStats>('/statistics/overall'),

  getUpcomingSessions: (days = 7) =>
    api.get<UpcomingSession[]>(`/statistics/upcoming?days=${days}`),

  getRecentActivity: (limit = 10) =>
    api.get<RecentActivity[]>(`/statistics/recent?limit=${limit}`),

  getTrainingLoad: (days = 90) =>
    api.get<TrainingLoadPoint[]>(`/statistics/training-load?days=${days}`),

  getDashboard: () =>
    api.get<DashboardData>('/statistics/dashboard'),
}
