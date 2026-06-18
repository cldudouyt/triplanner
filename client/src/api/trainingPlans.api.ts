import api from './client'

export interface TrainingSession {
  id: number
  planId: number
  weekNumber: number
  dayOfWeek: number
  date?: string
  type: string
  title?: string
  description?: string
  duration?: number
  distance?: number
  intensity?: string
  completed: boolean
  actualDuration?: number
  actualDistance?: number
  notes?: string
}

export interface PlanCompetition {
  id: number
  competitionId: number
  isPrimary: boolean
  order: number
  competition: {
    id: number
    name: string
    date: string
    type: string
    priority: string
  }
}

export interface TrainingPlan {
  id: number
  name: string
  description?: string
  targetType: string
  durationWeeks: number
  level?: string
  weeklyHours?: number
  isTemplate: boolean
  isPublic?: boolean
  shareCode?: string | null
  startDate?: string
  endDate?: string
  createdAt?: string
  sessions: TrainingSession[]
  competitions: PlanCompetition[]
  user?: { firstName: string; lastName: string }
  _count?: { sessions: number }
}

export interface CompetitionIdInput {
  id: number
  isPrimary?: boolean
}

export interface PaginatedPlans {
  data: TrainingPlan[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const trainingPlansApi = {
  list: () =>
    api.get<PaginatedPlans>('/training-plans'),

  templates: () =>
    api.get<TrainingPlan[]>('/training-plans/templates'),

  get: (id: number) =>
    api.get<TrainingPlan>(`/training-plans/${id}`),

  create: (data: any) =>
    api.post<TrainingPlan>('/training-plans', data),

  createFromTemplate: (templateId: number, data: { competitionIds?: CompetitionIdInput[]; startDate: string }) =>
    api.post<TrainingPlan>(`/training-plans/from-template/${templateId}`, data),

  update: (id: number, data: any) =>
    api.put<TrainingPlan>(`/training-plans/${id}`, data),

  delete: (id: number) =>
    api.delete(`/training-plans/${id}`),

  generateSessions: (id: number) =>
    api.post<{ planId: number; sessionsGenerated: number }>(`/training-plans/${id}/generate-sessions`),

  share: (id: number, isPublic = false) =>
    api.post<TrainingPlan>(`/training-plans/${id}/share`, { isPublic }),

  revokeShare: (id: number) =>
    api.delete(`/training-plans/${id}/share`),

  getShared: (shareCode: string) =>
    api.get<TrainingPlan>(`/training-plans/shared/${shareCode}`),

  getPublic: (filters?: { targetType?: string; level?: string }) =>
    api.get<TrainingPlan[]>('/training-plans/public', { params: filters }),

  copyPlan: (id: number) =>
    api.post<TrainingPlan>(`/training-plans/${id}/copy`),
}

export const sessionsApi = {
  get: (id: number) =>
    api.get<TrainingSession>(`/training-sessions/${id}`),

  create: (data: any) =>
    api.post<TrainingSession>('/training-sessions', data),

  update: (id: number, data: any) =>
    api.put<TrainingSession>(`/training-sessions/${id}`, data),

  delete: (id: number) =>
    api.delete(`/training-sessions/${id}`),
}
