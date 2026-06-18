import api from './client'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'training' | 'consistency' | 'distance' | 'competition' | 'wellness'
  threshold: number
  unit: string
  unlocked: boolean
  progress: number
  unlockedAt: string | null
}

export interface CheckResult {
  newUnlocks: string[]
  metrics: Record<string, number>
}

export const achievementsApi = {
  getAll: () =>
    api.get<Achievement[]>('/achievements'),

  check: () =>
    api.post<CheckResult>('/achievements/check'),

  getDefinitions: () =>
    api.get<Achievement[]>('/achievements/definitions'),
}
