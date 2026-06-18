import api from './client'
import type { TrainingPlan } from './trainingPlans.api'

export interface GenerateAIPlanParams {
  name: string
  targetType: string
  durationWeeks: number
  level: string
  weeklyHours?: number
  startDate?: string
  objective?: string
  constraints?: string
}

export interface CompetitionAnalysis {
  evaluation: string
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  formAnalysis: string
}

export const aiApi = {
  getStatus: () =>
    api.get<{ available: boolean }>('/ai/status'),

  generatePlan: (params: GenerateAIPlanParams) =>
    api.post<TrainingPlan>('/ai/generate-plan', params),

  analyzeCompetition: (competitionId: number) =>
    api.post<CompetitionAnalysis>('/ai/analyze-competition', { competitionId }),
}
