import api from './client'

export interface WellnessLog {
  id: number
  date: string
  sleepQuality: number
  sleepHours: number | null
  fatigue: number
  mood: number
  muscleSoreness: number
  stress: number
  restingHR: number | null
  hrv: number | null
  notes: string | null
  readinessScore: number
  createdAt: string
}

export interface WellnessTrend {
  logs: WellnessLog[]
  averageReadiness: number
  totalEntries: number
}

export interface WellnessAlert {
  type: 'low_readiness_streak' | 'very_low_readiness'
  message: string
  severity: 'warning' | 'danger'
  days: number
}

export interface CreateWellnessLogInput {
  date: string
  sleepQuality: number
  sleepHours?: number
  fatigue: number
  mood: number
  muscleSoreness: number
  stress: number
  restingHR?: number
  hrv?: number
  notes?: string
}

export const wellnessApi = {
  createLog: (data: CreateWellnessLogInput) =>
    api.post<WellnessLog>('/wellness', data),

  getLogs: (days = 30) =>
    api.get<WellnessLog[]>(`/wellness?days=${days}`),

  getToday: () =>
    api.get<WellnessLog | null>('/wellness/today'),

  getTrend: (days = 14) =>
    api.get<WellnessTrend>(`/wellness/trend?days=${days}`),

  getAlerts: () =>
    api.get<WellnessAlert[]>('/wellness/alerts'),

  deleteLog: (id: number) =>
    api.delete(`/wellness/${id}`),
}
