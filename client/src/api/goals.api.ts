import api from './client'

export interface GoalWithProgress {
  id: number
  sport: 'swim' | 'bike' | 'run' | 'strength' | 'all'
  year: number
  type: 'distance' | 'duration' | 'sessions'
  targetValue: number
  unit: string
  label?: string
  currentValue: number
  percentage: number
  projection: number
  createdAt: string
}

export interface CreateGoalInput {
  sport: GoalWithProgress['sport']
  year: number
  type: GoalWithProgress['type']
  targetValue: number
  unit: string
  label?: string
}

export const goalsApi = {
  list: (year?: number) =>
    api.get<GoalWithProgress[]>('/goals', { params: year ? { year } : undefined }),
  create: (data: CreateGoalInput) => api.post<GoalWithProgress>('/goals', data),
  delete: (id: number) => api.delete(`/goals/${id}`),
}
