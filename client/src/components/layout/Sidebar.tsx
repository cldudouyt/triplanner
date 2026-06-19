import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Trophy, Dumbbell, Calendar, BarChart3, Settings, LogOut, X, Shield, Heart, Medal, Award, Sun, Moon, Target } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/competitions', icon: Trophy, label: 'Compétitions' },
  { to: '/training', icon: Dumbbell, label: 'Entraînement' },
  { to: '/calendar', icon: Calendar, label: 'Calendrier' },
  { to: '/wellness', icon: Heart, label: 'Bien-être' },
  { to: '/goals', icon: Target, label: 'Objectifs' },
  { to: '/records', icon: Medal, label: 'Records' },
  { to: '/achievements', icon: Award, label: 'Badges' },
  { to: '/statistics', icon: BarChart3, label: 'Statistiques' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-72 lg:w-64
          bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/40">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l4-8 4 5 3-7 4 10"/></svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Tri Planner</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gestion sportive</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-500/10 text-gray-900 dark:text-gray-100 shadow-[0_0_0_1px_rgba(249,115,22,.28),0_8px_22px_-10px_rgba(234,88,12,.4)]'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`w-[30px] h-[30px] flex-none rounded-[9px] flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-600/30' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}

          {/* Admin link for admin users */}
          {user?.isAdmin && (
            <NavLink
              to="/admin"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                    : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`
              }
            >
              <span className="w-[30px] h-[30px] flex-none rounded-[9px] bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </span>
              Administration
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 space-y-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200"
          >
            {resolvedTheme === 'dark' ? (
              <>
                <Sun className="h-5 w-5" />
                Mode clair
              </>
            ) : (
              <>
                <Moon className="h-5 w-5" />
                Mode sombre
              </>
            )}
          </button>

          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium shadow-md">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  )
}
