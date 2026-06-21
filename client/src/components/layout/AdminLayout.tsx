import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShieldCheck, Mail, ArrowRightFromLine } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const NAV_ITEMS = [
  { path: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { path: '/admin/membres', label: 'Membres & droits', icon: ShieldCheck },
  { path: '/admin/invitations', label: 'Invitations', icon: Mail, badge: 2 },
]

export default function AdminLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Sidebar */}
      <div className="w-60 flex-none flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 min-h-screen">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
              <span className="text-white font-black text-sm">M</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">Tri Planner</div>
              <div className="text-[10px] text-gray-400 font-medium">Administration · CODIR</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-violet-50 dark:bg-violet-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-none ${
                  isActive ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
                }`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className={`text-sm flex-1 ${isActive ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {item.label}
                </span>
                {item.badge && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-gray-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-none"
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-gray-400">Admin · Présidente</div>
            </div>
            <button onClick={() => navigate('/dashboard')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-400">
              <ArrowRightFromLine className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
