import api from './client'

export interface ClubSession {
  id: number
  title: string
  sport: string
  date: string
  startTime: string
  endTime: string
  location: string
  capacity: number
  registeredCount: number
  waitlistCount: number
  isRegistered: boolean
  isWaitlisted: boolean
  attendees: { id: number; firstName: string; lastName: string }[]
}

export const seancesClubApi = {
  list: (sport?: string) => api.get<ClubSession[]>('/club-sessions', { params: { sport } }),
  create: (data: Omit<ClubSession, 'id' | 'registeredCount' | 'waitlistCount' | 'isRegistered' | 'isWaitlisted' | 'attendees'>) =>
    api.post<ClubSession>('/club-sessions', data),
  register: (id: number) => api.post(`/club-sessions/${id}/register`),
  unregister: (id: number) => api.delete(`/club-sessions/${id}/register`),
  getAttendees: (id: number) => api.get(`/club-sessions/${id}/attendees`),
}
