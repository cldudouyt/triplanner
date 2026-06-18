import api from './client'

export interface NotificationPreferences {
  id: number
  emailSessionReminder: boolean
  emailCompetitionReminder: boolean
  reminderDaysBefore: number
}

export const notificationsApi = {
  getPreferences: () => api.get<NotificationPreferences>('/notifications/preferences'),
  updatePreferences: (data: Partial<Omit<NotificationPreferences, 'id'>>) =>
    api.patch<NotificationPreferences>('/notifications/preferences', data),
}
