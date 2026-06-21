import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  CalendarClock,
  Trophy,
  BarChart3,
  Users,
  MessageSquare,
  LogOut,
  X,
  Shield,
  Menu,
  ArrowRightFromLine,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { messagesApi } from '@/api/messages.api'
import { competitionsApi } from '@/api/competitions.api'
import { trainingPlansApi } from '@/api/trainingPlans.api'

// ─── Nav items athlète ────────────────────────────────────────────────────────

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', end: false },
  { to: '/training', icon: ClipboardList, label: 'Mon plan', end: false },
  { to: '/seances-club', icon: CalendarClock, label: 'Séances club', end: false },
  { to: '/calendar', icon: Calendar, label: 'Calendrier', end: false },
  { to: '/competitions', icon: Trophy, label: 'Compétitions', end: false },
  { to: '/statistics', icon: BarChart3, label: 'Statistiques', end: false },
  { to: '/annuaire', icon: Users, label: 'Annuaire du club', end: false },
]

// ─── Pill NavItem ─────────────────────────────────────────────────────────────

interface NavItemProps {
  to: string
  icon: React.ElementType
  label: string
  end?: boolean
  badge?: number
  onClick?: () => void
}

function NavItem({ to, icon: Icon, label, end = false, badge, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
          isActive
            ? 'bg-orange-50 dark:bg-orange-900/20'
            : 'hover:bg-gray-50 dark:hover:bg-slate-800'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`w-[30px] h-[30px] flex-none rounded-[9px] flex items-center justify-center transition-all ${
              isActive
                ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500'
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span
            className={`flex-1 ${
              isActive
                ? 'font-medium text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {label}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-semibold">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

// ─── Widget compétition A ─────────────────────────────────────────────────────

interface CompetitionWidgetProps {
  name: string
  daysUntil: number
  weekPct: number
  currentWeek: number
  totalWeeks: number
}

function CompetitionWidget({ name, daysUntil, weekPct, currentWeek, totalWeeks }: CompetitionWidgetProps) {
  return (
    <div
      className="rounded-2xl p-3 mx-3 mb-3"
      style={{
        background: 'linear-gradient(150deg,rgba(249,115,22,.10),rgba(249,115,22,.04))',
        border: '1px solid rgba(249,115,22,.18)',
      }}
    >
      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{name}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        Objectif A · dans {daysUntil} jours
      </p>
      {totalWeeks > 0 && (
        <>
          <div className="mt-2 h-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${weekPct}%`,
                background: 'linear-gradient(90deg,#FB923C,#EA580C)',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Prépa semaine {currentWeek} / {totalWeeks}
          </p>
        </>
      )}
    </div>
  )
}

// ─── Mobile hamburger button ──────────────────────────────────────────────────

interface MobileToggleProps {
  onOpen: () => void
}

export function SidebarMobileToggle({ onOpen }: MobileToggleProps) {
  return (
    <button
      onClick={onOpen}
      className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Ouvrir le menu"
    >
      <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
    </button>
  )
}

// ─── Sidebar principale (athlète) ─────────────────────────────────────────────

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  const { data: unreadData } = useQuery({
    queryKey: ['messages-unread'],
    queryFn: () => messagesApi.getUnreadCount().then(r => r.data),
    refetchInterval: 30000,
  })
  const unreadCount = unreadData?.count ?? 0

  const { data: competitionsData } = useQuery({
    queryKey: ['competitions-priority-a'],
    queryFn: () =>
      competitionsApi
        .list({ priority: 'A', sortBy: 'date', sortOrder: 'asc', limit: 1 })
        .then(r => r.data),
  })

  const { data: plansData } = useQuery({
    queryKey: ['training-plans'],
    queryFn: () => trainingPlansApi.list().then(r => r.data),
  })

  const nextCompA = competitionsData?.data?.find(c => new Date(c.date) >= new Date()) ?? null

  const plans = plansData?.data ?? []
  const activePlan =
    plans.find(p => p.startDate && (!p.endDate || new Date(p.endDate) >= new Date())) ??
    plans[0] ??
    null

  const currentWeek = activePlan?.startDate
    ? Math.max(1, Math.ceil((Date.now() - new Date(activePlan.startDate).getTime()) / (7 * 24 * 3600 * 1000)))
    : 1
  const totalWeeks = activePlan?.durationWeeks ?? 0
  const weekPct = totalWeeks > 0 ? Math.min((currentWeek / totalWeeks) * 100, 100) : 0

  const daysUntilDate = (dateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr)
    target.setHours(0, 0, 0, 0)
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const handleNavClick = () => {
    if (window.innerWidth < 1024) setIsOpen(false)
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-3 z-30 lg:hidden p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-[230px] flex-none
          bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-600/30 flex-none">
                M
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Tri Planner</p>
                <p className="text-xs text-gray-400 leading-tight truncate">Triathlon Club Nantais</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fermer le menu"
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
          {navLinks.map(({ to, icon, label, end }) => (
            <NavItem key={to} to={to} icon={icon} label={label} end={end} onClick={handleNavClick} />
          ))}

          {/* Messages avec badge */}
          <NavItem
            to="/messages"
            icon={MessageSquare}
            label="Messages"
            badge={unreadCount}
            onClick={handleNavClick}
          />

          {/* Admin CODIR */}
          {user?.isAdmin && (
            <NavLink
              to="/admin"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium'
                    : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`
              }
            >
              <span className="w-[30px] h-[30px] flex-none rounded-[9px] bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </span>
              <span className="flex-1">Administration</span>
            </NavLink>
          )}
        </nav>

        {/* Widget compétition A */}
        {nextCompA && (
          <CompetitionWidget
            name={nextCompA.name}
            daysUntil={daysUntilDate(nextCompA.date)}
            weekPct={weekPct}
            currentWeek={currentWeek}
            totalWeeks={totalWeeks}
          />
        )}

        {/* Footer */}
        <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-none"
              style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
            >
              {user?.firstName?.[0] ?? ''}{user?.lastName?.[0] ?? ''}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 leading-tight">Athlète · TCN</p>
            </div>
            <button
              onClick={logout}
              aria-label="Se déconnecter"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-none"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

// ─── Sidebar Coach ────────────────────────────────────────────────────────────

export function SidebarCoach() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const coachLinks = [
    { to: '/club/coach', icon: LayoutDashboard, label: 'Tableau de bord club', end: true },
    { to: '/club/coach/groupes', icon: Users, label: 'Groupes', end: false },
    { to: '/club/coach/plans', icon: ClipboardList, label: "Plans d'entraînement", end: false },
    { to: '/club/coach/seances', icon: CalendarClock, label: 'Séances club', end: false },
    { to: '/club/coach/calendrier', icon: Calendar, label: 'Calendrier', end: false },
  ]

  const handleNavClick = () => {
    if (window.innerWidth < 1024) setIsOpen(false)
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-3 z-30 lg:hidden p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[230px] flex-none bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-600/30 flex-none">
              M
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Tri Planner</p>
              <p className="text-xs text-gray-400 leading-tight truncate">Espace coach · TCN</p>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Fermer" className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ml-auto">
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
          {coachLinks.map(({ to, icon: Icon, label, end }) => {
            const isActive = end ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${isActive ? 'bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                <span className={`w-[30px] h-[30px] flex-none rounded-[9px] flex items-center justify-center transition-all ${isActive ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-600/30' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500'}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className={`flex-1 ${isActive ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="px-3 pb-4 pt-2 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-none"
              style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
            >
              {user?.firstName?.[0] ?? ''}{user?.lastName?.[0] ?? ''}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400">Coach · TCN</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex-none"
              title="Retour à l'espace athlète"
            >
              <ArrowRightFromLine className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

// ─── Sidebar Athlète (vue aperçu dans espace coach) ──────────────────────────

const athleteNavLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', end: false },
  { to: '/training', icon: ClipboardList, label: 'Mon plan', end: false },
  { to: '/calendar', icon: Calendar, label: 'Calendrier', end: false },
  { to: '/competitions', icon: Trophy, label: 'Compétitions', end: false },
  { to: '/messages', icon: MessageSquare, label: 'Messages', end: false },
]

export function SidebarAthlete() {
  const [isOpen, setIsOpen] = useState(false)

  const handleNavClick = () => {
    if (window.innerWidth < 1024) setIsOpen(false)
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-3 z-30 lg:hidden p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-[230px] flex-none
          bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-orange-600/30 flex-none">
                M
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Tri Planner</p>
                <p className="text-xs text-gray-400 leading-tight truncate">Triathlon Club Nantais</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fermer le menu"
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
          {athleteNavLinks.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to + label}
              to={to}
              end={end}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-900/20 font-medium text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-300'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-none" />
              <span className="flex-1">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
