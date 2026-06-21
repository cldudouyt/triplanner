import api from './client'

export interface DashboardStats {
  stats: {
    users: number
    plans: number
    competitions: number
    sessions: number
    usersThisMonth: number
    activeUsersLast7Days: number
  }
  recentUsers: Array<{
    id: number
    email: string
    firstName: string
    lastName: string
    createdAt: string
  }>
  recentPlans: Array<{
    id: number
    name: string
    targetType: string
    createdAt: string
    user: { firstName: string; lastName: string; email: string }
  }>
}

export interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  isAdmin: boolean
  createdAt: string
  _count: {
    trainingPlans: number
    competitions: number
  }
}

export interface AdminUserDetail extends AdminUser {
  updatedAt: string
  _count: {
    trainingPlans: number
    competitions: number
    refreshTokens: number
  }
  trainingPlans: Array<{
    id: number
    name: string
    targetType: string
    createdAt: string
  }>
  competitions: Array<{
    id: number
    name: string
    date: string
    type: string
  }>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ContentPlan {
  id: number
  name: string
  targetType: string
  durationWeeks: number
  isTemplate: boolean
  isPublic: boolean
  createdAt: string
  user: { id: number; email: string; firstName: string; lastName: string }
  _count: { sessions: number }
}

export interface ContentCompetition {
  id: number
  name: string
  date: string
  type: string
  subType: string
  status: string
  user: { id: number; email: string; firstName: string; lastName: string }
}

export interface SystemLogs {
  recentSessionActivity: Array<{
    id: number
    title: string | null
    updatedAt: string
    plan: { name: string; user: { email: string } }
  }>
  recentCompetitionActivity: Array<{
    id: number
    name: string
    updatedAt: string
    user: { email: string }
  }>
  recentRegistrations: Array<{
    id: number
    email: string
    createdAt: string
  }>
}

// ─── Club CODIR Admin ──────────────────────────────────────────────────────────

export interface AdminMember {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  group: string | null
  status: string
}

export interface AdminInvitation {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  groupName: string | null
  createdAt: string
  expiresAt: string
  status: string
}

export interface AdminStats {
  members: number
  coaches: number
  admins: number
  pendingInvitations: number
  recentActivity: Array<{
    id: number
    email: string
    role: string
    createdAt: string
    invitedBy: { firstName: string; lastName: string }
  }>
}

export const adminCoachApi = {
  getStats: () => api.get<AdminStats>('/admin/club-stats'),
  getMembers: (filter?: string) => api.get<AdminMember[]>('/admin/members', { params: { filter } }),
  updateRole: (id: number, role: string) => api.patch(`/admin/members/${id}/role`, { role }),
  getInvitations: () => api.get<AdminInvitation[]>('/admin/invitations'),
  createInvitation: (data: { email: string; firstName: string; lastName: string; role: string; groupName?: string }) =>
    api.post<AdminInvitation>('/admin/invitations', data),
  resendInvitation: (id: number) => api.post(`/admin/invitations/${id}/resend`),
  deleteInvitation: (id: number) => api.delete(`/admin/invitations/${id}`),
}

export const adminApi = {
  // Dashboard
  getDashboard: () => api.get<DashboardStats>('/admin/dashboard'),

  // Users
  listUsers: (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }) =>
    api.get<PaginatedResponse<AdminUser>>('/admin/users', { params }),

  getUser: (id: number) => api.get<AdminUserDetail>(`/admin/users/${id}`),

  updateUser: (id: number, data: { firstName?: string; lastName?: string; email?: string; isAdmin?: boolean; password?: string }) =>
    api.put<AdminUser>(`/admin/users/${id}`, data),

  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  // Content
  listContent: (params?: { page?: number; limit?: number; type?: 'plans' | 'competitions'; search?: string }) =>
    api.get<PaginatedResponse<ContentPlan | ContentCompetition>>('/admin/content', { params }),

  deleteContent: (type: 'plan' | 'competition', id: number) =>
    api.delete(`/admin/content/${type}/${id}`),

  // Logs
  getSystemLogs: () => api.get<SystemLogs>('/admin/logs'),
}
