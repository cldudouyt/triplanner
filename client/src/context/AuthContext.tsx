import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { authApi, type User, type LoginData, type RegisterData } from '@/api/auth.api'
import { setAccessToken, rawAxios } from '@/api/client'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Refresh token 1 minute before access token expires (assuming 15min access token)
const REFRESH_INTERVAL = 14 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }, [])

  const silentRefresh = useCallback(async (): Promise<boolean> => {
    try {
      // Use rawAxios to bypass interceptors and avoid refresh loops
      const { data } = await rawAxios.post('/auth/refresh')
      setAccessToken(data.accessToken)
      const { data: userData } = await authApi.me()
      setUser(userData)
      return true
    } catch {
      setUser(null)
      setAccessToken(null)
      clearRefreshInterval()
      return false
    }
  }, [clearRefreshInterval])

  const startRefreshInterval = useCallback(() => {
    clearRefreshInterval()
    refreshIntervalRef.current = setInterval(async () => {
      await silentRefresh()
    }, REFRESH_INTERVAL)
  }, [silentRefresh, clearRefreshInterval])

  useEffect(() => {
    const init = async () => {
      const success = await silentRefresh()
      if (success) {
        startRefreshInterval()
      }
      setIsLoading(false)
    }
    init()

    return () => clearRefreshInterval()
  }, [silentRefresh, startRefreshInterval, clearRefreshInterval])

  const login = async (data: LoginData) => {
    const { data: res } = await authApi.login(data)
    setAccessToken(res.accessToken)
    setUser(res.user)
    startRefreshInterval()
  }

  const register = async (data: RegisterData) => {
    await authApi.register(data)
  }

  const logout = async () => {
    clearRefreshInterval()
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
