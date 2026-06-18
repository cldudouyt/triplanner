import api from './client'

export interface StravaAthlete {
  id: number
  firstname: string
  lastname: string
  profile: string
}

export interface StravaStatus {
  connected: boolean
  athlete?: StravaAthlete | null
}

export interface StravaActivity {
  id: number
  name: string
  type: string
  distance: number
  moving_time: number
  start_date: string
  average_speed: number
  max_speed: number
}

export interface SyncResult {
  synced: number
  total: number
}

export interface CompetitionSyncResult {
  matched: number
  total: number
}

export const stravaApi = {
  getAuthUrl: () =>
    api.get<{ url: string }>('/strava/auth-url'),

  getStatus: () =>
    api.get<StravaStatus>('/strava/status'),

  disconnect: () =>
    api.post('/strava/disconnect'),

  getActivities: (page = 1) =>
    api.get<StravaActivity[]>(`/strava/activities?page=${page}`),

  sync: () =>
    api.post<SyncResult>('/strava/sync'),

  syncCompetitions: () =>
    api.post<CompetitionSyncResult>('/strava/sync-competitions'),
}
