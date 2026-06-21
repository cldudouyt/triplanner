import api from './client'

export interface ClubMemberDirectory {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  group: string | null
  isMe: boolean
}

export const annuaireApi = {
  list: (group?: string) => api.get<ClubMemberDirectory[]>('/club/directory', { params: { group } }),
}
