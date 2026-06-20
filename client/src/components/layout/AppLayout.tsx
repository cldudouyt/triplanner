import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import CoachButton from '@/components/coach/CoachButton'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-page dark:bg-slate-900 transition-colors">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      <CoachButton />
    </div>
  )
}
