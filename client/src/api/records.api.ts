import api from './client'

export interface PersonalRecord {
  id: number
  sport: string
  category: string
  value: number
  unit: string
  date: string
  notes: string | null
  sessionId: number | null
  competitionId: number | null
  createdAt: string
}

export interface RecordCategory {
  value: string
  label: string
  unit: string
}

export interface RecordsResponse {
  best: PersonalRecord[]
  all: PersonalRecord[]
}

export interface CreateRecordInput {
  sport: string
  category: string
  value: number
  unit: string
  date: string
  notes?: string
  sessionId?: number
  competitionId?: number
}

export const recordsApi = {
  getAll: () =>
    api.get<RecordsResponse>('/records'),

  getBySport: (sport: string) =>
    api.get<PersonalRecord[]>(`/records/${sport}`),

  getCategories: () =>
    api.get<Record<string, RecordCategory[]>>('/records/categories'),

  create: (data: CreateRecordInput) =>
    api.post<{ record: PersonalRecord; isNewPR: boolean }>('/records', data),

  delete: (id: number) =>
    api.delete(`/records/${id}`),
}
