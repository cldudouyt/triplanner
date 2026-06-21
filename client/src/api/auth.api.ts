import api from './client'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  isAdmin?: boolean
  onboardingCompleted?: boolean
  level?: string
  weeklyHoursAvailable?: number
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  email: string
  code: string
  newPassword: string
}

export const authApi = {
  login: (data: LoginData) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterData) => api.post<User>('/auth/register', data),
  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
  forgotPassword: (data: ForgotPasswordData) => api.post('/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordData) => api.post('/auth/reset-password', data),
  completeOnboarding: (data: { level: string; weeklyHoursAvailable: number; sports?: string[] }) =>
    api.patch<User>('/auth/onboarding', data),
}
