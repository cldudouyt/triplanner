import api from './client'

export interface TrainingGroupMember {
  id: number
  firstName: string
  lastName: string
  currentTSB: number
}

export interface TrainingGroup {
  id: number
  name: string
  level: string
  description?: string
  icon?: string
  color?: string
  weeklyHours: number
  sessionsPerWeek: number
  members: TrainingGroupMember[]
}

export interface CoachStats {
  athleteCount: number
  weeklyAttendance: number
  plansSent: number
  nextCompetitionName: string | null
  nextCompetitionDays: number | null
}

export const groupsApi = {
  list: () => api.get<TrainingGroup[]>('/groups'),
  stats: () => api.get<CoachStats>('/groups/stats'),
  create: (data: Partial<TrainingGroup>) => api.post<TrainingGroup>('/groups', data),
}
