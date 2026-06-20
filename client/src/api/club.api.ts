import api from './client'

export interface ClubInfo {
  id: number
  name: string
  membersCount: number
}

export interface RosterAthlete {
  id: number
  firstName: string
  lastName: string
  level: string
  ctl: number
  tsb: number
  nextCompetition?: { name: string; daysUntil: number }
  suggestionStatus?: 'plan_to_validate' | 'sent' | 'to_assign' | null
  currentSuggestionId?: number
}

export interface ClubStats {
  athletesCount: number
  activePlans: number
  weekCompletionPct: number
  weekCompletedSessions: number
  weekPlannedSessions: number
}

export interface AiSuggestion {
  id: string
  title: string
  delta: string
  why: string
  enabled: boolean
}

export interface PlanSuggestion {
  id: number
  athleteId: number
  suggestions: AiSuggestion[]
  coachNote?: string
  status: string
  sentAt?: string
}

export const clubApi = {
  getInfo: () => api.get<ClubInfo & { stats: ClubStats }>('/club'),
  getRoster: () => api.get<RosterAthlete[]>('/club/roster'),
  generateSuggestions: (data: { athleteId: number; planId: number; weekNumber: number }) =>
    api.post<PlanSuggestion>('/club/ai/generate', data),
  sendPlan: (data: { suggestionId: number; appliedIds: string[]; coachNote?: string }) =>
    api.post('/club/ai/send', data),
  respondToPlan: (data: { suggestionId: number; action: 'accept' | 'reject' }) =>
    api.patch('/club/plan/respond', data),
  getAthletePlan: (athleteId: number) =>
    api.get<{ plan: unknown; currentSuggestion: PlanSuggestion | null }>(`/club/plan/${athleteId}/current`),
}
