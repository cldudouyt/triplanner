import api from './client'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  type: string
  subType?: string
  priority?: string
  intensity?: string
  completed?: boolean
  duration?: number
  distance?: number
  description?: string
  notes?: string
  color: string
  sourceId: number
  sourceType: 'competition' | 'training_session'
  planName?: string
}

export const calendarApi = {
  events: (start: string, end: string) =>
    api.get<CalendarEvent[]>('/calendar/events', { params: { start, end } }),
}
