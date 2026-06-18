import api from './client'

export interface Competition {
  id: number
  name: string
  date: string
  location?: string
  type: string
  subType: string
  swimDistance?: number
  bikeDistance?: number
  runDistance?: number
  chronoObjective?: string
  startTime?: string
  result?: string
  registrationLink?: string
  notes?: string
  priority: string
  budget?: number
  accommodation?: string
  transport?: string
  status: string
  equipmentItems: EquipmentItem[]
  trainingPlans?: any[]
  createdAt: string
  updatedAt: string
}

export interface EquipmentItem {
  id: number
  name: string
  checked: boolean
  category?: string
}

export interface CompetitionListResponse {
  data: Competition[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CompetitionFilters {
  type?: string
  subType?: string
  status?: string
  priority?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export const competitionsApi = {
  list: (params?: CompetitionFilters) =>
    api.get<CompetitionListResponse>('/competitions', { params }),

  get: (id: number) =>
    api.get<Competition>(`/competitions/${id}`),

  create: (data: Partial<Competition>) =>
    api.post<Competition>('/competitions', data),

  update: (id: number, data: Partial<Competition>) =>
    api.put<Competition>(`/competitions/${id}`, data),

  delete: (id: number) =>
    api.delete(`/competitions/${id}`),

  import: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/competitions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  addEquipment: (competitionId: number, data: { name: string; category?: string }) =>
    api.post<EquipmentItem>(`/competitions/${competitionId}/equipment`, data),

  updateEquipment: (competitionId: number, itemId: number, data: Partial<EquipmentItem>) =>
    api.put<EquipmentItem>(`/competitions/${competitionId}/equipment/${itemId}`, data),

  removeEquipment: (competitionId: number, itemId: number) =>
    api.delete(`/competitions/${competitionId}/equipment/${itemId}`),

  suggestions: () =>
    api.get<{ names: string[]; locations: string[] }>('/competitions/suggestions'),
}
