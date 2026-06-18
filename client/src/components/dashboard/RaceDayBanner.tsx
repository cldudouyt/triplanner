import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Trophy, ArrowRight } from 'lucide-react'
import { competitionsApi } from '@/api/competitions.api'

export default function RaceDayBanner() {
  const { data: competitionsData } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => competitionsApi.list().then(r => r.data),
  })

  const today = new Date().toISOString().split('T')[0]
  const raceToday = competitionsData?.data?.find(
    c => c.date.startsWith(today) && c.status === 'planned'
  )

  if (!raceToday) return null

  return (
    <Link
      to={`/race-day/${raceToday.id}`}
      className="block mb-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl p-4 shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                RACE DAY
              </span>
            </div>
            <p className="font-bold text-lg leading-tight">{raceToday.name}</p>
            {raceToday.location && (
              <p className="text-white/80 text-sm">{raceToday.location}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 text-white/90 text-sm font-medium">
          <span>Voir le tableau de bord course</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}
