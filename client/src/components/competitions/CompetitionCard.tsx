import { Link } from 'react-router-dom'
import { MapPin, Calendar as CalendarIcon } from 'lucide-react'
import type { Competition } from '@/api/competitions.api'
import { formatDate, formatRelative } from '@/utils/formatDate'
import PriorityBadge from './PriorityBadge'
import { STATUSES } from '@/utils/constants'

export default function CompetitionCard({ competition }: { competition: Competition }) {
  const status = STATUSES.find(s => s.value === competition.status)

  return (
    <Link
      to={`/competitions/${competition.id}`}
      className="block bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:shadow-md dark:hover:shadow-slate-900/50 transition-all hover:scale-[1.02]"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{competition.name}</h3>
        <PriorityBadge priority={competition.priority} />
      </div>

      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>{formatDate(competition.date)}</span>
          <span className="text-gray-400 dark:text-gray-500">({formatRelative(competition.date)})</span>
        </div>

        {competition.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{competition.location}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
          {competition.type === 'triathlon' ? 'Triathlon' : 'Course'} - {competition.subType}
        </span>
        {status && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
            {status.label}
          </span>
        )}
        {competition.chronoObjective && (
          <span className="text-xs text-gray-400 dark:text-gray-500">Obj: {competition.chronoObjective}</span>
        )}
      </div>
    </Link>
  )
}
